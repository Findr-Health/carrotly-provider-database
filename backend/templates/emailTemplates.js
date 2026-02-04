// backend/templates/emailTemplates.js
// Email templates for 80/20 payment policy

const emailTemplates = {
  
  /**
   * Booking Confirmation Email
   * Sent when: Booking created, deposit charged
   */
  booking_confirmation: {
    subject: (data) => `Booking Confirmed - ${data.serviceName} with ${data.providerName}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0d9488; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .breakdown { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .row.total { font-weight: bold; font-size: 1.1em; border-top: 2px solid #0d9488; border-bottom: none; }
          .policy { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .button { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">✅ Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.patientName},</p>
            <p>Your appointment is confirmed!</p>
            
            <div class="breakdown">
              <h3 style="margin-top:0;">📅 Appointment Details</h3>
              <div class="row">
                <span>Provider</span>
                <strong>${data.providerName}</strong>
              </div>
              <div class="row">
                <span>Service</span>
                <strong>${data.serviceName}</strong>
              </div>
              <div class="row">
                <span>Date & Time</span>
                <strong>${data.appointmentDate}</strong>
              </div>
              <div class="row">
                <span>Duration</span>
                <strong>${data.duration} minutes</strong>
              </div>
              <div class="row">
                <span>Location</span>
                <strong>${data.providerAddress}</strong>
              </div>
            </div>
            
            <div class="breakdown">
              <h3 style="margin-top:0;">💳 Payment Summary</h3>
              <div class="row">
                <span>Charged Today (80% Deposit)</span>
                <strong>$${data.depositAmount}</strong>
              </div>
              <div class="row">
                <span>Charged After Service (20% Balance)</span>
                <strong>$${data.finalAmount}</strong>
              </div>
              <div class="row total">
                <span>Total</span>
                <span>$${data.totalAmount}</span>
              </div>
            </div>
            
            <div class="policy">
              <h4 style="margin-top:0;">❌ Cancellation Policy</h4>
              <p style="margin-bottom:5px;"><strong>Cancel 48+ hours before:</strong> Full refund ($${data.depositAmount})</p>
              <p style="margin:0;"><strong>Cancel less than 48 hours:</strong> No refund (you lose $${data.depositAmount})</p>
            </div>
            
            <p>Need to cancel or reschedule?</p>
            <a href="${data.bookingLink}" class="button">View Booking</a>
            
            <p style="color:#6b7280; font-size:14px;">
              Booking Number: <strong>${data.bookingNumber}</strong><br>
              Questions? Reply to this email or call ${data.providerPhone}
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  /**
   * Early Cancellation (>48 hours) - Full Refund
   */
  early_cancellation_refund: {
    subject: (data) => `Cancellation Confirmed - Full Refund Issued`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0d9488; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0;">Cancellation Confirmed</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${data.patientName},</p>
          <p>Your appointment has been cancelled.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Original Appointment:</strong> ${data.appointmentDate}</p>
            <p><strong>Provider:</strong> ${data.providerName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Cancelled:</strong> ${data.hoursBeforeAppointment} hours before appointment</p>
          </div>
          
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin-top:0; color: #10b981;">💰 Full Refund Issued</h3>
            <p style="font-size: 1.5em; margin: 10px 0;"><strong>$${data.refundAmount}</strong></p>
            <p style="margin:0;">Refunded to: ${data.paymentMethod}</p>
            <p style="margin:0; color:#6b7280; font-size:14px;">Expect refund in 5-10 business days</p>
          </div>
          
          <p>We're sorry we won't see you this time. Need to book another appointment?</p>
          <a href="${data.searchLink}" style="display:inline-block; background:#0d9488; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; margin:20px 0;">
            Find Another Provider
          </a>
          
          <p style="color:#6b7280; font-size:14px;">
            Booking Number: <strong>${data.bookingNumber}</strong><br>
            Questions? Email support@findrhealth.com
          </p>
        </div>
      </body>
      </html>
    `
  },
  
  /**
   * Late Cancellation (<48 hours) - No Refund
   */
  late_cancellation_no_refund: {
    subject: (data) => `Cancellation Confirmed - Late Cancellation Fee Applied`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0;">Cancellation Confirmed</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${data.patientName},</p>
          <p>Your appointment has been cancelled.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Original Appointment:</strong> ${data.appointmentDate}</p>
            <p><strong>Provider:</strong> ${data.providerName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Cancelled:</strong> ${data.hoursBeforeAppointment} hours before appointment</p>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top:0; color: #f59e0b;">⚠️ Late Cancellation Fee</h3>
            <p style="font-size: 1.5em; margin: 10px 0;"><strong>$${data.feeAmount}</strong></p>
            <p>Because you cancelled less than 48 hours before your appointment, our policy requires us to keep your deposit.</p>
            <p style="margin:0;">This helps providers who had this time reserved for you and may not be able to fill it.</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top:0;">📋 To avoid future late fees:</h4>
            <ul style="margin: 10px 0;">
              <li>Cancel at least 48 hours in advance for a full refund</li>
              <li>Set calendar reminders for appointments</li>
              <li>Contact us if you have an emergency</li>
            </ul>
          </div>
          
          <p>Need to dispute this charge? Contact us within 7 days:</p>
          <a href="mailto:support@findrhealth.com" style="display:inline-block; background:#0d9488; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; margin:20px 0;">
            Contact Support
          </a>
          
          <p style="color:#6b7280; font-size:14px;">
            Booking Number: <strong>${data.bookingNumber}</strong>
          </p>
        </div>
      </body>
      </html>
    `
  },
  
  /**
   * Provider Cancellation - Refund + Credit
   */
  provider_cancellation: {
    subject: (data) => `Appointment Cancelled by Provider - Refund + Credit Issued`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0;">Appointment Cancelled</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${data.patientName},</p>
          <p>We're very sorry, but <strong>${data.providerName}</strong> had to cancel your appointment.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Original Appointment:</strong> ${data.appointmentDate}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Reason:</strong> ${data.cancellationReason}</p>
          </div>
          
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
            <h3 style="margin-top:0; color: #10b981;">💰 Compensation</h3>
            <p><strong>Full Refund:</strong> $${data.refundAmount}</p>
            <p><strong>Platform Credit:</strong> $20.00</p>
            <p style="margin:0; color:#6b7280; font-size:14px;">Refund in 5-10 business days. Credit available immediately.</p>
          </div>
          
          <p>We apologize for the inconvenience. We've issued a $20 credit to your account that you can use toward any service on Findr Health.</p>
          
          <p>Would you like help finding another provider?</p>
          <a href="${data.searchLink}" style="display:inline-block; background:#0d9488; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; margin:20px 0;">
            Find Another Provider
          </a>
          
          <p style="color:#6b7280; font-size:14px;">
            Questions? Email support@findrhealth.com or call (555) 123-4567
          </p>
        </div>
      </body>
      </html>
    `
  },
  
  /**
   * Service Complete - Receipt
   */
  booking_receipt: {
    subject: (data) => `Receipt for ${data.serviceName} - ${data.appointmentDate}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0d9488; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0;">Thank You!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${data.patientName},</p>
          <p>Thank you for using Findr Health!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top:0;">📋 Service Details</h3>
            <p><strong>Provider:</strong> ${data.providerName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.appointmentDate}</p>
            <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top:0;">💳 Payment Summary</h3>
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #e5e7eb;">
              <span>Deposit (80%) - ${data.depositDate}</span>
              <strong>$${data.depositAmount}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #e5e7eb;">
              <span>Final Payment (20%) - Today</span>
              <strong>$${data.finalAmount}</strong>
            </div>
            ${data.adjustments ? `
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #e5e7eb;">
              <span>Additional Services</span>
              <strong>$${data.adjustmentTotal}</strong>
            </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; padding:10px 0; font-size:1.1em; font-weight:bold; border-top:2px solid #0d9488; margin-top:10px;">
              <span>Total Charged</span>
              <span>$${data.totalAmount}</span>
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          </div>
          
          <a href="${data.receiptPdfLink}" style="display:inline-block; background:#0d9488; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; margin:20px 0;">
            Download PDF Receipt
          </a>
          
          <p style="color:#6b7280; font-size:14px;">
            Questions about this charge?<br>
            Contact ${data.providerName}: ${data.providerPhone}
          </p>
        </div>
      </body>
      </html>
    `
  },
  
  /**
   * Update Payment Method (Failed Final Payment)
   */
  update_payment_method: {
    subject: (data) => `Action Required: Update Payment Method`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0;">⚠️ Action Required</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${data.patientName},</p>
          <p>We attempted to charge your final payment for a recent appointment, but your payment method was declined.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.appointmentDate}</p>
            <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top:0; color: #f59e0b;">💳 Payment Failed</h3>
            <p style="font-size: 1.5em; margin: 10px 0;"><strong>Amount Due: $${data.finalAmount}</strong></p>
            <p>Please update your payment method within ${data.daysRemaining} days to avoid collection fees.</p>
          </div>
          
          <a href="${data.updatePaymentLink}" style="display:inline-block; background:#0d9488; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; margin:20px 0;">
            Update Payment Method
          </a>
          
          <p style="color:#6b7280; font-size:14px;">
            Questions? Email support@findrhealth.com or call (555) 123-4567
          </p>
        </div>
      </body>
      </html>
    `
  }
};

module.exports = emailTemplates;
