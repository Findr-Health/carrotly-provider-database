## 🔍 SEARCH V2 TESTS (NEW - Added Jan 25, 2026)

**Critical Feature:** Service-first search with direct booking  
**Priority:** P0 - Must test before every mobile deployment  
**Impact:** Core user flow - search and book

### Test Suite: Search V2 Functionality

**Test 1: Basic Search**
- [ ] Open mobile app
- [ ] Tap search icon
- [ ] Type "labs" in search field
- [ ] Results appear (12+ service results expected)
- [ ] Services display with:
  - [ ] Service name (e.g., "CBC")
  - [ ] Large price display (e.g., "$38")
  - [ ] Category badge (e.g., "Labs")
  - [ ] Duration (e.g., "15 min")
  - [ ] Provider name below
  - [ ] "Book" button visible

**Test 2: Search Results Display**
- [ ] Search for "massage"
- [ ] Service cards show:
  - [ ] Price is prominent (32-36pt font)
  - [ ] Price indicator bar (green/orange/red)
  - [ ] Price label ("Low price", "Average", "Premium")
  - [ ] Category badge with correct color
  - [ ] Provider info at bottom
- [ ] No overflow errors
- [ ] Images/gradients display correctly

**Test 3: Sort Functionality**
- [ ] Perform search (e.g., "dental")
- [ ] Tap sort button (default: "Relevance")
- [ ] Select "Price: Low to High"
- [ ] Verify results reorder (cheapest first)
- [ ] Select "Price: High to Low"
- [ ] Verify results reorder (most expensive first)
- [ ] Return to "Relevance"
- [ ] Verify default ordering

**Test 4: Service Detail Sheet - Card Tap**
- [ ] Search for "labs"
- [ ] Tap anywhere on service card EXCEPT "Book" button
- [ ] Detail sheet slides up from bottom
- [ ] Sheet shows:
  - [ ] Category badge + duration
  - [ ] Service name (large, 26pt)
  - [ ] Large price display ($$$)
  - [ ] Price indicator bar
  - [ ] Full description (if available)
  - [ ] Provider card section
  - [ ] "Book This Service" button at bottom
- [ ] Can swipe down to dismiss
- [ ] Can drag handle to dismiss

**Test 5: Direct Booking - Book Button**
- [ ] Search for "labs"
- [ ] Tap "Book" button (NOT the card)
- [ ] **CRITICAL:** Should navigate directly to booking flow
- [ ] Should NOT go to provider detail page
- [ ] Booking flow shows:
  - [ ] Service pre-selected (e.g., "CBC")
  - [ ] Provider name shown
  - [ ] Price shown
  - [ ] Date/time selection available
- [ ] Can complete booking

**Test 6: Service Detail Sheet - Book Button**
- [ ] Search for "massage"
- [ ] Tap service card body (opens detail sheet)
- [ ] Read service information
- [ ] Tap "Book This Service" button
- [ ] Sheet dismisses
- [ ] Navigates to booking flow
- [ ] Service pre-selected
- [ ] Can complete booking

**Test 7: Provider Exploration - Provider Card Tap**
- [ ] Search for "dental"
- [ ] Tap service card (opens detail sheet)
- [ ] In detail sheet, tap provider card
- [ ] Sheet dismisses
- [ ] Navigates to provider profile page
- [ ] Provider detail loads:
  - [ ] Provider name
  - [ ] All services listed
  - [ ] Photos/cover image
  - [ ] Reviews (if any)
  - [ ] Location
  - [ ] Hours
- [ ] Can tap "Book Appointment" from provider page

**Test 8: Three User Flows Complete**

**Flow A: Quick Booker (4 taps)**
- [ ] 1. Search "labs"
- [ ] 2. See "CBC - $38"
- [ ] 3. Tap "Book" button
- [ ] 4. Booking flow opens
- [ ] Service is pre-selected
- [ ] Can select date/time and book
- [ ] **Total:** 4 taps to booking confirmation

**Flow B: Cautious User (6 taps)**
- [ ] 1. Search "labs"
- [ ] 2. See "CBC - $38"
- [ ] 3. Tap service card
- [ ] 4. Detail sheet opens
- [ ] 5. Read details
- [ ] 6. Tap "Book This Service"
- [ ] Booking flow opens
- [ ] Service is pre-selected
- [ ] Can complete booking
- [ ] **Total:** 6 taps to booking confirmation

