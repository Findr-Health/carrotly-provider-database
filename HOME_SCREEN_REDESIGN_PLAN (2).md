# FINDR HEALTH - HOME SCREEN REDESIGN
## Design/Build Plan & Progress Tracker
### Version 1.0 | Created: January 20, 2026

**Project Lead:** Tim Wetherill  
**Engineering Standard:** World-class, zero technical debt  
**Mission:** Create best-in-class provider discovery experience with optimal UX

---

## 🎯 PROJECT OVERVIEW

### Goals
1. **Improve Provider Card UX** - Larger photos, better hierarchy, separated actions
2. **Implement Section-Based Home Screen** - Organized, discoverable, personalized
3. **Enhance User Engagement** - Better browsing, faster provider assessment
4. **Build Scalable Architecture** - Support future personalization and features

### Success Metrics
- [ ] +40% faster provider assessment time
- [ ] +25% increase in provider detail views
- [ ] +30% increase in favorite usage
- [ ] Improved user satisfaction scores
- [ ] Higher booking conversion rates

---

## 📊 PROGRESS TRACKER

| Phase | Status | Progress | Target Date | Actual Date |
|-------|--------|----------|-------------|-------------|
| **Phase 1: Core Redesign** | 🟡 IN PROGRESS | 0% | Jan 21, 2026 | - |
| **Phase 2: Enhanced Sections** | ⚪ NOT STARTED | 0% | Jan 27, 2026 | - |
| **Phase 3: Personalization** | ⚪ NOT STARTED | 0% | Feb 10, 2026 | - |

**Overall Project Status:** 🟡 IN PROGRESS (0% complete)

---

## 📋 PHASE 1: CORE REDESIGN

**Timeline:** 1 day  
**Priority:** P0 - Critical  
**Goal:** Implement new provider card design and core home screen sections

### Task Breakdown

#### 1.1 Provider Card Widget Redesign ⚪ NOT STARTED
**File:** `lib/presentation/widgets/provider_card.dart`  
**Estimated Time:** 1.5 hours

**Requirements:**
- [ ] Increase card height to 220pt (from ~160pt)
- [ ] Increase photo height to 140pt (from ~100pt)
- [ ] Move favorite icon to top-right of card (outside photo)
- [ ] Move badges to top-left of photo (Verified, Featured)
- [ ] Implement horizontal badge stack with 4pt gap
- [ ] Add semi-transparent badge backgrounds with blur effect
- [ ] Improve text hierarchy:
  - [ ] Provider name: 18pt Semibold
  - [ ] Service type: 14pt Regular gray
  - [ ] Rating: 16pt Semibold with star icon
  - [ ] Address: 13pt Regular light gray
- [ ] Add proper spacing: 16pt content padding
- [ ] Implement corner radius: 12pt
- [ ] Add distance badge (bottom-left of photo) if applicable

**Acceptance Criteria:**
- Card renders at 220pt height
- All elements properly positioned per spec
- Badges don't overlap with favorite icon
- Text hierarchy is clear and readable
- Card maintains aspect ratio on different screen sizes
- `flutter analyze` shows no new errors

---

#### 1.2 Section Header Component ⚪ NOT STARTED
**File:** `lib/presentation/widgets/section_header.dart` (NEW)  
**Estimated Time:** 45 minutes

**Requirements:**
- [ ] Create reusable SectionHeader widget
- [ ] Support icon + title + optional subtitle
- [ ] "See All" link on right side with chevron
- [ ] Optional bottom divider
- [ ] Configurable tap handler for "See All"
- [ ] Support emoji or icon on left
- [ ] Proper padding: 20pt horizontal, 12pt vertical
- [ ] Typography:
  - [ ] Title: 20pt Semibold
  - [ ] Subtitle: 13pt Regular gray
  - [ ] "See All": 15pt Medium teal

**Acceptance Criteria:**
- Component is reusable with clean API
- All variants render correctly
- "See All" tap navigates properly
- Maintains design system consistency
- Accessible (proper semantics)

---

#### 1.3 Home Screen Architecture Refactor ⚪ NOT STARTED
**File:** `lib/presentation/screens/home/home_screen.dart`  
**Estimated Time:** 2 hours

**Requirements:**
- [ ] Implement section-based layout
- [ ] Create three core sections:
  - [ ] **For You** (falls back to Featured if no personalization)
  - [ ] **Near You** (sorted by distance)
  - [ ] **Top Rated** (4.8+ rating, 50+ reviews)
