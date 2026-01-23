const { OAuth2Client } = require('google-auth-library');

// Accept both iOS and Web client IDs
const clientIds = [
  process.env.GOOGLE_CLIENT_ID,      // Web client ID
  process.env.GOOGLE_IOS_CLIENT_ID,   // iOS client ID
].filter(Boolean);

const client = new OAuth2Client();

/**
 * Verify Google ID token and extract user info
 */
async function verifyGoogleToken(idToken) {
  try {
    // Try to verify with any of our client IDs
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: clientIds,  // Accept multiple audiences
    });
    
    const payload = ticket.getPayload();
    
    return {
      googleId: payload['sub'],
      email: payload['email'],
      emailVerified: payload['email_verified'],
      firstName: payload['given_name'] || '',
      lastName: payload['family_name'] || '',
      photoUrl: payload['picture'],
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}

module.exports = { verifyGoogleToken };
