// backend/utils/emailTemplates.js

const emailTemplates = {
  // Patient receives when booking request is created
  bookingRequestSent: (data) => ({
    subject: 'Booking Request Sent - Findr Health',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0D9488;">Booking Request Sent!</h2>
        <p>Hi ${data.patientName},</p>
        <p>Your booking request has been sent to <strong>${data.providerName}</strong>.</p>
        
        <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${data.serviceName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Requested Time:</strong> ${data.requestedDateTime}</p>
          <p style="margin: 0;"><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)} (on hold)</p>
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ol>
          <li>The provider will review your request</li>
          <li>You'll receive a notification within 24 hours</li>
          <li>Your card will only be charged if confirmed</li>
        </ol>
        
        <p style="color: #6B7280; font-size: 14px;">
          Your card has a temporary hold of $${(data.amount / 100).toFixed(2)}. 
          This is not a charge and will be released if the booking is not confirmed.
        </p>
        
        <p>Thanks,<br>The Findr Health Team</p>
      </div>
    `
  }),

  // Patient receives when provider confirms
  bookingConfirmed: (data) => ({
    subject: '✅ Booking Confirmed! - Findr Health',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Your Booking is Confirmed!</h2>
        <p>Hi ${data.patientName},</p>
        <p>Great news! <strong>${data.providerName}</strong> has confirmed your booking.</p>
        
        <div style="background: #D1FAE5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${data.serviceName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${data.confirmedDateTime}</p>
          <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${data.providerAddress}</p>
          <p style="margin: 0;"><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</p>
        </div>
        
        <a href="${data.bookingUrl}" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          View Booking Details
        </a>
        
        <p>Thanks,<br>The Findr Health Team</p>
      </div>
    `
  }),

  // Patient receives when provider proposes reschedule
  rescheduleProposed: (data) => ({
    subject: '📅 New Time Proposed - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">New Time Proposed</h2>
        <p>Hi ${data.patientName},</p>
        <p><strong>${data.providerName}</strong> has proposed a different time for your appointment.</p>
        
        <div style="background: #EFF6FF; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; text-decoration: line-through; color: #6B7280;">
            <strong>Original:</strong> ${data.originalDateTime}
          </p>
          <p style="margin: 0; color: #1D4ED8;">
            <strong>Proposed:</strong> ${data.proposedDateTime}
          </p>
        </div>
        
        ${data.message ? `
        <div style="background: #F3F4F6; border-left: 4px solid #0D9488; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${data.message}"</p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #6B7280;">- ${data.providerName}</p>
        </div>
        ` : ''}
        
        <p><strong>Please respond within 24 hours:</strong></p>
        
        <a href="${data.responseUrl}" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 8px 0;">
          Respond Now
        </a>
        
        <p style="color: #6B7280; font-size: 14px;">
          If you don't respond, your booking will be cancelled and your card hold released.
        </p>
        
        <p>Thanks,<br>The Findr Health Team</p>
      </div>
    `
  }),

  // Provider receives when new booking request comes in
  newBookingRequest: (data) => ({
    subject: '🔔 New Booking Request - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">New Booking Request</h2>
        <p>Hi ${data.providerName},</p>
        <p>You have a new booking request that needs your response.</p>
        
        <div style="background: #FEF3C7; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Patient:</strong> ${data.patientName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${data.serviceName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Requested Time:</strong> ${data.requestedDateTime}</p>
          <p style="margin: 0;"><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</p>
        </div>
        
        ${data.patientNote ? `
        <div style="background: #F3F4F6; padding: 12px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Patient Note:</strong> "${data.patientNote}"</p>
        </div>
        ` : ''}
        
        <p style="color: #B45309; font-weight: bold;">
          ⏰ Please respond within 24 hours or this request will expire.
        </p>
        
        <a href="${data.dashboardUrl}" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          View & Respond
        </a>
        
        <p>Thanks,<br>The Findr Health Team</p>
      </div>
    `
  }),

  // Patient receives when request declined
  bookingDeclined: (data) => ({
    subject: 'Booking Request Update - Findr Health',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6B7280;">Booking Not Available</h2>
        <p>Hi ${data.patientName},</p>
        <p>Unfortunately, <strong>${data.providerName}</strong> was unable to accommodate your booking request.</p>
        
        <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${data.serviceName}</p>
          <p style="margin: 0;"><strong>Requested Time:</strong> ${data.requestedDateTime}</p>
        </div>
        
        <div style="background: #D1FAE5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #059669;">
            ✓ <strong>Your card hold has been released.</strong> No charge was made.
          </p>
        </div>
        
        <p>You can search for other available providers on Findr Health.</p>
        
        <a href="${data.searchUrl}" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Find Another Provider
        </a>
        
        <p>Thanks,<br>The Findr Health Team</p>
      </div>
    `
  }),

  // Patient receives when request expires
  bookingExpired: (data) => ({
    subject: 'Booking Request Expired - Findr Health',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6B7280;">Booking Request Expired</h2>
        <p>Hi ${data.patientName},</p>
        <p>Your booking request with <strong>${data.providerName}</strong> has expired because the provider did not respond within 24 hours.</p>
        
        <div style="background: #D1FAE5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #059669;">
            ✓ <strong>Your card hold has been released.</strong> No charge was made.
          </p>
        </div>
        
        <p>We apologize for the inconvenience. You can search for other available providers.</p>
        
        <a href="${data.searchUrl}" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Find Another Provider
        </a>
        
        <p>Thanks,<br>The Findr Health Team</p>
      </div>
    `
  }),
};

module.exports = emailTemplates;
