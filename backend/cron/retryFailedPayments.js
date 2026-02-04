// backend/cron/retryFailedPayments.js
// Cron job to retry failed final payments (runs daily)

const cron = require('node-cron');
const Booking = require('../models/Booking');
const PaymentService = require('../services/PaymentService');
const NotificationService = require('../services/NotificationService');

/**
 * Retry failed final payments
 * Runs daily at 2:00 AM
 */
function startRetryFailedPaymentsCron() {
  // Schedule: Every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 [CRON] Starting failed payment retry job...');
    
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Find bookings with failed final payments in last 7 days
      const failedBookings = await Booking.find({
        'payment.finalStatus': 'failed',
        'payment.status': 'final_payment_failed',
        completedAt: { $exists: true },
        updatedAt: { $gte: sevenDaysAgo }
      })
      .populate('patient', 'name email stripeCustomerId')
      .populate('provider', 'businessName email');
      
      console.log(`📋 Found ${failedBookings.length} bookings with failed final payments`);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const booking of failedBookings) {
        try {
          const result = await PaymentService.retryFinalPayment(booking);
          
          if (result.success) {
            successCount++;
            
            // Send success notification
            await NotificationService.send({
              recipient: {
                email: booking.patient.email,
                name: booking.patient.name
              },
              template: 'final_payment_retry_success',
              data: {
                bookingNumber: booking.bookingNumber,
                amount: booking.payment.finalAmount,
                serviceName: booking.service.name
              }
            });
            
          } else {
            failCount++;
            
            // Check if this is the last retry (7 days)
            const bookingAge = (new Date() - new Date(booking.completedAt)) / (1000 * 60 * 60 * 24);
            
            if (bookingAge >= 7) {
              // Last retry failed - notify support team
              console.log(`⚠️ Final retry failed for ${booking.bookingNumber} - sending to collections`);
              
              await NotificationService.send({
                recipient: {
                  email: process.env.SUPPORT_EMAIL || 'support@findrhealth.com',
                  name: 'Findr Support'
                },
                template: 'payment_collection_needed',
                data: {
                  bookingNumber: booking.bookingNumber,
                  patientName: booking.patient.name,
                  patientEmail: booking.patient.email,
                  amount: booking.payment.finalAmount,
                  failedAt: booking.payment.finalChargedAt,
                  daysOverdue: Math.floor(bookingAge)
                }
              });
              
              // Mark as sent to collections
              booking.payment.status = 'sent_to_collections';
              booking.payment.collectionsSentAt = new Date();
              await booking.save();
              
            } else {
              // Send reminder to update payment method
              await NotificationService.send({
                recipient: {
                  email: booking.patient.email,
                  name: booking.patient.name
                },
                template: 'update_payment_method',
                data: {
                  bookingNumber: booking.bookingNumber,
                  amount: booking.payment.finalAmount,
                  serviceName: booking.service.name,
                  daysRemaining: Math.ceil(7 - bookingAge)
                }
              });
            }
          }
          
          // Small delay between attempts
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error retrying ${booking.bookingNumber}:`, error.message);
          failCount++;
        }
      }
      
      console.log(`✅ [CRON] Failed payment retry complete: ${successCount} succeeded, ${failCount} failed`);
      
    } catch (error) {
      console.error('❌ [CRON] Failed payment retry job error:', error);
    }
  });
  
  console.log('✅ Failed payment retry cron job scheduled (daily at 2:00 AM)');
}

/**
 * Auto-complete bookings and charge final payment
 * Runs every hour
 */
function startAutoCompleteBookingsCron() {
  // Schedule: Every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 [CRON] Starting auto-complete bookings job...');
    
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
      
      // Find bookings that ended 24+ hours ago and haven't been completed
      const bookingsToComplete = await Booking.find({
        requestedEnd: { $lt: twentyFourHoursAgo },
        status: 'confirmed',
        'payment.status': 'deposit_charged'
      })
      .populate('patient', 'name email stripeCustomerId')
      .populate('provider', 'businessName');
      
      console.log(`📋 Found ${bookingsToComplete.length} bookings to auto-complete`);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const booking of bookingsToComplete) {
        try {
          // Charge final payment
          const result = await PaymentService.chargeFinalPayment(booking);
          
          if (result.success) {
            booking.status = 'completed';
            booking.completedAt = now;
            booking.payment.finalPaymentIntentId = result.paymentIntentId;
            booking.payment.finalChargedAt = result.chargedAt;
            booking.payment.finalStatus = 'succeeded';
            booking.payment.status = 'completed';
            await booking.save();
            
            // Transfer to provider
            await PaymentService.transferToProvider(booking);
            
            successCount++;
            
            // Send receipt
            await NotificationService.send({
              recipient: {
                email: booking.patient.email,
                name: booking.patient.name
              },
              template: 'booking_receipt',
              data: {
                bookingNumber: booking.bookingNumber,
                serviceName: booking.service.name,
                providerName: booking.provider.businessName,
                appointmentDate: booking.requestedStart,
                depositAmount: booking.payment.depositAmount,
                finalAmount: booking.payment.finalAmount,
                totalAmount: booking.payment.totalAmount
              }
            });
            
          } else {
            // Mark as failed for retry
            booking.payment.finalStatus = 'failed';
            booking.payment.status = 'final_payment_failed';
            await booking.save();
            
            failCount++;
            
            console.log(`⚠️ Auto-complete failed for ${booking.bookingNumber}: ${result.error}`);
          }
          
          // Small delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Error auto-completing ${booking.bookingNumber}:`, error.message);
          failCount++;
        }
      }
      
      console.log(`✅ [CRON] Auto-complete complete: ${successCount} succeeded, ${failCount} failed`);
      
    } catch (error) {
      console.error('❌ [CRON] Auto-complete job error:', error);
    }
  });
  
  console.log('✅ Auto-complete bookings cron job scheduled (hourly)');
}

module.exports = {
  startRetryFailedPaymentsCron,
  startAutoCompleteBookingsCron
};