- [ ] Each section shows 2-3 provider cards
- [ ] Use SingleChildScrollView with Column of sections
- [ ] Implement section visibility logic
- [ ] Add loading states for each section
- [ ] Add empty states (hide section if no results)
- [ ] Maintain search bar at top (sticky)
- [ ] Add proper spacing between sections (24pt)

**Acceptance Criteria:**
- Home screen displays all three sections
- Each section uses new card design
- "See All" navigates to full section list
- Loading states show gracefully
- Empty sections are hidden (not shown)
- Scroll performance is smooth (60fps)
- Pull-to-refresh works correctly

---

#### 1.4 Section List Screen ⚪ NOT STARTED
**File:** `lib/presentation/screens/home/section_list_screen.dart` (NEW)  
**Estimated Time:** 1 hour

**Requirements:**
- [ ] Create full list view for "See All" taps
- [ ] Display section title in app bar
- [ ] Show all providers in section (not just preview)
- [ ] Use same provider card design
- [ ] Add filter/sort options (optional for Phase 1)
- [ ] Support pull-to-refresh
- [ ] Pagination if >20 results
- [ ] Empty state if no providers

**Acceptance Criteria:**
- Screen displays full provider list
- Navigation from home works correctly
- Back button returns to home
- Loading and error states handled
- Maintains scroll position on back navigation

---

#### 1.5 Backend Data Structure Updates ⚪ NOT STARTED
**Files:** 
- `backend/routes/providers.js`
- `backend/controllers/providers.js` (if exists)

**Estimated Time:** 1 hour

**Requirements:**
- [ ] Add `featured` boolean field to provider model (if not exists)
- [ ] Create endpoint: `GET /api/providers/for-you`
- [ ] Create endpoint: `GET /api/providers/near-you?lat={}&lng={}`
- [ ] Create endpoint: `GET /api/providers/top-rated?limit=10`
- [ ] Ensure endpoints return providers with:
  - [ ] All photos
  - [ ] Ratings and review count
  - [ ] Distance (for near-you)
  - [ ] Verified and featured status
- [ ] Add sorting by distance
- [ ] Add filtering by rating threshold

**Acceptance Criteria:**
- All endpoints return proper JSON
- Data includes all required fields for card display
- Distance calculation works correctly
- Top rated filtering works (4.8+, 50+ reviews)
- Endpoints are efficient (indexed queries)

---

#### 1.6 Flutter Integration & State Management ⚪ NOT STARTED
**Files:**
- `lib/data/repositories/provider_repository.dart`
- `lib/presentation/screens/home/home_view_model.dart` (or equivalent)

**Estimated Time:** 1.5 hours

**Requirements:**
- [ ] Add repository methods for new endpoints:
  - [ ] `getForYouProviders()`
  - [ ] `getNearYouProviders(lat, lng, limit)`
  - [ ] `getTopRatedProviders(limit)`
- [ ] Update home screen state management
- [ ] Implement section loading states (individual per section)
- [ ] Add error handling for each section
- [ ] Implement pull-to-refresh for all sections
- [ ] Add caching strategy (optional, but recommended)
- [ ] Handle location permissions for "Near You"

**Acceptance Criteria:**
- Data flows from backend to UI correctly
- Loading states show appropriately
- Errors are handled gracefully (show message, allow retry)
- Pull-to-refresh updates all sections
- Location prompt shows if permission not granted
- No memory leaks or state issues

---

#### 1.7 Testing & Quality Assurance ⚪ NOT STARTED
**Estimated Time:** 1 hour

**Requirements:**
- [ ] Manual testing on iOS simulator
- [ ] Test all three sections load correctly
- [ ] Test "See All" navigation
- [ ] Test favorite icon tap (toggle functionality)
- [ ] Test card tap to provider detail
- [ ] Test empty states (no providers in section)
- [ ] Test loading states
- [ ] Test error states (network failure)
- [ ] Test pull-to-refresh
- [ ] Run `flutter analyze` (must have 0 errors)
- [ ] Check for any console warnings
- [ ] Test on different screen sizes (iPhone SE, iPhone 15 Pro Max)

**Acceptance Criteria:**
- All manual tests pass
- No crashes or errors
- Smooth scrolling and animations
- Proper touch targets (44x44pt minimum)
- All states render correctly
- Performance is acceptable (no jank)

---

#### 1.8 Documentation Updates ⚪ NOT STARTED
**Estimated Time:** 30 minutes

