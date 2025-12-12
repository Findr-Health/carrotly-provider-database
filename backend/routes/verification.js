const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const verificationCodes = new Map();

router.post('/send', async (req, res) => {
  try {
    const { providerId, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    verificationCodes.set(providerId, {
      code,
      email,
      expiresAt,
      attempts: 0
    });

    console.log(`Verification code for ${email}: ${code}`);

    res.json({ 
      success: true, 
      message: 'Verification code sent',
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { providerId, code } = req.body;

    const stored = verificationCodes.get(providerId);

    if (!stored) {
      return res.status(400).json({ error: 'No verification code found' });
    }

    if (new Date() > stored.expiresAt) {
      verificationCodes.delete(providerId);
      return res.status(400).json({ error: 'Verification code expired' });
    }

    if (stored.attempts >= 3) {
      verificationCodes.delete(providerId);
      return res.status(400).json({ 
        error: 'Too many failed attempts',
        attemptsRemaining: 0
      });
    }

    if (stored.code !== code) {
      stored.attempts++;
      return res.status(400).json({ 
        error: 'Invalid verification code',
        attemptsRemaining: 3 - stored.attempts
      });
    }

    verificationCodes.delete(providerId);

    res.json({ 
      success: true,
      message: 'Verification successful'
    });

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
