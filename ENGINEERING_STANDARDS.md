# FINDR HEALTH - ENGINEERING STANDARDS
## Version 1.0 - January 12, 2026

---

## 🎯 Purpose

This document establishes mandatory engineering standards for all Findr Health development. Following these standards prevents code loss, ensures consistency, and enables team collaboration.

**Compliance is MANDATORY for all developers and AI assistant sessions.**

---

## 📁 FOLDER STRUCTURE

### Canonical Root Directory
```
~/Development/findr-health/
```

**ALL Findr Health code MUST reside in this directory.**

### Repository Structure
```
~/Development/findr-health/
├── findr-health-mobile/             ← Flutter consumer app
│   ├── .git/                        ← REQUIRED
│   ├── lib/
│   │   ├── core/
│   │   ├── data/
│   │   ├── presentation/
│   │   └── providers/
│   ├── ios/
│   ├── android/
│   ├── assets/
│   └── docs/
│       ├── ECOSYSTEM_SUMMARY.md     ← Repo-specific copy
│       ├── OUTSTANDING_ISSUES.md
│       └── sessions/
│           └── SESSION_END_*.md
│
├── carrotly-provider-database/      ← Backend API + Admin Dashboard
│   ├── .git/                        ← REQUIRED
│   ├── backend/
│   │   ├── routes/
│   │   ├── models/
│   │   └── middleware/
│   └── admin-dashboard/
│
├── carrotly-provider-mvp/           ← Provider Portal
│   ├── .git/                        ← REQUIRED
│   └── src/
│
└── docs/                            ← Shared documentation
    ├── ENGINEERING_STANDARDS.md     ← This file
    ├── ECOSYSTEM_SUMMARY.md         ← Master copy
    ├── OUTSTANDING_ISSUES.md        ← Master copy
    └── SESSION_PROTOCOL.md
```

### ❌ Prohibited Locations
**NEVER store code in:**
- `~/Downloads/` (any subfolder)
- `~/Desktop/` (for code)
- `/tmp/` or temporary folders
- Any location outside `~/Development/findr-health/`

### ❌ Prohibited Actions
- Downloading repo as ZIP (loses git history)
- Copying folders instead of cloning
- Working in multiple copies of same repo
- Creating "backup" copies of folders

---

## 🔐 GIT REQUIREMENTS

### Every Repo MUST Have
1. `.git/` folder (connected to GitHub remote)
2. Clean `git status` at session end
3. All commits pushed to remote

### Verify Git Health
```bash
# Run this to verify git is properly configured
cd ~/Development/findr-health/[repo]
git status              # Should show clean or staged changes
git remote -v           # Should show GitHub URL
ls -la .git             # Should exist
```

### If `.git` is Missing
```bash
# DO NOT initialize new git - this loses history
# Instead, re-clone from GitHub:
cd ~/Development/findr-health
rm -rf [repo-name]
git clone git@github.com:Findr-Health/[repo-name].git
```

---

## 🌿 BRANCH STRATEGY

### Branch Types
| Branch | Purpose | Merge To |
|--------|---------|----------|
| `main` | Production-ready code | - |
| `develop` | Integration (optional) | `main` |
| `feature/[name]` | New features | `main` or `develop` |
| `bugfix/[name]` | Bug fixes | `main` or `develop` |
| `hotfix/[name]` | Emergency fixes | `main` |

### Branch Naming
```
feature/calendar-picker-redesign
bugfix/auth-token-refresh
hotfix/payment-crash-fix
```

### Branch Workflow
```bash
# Create feature branch
git checkout main
git pull origin main
git checkout -b feature/[description]

# Work on feature...
git add -A
git commit -m "feat(scope): description"

# Push feature branch
git push origin feature/[description]

# When complete, merge to main (or create PR)
git checkout main
git merge feature/[description]
git push origin main

# Delete feature branch
git branch -d feature/[description]
git push origin --delete feature/[description]
```

---

## 📝 COMMIT STANDARDS

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `test` | Adding tests |
| `chore` | Maintenance, dependencies |

### Scopes (Examples)
| Scope | Usage |
|-------|-------|
| `booking` | Booking flow |
| `auth` | Authentication |
| `home` | Home screen |
| `provider` | Provider features |
| `payment` | Payment processing |
| `admin` | Admin dashboard |
| `api` | Backend API |

### Good Commit Messages
```
feat(booking): add 12-month calendar range
fix(auth): resolve Google login token storage issue
docs(readme): update installation instructions
refactor(home): extract search bar to separate widget
style(app): apply consistent button styling
chore(deps): update flutter_stripe to 10.1.0
```

### Bad Commit Messages
```
❌ "fixed stuff"
❌ "WIP"
❌ "updates"
❌ "asdf"
❌ "."
```

### Commit Frequency
- Commit after each logical change
- Commit before switching tasks
- Commit before ending session
- **NEVER** end session with uncommitted changes

---

## 🔒 SECURITY STANDARDS

### Never Commit
- API keys
- Passwords
- Tokens (access, refresh, JWT)
- Private keys
- .env files
- Database connection strings

### Pre-Commit Check
```bash
# Search for potential secrets before committing
grep -r "AIza\|pk_live\|sk_live\|password\|secret" --include="*.dart" --include="*.js" --include="*.json" .
```

