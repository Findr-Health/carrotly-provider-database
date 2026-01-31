/**
 * Findr Health - Booking Number Generator
 * 
 * Generates unique, human-readable confirmation numbers
 * Format: FH-2026-XXXX (e.g., FH-2026-0234)
 * 
 * Features:
 * - Collision detection with retry
 * - Sequential numbering per year
 * - Easy to read/speak over phone
 * - HIPAA compliant (no patient info)
 */

const Booking = require('../models/Booking');

/**
 * Generate a unique booking confirmation number
 * @returns {Promise<string>} Confirmation number (e.g., FH-2026-0234)
 */
async function generateBookingNumber() {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const number = await _generateNumber();
    
    // Check for collision
    const exists = await Booking.findOne({ bookingNumber: number });
    if (!exists) {
      return number;
    }
    
    console.warn(`Booking number collision detected: ${number}, retrying...`);
  }
  
  // Fallback to timestamp-based if all attempts fail
  const timestamp = Date.now().toString().slice(-8);
  return `FH-${new Date().getFullYear()}-${timestamp}`;
}

/**
 * Generate a booking number (internal)
 * @private
 */
async function _generateNumber() {
  const year = new Date().getFullYear();
  
  // Find the latest booking number for this year
  const latestBooking = await Booking.findOne({
    bookingNumber: new RegExp(`^FH-${year}-`)
  })
  .sort({ bookingNumber: -1 })
  .select('bookingNumber');
  
  let sequence = 1;
  
  if (latestBooking && latestBooking.bookingNumber) {
    // Extract sequence from FH-2026-0234 → 234
    const parts = latestBooking.bookingNumber.split('-');
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  // Format: FH-2026-0234 (4 digits, zero-padded)
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `FH-${year}-${paddedSequence}`;
}

/**
 * Validate a booking number format
 * @param {string} bookingNumber - Number to validate
 * @returns {boolean} True if valid format
 */
function isValidBookingNumber(bookingNumber) {
  if (!bookingNumber || typeof bookingNumber !== 'string') {
    return false;
  }
  
  // Format: FH-YYYY-XXXX
  const pattern = /^FH-\d{4}-\d{4}$/;
  return pattern.test(bookingNumber);
}

module.exports = {
  generateBookingNumber,
  isValidBookingNumber
};
