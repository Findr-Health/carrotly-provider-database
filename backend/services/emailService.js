/**
 * Email Service
 * Sends emails via Resend API
 */

const { Resend } = require('resend');

const getResend = () => {
  return new Resend(process.env.RESEND_API_KEY);
};

const sendEmail = async ({ to, subject, text, html }) => {
  const resend = getResend();
  
  try {
    const result = await resend.emails.send({
      from: 'Findr Health <providers@findrhealth.com>',
      to: [to],
      subject,
      text,
      html: html || text
    });
    
    console.log('Email sent:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

const sendProviderInvite = async ({ toEmail, providerName, providerType, city, state }) => {
  const location = [city, state].filter(Boolean).join(', ') || 'your area';
  const greeting = providerName ? `Dear ${providerName}` : 'Hello';
  const subject = `Patients in ${location} are looking for ${providerType} providers - Join Findr Health`;
  
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;"><div style="background:linear-gradient(135deg,#0d9488,#14b8a6);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;"><h1>Findr Health</h1></div><div style="background:#f9fafb;padding:30px;border:1px solid #e5e7eb;"><p>${greeting},</p><div style="background:#d1fae5;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;"><strong>Patients in ${location} are actively searching for ${providerType} providers on Findr Health!</strong></div><p>We'd love to connect them with your practice.</p><h3>Why Join?</h3><ul><li>Free Listing</li><li>Transparent Pricing</li><li>Direct Bookings</li><li>Analytics Dashboard</li></ul><p><a href="https://findrhealth.com/providers/register" style="display:inline-block;background:#0d9488;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;">Join Findr Health</a></p><p>Best regards,<br>The Findr Health Team</p></div></div></body></html>`;
  
  return sendEmail({ to: toEmail, subject, text: `${greeting}, Patients in ${location} are looking for ${providerType} providers. Join: https://findrhealth.com/providers/register`, html });
};

const sendUserFollowUp = async ({ toEmail, userName, providerType, city, state }) => {
  const location = [city, state].filter(Boolean).join(', ') || 'your area';
  const greeting = userName ? `Hi ${userName}` : 'Hi there';
  const subject = `Update on your ${providerType} search - Findr Health`;
  
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;"><div style="background:linear-gradient(135deg,#0d9488,#14b8a6);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;"><h1>Findr Health</h1></div><div style="background:#f9fafb;padding:30px;border:1px solid #e5e7eb;"><p>${greeting},</p><p>We're reaching out to ${providerType} providers in ${location} to join our platform. We'll notify you when they're available!</p><p>Best,<br>The Findr Health Team</p></div></div></body></html>`;
  
  return sendEmail({ to: toEmail, subject, text: `${greeting}, We're reaching out to ${providerType} providers in ${location}. We'll notify you when available!`, html });
};

module.exports = { sendEmail, sendProviderInvite, sendUserFollowUp };
