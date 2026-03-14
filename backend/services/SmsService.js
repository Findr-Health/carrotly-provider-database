// backend/services/SmsService.js
// Twilio SMS doorbell for Findr Health messaging

const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Send an SMS notification to a patient when their coach sends a message.
 * Fails silently — a failed SMS should never break the message send.
 */
async function sendCoachMessageAlert({ toPhone, patientFirstName, coachName }) {
  if (!toPhone) {
    console.log('[SMS] No phone number for patient — skipping doorbell');
    return;
  }

  // Normalize phone — ensure E.164 format (+1XXXXXXXXXX)
  const normalized = normalizePhone(toPhone);
  if (!normalized) {
    console.log('[SMS] Could not normalize phone number:', toPhone);
    return;
  }

  const body =
    `Hi ${patientFirstName || 'there'} — your ${coachName || 'Muscle First'} ` +
    `coach sent you a message. Open the Findr app to reply.`;

  try {
    const message = await client.messages.create({
      body,
      from: FROM_NUMBER,
      to:   normalized,
    });
    console.log('[SMS] Doorbell sent:', message.sid, '→', normalized);
  } catch (err) {
    // Log but never throw — SMS failure must not break message delivery
    console.error('[SMS] Failed to send doorbell:', err.message);
  }
}

/**
 * Normalize a phone number to E.164 format.
 * Handles formats: 4065551234, (406)555-1234, 406-555-1234, +14065551234
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length > 11) return null; // international — skip for now
  return null;
}

module.exports = { sendCoachMessageAlert };
