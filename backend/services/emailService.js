const sgMail = require('@sendgrid/mail');

// Initialize SendGrid - only if API key exists
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const getFromEmail = () => process.env.FROM_EMAIL || 'noreply@findrhealth.com';
const getAppUrl = () => process.env.APP_URL || 'https://findrhealth.com';
const FROM_NAME = 'Findr Health';

const emailService = {
  async sendPasswordResetEmail(to, resetToken, firstName) {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('⚠️ SendGrid not configured, skipping email');
      console.log(`Would send reset email to ${to} with token ${resetToken}`);
      return { success: true, skipped: true };
    }

    const resetUrl = `${getAppUrl()}/reset-password?token=${resetToken}`;
    
    const msg = {
      to,
      from: {
        email: getFromEmail(),
        name: FROM_NAME
      },
      subject: 'Reset Your Findr Health Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0d9488; margin: 0;">Findr Health</h1>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #111827;">Reset Your Password</h2>
            <p>Hi ${firstName || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(to right, #0d9488, #06b6d4); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
          
          <div style="text-align: center; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
            <p>If the button doesn't work, copy and paste this link:<br>
            <a href="${resetUrl}" style="color: #0d9488; word-break: break-all;">${resetUrl}</a></p>
          </div>
        </body>
        </html>
      `,
      text: `
Reset Your Password

Hi ${firstName || 'there'},

We received a request to reset your password. Visit the link below to create a new password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this, you can safely ignore this email.

© ${new Date().getFullYear()} Findr Health
      `
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Password reset email sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Email send error:', error.response?.body || error.message);
      throw error;
    }
  },

  async sendWelcomeEmail(to, firstName) {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('⚠️ SendGrid not configured, skipping welcome email');
      return { success: true, skipped: true };
    }

    const msg = {
      to,
      from: {
        email: getFromEmail(),
        name: FROM_NAME
      },
      subject: 'Welcome to Findr Health!',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0d9488; margin: 0;">Findr Health</h1>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px;">
            <h2 style="margin-top: 0; color: #111827;">Welcome, ${firstName}! 🎉</h2>
            <p>Thank you for joining Findr Health. We're excited to help you find the best healthcare providers in your area.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${getAppUrl()}" style="background: linear-gradient(to right, #0d9488, #06b6d4); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Start Exploring
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Findr Health, ${firstName}! Visit ${getAppUrl()} to get started.`
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Welcome email sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Email send error:', error.response?.body || error.message);
      throw error;
    }
  },

  async sendProviderApprovalEmail(to, practiceName, approved) {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('⚠️ SendGrid not configured, skipping provider email');
      return { success: true, skipped: true };
    }

    const subject = approved 
      ? 'Your Findr Health Provider Account is Approved!' 
      : 'Update on Your Findr Health Provider Application';
    
    const msg = {
      to,
      from: {
        email: getFromEmail(),
        name: FROM_NAME
      },
      subject,
      html: approved ? `
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0d9488;">Findr Health</h1>
          <div style="background: #ecfdf5; border-radius: 8px; padding: 30px; border: 1px solid #10b981;">
            <h2 style="color: #065f46;">Congratulations! 🎉</h2>
            <p>Your provider profile for <strong>${practiceName}</strong> has been approved.</p>
            <p>Your practice is now visible to patients on Findr Health.</p>
            <a href="https://findrhealth-provider.vercel.app/login" style="background: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">
              Access Your Dashboard
            </a>
          </div>
        </body>
      ` : `
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0d9488;">Findr Health</h1>
          <div style="background: #fef2f2; border-radius: 8px; padding: 30px; border: 1px solid #f87171;">
            <h2 style="color: #991b1b;">Application Update</h2>
            <p>After reviewing your application for <strong>${practiceName}</strong>, we were unable to approve it at this time.</p>
            <p>Please contact support if you have questions.</p>
          </div>
        </body>
      `,
      text: approved 
        ? `Congratulations! Your provider profile for ${practiceName} has been approved.`
        : `Your application for ${practiceName} was not approved at this time.`
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Provider ${approved ? 'approval' : 'rejection'} email sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Email send error:', error.response?.body || error.message);
      throw error;
    }
  },

  async sendProviderWelcomeEmail(to, practiceName) {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('⚠️ SendGrid not configured, skipping provider welcome email');
      return { success: true, skipped: true };
    }

    const msg = {
      to,
      from: {
        email: getFromEmail(),
        name: FROM_NAME
      },
      subject: 'Welcome to Findr Health - Your Application is Under Review',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0d9488; margin: 0;">Findr Health</h1>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px;">
            <h2 style="margin-top: 0; color: #111827;">Welcome, ${practiceName}! 🎉</h2>
            <p>Thank you for registering with Findr Health. We're excited to have you join our network of healthcare providers.</p>
            
            <h3 style="color: #0d9488;">What happens next?</h3>
            <ol style="color: #4b5563;">
              <li>Our team will review your application (typically within 24-48 hours)</li>
              <li>You'll receive an email once your profile is approved</li>
              <li>Once approved, your practice will be visible to patients in your area</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://findrhealth-provider.vercel.app/login" style="background: linear-gradient(to right, #0d9488, #06b6d4); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            <p>© ${new Date().getFullYear()} Findr Health. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Findr Health, ${practiceName}! Our team will review your application within 24-48 hours. Access your dashboard at https://findrhealth-provider.vercel.app/login`
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Provider welcome email sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Email send error:', error.response?.body || error.message);
      throw error;
    }
  }
};

module.exports = emailService;