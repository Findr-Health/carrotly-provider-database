/**
 * Cancellation Routes
 */
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

const POLICIES = {
  standard: { name: 'Standard', freeCancellationHours: 24, rules: [{ hoursMin: 24, feePercent: 0 }, { hoursMin: 12, feePercent: 25 }, { hoursMin: 0, feePercent: 50 }, { hoursMin: -Infinity, feePercent: 100 }] },
  moderate: { name: 'Moderate', freeCancellationHours: 48, rules: [{ hoursMin: 48, feePercent: 0 }, { hoursMin: 24, feePercent: 25 }, { hoursMin: 0, feePercent: 50 }, { hoursMin: -Infinity, feePercent: 100 }] }
};

const calculateFee = (appointmentDate, amount, tier = 'standard') => {
  const policy = POLICIES[tier] || POLICIES.standard;
  const hoursUntil = (new Date(appointmentDate) - new Date()) / 3600000;
  let feePercent = 100;
  for (const rule of policy.rules) { if (hoursUntil >= rule.hoursMin) { feePercent = rule.feePercent; break; } }
  const feeAmount = Math.round(amount * feePercent) / 100;
  return { feePercent, feeAmount, refundAmount: amount - feeAmount, hoursUntil: Math.max(0, hoursUntil) };
};

router.get('/:id/cancellation-quote', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('providerId');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const tier = booking.providerId?.cancellationPolicy?.tier || 'standard';
    const amount = booking.totalAmount || booking.servicePrice;
    res.json({ bookingId: booking._id, ...calculateFee(booking.appointmentDate, amount, tier) });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason, cancelledBy = 'user' } = req.body;
    const booking = await Booking.findById(req.params.id).populate('providerId');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const tier = booking.providerId?.cancellationPolicy?.tier || 'standard';
    const amount = booking.totalAmount || booking.servicePrice;
    const fee = cancelledBy === 'provider' ? { feePercent: 0, feeAmount: 0, refundAmount: amount } : calculateFee(booking.appointmentDate, amount, tier);
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = cancelledBy;
    booking.cancellationReason = reason;
    booking.refundAmount = fee.refundAmount;
    booking.cancellationPolicy = { tierApplied: tier, feePercent: fee.feePercent, feeAmount: fee.feeAmount, feeWaived: false };
    await booking.save();
    res.json({ success: true, feeCharged: fee.feeAmount, refundAmount: fee.refundAmount });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/:id/no-show', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const amount = booking.totalAmount || booking.servicePrice;
    booking.status = 'no_show';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'system';
    booking.refundAmount = 0;
    booking.cancellationPolicy = { tierApplied: 'no_show', feePercent: 100, feeAmount: amount, feeWaived: false };
    await booking.save();
    res.json({ success: true, amountCharged: amount });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/:id/waive-fee', async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!booking.cancellationPolicy?.feeAmount) return res.status(400).json({ error: 'No fee to waive' });
    if (booking.cancellationPolicy.feeWaived) return res.status(400).json({ error: 'Already waived' });
    const feeAmount = booking.cancellationPolicy.feeAmount;
    booking.cancellationPolicy.feeWaived = true;
    booking.cancellationPolicy.feeWaivedReason = reason;
    booking.cancellationPolicy.feeWaivedAt = new Date();
    booking.refundAmount = (booking.refundAmount || 0) + feeAmount;
    await booking.save();
    res.json({ success: true, refundedAmount: feeAmount });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/policy/:providerId', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.providerId);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    const tier = provider.cancellationPolicy?.tier || 'standard';
    res.json({ tier, freeCancellationHours: POLICIES[tier].freeCancellationHours, allowFeeWaiver: provider.cancellationPolicy?.allowFeeWaiver ?? true });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/policy/:providerId', async (req, res) => {
  try {
    const { tier, allowFeeWaiver } = req.body;
    if (tier && !['standard', 'moderate'].includes(tier)) return res.status(400).json({ error: 'Invalid tier' });
    const provider = await Provider.findById(req.params.providerId);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    provider.cancellationPolicy = { tier: tier || 'standard', allowFeeWaiver: allowFeeWaiver ?? true };
    await provider.save();
    res.json({ success: true, policy: provider.cancellationPolicy });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