**Requirements:**
- [ ] Update `OUTSTANDING_ISSUES_v20.md` → v21
- [ ] Update `FINDR_HEALTH_ECOSYSTEM_SUMMARY_v16.md` → v17
- [ ] Create `HOME_SCREEN_REDESIGN_SESSION_SUMMARY.md`
- [ ] Document any API changes
- [ ] Update component library documentation
- [ ] Add comments in code for complex logic

**Acceptance Criteria:**
- All documents are current
- Session summary captures all changes
- API documentation is clear
- Code comments explain "why" not just "what"

---

### Phase 1 Total Estimated Time: **8-10 hours**

---

## 📋 PHASE 2: ENHANCED SECTIONS

**Timeline:** 3-4 days  
**Priority:** P1 - High  
**Status:** ⚪ NOT STARTED

### Task Overview

#### 2.1 Featured Section Implementation
- [ ] Add Featured provider management in Admin Dashboard
- [ ] Create backend endpoint for featured providers
- [ ] Implement featured badge on cards
- [ ] Add "Featured" section to home screen
- [ ] Test featured provider discovery

#### 2.2 Trending Section
- [ ] Create booking velocity calculation
- [ ] Add backend endpoint for trending providers
- [ ] Implement trending badge/indicator
- [ ] Add "Trending" section (conditional display)
- [ ] Set minimum threshold (5 providers)

#### 2.3 New Providers Section
- [ ] Add join date tracking to provider model
- [ ] Create "New Providers" endpoint (last 14 days)
- [ ] Add "New" badge to cards
- [ ] Implement section with conditional display
- [ ] Test with real data

#### 2.4 Dynamic Section Logic
- [ ] Implement section display rules
- [ ] Add section prioritization logic
- [ ] Limit to max 6-7 sections on home
- [ ] Handle section empty states
- [ ] A/B test section order

#### 2.5 Search Results Layout
- [ ] Apply new card design to search results
- [ ] Add "Featured Results" section on search
- [ ] Implement filter bar
- [ ] Add sorting options
- [ ] Test search UX

**Phase 2 Total Estimated Time: 20-24 hours**

---

## 📋 PHASE 3: PERSONALIZATION

**Timeline:** 1-2 weeks  
**Priority:** P2 - Medium  
**Status:** ⚪ NOT STARTED

### Task Overview

#### 3.1 User Behavior Tracking
- [ ] Track user searches (categories, keywords)
- [ ] Track provider views
- [ ] Track booking history
- [ ] Track favorite patterns
- [ ] Store data for personalization

#### 3.2 "For You" Algorithm
- [ ] Implement personalization scoring
- [ ] Factor in recent searches
- [ ] Consider booking history
- [ ] Weight by time of day
- [ ] Test algorithm accuracy

#### 3.3 Category-Based Sections
- [ ] Detect user category preferences
- [ ] Show category-specific sections
- [ ] Limit to 1-2 category sections
- [ ] Test discovery improvements

#### 3.4 Favorites Section
- [ ] Show Favorites section if user has 1+ favorite
- [ ] Position near top of home screen
- [ ] Sort by last interaction
- [ ] Add quick booking from favorites

#### 3.5 Seasonal Campaigns
- [ ] Create campaign management in Admin
- [ ] Implement seasonal section logic
- [ ] Add campaign artwork/theming
- [ ] Schedule campaigns
- [ ] Track campaign performance

**Phase 3 Total Estimated Time: 40-50 hours**

---

## 🔧 TECHNICAL SPECIFICATIONS

### Design System Values

```dart
// Card Dimensions
const double cardHeight = 220.0;
const double photoHeight = 140.0;
const double cardPadding = 16.0;
const double cardSpacing = 16.0;
const double cornerRadius = 12.0;

// Typography
const double providerNameSize = 18.0;
const FontWeight providerNameWeight = FontWeight.w600; // Semibold
const double serviceTypeSize = 14.0;
const double ratingSize = 16.0;
const double addressSize = 13.0;

// Colors
const Color textPrimary = Color(0xFF1A1A1A);
const Color textSecondary = Color(0xFF666666);
const Color textTertiary = Color(0xFF999999);
const Color accentTeal = Color(0xFF00BFA5);
const Color badgeGold = Color(0xFFFFB300);

// Badge Styling
const double badgeHeight = 24.0;
const double badgePadding = 10.0; // horizontal
const double badgeIconSize = 14.0;
const double badgeGap = 4.0; // gap between badges

// Section Spacing
const double sectionSpacing = 24.0;
const double sectionHeaderHeight = 44.0;
```

