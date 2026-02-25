# BIOMETRIC LOGIN BUG - ROOT CAUSE ANALYSIS

## The Bug
**Symptom:** Face ID authenticates successfully, but user is redirected to login screen instead of home screen.

## Current Flow (BROKEN)

### Step 1: App Startup
```
1. App launches → SplashScreen loads
2. AuthNotifier created (in provider initialization)
3. AuthNotifier._checkAuth() runs automatically (in constructor)
   - Checks if token exists
   - Calls authRepo.getProfile() to validate token
   - If successful: sets state = authenticated + user data
   - If fails: sets state = unauthenticated
```

### Step 2: Splash Screen Logic
```
4. SplashScreen checks token (separately from AuthNotifier)
5. Token exists + biometric enabled → Shows Face ID prompt
6. User authenticates with Face ID ✓
7. SplashScreen validates token:
   final authRepo = AuthRepository(ApiService());  // ← NEW INSTANCE!
   await authRepo.getProfile();                    // ← Validates token
8. Navigation: context.go(AppRoutes.home)
```

### Step 3: The Problem
```
9. User arrives at home screen
10. Home screen checks auth state from AuthProvider
11. Auth state might be UNAUTHENTICATED because:
    - Initial _checkAuth() might have failed (expired token, network error)
    - OR state hasn't been updated after biometric success
12. Home screen sees unauthenticated state
13. ❌ Redirects to login screen
```

## Root Cause

**The bug occurs because SplashScreen validates the token directly but DOESN'T UPDATE the AuthProvider state.**

```dart
// CURRENT CODE (WRONG):
final authRepo = AuthRepository(ApiService());  // New instance, not connected to provider
await authRepo.getProfile();                    // Validates token but doesn't update state
if (mounted) context.go(AppRoutes.home);       // Goes to home with stale auth state
```

Even though the token is valid and getProfile succeeds:
1. The token validation happens in an isolated AuthRepository instance
2. The AuthNotifier state remains unchanged (still unauthenticated from startup)
3. Home screen checks AuthProvider state
4. Sees unauthenticated state
5. Redirects to login

## The Fix

After biometric succeeds, we must update the AuthProvider state to ensure the entire app knows the user is authenticated.

### Solution: Add a public method to AuthNotifier to refresh auth state

```dart
// In auth_provider.dart:
Future<void> refreshAuthState() async {
  await _checkAuth();
}
```

```dart
// In splash_screen.dart:
if (authenticated) {
  // Biometric success - validate token AND update auth state
  try {
    // This validates token AND updates AuthProvider state
    await ref.read(authProvider.notifier).refreshAuthState();
    
    // Now auth state is updated, home screen will see authenticated user
    if (mounted) context.go(AppRoutes.home);
  } catch (e) {
    // Token invalid/expired
    debugPrint('Token validation failed after biometric: $e');
    await StorageService.clearAll();
    if (mounted) context.go(AppRoutes.authPrompt);
  }
}
```

## Why This Fix Is World-Class

1. **Single Source of Truth:** Auth state managed in one place (AuthNotifier)
2. **No Duplication:** Reuses existing _checkAuth logic instead of duplicating token validation
3. **Type Safe:** Uses Riverpod ref to access provider, not direct instantiation
4. **Consistent:** All screens read from the same auth state
5. **Zero Tech Debt:** Clean, maintainable, follows Flutter/Riverpod best practices
6. **Fail Safe:** If token refresh fails, clears storage and shows login

## Expected Flow (FIXED)

```
1. App launches → AuthNotifier._checkAuth() runs
2. SplashScreen checks token + biometric enabled
3. Shows Face ID prompt
4. User authenticates ✓
5. Calls ref.read(authProvider.notifier).refreshAuthState()
   - Validates token
   - Updates AuthProvider state to authenticated
   - Stores user data in state
6. Navigates to home
7. Home screen checks auth state → sees authenticated ✓
8. User stays on home screen ✓
```

## Files to Modify

1. `lib/providers/auth_provider.dart` - Add refreshAuthState() method
2. `lib/presentation/screens/splash/splash_screen.dart` - Use refreshAuthState() after biometric
