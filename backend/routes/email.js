/**
 * Email Routes
 * Admin endpoints for sending emails
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { sendProviderInvite, sendUserFollowUp, sendEmail } = require('../services/emailService');
const Inquiry = require('../models/Inquiry');

const JWT_SECRET = process.env.JWT_SECRET || 'findr-health-admin-secret-2025';

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id || decoded.adminId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

/**
 * Send provider outreach invite
 * POST /api/admin/email/provider-invite
 */
router.post('/provider-invite', adminAuth, async (req, res) => {
  try {
    const { toEmail, providerName, providerType, city, state, inquiryId } = req.body;
    
    if (!toEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    // Send the email
    const result = await sendProviderInvite({
      toEmail,
      providerName,
      providerType: providerType || 'Healthcare',
      city,
      state
    });
    
    // If linked to an inquiry, log the follow-up
    if (inquiryId) {
      await Inquiry.findByIdAndUpdate(inquiryId, {
        $push: {
          followUps: {
            date: new Date(),
            method: 'email',
            notes: `Provider invite sent to ${toEmail}`,
            outcome: 'Email sent',
            createdBy: req.adminId
          }
        },
        status: 'contacted',
        contactedAt: new Date()
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Provider invite sent successfully',
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('Send provider invite error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message
    });
  }
});

/**
 * Send user follow-up email
 * POST /api/admin/email/user-followup
 */
router.post('/user-followup', adminAuth, async (req, res) => {
  try {
    const { toEmail, userName, providerType, city, state, inquiryId } = req.body;
    
    if (!toEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    // Send the email
    const result = await sendUserFollowUp({
      toEmail,
      userName,
      providerType: providerType || 'healthcare',
      city,
      state
    });
    
    // If linked to an inquiry, log the follow-up
    if (inquiryId) {
      await Inquiry.findByIdAndUpdate(inquiryId, {
        $push: {
          followUps: {
            date: new Date(),
            method: 'email',
            notes: `User follow-up sent to ${toEmail}`,
            outcome: 'Email sent',
            createdBy: req.adminId
          }
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: 'User follow-up sent successfully',
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('Send user follow-up error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message
    });
  }
});

/**
 * Send custom email
 * POST /api/admin/email/send
 */
router.post('/send', adminAuth, async (req, res) => {
  try {
    const { to, subject, text, html, inquiryId } = req.body;
    
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'to, subject, and text are required' });
    }
    
    const result = await sendEmail({ to, subject, text, html });
    
    // If linked to an inquiry, log the follow-up
    if (inquiryId) {
      await Inquiry.findByIdAndUpdate(inquiryId, {
        $push: {
          followUps: {
            date: new Date(),
            method: 'email',
            notes: `Custom email sent: "${subject}"`,
            outcome: 'Email sent',
            createdBy: req.adminId
          }
        },
        status: 'contacted',
        contactedAt: new Date()
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message
    });
  }
});

/**
 * Test email configuration
 * POST /api/admin/email/test
 */
router.post('/test', adminAuth, async (req, res) => {
  try {
    const { toEmail } = req.body;
    
    const result = await sendEmail({
      to: toEmail || process.env.GMAIL_USER,
      subject: 'Findr Health Email Test',
      text: 'This is a test email from your Findr Health admin dashboard. If you received this, email sending is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0d9488;">✅ Email Test Successful!</h2>
          <p>This is a test email from your Findr Health admin dashboard.</p>
          <p>If you received this, email sending is working correctly!</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `
    });
    
    res.json({ 
      success: true, 
      message: 'Test email sent!',
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: 'Email test failed',
      details: error.message
    });
  }
});

module.exports = router;
