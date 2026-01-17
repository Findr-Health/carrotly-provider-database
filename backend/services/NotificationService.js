// backend/services/NotificationService.js
// Findr Health Notification Service - Handles email, push, and SMS notifications

const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

/**
 * NotificationService - Centralized notification handling
 * Supports: Email (SendGrid/Nodemailer), Push (Firebase), SMS (Twilio - future)
 */
class NotificationService {
  constructor() {
    // Email transporter (using existing GMAIL config from env)
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  // ============================================================================
  // MAIN SEND METHOD
  // ============================================================================
  
  /**
   * Send notification through specified channels
   * @param {Object} options
   * @param {Object} options.recipient - { email, fcmToken, phone, name }
   * @param {string} options.template - Template name
   * @param {Object} options.data - Template data
   * @param {string[]} options.channels - ['email', 'push', 'sms']
   */
  async send({ recipient, template, data, channels = ['email', 'push'] }) {
    const results = [];
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            if (recipient.email) {
              await this.sendEmail(recipient, template, data);
              results.push({ channel: 'email', success: true });
            }
            break;
            
          case 'push':
            if (recipient.fcmToken) {
              await this.sendPush(recipient.fcmToken, template, data);
              results.push({ channel: 'push', success: true });
            }
            break;
            
          case 'sms':
            // Future implementation
            console.log('[NotificationService] SMS not yet implemented');
            break;
        }
      } catch (error) {
        console.error(`[NotificationService] Failed to send ${channel}:`, error.message);
        results.push({ channel, success: false, error: error.message });
      }
    }
    

    // Create in-app notification record
    try {
      if (recipient.id && recipient.type) {
        const pushConfig = this.getPushConfig(template, data);
        await Notification.createNotification({
          recipientId: recipient.id,
          recipientType: recipient.type === "user" ? "User" : "Provider",
          type: template,
          title: pushConfig?.title || "Findr Health",
          body: pushConfig?.body || "You have a new notification",
          data: {
            bookingId: data.bookingId,
            providerId: data.providerId,
            actionUrl: data.actionUrl || `/booking/${data.bookingId}`,
            actionLabel: data.actionLabel || "View Details"
          },
          priority: data.priority || "normal"
        });
        results.push({ channel: "in-app", success: true });
      }
    } catch (inAppError) {
      console.error("[NotificationService] Failed to create in-app notification:", inAppError.message);
      results.push({ channel: "in-app", success: false, error: inAppError.message });
    }

    return results;
  }

  // ============================================================================
  // EMAIL NOTIFICATIONS
  // ============================================================================
  
  async sendEmail(recipient, template, data) {
    const emailConfig = this.getEmailTemplate(template, data);
    
    await this.emailTransporter.sendMail({
      from: `"Findr Health" <${process.env.GMAIL_USER || 'noreply@findrhealth.com'}>`,
      to: recipient.email,
      subject: emailConfig.subject,
      html: emailConfig.html
    });
    
    console.log(`[NotificationService] Email sent: ${template} to ${recipient.email}`);
  }
  
  getEmailTemplate(template, data) {
    const templates = {
      // ==================== PATIENT NOTIFICATIONS ====================
      
      'booking_request_sent': {
        subject: 'Your Booking Request Has Been Sent',
        html: this.buildPatientRequestSentEmail(data)
      },
      
      'booking_confirmed_patient': {
        subject: '✅ Your Booking is Confirmed!',
        html: this.buildPatientConfirmedEmail(data)
      },
      
      'booking_declined_patient': {
        subject: 'Booking Request Update',
        html: this.buildPatientDeclinedEmail(data)
      },
      
      'reschedule_proposed_patient': {
        subject: '📅 New Time Proposed - Action Required',
        html: this.buildPatientRescheduleProposedEmail(data)
      },
      
      'booking_expired_patient': {
        subject: 'Booking Request Expired - No Charge',
        html: this.buildPatientExpiredEmail(data)
      },
      
      'booking_cancelled_patient': {
        subject: 'Booking Cancelled',
        html: this.buildPatientCancelledEmail(data)
      },
      
      // ==================== PROVIDER NOTIFICATIONS ====================
      
      'new_booking_request': {
        subject: '🔔 New Booking Request - Action Required',
        html: this.buildProviderNewRequestEmail(data)
      },
      
      'reschedule_accepted_provider': {
        subject: '✅ Patient Accepted Reschedule',
        html: this.buildProviderRescheduleAcceptedEmail(data)
      },
      
      'reschedule_declined_provider': {
        subject: 'Patient Declined Reschedule',
        html: this.buildProviderRescheduleDeclinedEmail(data)
      },
      
      'booking_cancelled_provider': {
        subject: 'Booking Cancelled by Patient',
        html: this.buildProviderCancelledEmail(data)
      },
      
      'booking_expiring_reminder': {
        subject: '⚠️ Booking Request Expiring Soon',
        html: this.buildProviderExpiringReminderEmail(data)
      }
    };
    
    const config = templates[template];
    if (!config) {
      console.warn(`[NotificationService] Unknown template: ${template}`);
      return {
        subject: 'Findr Health Notification',
        html: `<p>${JSON.stringify(data)}</p>`
      };
    }
    
    return config;
  }
  
  // ==================== EMAIL TEMPLATE BUILDERS ====================
  
  buildPatientRequestSentEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .booking-card { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .booking-card h3 { margin-top: 0; color: #0d9488; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { color: #6b7280; }
    .info-value { font-weight: 600; }
    .notice { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏳ Request Sent!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.patientName || 'there'},</p>
      <p>Your booking request has been sent to <strong>${data.providerName}</strong>. They'll review and respond within 24-48 hours.</p>
      
      <div class="booking-card">
        <h3>Booking Details</h3>
        <div class="info-row">
          <span class="info-label">Provider</span>
          <span class="info-value">${data.providerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Service</span>
          <span class="info-value">${data.serviceName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Requested Date</span>
          <span class="info-value">${data.appointmentDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Requested Time</span>
          <span class="info-value">${data.appointmentTime}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Amount</span>
          <span class="info-value">$${(data.amount / 100).toFixed(2)} (on hold)</span>
        </div>
      </div>
      
      <div class="notice">
        <strong>💳 Payment Hold:</strong> Your card has a temporary hold of $${(data.amount / 100).toFixed(2)}. This is NOT a charge. It will be released automatically if the provider doesn't confirm within 24 hours.
      </div>
      
      <p>We'll notify you as soon as the provider responds!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildPatientConfirmedEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .booking-card { background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #10b981; }
    .booking-card h3 { margin-top: 0; color: #059669; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5; }
    .info-label { color: #6b7280; }
    .info-value { font-weight: 600; }
    .cta-button { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Great news, ${data.patientName || 'there'}!</p>
      <p>Your booking with <strong>${data.providerName}</strong> has been confirmed.</p>
      
      <div class="booking-card">
        <h3>Confirmed Appointment</h3>
        <div class="info-row">
          <span class="info-label">Confirmation #</span>
          <span class="info-value">${data.confirmationCode || data.bookingId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Provider</span>
          <span class="info-value">${data.providerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Service</span>
          <span class="info-value">${data.serviceName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${data.appointmentDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${data.appointmentTime}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Address</span>
          <span class="info-value">${data.providerAddress || 'See app for details'}</span>
        </div>
      </div>
      
      <p>See you there! 🎉</p>
    </div>
    <div class="footer">
      <p>Need to cancel or reschedule? Open the Findr Health app.</p>
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildPatientDeclinedEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f3f4f6; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #374151; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .notice { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .refund-notice { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Update</h1>
    </div>
    <div class="content">
      <p>Hi ${data.patientName || 'there'},</p>
      <p>Unfortunately, <strong>${data.providerName}</strong> was unable to accommodate your booking request for ${data.serviceName} on ${data.appointmentDate}.</p>
      
      ${data.declineReason ? `<div class="notice"><strong>Reason:</strong> ${data.declineReason}</div>` : ''}
      
      <div class="refund-notice">
        <strong>💳 Payment Released:</strong> The hold on your card has been released. No charge was made.
      </div>
      
      <p>Don't worry - there are other great providers available!</p>
      
      <a href="https://app.findrhealth.com" class="cta-button">Find Another Provider</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildPatientRescheduleProposedEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .time-comparison { display: flex; gap: 20px; margin: 20px 0; }
    .time-box { flex: 1; padding: 15px; border-radius: 8px; }
    .time-box.original { background: #f3f4f6; text-decoration: line-through; color: #6b7280; }
    .time-box.proposed { background: #dbeafe; border: 2px solid #3b82f6; }
    .time-box h4 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; }
    .time-box .date { font-size: 18px; font-weight: bold; }
    .time-box .time { font-size: 14px; }
    .message-box { background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; font-style: italic; }
    .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 10px 5px; }
    .cta-button.secondary { background: #6b7280; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 New Time Proposed</h1>
    </div>
    <div class="content">
      <p>Hi ${data.patientName || 'there'},</p>
      <p><strong>${data.providerName}</strong> has proposed a different time for your appointment.</p>
      
      <div class="time-comparison">
        <div class="time-box original">
          <h4>Your Request</h4>
          <div class="date">${data.originalDate}</div>
          <div class="time">${data.originalTime}</div>
        </div>
        <div class="time-box proposed">
          <h4>Proposed Time</h4>
          <div class="date">${data.proposedDate}</div>
          <div class="time">${data.proposedTime}</div>
        </div>
      </div>
      
      ${data.message ? `<div class="message-box">"${data.message}"</div>` : ''}
      
      <p style="text-align: center;">
        <a href="findrhealth://booking/${data.bookingId}/reschedule" class="cta-button">Accept New Time</a>
        <a href="findrhealth://booking/${data.bookingId}/reschedule" class="cta-button secondary">Decline</a>
      </p>
      
      <p><small>If you decline, your booking will be cancelled and any payment hold will be released.</small></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildPatientExpiredEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f3f4f6; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #374151; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .refund-notice { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Request Expired</h1>
    </div>
    <div class="content">
      <p>Hi ${data.patientName || 'there'},</p>
      <p>Your booking request with <strong>${data.providerName}</strong> has expired because the provider didn't respond within the required timeframe.</p>
      
      <div class="refund-notice">
        <strong>💳 No Charge:</strong> The hold on your card has been automatically released. You were not charged.
      </div>
      
      <p>We apologize for the inconvenience. Please try booking with another provider!</p>
      
      <a href="https://app.findrhealth.com" class="cta-button">Find Another Provider</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildPatientCancelledEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f3f4f6; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #374151; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .refund-notice { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Cancelled</h1>
    </div>
    <div class="content">
      <p>Hi ${data.patientName || 'there'},</p>
      <p>Your booking with <strong>${data.providerName}</strong> for ${data.serviceName} on ${data.appointmentDate} has been cancelled${data.cancelledBy === 'provider' ? ' by the provider' : ''}.</p>
      
      ${data.refundAmount ? `
      <div class="refund-notice">
        <strong>💳 Refund:</strong> $${(data.refundAmount / 100).toFixed(2)} will be refunded to your original payment method within 5-10 business days.
      </div>
      ` : `
      <div class="refund-notice">
        <strong>💳 No Charge:</strong> The hold on your card has been released.
      </div>
      `}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildProviderNewRequestEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .booking-card { background: #fffbeb; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #f59e0b; }
    .booking-card h3 { margin-top: 0; color: #d97706; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fde68a; }
    .info-label { color: #6b7280; }
    .info-value { font-weight: 600; }
    .urgent-notice { background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
    .cta-button { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 10px 5px; }
    .cta-button.decline { background: #6b7280; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Booking Request</h1>
    </div>
    <div class="content">
      <p>Hi ${data.providerName || 'there'},</p>
      <p>You have a new booking request that requires your attention.</p>
      
      <div class="booking-card">
        <h3>Request Details</h3>
        <div class="info-row">
          <span class="info-label">Patient</span>
          <span class="info-value">${data.patientName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Service</span>
          <span class="info-value">${data.serviceName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Requested Date</span>
          <span class="info-value">${data.appointmentDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Requested Time</span>
          <span class="info-value">${data.appointmentTime}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Amount</span>
          <span class="info-value">$${(data.amount / 100).toFixed(2)}</span>
        </div>
      </div>
      
      <div class="urgent-notice">
        <strong>⏰ Respond within 24 hours</strong><br>
        Request expires: ${data.expiresAt}
      </div>
      
      <p style="text-align: center;">
        <a href="https://findrhealth-provider.vercel.app/bookings/pending" class="cta-button">Confirm Booking</a>
        <a href="https://findrhealth-provider.vercel.app/bookings/pending" class="cta-button decline">Decline or Reschedule</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildProviderRescheduleAcceptedEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .booking-card { background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #10b981; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Reschedule Accepted!</h1>
    </div>
    <div class="content">
      <p>Great news!</p>
      <p><strong>${data.patientName}</strong> has accepted your proposed new time for their appointment.</p>
      
      <div class="booking-card">
        <h3 style="color: #059669; margin-top: 0;">Confirmed Appointment</h3>
        <p><strong>Service:</strong> ${data.serviceName}</p>
        <p><strong>Date:</strong> ${data.appointmentDate}</p>
        <p><strong>Time:</strong> ${data.appointmentTime}</p>
      </div>
      
      <p>The booking is now confirmed!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildProviderRescheduleDeclinedEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f3f4f6; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #374151; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reschedule Declined</h1>
    </div>
    <div class="content">
      <p><strong>${data.patientName}</strong> was unable to accept your proposed new time for ${data.serviceName}.</p>
      <p>The booking has been cancelled and any payment hold has been released.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildProviderCancelledEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f3f4f6; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #374151; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Cancelled</h1>
    </div>
    <div class="content">
      <p><strong>${data.patientName}</strong> has cancelled their booking for ${data.serviceName} on ${data.appointmentDate}.</p>
      ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
  
  buildProviderExpiringReminderEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .urgent-notice { background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .cta-button { display: inline-block; background: #0d9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Urgent: Request Expiring!</h1>
    </div>
    <div class="content">
      <div class="urgent-notice">
        <h2 style="color: #dc2626; margin-top: 0;">Only ${data.hoursRemaining} hours remaining!</h2>
        <p>A booking request from <strong>${data.patientName}</strong> will expire soon.</p>
      </div>
      
      <p><strong>Service:</strong> ${data.serviceName}</p>
      <p><strong>Requested:</strong> ${data.appointmentDate} at ${data.appointmentTime}</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://findrhealth-provider.vercel.app/bookings/pending" class="cta-button">Respond Now</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  // ============================================================================
  // PUSH NOTIFICATIONS
  // ============================================================================
  
  async sendPush(fcmToken, template, data) {
    // Firebase Admin SDK required
    // This is a placeholder - implement when Firebase is configured
    console.log(`[NotificationService] Push notification queued: ${template}`);
    
    const messages = {
      'booking_request_sent': {
        title: 'Request Sent!',
        body: `Your booking request has been sent to ${data.providerName}`
      },
      'booking_confirmed_patient': {
        title: 'Booking Confirmed! ✅',
        body: `Your appointment with ${data.providerName} is confirmed`
      },
      'booking_declined_patient': {
        title: 'Booking Update',
        body: 'Your booking request could not be accommodated'
      },
      'reschedule_proposed_patient': {
        title: 'New Time Proposed 📅',
        body: `${data.providerName} suggested a different time`
      },
      'booking_expired_patient': {
        title: 'Request Expired',
        body: 'Your booking request expired. No charge was made.'
      },
      'new_booking_request': {
        title: 'New Booking Request! 🔔',
        body: `${data.patientName} wants to book ${data.serviceName}`
      },
      'reschedule_accepted_provider': {
        title: 'Reschedule Accepted ✅',
        body: `${data.patientName} accepted your proposed time`
      },
      'reschedule_declined_provider': {
        title: 'Reschedule Declined',
        body: `${data.patientName} declined the proposed time`
      },
      'booking_cancelled_provider': {
        title: 'Booking Cancelled',
        body: `${data.patientName} cancelled their ${data.serviceName} booking`
      },
      'booking_expiring_reminder': {
        title: '⚠️ Request Expiring Soon!',
        body: `Respond to ${data.patientName}'s request before it expires`
      }
    };
    
    const config = messages[template];
    if (!config) {
      console.warn(`[NotificationService] Unknown push template: ${template}`);
      return;
    }
    
    // TODO: Implement Firebase Admin SDK
    // await admin.messaging().send({
    //   token: fcmToken,
    //   notification: config,
    //   data: { bookingId: data.bookingId, type: template }
    // });
  }
}

module.exports = new NotificationService();
