const { Resend } = require('resend');
const Stripe = require('stripe');

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ============================================
// GOOGLE PLACES SEARCH
// ============================================
function setupSearchEndpoints(app, pool, authenticateAdmin) {
  
  // Search for business
  app.post('/api/search/business', async (req, res) => {
    try {
      const { businessName, zipCode } = req.body;
      
      if (!businessName) {
        return res.status(400).json({ error: 'Business name required' });
      }
      
      const query = zipCode 
        ? `${businessName} ${zipCode}`
        : businessName;
      
      const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(googleUrl);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        return res.json({ results: [], autoSelected: false });
      }
      
      const results = data.results.slice(0, 5).map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        photoReference: place.photos?.[0]?.photo_reference
      }));
      
      const autoSelected = results.length === 1;
      
      res.json({ results, autoSelected });
      
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });
  
  // Get place details
  app.get('/api/google/place/:placeId', async (req, res) => {
    try {
      const { placeId } = req.params;
      
      const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,photos,opening_hours,types&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(googleUrl);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        return res.status(404).json({ error: 'Place not found' });
      }
      
      res.json({ place: data.result });
      
    } catch (error) {
      console.error('Place details error:', error);
      res.status(500).json({ error: 'Failed to get place details' });
    }
  });
}

// ============================================
// EMAIL VERIFICATION
// ============================================
function setupVerificationEndpoints(app, pool) {
  
  // Generate 6-digit code
  function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Send verification email
  app.post('/api/verification/send', async (req, res) => {
    try {
      const { providerId, email } = req.body;
      
      // Check if provider exists
      const providerCheck = await pool.query(
        'SELECT id, email FROM providers WHERE id = $1',
        [providerId]
      );
      
      if (providerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      
      const provider = providerCheck.rows[0];
      
      // Verify email matches
      if (provider.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({ 
          error: 'Email does not match our records',
          message: 'You can only verify using the email we found online for this business.'
        });
      }
      
      // Check attempts
      const attemptsCheck = await pool.query(
        'SELECT verification_attempts FROM providers WHERE id = $1',
        [providerId]
      );
      
      if (attemptsCheck.rows[0]?.verification_attempts >= 3) {
        return res.status(429).json({ 
          error: 'Too many attempts',
          message: 'Please contact admin@findrhealth.com for assistance.'
        });
      }
      
      // Generate code
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Save code to database
      await pool.query(
        `UPDATE providers 
         SET verification_code = $1, 
             verification_code_sent_at = NOW(),
             verification_code_expires_at = $2
         WHERE id = $3`,
        [code, expiresAt, providerId]
      );
      
      // Send email via Resend
      await resend.emails.send({
        from: 'Findr Health <onboarding@findrhealth.com>',
        to: email,
        subject: 'Verify Your Business - Findr Health',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Verify Your Business</h1>
            <p>Your verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 1 hour.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `
      });
      
      // Log verification attempt
      await pool.query(
        `INSERT INTO verification_logs 
         (provider_id, verification_type, code_sent, success)
         VALUES ($1, $2, $3, $4)`,
        [providerId, 'email', code, true]
      );
      
      res.json({ 
        success: true, 
        expiresAt,
        message: 'Verification code sent to your email'
      });
      
    } catch (error) {
      console.error('Send verification error:', error);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  });
  
  // Verify code
  app.post('/api/verification/verify', async (req, res) => {
    try {
      const { providerId, code } = req.body;
      
      const result = await pool.query(
        `SELECT verification_code, verification_code_expires_at, verification_attempts
         FROM providers WHERE id = $1`,
        [providerId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      
      const provider = result.rows[0];
      
      // Check expiry
      if (new Date() > new Date(provider.verification_code_expires_at)) {
        return res.status(400).json({ 
          error: 'Code expired',
          message: 'Please request a new code'
        });
      }
      
      // Check code
      if (provider.verification_code !== code) {
        // Increment attempts
        await pool.query(
          'UPDATE providers SET verification_attempts = verification_attempts + 1 WHERE id = $1',
          [providerId]
        );
        
        const newAttempts = (provider.verification_attempts || 0) + 1;
        const remaining = 3 - newAttempts;
        
        if (remaining <= 0) {
          return res.status(403).json({
            error: 'Too many failed attempts',
            message: 'Please contact admin@findrhealth.com for assistance.'
          });
        }
        
        return res.status(400).json({ 
          error: 'Invalid code',
          attemptsRemaining: remaining
        });
      }
      
      // Success! Update provider
      await pool.query(
        `UPDATE providers 
         SET verified_at = NOW(),
             verification_method = 'email',
             status = 'verified'
         WHERE id = $1`,
        [providerId]
      );
      
      // Log success
      await pool.query(
        `INSERT INTO verification_logs 
         (provider_id, verification_type, code_sent, code_entered, success)
         VALUES ($1, $2, $3, $4, $5)`,
        [providerId, 'email', provider.verification_code, code, true]
      );
      
      res.json({ 
        success: true,
        message: 'Verification successful!',
        providerId
      });
      
    } catch (error) {
      console.error('Verify code error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  });
  
  // Resend code
  app.get('/api/verification/resend/:providerId', async (req, res) => {
    try {
      const { providerId } = req.params;
      
      const result = await pool.query(
        'SELECT email FROM providers WHERE id = $1',
        [providerId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      
      // Use the send endpoint logic
      req.body = { providerId, email: result.rows[0].email };
      return app.handle(req, res);
      
    } catch (error) {
      console.error('Resend error:', error);
      res.status(500).json({ error: 'Failed to resend code' });
    }
  });
}

// ============================================
// STRIPE CONNECT
// ============================================
function setupStripeEndpoints(app, pool, authenticateAdmin) {
  
  // Create Stripe Connect account
  app.post('/api/stripe/create-account', authenticateAdmin, async (req, res) => {
    try {
      const { providerId, country = 'US', businessType = 'individual' } = req.body;
      
      // Check if account already exists
      const existing = await pool.query(
        'SELECT stripe_account_id FROM provider_stripe_accounts WHERE provider_id = $1',
        [providerId]
      );
      
      if (existing.rows.length > 0 && existing.rows[0].stripe_account_id) {
        return res.json({ 
          accountId: existing.rows[0].stripe_account_id,
          message: 'Account already exists'
        });
      }
      
      // Create Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        business_type: businessType,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });
      
      // Save to database
      await pool.query(
        `INSERT INTO provider_stripe_accounts 
         (provider_id, stripe_account_id, stripe_account_type, country, business_type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (provider_id) 
         DO UPDATE SET stripe_account_id = $2`,
        [providerId, account.id, 'express', country, businessType]
      );
      
      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/payment-setup?refresh=true`,
        return_url: `${process.env.FRONTEND_URL}/payment-setup?success=true`,
        type: 'account_onboarding'
      });
      
      res.json({ 
        accountId: account.id,
        onboardingUrl: accountLink.url
      });
      
    } catch (error) {
      console.error('Stripe account creation error:', error);
      res.status(500).json({ error: 'Failed to create Stripe account' });
    }
  });
  
  // Get account status
  app.get('/api/stripe/account-status/:providerId', authenticateAdmin, async (req, res) => {
    try {
      const { providerId } = req.params;
      
      const result = await pool.query(
        'SELECT * FROM provider_stripe_accounts WHERE provider_id = $1',
        [providerId]
      );
      
      if (result.rows.length === 0) {
        return res.json({ 
          exists: false,
          onboardingComplete: false,
          payoutsEnabled: false
        });
      }
      
      const account = result.rows[0];
      
      // Get latest status from Stripe
      if (account.stripe_account_id) {
        const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id);
        
        // Update database
        await pool.query(
          `UPDATE provider_stripe_accounts 
           SET onboarding_complete = $1,
               payouts_enabled = $2,
               details_submitted = $3,
               charges_enabled = $4
           WHERE provider_id = $5`,
          [
            stripeAccount.details_submitted,
            stripeAccount.payouts_enabled,
            stripeAccount.details_submitted,
            stripeAccount.charges_enabled,
            providerId
          ]
        );
        
        res.json({
          exists: true,
          accountId: account.stripe_account_id,
          onboardingComplete: stripeAccount.details_submitted,
          payoutsEnabled: stripeAccount.payouts_enabled,
          chargesEnabled: stripeAccount.charges_enabled
        });
      } else {
        res.json({ 
          exists: false,
          onboardingComplete: false 
        });
      }
      
    } catch (error) {
      console.error('Stripe status error:', error);
      res.status(500).json({ error: 'Failed to get account status' });
    }
  });
}

module.exports = {
  setupSearchEndpoints,
  setupVerificationEndpoints,
  setupStripeEndpoints
};
