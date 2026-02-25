# 🎯 PAYMENT SYSTEM FIX - PHASE 1: BACKEND SCHEMA

## PRIORITY: P0 - CRITICAL (Blocks Revenue)

## 🔍 ROOT CAUSE ANALYSIS

**Problem:**
```javascript
// Current User model (backend/models/User.js)
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  // ❌ NO STRIPE FIELDS
});

// What happens now:
1. User tries to add credit card
2. Backend creates NEW Stripe customer every time
3. Payment method attached to customer_123
4. Next API call creates customer_456
5. Tries to use payment method from customer_123 with customer_456
6. Stripe error: "PaymentMethod does not belong to Customer"
```

**Solution:**
```javascript
// Add Stripe fields to User model
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  // ✅ ADD THESE STRIPE FIELDS
  stripe: {
    customerId: { type: String, index: true },
    paymentMethods: [{ type: String }],
    defaultPaymentMethod: { type: String }
  }
});
```

---

## 📂 FILE 1: Update User Model Schema

### File: `backend/models/User.js`

### FIND THIS SECTION (Current Schema):
```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
  },
  phone: String,
  dateOfBirth: Date,
  profilePicture: String,
  // ... other fields
}, {
  timestamps: true,
});
```

### ADD THIS STRIPE SECTION (After existing fields, before timestamps):
```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
  },
  phone: String,
  dateOfBirth: Date,
  profilePicture: String,
  
  // ✅ STRIPE INTEGRATION FIELDS
  stripe: {
    customerId: { 
      type: String, 
      index: true,
      sparse: true, // Allow null values but index when present
    },
    paymentMethods: [{
      type: String, // Array of Stripe PaymentMethod IDs
    }],
    defaultPaymentMethod: {
      type: String, // Default PaymentMethod ID
    },
    // Track when customer was created
    customerCreatedAt: {
      type: Date,
    },
  },
  
  // ... rest of existing fields
}, {
  timestamps: true,
});
```

---

## 📂 FILE 2: Create Migration Script

### File: `backend/scripts/migrate-stripe-fields.js`

### CREATE NEW FILE:
```javascript
/**
 * Migration Script: Add Stripe fields to existing users
 * Run once to update all existing user documents
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function migrateStripeFields() {
  try {
    console.log('🔄 Starting Stripe fields migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all users without stripe field
    const usersToUpdate = await User.find({
      $or: [
        { stripe: { $exists: false } },
        { 'stripe.customerId': { $exists: false } }
      ]
    });
    
    console.log(`📊 Found ${usersToUpdate.length} users to update`);
    
    // Update each user with empty stripe object
    let updated = 0;
    for (const user of usersToUpdate) {
      user.stripe = {
        customerId: null,
        paymentMethods: [],
        defaultPaymentMethod: null,
        customerCreatedAt: null,
      };
      await user.save();
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`   Progress: ${updated}/${usersToUpdate.length}`);
      }
    }
    
    console.log(`✅ Migration complete! Updated ${updated} users`);
    
    // Verify migration
    const totalUsers = await User.countDocuments();
    const usersWithStripe = await User.countDocuments({ 
      'stripe': { $exists: true } 
    });
    
    console.log(`\n📊 Verification:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with stripe field: ${usersWithStripe}`);
    
    if (totalUsers === usersWithStripe) {
      console.log('✅ All users successfully migrated!');
    } else {
      console.log('⚠️  Some users may not have stripe field');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrateStripeFields()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateStripeFields };
```

---

## 📂 FILE 3: Update User Controller (Return Stripe Data)

### File: `backend/controllers/userController.js`

### FIND: getCurrentUser function (or similar)
```javascript
// Current implementation (likely)
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password'); // Exclude password
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

### UPDATE TO (Include Stripe data):
```javascript
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password'); // Exclude password
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // ✅ Ensure stripe object exists (for backward compatibility)
    if (!user.stripe) {
      user.stripe = {
        customerId: null,
        paymentMethods: [],
        defaultPaymentMethod: null,
      };
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

---

## 🧪 VERIFICATION STEPS

### Step 1: Update User Model
```bash
cd ~/Development/findr-health/findr-health-backend

# Open and edit
code backend/models/User.js

# Add the stripe fields as shown above
```

### Step 2: Create Migration Script
```bash
# Create file
code backend/scripts/migrate-stripe-fields.js

# Copy the migration script code
```

### Step 3: Run Migration
```bash
cd backend

# Run migration
node scripts/migrate-stripe-fields.js

# Expected output:
# 🔄 Starting Stripe fields migration...
# ✅ Connected to MongoDB
# 📊 Found X users to update
# ✅ Migration complete! Updated X users
# ✅ All users successfully migrated!
```

### Step 4: Verify in MongoDB
```bash
# Connect to MongoDB shell (if using Railway)
# OR use MongoDB Compass
# OR use Railway dashboard

# Query to verify:
db.users.findOne({}, { stripe: 1, email: 1 })

# Should return:
# {
#   _id: ObjectId("..."),
#   email: "user@example.com",
#   stripe: {
#     customerId: null,
#     paymentMethods: [],
#     defaultPaymentMethod: null
#   }
# }
```

### Step 5: Update User Controller
```bash
code backend/controllers/userController.js

# Update getCurrentUser as shown above
```

### Step 6: Test API
```bash
# Restart backend server
npm run dev

# Test GET /api/users/me endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/users/me

# Should return user with stripe field
```

---

## ✅ PHASE 1 CHECKLIST

- [ ] User model updated with stripe fields
- [ ] Migration script created
- [ ] Migration script executed successfully
- [ ] All users have stripe field in database
- [ ] User controller returns stripe data
- [ ] API tested - stripe field appears in response
- [ ] Backend server restarted
- [ ] No errors in logs

---

## 🚨 IMPORTANT NOTES

### Why This Matters:
1. **Without this:** Every payment creates new Stripe customer
2. **With this:** Single Stripe customer per user (proper architecture)
3. **Impact:** Payment methods persist correctly
4. **Bonus:** Can track payment history, subscriptions, etc.

### Backward Compatibility:
- Migration adds stripe field to existing users
- New users get stripe field automatically
- Controller ensures stripe field always exists
- No breaking changes to API

### Security:
- Stripe customer IDs are safe to expose (they're not secrets)
- Payment method IDs are safe (they don't contain card data)
- Actual card data never stored in database (only in Stripe)

---

## ⏭️ NEXT: PHASE 2

After Phase 1 is complete and verified, we'll move to:

**PHASE 2: PAYMENT ENDPOINTS**
- Fix payment setup endpoint
- Implement customer creation/reuse logic
- Fix payment method attachment
- Add proper error handling

**Estimated Phase 1 Time:** 1-2 hours  
**Difficulty:** Medium  
**Risk:** Low (has migration rollback)

---

**Ready to start Phase 1? Begin with Step 1 above!** 🚀