### Environment Variables
| Secret | Where to Store |
|--------|----------------|
| Google Maps Key | Xcode env vars (iOS), local.properties (Android) |
| Stripe Keys | Railway environment variables |
| MongoDB URI | Railway environment variables |
| Cloudinary | Railway environment variables |
| SMTP Credentials | Railway environment variables |

### If Secret Exposed
1. **Immediately** rotate the key in the service dashboard
2. Update environment variables with new key
3. Audit git history: `git log -p | grep -i "secret\|key\|password"`
4. If in public repo, consider the key permanently compromised

---

## 📄 DOCUMENTATION STANDARDS

### Required Documents
| Document | Location | Update Frequency |
|----------|----------|------------------|
| ENGINEERING_STANDARDS.md | Shared docs | When processes change |
| ECOSYSTEM_SUMMARY.md | Shared docs + each repo | When architecture changes |
| OUTSTANDING_ISSUES.md | Shared docs + each repo | Every session |
| SESSION_PROTOCOL.md | Shared docs | When workflow changes |
| README.md | Each repo root | When setup changes |

### Document Versioning
- Increment version at end of each session
- Format: `DOCUMENT_NAME_v[N].md`
- Keep last 3 versions
- Delete older versions

### Session Documentation
- Generate SESSION_END_[DATE].md at end of each session
- Store in `docs/sessions/` folder
- Include: completed work, code changes, new issues, next priorities

---

## 🔧 DEVELOPMENT WORKFLOW

### Starting a Session
1. ✅ Verify SSH: `ssh -T git@github.com`
2. ✅ Navigate to correct folder: `cd ~/Development/findr-health`
3. ✅ Verify git status for all repos
4. ✅ Pull latest: `git pull origin main`
5. ✅ Create feature branch if needed
6. ✅ Attach documents to AI session

### During a Session
1. ✅ Work only in canonical folders
2. ✅ Commit frequently with good messages
3. ✅ Test changes before moving on
4. ✅ Document any issues discovered

### Ending a Session
1. ✅ Commit all changes
2. ✅ Push to remote
3. ✅ Generate session summary
4. ✅ Update OUTSTANDING_ISSUES
5. ✅ Verify nothing uncommitted: `git status`

---

## 🚀 DEPLOYMENT WORKFLOW

### Flutter App (TestFlight)
```bash
cd ~/Development/findr-health/findr-health-mobile

# 1. Ensure clean git state
git status  # Should be clean

# 2. Build
flutter clean && flutter pub get
flutter build ios --release

# 3. Open Xcode
open ios/Runner.xcworkspace

# 4. In Xcode:
#    - Increment Build number (General → Identity)
#    - Product → Archive
#    - Distribute App → App Store Connect

# 5. Commit version bump
git add -A
git commit -m "chore(ios): bump build to [N]"
git push origin main
```

### Backend (Railway)
- Automatic deployment on push to main
- Verify deployment in Railway dashboard
- Check health endpoint after deploy

### Provider Portal / Admin (Vercel)
- Automatic deployment on push to main
- Preview deployments for branches
- Verify deployment in Vercel dashboard

---

## 🛠️ TROUBLESHOOTING

### SSH Permission Denied
```bash
# Check if key exists
ls -la ~/.ssh/

# Add key to agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Test connection
ssh -T git@github.com

# If still failing, generate new key
ssh-keygen -t ed25519 -C "your-email@example.com"
# Add public key to GitHub Settings → SSH Keys
```

### Git Repo Corrupted
```bash
# Re-clone (loses uncommitted changes)
cd ~/Development/findr-health
rm -rf [repo-name]
git clone git@github.com:Findr-Health/[repo-name].git
```

### Merge Conflicts
```bash
# See conflicted files
git status

# Edit files to resolve conflicts (remove <<<<< ===== >>>>> markers)

# Mark as resolved
git add [file]

# Complete merge
git commit
```

### Flutter Issues
```bash
# Clean rebuild
flutter clean
flutter pub get
flutter run

# Check for issues
flutter doctor

# Reset iOS
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

---

## ✅ CHECKLISTS

### New Developer Onboarding
- [ ] SSH key generated and added to GitHub
- [ ] `~/Development/findr-health/` created
- [ ] All repos cloned via SSH (not HTTPS, not ZIP)
- [ ] Flutter installed and `flutter doctor` passes
- [ ] Node.js 18+ installed
- [ ] Xcode installed (for iOS)
- [ ] Read all documentation in this folder
- [ ] Verified `git status` clean for all repos

### Pre-Commit
- [ ] Code compiles without errors
- [ ] No hardcoded secrets
- [ ] Commit message follows format
- [ ] Related files grouped in same commit

### Pre-Push
- [ ] All commits have good messages
- [ ] No WIP commits
- [ ] Tests pass (if applicable)
- [ ] Documentation updated (if needed)

### End of Session
- [ ] All changes committed
- [ ] All commits pushed
- [ ] `git status` clean for all repos
- [ ] Session summary generated
- [ ] OUTSTANDING_ISSUES updated

---

## 📞 ESCALATION

If you encounter issues not covered here:
1. Document the exact error/situation
2. Check git status and branch
3. Do NOT attempt destructive fixes (rm -rf, force push)
4. Consult with team before major changes

---

*Document Version: 1.0 - January 12, 2026*
*Owner: Findr Health Engineering*
