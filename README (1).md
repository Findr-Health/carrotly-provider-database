# 🥕 UPLOAD WELLNOW - QUICK START

## ⚡ 30-Second Upload

```bash
# 1. Create directory and navigate
mkdir -p ~/Desktop/wellnow-upload
cd ~/Desktop/wellnow-upload

# 2. Move downloaded files here
# (Download the 4 files from Downloads folder)

# 3. Run upload (all-in-one)
node upload-and-verify.js
```

**That's it!** ✅

---

## 📥 Files You Need

Download these 4 files from Downloads folder:

1. ✅ **wellnow-chicago-complete.json** - Provider data with 85 services
2. ✅ **upload-and-verify.js** - All-in-one upload script (RECOMMENDED)
3. ✅ **upload-wellnow.js** - Upload only
4. ✅ **verify-upload.js** - Verification only

---

## 🎯 Three Upload Options

### Option 1: All-in-One (EASIEST) ⭐
```bash
node upload-and-verify.js
```
Does everything: upload + verify + next steps

### Option 2: Step-by-Step
```bash
node upload-wellnow.js     # Upload
node verify-upload.js      # Verify
```

### Option 3: Manual curl
```bash
curl -X POST https://fearless-achievement-production.up.railway.app/api/admin/providers \
  -H "Content-Type: application/json" \
  -d @wellnow-chicago-complete.json
```

---

## ✅ What You'll See

**Successful Upload:**
```
🥕 CARROTLY - WELLNOW UPLOAD WIZARD

✅ Provider data loaded successfully
   Practice: WellNow Urgent Care - Chicago (Evergreen Park)
   Services: 85
   Location: Chicago, IL

✅ SUCCESS! Provider uploaded to database

📊 UPLOAD SUMMARY:
   Provider ID: 674f1a2b3c4d5e6f7a8b9c0d
   Services: 85
   Status: pending

🔗 VIEW IN ADMIN DASHBOARD:
   https://carrotly-admin-dashboard.vercel.app/providers/[ID]
```

---

## 🔍 Verify Upload

**Option 1: Admin Dashboard (Visual)**
1. Go to: https://carrotly-admin-dashboard.vercel.app
2. Login: admin@carrotly.com / admin123
3. Look for "WellNow Urgent Care - Chicago"
4. Should show 85 services

**Option 2: Command Line**
```bash
node verify-upload.js
```

---

## 🎯 After Upload

### Immediate Actions:
1. ✅ View in Admin Dashboard
2. ✅ Approve the provider
3. ✅ Test search in onboarding app

### Next Steps:
1. Upload more WellNow locations (150 total)
2. Create Aspen Dental catalog
3. Expand to more provider types

---

## 🐛 If Upload Fails

**Error: "Cannot find module"**
```bash
# Make sure you're in the right directory
pwd  # Should show: ~/Desktop/wellnow-upload
ls   # Should show the 4 files
```

**Error: "ENOENT" or file not found**
```bash
# Check files exist
ls -la wellnow-chicago-complete.json
# If missing, download again from Downloads folder
```

**Error: "Connection refused"**
```bash
# Check backend is running
curl https://fearless-achievement-production.up.railway.app/api/admin/stats
# Should return data (even if 401, that's fine)
```

**No output or hangs**
```bash
# Try with more verbose output
node upload-wellnow.js
# Then separately verify
node verify-upload.js
```

---

## 📊 What Gets Uploaded

**Provider Info:**
- Practice Name: WellNow Urgent Care - Chicago (Evergreen Park)
- Address: 9501 S Western Ave, Chicago, IL 60643
- Phone: (773) 344-9465
- Type: Medical (🏥)

**85 Services in 15 Categories:**
1. Urgent Care Visits (8)
2. Virtual Care (1)
3. Condition-Specific Packages (8)
4. Injury Assessment (4)
5. Laboratory Services (18)
6. Imaging (5)
7. IV Therapy (7)
8. Physical Exams (5)
9. Vaccinations (7)
10. Diagnostic Procedures (6)
11. Minor Procedures (6)
12. Point-of-Care Testing (7)
13. Occupational Health (3)
14. Telemedicine (3)
15. Wellness Packages (5)

**Total Value:** $10,000+ in service menu

---

## 💡 Pro Tips

1. **Use upload-and-verify.js** - It does everything in one go
2. **Keep terminal open** - Watch for success message and Provider ID
3. **Save Provider ID** - You'll need it to view in dashboard
4. **Test immediately** - Verify in admin dashboard right away
5. **Approve quickly** - Makes provider visible to patients

---

## 🔗 Important Links

**Admin Dashboard:**
https://carrotly-admin-dashboard.vercel.app
(Login: admin@carrotly.com / admin123)

**Provider Onboarding:**
https://carrotly-provider-mvp.vercel.app

**Backend API:**
https://fearless-achievement-production.up.railway.app

---

## 📞 Need Help?

**Check these in order:**

1. Backend running?
   ```bash
   curl https://fearless-achievement-production.up.railway.app/api/admin/stats
   ```

2. Files in right place?
   ```bash
   ls -la wellnow-chicago-complete.json
   ```

3. JSON valid?
   ```bash
   cat wellnow-chicago-complete.json | head -20
   ```

4. Node.js installed?
   ```bash
   node --version  # Should show v16 or higher
   ```

---

## ⚡ TL;DR

```bash
cd ~/Desktop/wellnow-upload
node upload-and-verify.js
```

Then go to: https://carrotly-admin-dashboard.vercel.app

**Done!** 🎉

---

**Ready? Let's upload WellNow to Carrotly! 🚀**