**Flow C: Researcher (8 taps)**
- [ ] 1. Search "labs"
- [ ] 2. See "CBC - $38"
- [ ] 3. Tap service card
- [ ] 4. Detail sheet opens
- [ ] 5. Read service details
- [ ] 6. Tap provider card
- [ ] 7. Provider profile loads
- [ ] 8. Review provider info
- [ ] 9. Tap "Book Appointment"
- [ ] Can select service and book
- [ ] **Total:** 8 taps to booking

**Test 9: Edge Cases**
- [ ] Search with no results (e.g., "zzz")
- [ ] Empty state displays correctly
- [ ] "No results found" message shown
- [ ] Can search again
- [ ] Search with one result
- [ ] Displays correctly
- [ ] All interactions work
- [ ] Very long service name
- [ ] Text truncates properly
- [ ] No overflow errors

**Test 10: Navigation and Back Button**
- [ ] From search results, tap device back
- [ ] Returns to home screen
- [ ] From detail sheet, swipe down
- [ ] Returns to search results
- [ ] From booking flow, tap back
- [ ] Returns to search results (or previous screen)
- [ ] Service remains in results

**Test 11: Authentication Flow**
- [ ] Log out of app
- [ ] Search for "labs"
- [ ] Tap "Book" button
- [ ] Authentication prompt appears:
  - [ ] "Please log in to book an appointment"
  - [ ] Login/Register buttons
- [ ] Log in
- [ ] Returns to booking flow
- [ ] Service still pre-selected

**Test 12: Price Display Accuracy**
- [ ] Search for services
- [ ] Verify price matches:
  - [ ] Service card price
  - [ ] Detail sheet price
  - [ ] Booking flow price
- [ ] All three should match
- [ ] No rounding errors
- [ ] Currency symbol ($) present

**Test 13: Category Colors**
- [ ] Search "labs" (purple badge)
- [ ] Search "consultation" (orange badge)
- [ ] Search "preventive" (green badge)
- [ ] Verify each category has correct color
- [ ] Colors are consistent across app

**Test 14: Performance**
- [ ] Search returns results in < 2 seconds
- [ ] Scrolling is smooth (60fps)
- [ ] No lag when opening detail sheet
- [ ] No lag when navigating to booking
- [ ] Images load progressively
- [ ] No memory leaks (test with 20+ searches)

**Test 15: Regression - Old Features Still Work**
- [ ] Home screen search still works
- [ ] Provider detail page still accessible
- [ ] Direct provider URL still works
- [ ] Favorites still save
- [ ] Profile still loads
- [ ] Other app features unaffected

### Test Results Template

Copy this after testing Search V2:

```markdown
## Search V2 Test Results - [DATE]

**Tester:** [Name]  
**Build:** [Build number]  
**Device:** [iOS/Android, model]

### Basic Functionality
- [ ] Search returns results
- [ ] Service cards display correctly
- [ ] Sort works
- [ ] No crashes

### Two Tap Zones
- [ ] Card tap opens detail sheet
- [ ] Book button goes to booking
- [ ] Both work as expected

### Service Detail Sheet
- [ ] Opens correctly
- [ ] All info displays
- [ ] Provider card tappable
- [ ] Book button works

### User Flows
- [ ] Flow A (Quick Booker) - 4 taps
- [ ] Flow B (Cautious) - 6 taps  
- [ ] Flow C (Researcher) - 8 taps

### Issues Found
[List any bugs or problems]

### Overall Status
- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues (list above)
- [ ] 🔴 Critical issues (block deployment)
```

### Known Issues (Current)

**None** - Search V2 passed all tests (Jan 25, 2026)

### Critical Paths to Always Test

**Priority 1 (Must Test):**
1. Basic search returns results
2. Book button goes to booking flow
3. Service is pre-selected in booking
4. Detail sheet opens and displays

**Priority 2 (Should Test):**
5. All three user flows complete
6. Sort functionality
7. Provider card tap works
8. No overflow errors

**Priority 3 (Nice to Test):**
9. Edge cases (no results, one result)
10. Performance metrics
11. Category colors
12. Price accuracy

---

*Search V2 Tests Added: January 25, 2026*  
*Status: Comprehensive test suite for service-first search*  
*Coverage: 15 test scenarios, 3 user flows, ~50 individual checks*