---

## 🎯 DEFINITION OF DONE

### For Each Task:
- [ ] Code written following Flutter best practices
- [ ] `flutter analyze` passes with no errors
- [ ] Manual testing completed
- [ ] Code committed with descriptive message
- [ ] Documentation updated
- [ ] PR reviewed (if team workflow)
- [ ] No technical debt introduced

### For Each Phase:
- [ ] All tasks completed
- [ ] Full regression testing
- [ ] Documentation updated
- [ ] Session summary created
- [ ] Outstanding issues document updated
- [ ] Ready for TestFlight (if applicable)

---

## 📁 FILES TO BE CREATED/MODIFIED

### New Files (Phase 1)
```
lib/presentation/widgets/section_header.dart
lib/presentation/screens/home/section_list_screen.dart
```

### Modified Files (Phase 1)
```
lib/presentation/widgets/provider_card.dart
lib/presentation/screens/home/home_screen.dart
lib/data/repositories/provider_repository.dart
backend/routes/providers.js
```

### Updated Documentation (Phase 1)
```
/mnt/project/OUTSTANDING_ISSUES_v21.md
/mnt/project/FINDR_HEALTH_ECOSYSTEM_SUMMARY_v17.md
/home/claude/HOME_SCREEN_REDESIGN_SESSION_SUMMARY.md
```

---

## 🚨 RISKS & MITIGATION

### Risk 1: Backend Performance
**Risk:** New endpoints could be slow with large datasets  
**Mitigation:** 
- Add database indexes on rating, createdAt, location
- Implement query limits (10-20 providers per section)
- Add caching layer
- Monitor query performance

### Risk 2: Photo Loading
**Risk:** Larger photos could slow scroll performance  
**Mitigation:**
- Implement proper image caching
- Use thumbnail URLs for list view
- Lazy load images outside viewport
- Test on slower devices

### Risk 3: Location Permissions
**Risk:** Users may deny location, breaking "Near You"  
**Mitigation:**
- Graceful fallback to city from profile
- Show permission prompt with context
- Hide "Near You" if location unavailable
- Still show other sections

### Risk 4: Empty Sections
**Risk:** Some sections may frequently be empty  
**Mitigation:**
- Hide empty sections entirely
- Ensure at least 2 sections always show
- Fallback to "All Providers" if needed
- Test with limited provider data

---

## 📊 QUALITY GATES

### Before Committing:
- [ ] Code builds without errors
- [ ] `flutter analyze` passes
- [ ] Manual testing on simulator
- [ ] No console errors/warnings
- [ ] Code follows style guide

### Before Phase Completion:
- [ ] All tasks in phase complete
- [ ] Full regression test
- [ ] Documentation updated
- [ ] Performance acceptable
- [ ] Ready for demo/review

### Before Production:
- [ ] TestFlight testing complete
- [ ] User feedback incorporated
- [ ] Analytics tracking in place
- [ ] A/B test framework ready
- [ ] Rollback plan documented

---

## 📈 SUCCESS TRACKING

### Metrics to Monitor (Post-Launch)
- Provider card click-through rate
- Time spent on home screen
- Section engagement (clicks per section)
- "See All" usage rate
- Favorite icon usage
- Scroll depth
- Provider detail views
- Booking conversion rate

### A/B Testing Opportunities
- Section order
- Number of preview cards (2 vs 3)
- Card size variations
- Badge placement
- "See All" vs "View More" copy
- Section header styles

---

## 🎓 LESSONS & BEST PRACTICES

### From This Project:
1. **Design First, Code Second** - Comprehensive planning saves time
2. **User-Centric Decisions** - Every choice serves user needs
3. **Phased Approach** - Deliver value incrementally
4. **Quality Gates** - Maintain high standards at each step
5. **Documentation** - Future you will thank present you

### Standards to Maintain:
- World-class code quality
- Zero technical debt
- Comprehensive testing
- Clear documentation
- User-first mentality

---

## ✅ NEXT STEPS

**Immediate Actions:**
1. Review and approve this plan
2. Begin Phase 1, Task 1.1 (Provider Card Redesign)
3. Set up git branch: `feature/home-screen-redesign`
4. Regular progress updates to this document
5. Celebrate wins along the way! 🎉

---

**Plan Version:** 1.0  
**Created:** January 20, 2026  
**Last Updated:** January 20, 2026  
**Status:** Ready to Execute ✅
