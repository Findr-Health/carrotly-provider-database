/**
 * Findr Health Email Service
 * 
 * Handles all booking-related email notifications.
 * Uses nodemailer - configure with your email provider (SendGrid, Mailgun, etc.)
 */

const nodemailer = require('nodemailer');

// Configure transporter (update with your email provider)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY
  }
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'bookings@findrhealth.com';
const FROM_NAME = 'Findr Health';

// ==================== EMAIL TEMPLATES ====================

const templates = {
  
  // ========== USER EMAILS ==========
  
  bookingConfirmed: (booking, provider) => ({
    subject: `Booking Confirmed - ${provider.practiceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #14b8a6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Booking Confirmed! ✓</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Your appointment has been confirmed.</p>
          
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #111827;">${provider.practiceName}</h3>
            <p style="color: #6b7280; margin: 5px 0;">
              ${provider.address?.street || ''}<br>
              ${provider.address?.city || ''}, ${provider.address?.state || ''} ${provider.address?.zip || ''}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
            
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Service</td>
                <td style="text-align: right; font-weight: 600;">${booking.service.name}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Date</td>
                <td style="text-align: right; font-weight: 600;">${formatDate(booking.appointmentDate)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Time</td>
                <td style="text-align: right; font-weight: 600;">${booking.appointmentTime}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Duration</td>
                <td style="text-align: right; font-weight: 600;">${booking.service.duration} minutes</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Total</td>
                <td style="text-align: right; font-weight: 600; color: #14b8a6;">$${booking.payment.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <p style="background: #fef3c7; padding: 12px; border-radius: 8px; color: #92400e; font-size: 14px;">
            <strong>Confirmation Code:</strong> ${booking.confirmationCode}
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL}/bookings/${booking._id}" 
               style="background: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              View Appointment
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>Need to make changes? You can reschedule or cancel in the Findr Health app.</p>
        </div>
      </div>
    `
  }),
  
  bookingRequest: (booking, provider) => ({
    subject: `Booking Request Submitted - ${provider.practiceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Booking Request Submitted</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">
            Your booking request has been sent to <strong>${provider.practiceName}</strong>. 
            They will confirm your appointment within 48 hours.
          </p>
          
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Requested Date</td>
                <td style="text-align: right; font-weight: 600;">${formatDate(booking.appointmentDate)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Requested Time</td>
                <td style="text-align: right; font-weight: 600;">${booking.appointmentTime}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Service</td>
                <td style="text-align: right; font-weight: 600;">${booking.service.name}</td>
              </tr>
            </table>
          </div>
          
          <p style="background: #dbeafe; padding: 12px; border-radius: 8px; color: #1e40af; font-size: 14px;">
            We'll notify you as soon as the provider responds. Your payment will only be processed once confirmed.
          </p>
        </div>
      </div>
    `
  }),
  
  bookingCancelledByUser: (booking, provider, refundAmount) => ({
    subject: `Booking Cancelled - ${provider.practiceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6b7280; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p>Your appointment with <strong>${provider.practiceName}</strong> has been cancelled.</p>
          
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Original Date</td>
                <td style="text-align: right;">${formatDate(booking.appointmentDate)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Service</td>
                <td style="text-align: right;">${booking.service.name}</td>
              </tr>
              ${booking.cancellation.feeAmount > 0 ? `
              <tr>
                <td style="color: #6b7280;">Cancellation Fee</td>
                <td style="text-align: right; color: #dc2626;">$${booking.cancellation.feeAmount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="color: #6b7280; font-weight: 600;">Refund Amount</td>
                <td style="text-align: right; font-weight: 600; color: #14b8a6;">$${refundAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Your refund will be processed within 5-10 business days.
          </p>
        </div>
      </div>
    `
  }),
  
  bookingCancelledByProvider: (booking, provider) => ({
    subject: `Appointment Cancelled by Provider - ${provider.practiceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Appointment Cancelled</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p>We're sorry, but <strong>${provider.practiceName}</strong> has cancelled your appointment.</p>
          
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Original Date</td>
                <td style="text-align: right;">${formatDate(booking.appointmentDate)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Service</td>
                <td style="text-align: right;">${booking.service.name}</td>
              </tr>
              ${booking.cancellation.reason ? `
              <tr>
                <td style="color: #6b7280;">Reason</td>
                <td style="text-align: right;">${booking.cancellation.reason}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <p style="background: #d1fae5; padding: 12px; border-radius: 8px; color: #065f46; font-size: 14px;">
            <strong>Full Refund:</strong> $${booking.payment.total.toFixed(2)} will be refunded to your original payment method within 5-10 business days.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL}/search" 
               style="background: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Find Another Provider
            </a>
          </div>
        </div>
      </div>
    `
  }),
  
  appointmentReminder: (booking, provider, hoursUntil) => ({
    subject: `Reminder: Appointment ${hoursUntil === 24 ? 'Tomorrow' : 'in 1 Hour'} - ${provider.practiceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #14b8a6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Appointment Reminder</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p style="font-size: 18px; text-align: center;">
            Your appointment is <strong>${hoursUntil === 24 ? 'tomorrow' : 'in 1 hour'}</strong>!
          </p>
          
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${provider.practiceName}</h3>
            <p style="color: #6b7280;">
              ${provider.address?.street}<br>
              ${provider.address?.city}, ${provider.address?.state} ${provider.address?.zip}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb;">
            
            <p><strong>Date:</strong> ${formatDate(booking.appointmentDate)}</p>
            <p><strong>Time:</strong> ${booking.appointmentTime}</p>
            <p><strong>Service:</strong> ${booking.service.name}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://maps.google.com/?q=${encodeURIComponent(provider.address?.street + ' ' + provider.address?.city + ' ' + provider.address?.state)}" 
               style="background: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Get Directions
            </a>
          </div>
        </div>
      </div>
    `
  }),
  
  // ========== PROVIDER EMAILS ==========
  
  providerNewBooking: (booking, user) => ({
    subject: `New Booking - ${user.firstName} ${user.lastName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #14b8a6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Booking!</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p>You have a new confirmed booking.</p>
          
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${user.firstName} ${user.lastName}</h3>
            ${user.phone ? `<p style="color: #6b7280;">📞 ${user.phone}</p>` : ''}
            ${user.email ? `<p style="color: #6b7280;">✉️ ${user.email}</p>` : ''}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb;">
            
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Service</td>
                <td style="text-align: right; font-weight: 600;">${booking.service.name}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Date</td>
                <td style="text-align: right; font-weight: 600;">${formatDate(booking.appointmentDate)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Time</td>
                <td style="text-align: right; font-weight: 600;">${booking.appointmentTime}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Duration</td>
                <td style="text-align: right;">${booking.service.duration} min</td>
              </tr>
              ${booking.notes ? `
              <tr>
                <td colspan="2" style="padding-top: 10px;">
                  <strong>Patient Notes:</strong><br>
                  <span style="color: #6b7280;">${booking.notes}</span>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.PROVIDER_PORTAL_URL}/bookings/${booking._id}" 
               style="background: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              View Booking
            </a>
          </div>
        </div>
      </div>
    `
  }),
  
  providerBookingRequest: (booking, user) => ({
    subject: `New Booking Request - ${user.firstName} ${user.lastName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Booking Request</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p>You have a new booking request that needs your confirmation.</p>
          
          <div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
            <strong>⏰ Please respond within 48 hours</strong>
          </div>
          
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${user.firstName} ${user.lastName}</h3>
            ${user.email ? `<p style="color: #6b7280;">✉️ ${user.email}</p>` : ''}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb;">
            
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Requested Service</td>
                <td style="text-align: right; font-weight: 600;">${booking.service.name}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Requested Date</td>
                <td style="text-align: right; font-weight: 600;">${formatDate(booking.appointmentDate)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Requested Time</td>
                <td style="text-align: right; font-weight: 600;">${booking.appointmentTime}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.PROVIDER_PORTAL_URL}/bookings/${booking._id}/respond" 
               style="background: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">
              Accept Request
            </a>
            <a href="${process.env.PROVIDER_PORTAL_URL}/bookings/${booking._id}/respond" 
               style="background: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">
              Decline / Counter
            </a>
          </div>
        </div>
      </div>
    `
  }),
  
  providerBookingRequestReminder: (booking, user, hoursRemaining) => ({
    subject: `⏰ Reminder: Booking Request Pending - ${user.firstName} ${user.lastName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Response Needed</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p>You have a pending booking request that will <strong>expire in ${hoursRemaining} hours</strong>.</p>
          
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p><strong>Patient:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Service:</strong> ${booking.service.name}</p>
            <p><strong>Requested:</strong> ${formatDate(booking.appointmentDate)} at ${booking.appointmentTime}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.PROVIDER_PORTAL_URL}/bookings/${booking._id}/respond" 
               style="background: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Respond Now
            </a>
          </div>
        </div>
      </div>
    `
  }),
  
  providerBookingCancelled: (booking, user) => ({
    subject: `Booking Cancelled - ${user.firstName} ${user.lastName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6b7280; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p>A booking has been cancelled by the patient.</p>
          
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p><strong>Patient:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Service:</strong> ${booking.service.name}</p>
            <p><strong>Was scheduled for:</strong> ${formatDate(booking.appointmentDate)} at ${booking.appointmentTime}</p>
            ${booking.cancellation.reason ? `<p><strong>Reason:</strong> ${booking.cancellation.reason}</p>` : ''}
          </div>
          
          <p style="color: #6b7280;">This time slot is now available for other bookings.</p>
        </div>
      </div>
    `
  })
};

// ==================== HELPER FUNCTIONS ====================

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ==================== EMAIL SERVICE ====================

const emailService = {
  
  /**
   * Send an email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @returns {Object} Send result
   */
  async send(to, subject, html) {
    try {
      const info = await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to,
        subject,
        html
      });
      
      console.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // USER EMAILS
  async sendBookingConfirmed(email, booking, provider) {
    const template = templates.bookingConfirmed(booking, provider);
    return this.send(email, template.subject, template.html);
  },
  
  async sendBookingRequest(email, booking, provider) {
    const template = templates.bookingRequest(booking, provider);
    return this.send(email, template.subject, template.html);
  },
  
  async sendUserBookingCancelledByUser(email, booking, provider) {
    const refundAmount = booking.cancellation.refundAmount || booking.payment.total;
    const template = templates.bookingCancelledByUser(booking, provider, refundAmount);
    return this.send(email, template.subject, template.html);
  },
  
  async sendUserBookingCancelledByProvider(email, booking, provider) {
    const template = templates.bookingCancelledByProvider(booking, provider);
    return this.send(email, template.subject, template.html);
  },
  
  async sendAppointmentReminder(email, booking, provider, hoursUntil) {
    const template = templates.appointmentReminder(booking, provider, hoursUntil);
    return this.send(email, template.subject, template.html);
  },
  
  // PROVIDER EMAILS
  async sendProviderNewBooking(email, booking, user) {
    const template = templates.providerNewBooking(booking, user);
    return this.send(email, template.subject, template.html);
  },
  
  async sendProviderBookingRequest(email, booking, user) {
    const template = templates.providerBookingRequest(booking, user);
    return this.send(email, template.subject, template.html);
  },
  
  async sendProviderBookingRequestReminder(email, booking, user, hoursRemaining) {
    const template = templates.providerBookingRequestReminder(booking, user, hoursRemaining);
    return this.send(email, template.subject, template.html);
  },
  
  async sendProviderBookingCancelled(email, booking, user) {
    const template = templates.providerBookingCancelled(booking, user);
    return this.send(email, template.subject, template.html);
  }
};

module.exports = emailService;
