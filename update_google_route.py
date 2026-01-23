with open('backend/routes/google.js', 'r') as f:
    content = f.read()

# Replace the user creation section to NOT auto-accept TOS
old_user_creation = """      user = new User({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        socialId: googleUser.googleId,
        authProvider: 'google',
        photoUrl: googleUser.photoUrl,
        password: Math.random().toString(36), // Random password (won't be used)
        agreement: {
          signed: true,
          signedAt: new Date(),
        }
      });"""

new_user_creation = """      user = new User({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        socialId: googleUser.googleId,
        authProvider: 'google',
        photoUrl: googleUser.photoUrl,
        password: Math.random().toString(36), // Random password (won't be used)
        profileComplete: false, // Requires profile completion
        agreement: {
          signed: false, // Must explicitly accept TOS
          signedAt: null,
        }
      });"""

content = content.replace(old_user_creation, new_user_creation)

# Update response to include profileComplete status
old_response = """    // Return user data and token
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        authProvider: user.authProvider,
      },
      message: isNewUser ? 'Account created successfully' : 'Login successful'
    });"""

new_response = """    // Return user data and token
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        photoUrl: user.photoUrl,
        authProvider: user.authProvider,
        profileComplete: user.profileComplete || false,
      },
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      requiresProfileCompletion: !user.profileComplete
    });"""

content = content.replace(old_response, new_response)

with open('backend/routes/google.js', 'w') as f:
    f.write(content)

print("✅ Updated Google auth route - removed auto TOS acceptance")
