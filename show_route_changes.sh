#!/bin/bash
# Show what needs to change in bookings.js routes

echo "📋 ROUTE UPDATE GUIDE"
echo "===================="
echo ""
echo "File: backend/routes/bookings.js"
echo ""
echo "1️⃣  POST /api/bookings - Update booking creation"
echo "   Find: router.post('/', async (req, res) => {"
echo "   Change payment logic from direct Stripe to:"
echo ""
cat << 'CODE'
const paymentResult = await PaymentService.chargeDeposit({
  totalAmount: service.price,
  customerId: patient.stripeCustomerId,
  paymentMethodId: req.body.paymentMethodId,
  bookingId: booking._id,
  serviceName: service.name,
  providerName: provider.businessName
});

if (!paymentResult.success) {
  return res.status(402).json({ 
    error: 'Payment failed',
    message: paymentResult.error 
  });
}

booking.payment = {
  totalAmount: service.price,
  depositAmount: paymentResult.depositAmount,
  finalAmount: paymentResult.finalAmount,
  depositPaymentIntentId: paymentResult.paymentIntentId,
  depositChargedAt: paymentResult.chargedAt,
  depositStatus: 'succeeded',
  platformFee: paymentResult.platformFee,
  status: 'deposit_charged'
};
CODE

echo ""
echo "2️⃣  POST /api/bookings/:id/cancel - Add cancellation logic"
echo "   Find: router.post('/:id/cancel', async (req, res) => {"
echo "   Add before updating booking status:"
echo ""
cat << 'CODE'
const cancellationResult = await PaymentService.processCancellation(
  booking,
  'patient',
  req.body.reason
);

if (!cancellationResult.success) {
  return res.status(500).json({ 
    error: 'Cancellation failed',
    message: cancellationResult.error 
  });
}

booking.payment.refundAmount = cancellationResult.refunded;
booking.payment.refundId = cancellationResult.refundId;
booking.cancellation = {
  cancelledAt: new Date(),
  cancelledBy: 'patient',
  reason: req.body.reason,
  hoursBeforeAppointment: cancellationResult.hoursBeforeAppointment,
  refundEligible: cancellationResult.refundEligible
};
CODE

echo ""
echo "3️⃣  POST /api/bookings/:id/complete - NEW endpoint (add this)"
echo "   Add new route for completing bookings:"
echo ""
cat << 'CODE'
router.post('/:id/complete', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'stripeAccountId businessName')
      .populate('patient', 'name email');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Charge final 20%
    const finalResult = await PaymentService.chargeFinalPayment(booking);
    
    if (!finalResult.success) {
      booking.payment.finalStatus = 'failed';
      await booking.save();
      return res.status(402).json({ 
        error: 'Final payment failed',
        message: finalResult.error 
      });
    }
    
    // Update booking
    booking.status = 'completed';
    booking.payment.finalPaymentIntentId = finalResult.paymentIntentId;
    booking.payment.finalChargedAt = finalResult.chargedAt;
    booking.payment.finalStatus = 'succeeded';
    booking.payment.status = 'completed';
    await booking.save();
    
    // Transfer to provider
    await PaymentService.transferToProvider(booking);
    
    res.json({ 
      success: true,
      booking,
      message: 'Booking completed and payment processed' 
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to complete booking',
      message: error.message 
    });
  }
});
CODE

echo ""
echo "✅ These changes implement the 80/20 payment policy"
echo ""
echo "📖 Full reference implementation:"
echo "   backend/routes/_payment_policy_routes.js"
