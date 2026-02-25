# ⚡ SUPER SIMPLE - RUN FROM DOWNLOADS

## STEP 1: Find Your Backend Path

Open Terminal and run:
```bash
find ~ -type d -name "CARROTLY-PROVIDER-DATABASE" 2>/dev/null
```

**Copy the output** - it will look something like:
```
/Users/timwetherill/Documents/CARROTLY-PROVIDER-DATABASE
```

---

## STEP 2: Run These Commands

**Paste the commands below into Terminal, but REPLACE the path with yours:**

```bash
# Navigate to Downloads
cd ~/Downloads

# SET YOUR BACKEND PATH HERE (replace with output from Step 1)
BACKEND="/Users/timwetherill/PATH/TO/CARROTLY-PROVIDER-DATABASE/backend"

# Create backups
cp "$BACKEND/routes/bookings.js" "$BACKEND/routes/bookings.js.backup"
cp "$BACKEND/routes/bookingsadmin.js" "$BACKEND/routes/bookingsadmin.js.backup"

# Run the fixes
python3 fix_bookings.py "$BACKEND/routes/bookings.js"
python3 fix_bookingsadmin.py "$BACKEND/routes/bookingsadmin.js"

# Check it worked
grep "populate('teamMember'" "$BACKEND/routes/bookings.js"
grep "populate('teamMember'" "$BACKEND/routes/bookingsadmin.js"
```

**If you see 2 lines from bookings.js and 3 lines from bookingsadmin.js = SUCCESS ✅**

---

## STEP 3: Deploy

```bash
# Go to backend
cd "$BACKEND"

# Review changes
git diff routes/bookings.js routes/bookingsadmin.js

# If changes look good, deploy
git add routes/bookings.js routes/bookingsadmin.js
git commit -m "fix: populate teamMember in booking endpoints"
git push origin main
```

---

## OR USE THE INTERACTIVE SCRIPT

Even simpler:

```bash
cd ~/Downloads
bash run_from_downloads.sh
```

It will ask you for the path and do everything automatically.

---

## PASTE ME THE PATH

Just paste the output of this command and I'll give you the EXACT commands:

```bash
find ~ -type d -name "CARROTLY-PROVIDER-DATABASE" 2>/dev/null
```
