# 📝 MANUAL EDITING INSTRUCTIONS
## Team Member Population Fix - Exact Changes Required

Use this guide if you prefer to edit the files manually in VS Code.

---

## FILE 1: routes/bookings.js

### CHANGE 1: GET /user/:userId endpoint (Line ~310)

**Find this code (around line 310):**
```javascript
    const bookings = await Booking.find(query)
      .populate('provider', 'practiceName address photos rating contactInfo')
      .sort({ appointmentDate: status === 'upcoming' ? 1 : -1 })
```

**Change to:**
```javascript
    const bookings = await Booking.find(query)
      .populate('provider', 'practiceName address photos rating contactInfo')
      .populate('teamMember', 'name title profilePhoto')
      .sort({ appointmentDate: status === 'upcoming' ? 1 : -1 })
```

**Added:** `.populate('teamMember', 'name title profilePhoto')`

---

### CHANGE 2: GET /:id endpoint (Line ~340)

**Find this code (around line 340):**
```javascript
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'practiceName address photos contactInfo cancellationPolicy calendar')
      .populate('user', 'firstName lastName email phone');

    if (!booking) {
```

**Change to:**
```javascript
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'practiceName address photos contactInfo cancellationPolicy calendar')
      .populate('user', 'firstName lastName email phone')
      .populate('teamMember', 'name title profilePhoto');

    if (!booking) {
```

**Added:** `.populate('teamMember', 'name title profilePhoto');`  
**Note:** Moved semicolon from `.populate('user')` line to new `.populate('teamMember')` line

---

## FILE 2: routes/bookingsadmin.js

### CHANGE 1: GET / (all bookings) endpoint (Line ~70)

**Find this code (around line 70):**
```javascript
    const bookings = await Booking.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('providerId', 'practiceName contactInfo')
      .sort({ appointmentDate: -1 })
```

**Change to:**
```javascript
    const bookings = await Booking.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('providerId', 'practiceName contactInfo')
      .populate('teamMember', 'name title profilePhoto email phone serviceIds')
      .sort({ appointmentDate: -1 })
```

**Added:** `.populate('teamMember', 'name title profilePhoto email phone serviceIds')`

---

### CHANGE 2: GET /:bookingId endpoint (Line ~95)

**Find this code (around line 95):**
```javascript
    const booking = await Booking.findById(req.params.bookingId)
      .populate('userId', 'firstName lastName email phone')
      .populate('providerId', 'practiceName contactInfo address')
      .populate('reviewId');
    
    if (!booking) {
```

**Change to:**
```javascript
    const booking = await Booking.findById(req.params.bookingId)
      .populate('userId', 'firstName lastName email phone')
      .populate('providerId', 'practiceName contactInfo address')
      .populate('reviewId')
      .populate('teamMember', 'name title profilePhoto email phone serviceIds calendar');
    
    if (!booking) {
```

**Added:** `.populate('teamMember', 'name title profilePhoto email phone serviceIds calendar');`  
**Note:** Removed semicolon from `.populate('reviewId')` line, added to new line

---

### CHANGE 3: PATCH /:bookingId/status endpoint (Line ~145)

**Find this code (around line 145):**
```javascript
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email')
     .populate('providerId', 'practiceName');
    
    if (!booking) {
```

**Change to:**
```javascript
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email')
     .populate('providerId', 'practiceName')
     .populate('teamMember', 'name title');
    
    if (!booking) {
```

**Added:** `.populate('teamMember', 'name title');`  
**Note:** Removed semicolon from `.populate('providerId')` line, added to new line

---

## VERIFICATION CHECKLIST

After making changes, search each file for `.populate('teamMember')`:

### bookings.js should have:
- [ ] Line ~312: `.populate('teamMember', 'name title profilePhoto')`
- [ ] Line ~344: `.populate('teamMember', 'name title profilePhoto');`

### bookingsadmin.js should have:
- [ ] Line ~73: `.populate('teamMember', 'name title profilePhoto email phone serviceIds')`
- [ ] Line ~99: `.populate('teamMember', 'name title profilePhoto email phone serviceIds calendar');`
- [ ] Line ~148: `.populate('teamMember', 'name title');`

**Total:** 5 changes across 2 files

---

## VS CODE EDITING TIPS

1. **Open file:** Cmd+P → type "bookings.js" → Enter
2. **Go to line:** Cmd+G → type line number → Enter
3. **Find text:** Cmd+F → paste the "Find this code" snippet
4. **Multiple cursors:** Hold Opt+Click to add cursor at multiple locations
5. **Format document:** Opt+Shift+F (after editing)
6. **Save:** Cmd+S

---

## TESTING AFTER CHANGES

```bash
# Check syntax
node -c routes/bookings.js
node -c routes/bookingsadmin.js

# Should output nothing if syntax is correct
# If errors, fix syntax before proceeding

# Search for your changes
grep -n "populate('teamMember'" routes/bookings.js
grep -n "populate('teamMember'" routes/bookingsadmin.js

# Should show 5 lines total (2 in bookings.js, 3 in bookingsadmin.js)
```

---

## DEPLOYMENT

```bash
# Review changes
git diff routes/bookings.js routes/bookingsadmin.js

# Stage files
git add routes/bookings.js routes/bookingsadmin.js

# Commit
git commit -m "fix: populate teamMember in all booking endpoints

- Add .populate('teamMember') to GET /user/:userId (bookings.js)
- Add .populate('teamMember') to GET /:id (bookings.js)
- Add .populate('teamMember') to GET / (bookingsadmin.js)
- Add .populate('teamMember') to GET /:bookingId (bookingsadmin.js)
- Add .populate('teamMember') to PATCH /:bookingId/status (bookingsadmin.js)

Fixes: Team member data now populated in all booking retrieval endpoints
Affects: User app, Admin dashboard, Provider portal"

# Push to deploy
git push origin main
```

---

## ROLLBACK (if needed)

If something breaks:

```bash
# Restore from git
git checkout routes/bookings.js routes/bookingsadmin.js

# Or restore from backup
mv routes/bookings.js.backup routes/bookings.js
mv routes/bookingsadmin.js.backup routes/bookingsadmin.js
```

---

**END OF MANUAL INSTRUCTIONS**
