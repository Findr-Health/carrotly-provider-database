with open('backend/models/User.js', 'r') as f:
    content = f.read()

# Find the schema definition and add profileComplete field
# Add after the agreement section
add_after = """  agreement: {
    signed: { type: Boolean, default: false },
    version: { type: String },
    signedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String }
  },"""

new_field = """  agreement: {
    signed: { type: Boolean, default: false },
    version: { type: String },
    signedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  
  // Profile completion status
  profileComplete: {
    type: Boolean,
    default: false
  },"""

content = content.replace(add_after, new_field)

# Add isProfileComplete method before module.exports
add_method_before = "module.exports = mongoose.model('User', userSchema);"

profile_method = """// Check if user profile is complete
userSchema.methods.isProfileComplete = function() {
  return !!(
    this.firstName &&
    this.lastName &&
    this.email &&
    this.phone &&
    this.agreement.signed &&
    this.address &&
    this.address.zipCode
  );
};

// Update profileComplete status
userSchema.methods.updateProfileCompletion = async function() {
  this.profileComplete = this.isProfileComplete();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);"""

content = content.replace(add_method_before, profile_method)

with open('backend/models/User.js', 'w') as f:
    f.write(content)

print("✅ Updated User model with profileComplete field and methods")
