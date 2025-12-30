/**
 * Email Service
 * Sends emails via Gmail SMTP using Nodemailer
 */

const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'findrhealth@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD // App password, not regular password
    }
  });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @returns {Promise} - Nodemailer send result
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Findr Health" <${process.env.GMAIL_USER || 'findrhealth@gmail.com'}>`,
    to,
    subject,
    text,
    html: html || text
  };
  
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

/**
 * Send provider outreach invite email
 * @param {Object} options
 * @param {string} options.toEmail - Provider email
 * @param {string} options.providerName - Provider/practice name (optional)
 * @param {string} options.providerType - Type of provider (Dental, Medical, etc.)
 * @param {string} options.city - City where user searched
 * @param {string} options.state - State where user searched
 */
const sendProviderInvite = async ({ toEmail, providerName, providerType, city, state }) => {
  const location = [city, state].filter(Boolean).join(', ') || 'your area';
  const greeting = providerName ? `Dear ${providerName}` : 'Hello';
  
  const subject = `Patients in ${location} are looking for ${providerType} providers - Join Findr Health`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .highlight { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .cta-button { display: inline-block; background: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .benefits li { margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Findr Health</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Healthcare Cost Transparency Platform</p>
    </div>
    
    <div class="content">
      <p>${greeting},</p>
      
      <div class="highlight">
        <strong>📍 Patients in ${location} are actively searching for ${providerType} providers on Findr Health!</strong>
      </div>
      
      <p>We're reaching out because users of our healthcare cost transparency platform are looking for quality ${providerType.toLowerCase()} care in your area, and we'd love to connect them with your practice.</p>
      
      <div class="benefits">
        <h3 style="margin-top: 0;">Why Join Findr Health?</h3>
        <ul>
          <li><strong>Free Listing</strong> - No cost to create your provider profile</li>
          <li><strong>Transparent Pricing</strong> - Attract cost-conscious patients by displaying your cash-pay rates</li>
          <li><strong>Direct Bookings</strong> - Patients can request appointments through the platform</li>
          <li><strong>Verified Badge</strong> - Stand out with our verification program</li>
          <li><strong>Analytics Dashboard</strong> - See how patients find and interact with your listing</li>
        </ul>
      </div>
      
      <p>Joining takes less than 10 minutes. Simply create your profile, add your services and pricing, and start connecting with patients who value transparency.</p>
      
      <center>
        <a href="https://findrhealth.com/providers/register" class="cta-button">Join Findr Health →</a>
      </center>
      
      <p>Have questions? Simply reply to this email - we're happy to help!</p>
      
      <p>Best regards,<br>
      <strong>The Findr Health Team</strong></p>
    </div>
    
    <div class="footer">
      <p>Findr Health - Making Healthcare Costs Transparent</p>
      <p>If you received this email in error, please disregard.</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const text = `
${greeting},

Patients in ${location} are actively searching for ${providerType} providers on Findr Health!

We're reaching out because users of our healthcare cost transparency platform are looking for quality ${providerType.toLowerCase()} care in your area, and we'd love to connect them with your practice.

Why Join Findr Health?
- Free Listing - No cost to create your provider profile
- Transparent Pricing - Attract cost-conscious patients by displaying your cash-pay rates
- Direct Bookings - Patients can request appointments through the platform
- Verified Badge - Stand out with our verification program
- Analytics Dashboard - See how patients find and interact with your listing

Joining takes less than 10 minutes. Simply create your profile, add your services and pricing, and start connecting with patients who value transparency.

Join now: https://findrhealth.com/providers/register

Have questions? Simply reply to this email - we're happy to help!

Best regards,
The Findr Health Team
  `;
  
  return sendEmail({ to: toEmail, subject, text, html });
};

/**
 * Send user follow-up email (when no providers found)
 * @param {Object} options
 * @param {string} options.toEmail - User email
 * @param {string} options.userName - User's name (optional)
 * @param {string} options.providerType - Type they searched for
 * @param {string} options.city - City they searched
 */
const sendUserFollowUp = async ({ toEmail, userName, providerType, city, state }) => {
  const location = [city, state].filter(Boolean).join(', ') || 'your area';
  const greeting = userName ? `Hi ${userName}` : 'Hi there';
  
  const subject = `Update on your ${providerType} search - Findr Health`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Findr Health</h1>
    </div>
    <div class="content">
      <p>${greeting},</p>
      
      <p>Thank you for using Findr Health to search for ${providerType.toLowerCase()} providers in ${location}.</p>
      
      <p>We wanted to let you know that we're actively reaching out to quality ${providerType.toLowerCase()} practices in your area to invite them to join our platform. We'll notify you as soon as we have providers available near you!</p>
      
      <p>In the meantime, our AI assistant Morgan is always available to help you:</p>
      <ul>
        <li>Understand typical costs for ${providerType.toLowerCase()} services</li>
        <li>Know what questions to ask providers</li>
        <li>Compare insurance vs. cash-pay options</li>
      </ul>
      
      <p>Thank you for your patience as we expand our network!</p>
      
      <p>Best,<br>
      <strong>The Findr Health Team</strong></p>
    </div>
    <div class="footer">
      <p>Findr Health - Making Healthcare Costs Transparent</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const text = `
${greeting},

Thank you for using Findr Health to search for ${providerType.toLowerCase()} providers in ${location}.

We wanted to let you know that we're actively reaching out to quality ${providerType.toLowerCase()} practices in your area to invite them to join our platform. We'll notify you as soon as we have providers available near you!

In the meantime, our AI assistant Morgan is always available to help you understand typical costs, know what questions to ask providers, and compare insurance vs. cash-pay options.

Thank you for your patience as we expand our network!

Best,
The Findr Health Team
  `;
  
  return sendEmail({ to: toEmail, subject, text, html });
};

module.exports = {
  sendEmail,
  sendProviderInvite,
  sendUserFollowUp
};
