# FINDR HEALTH - SESSION PROTOCOL
## Version 2.0 - Daily Development Workflow Guide
## Updated: January 12, 2026

---

## 🎯 Purpose

This document ensures continuity between development sessions and prevents code loss. Following this protocol is **MANDATORY** for all developers and AI assistant sessions.

---

## ⚠️ CRITICAL RULES

1. **ONLY work in `~/Development/findr-health/`** - Never elsewhere
2. **VERIFY git status before starting** - Every repo must have `.git`
3. **COMMIT before ending** - Uncommitted changes can be lost
4. **PUSH before ending** - Local-only commits can be lost
5. **INCREMENT doc versions** - Never overwrite without versioning

---

## 🌅 START OF SESSION PROCEDURE

### Step 1: Environment Verification (MANDATORY)

Run this script before ANY work:

```bash
#!/bin/bash
# FINDR HEALTH - Session Start Verification
# Run: bash verify-session.sh

echo "========================================"
echo "FINDR HEALTH - Session Verification"
echo "========================================"

# Check SSH
echo ""
echo "1. SSH Key Status:"
ssh -T git@github.com 2>&1 | head -1

# Check directory exists
echo ""
echo "2. Directory Structure:"
if [ -d ~/Development/findr-health ]; then
    echo "✅ ~/Development/findr-health exists"
else
    echo "❌ ERROR: ~/Development/findr-health does not exist"
    echo "   Run: mkdir -p ~/Development/findr-health"
    exit 1
fi

# Check each repo
echo ""
echo "3. Repository Status:"

repos=("findr-health-mobile" "carrotly-provider-database" "carrotly-provider-mvp")
for repo in "${repos[@]}"; do
    path=~/Development/findr-health/$repo
    if [ -d "$path/.git" ]; then
        echo "✅ $repo - git OK"
        cd "$path"
        branch=$(git branch --show-current)
        status=$(git status --porcelain | wc -l | tr -d ' ')
        echo "   Branch: $branch | Uncommitted files: $status"
    else
        echo "❌ $repo - NO .git FOLDER"
    fi
done

echo ""
echo "4. Flutter Status:"
flutter --version 2>/dev/null | head -1 || echo "❌ Flutter not found"

echo ""
echo "========================================"
echo "Verification Complete"
echo "========================================"
```

### Step 2: Pull Latest Changes

```bash
cd ~/Development/findr-health

# Pull all repos
for repo in findr-health-mobile carrotly-provider-database carrotly-provider-mvp; do
    echo "Pulling $repo..."
    cd ~/Development/findr-health/$repo
    git pull origin main
done
```

### Step 3: Create Feature Branch (If Making Changes)

```bash
cd ~/Development/findr-health/[repo-name]
git checkout -b feature/[description]
# Example: git checkout -b feature/calendar-picker-fix
```

### Step 4: Attach Required Documents to AI Session

Always upload these files when starting a Claude session:
1. `FINDR_HEALTH_ECOSYSTEM_SUMMARY_v[X].md` (latest version)
2. `OUTSTANDING_ISSUES_v[X].md` (latest version)
3. `SESSION_PROTOCOL.md` (this file)
4. Any specific files you'll be working on

---

## 📝 START OF SESSION PROMPT TEMPLATE

Copy this, fill in blanks, paste into new Claude conversation:

```markdown
# FINDR HEALTH - Session Start: [DATE]

## 👤 Context
I'm Tim, continuing development on Findr Health. This is a healthcare marketplace with:
- Flutter consumer app (iOS/Android)
- Node.js/MongoDB backend on Railway
- React provider portal and admin dashboard on Vercel

## 📁 Canonical Paths (ALWAYS USE THESE)
- Flutter App: `~/Development/findr-health/findr-health-mobile`
- Backend: `~/Development/findr-health/carrotly-provider-database`
- Provider Portal: `~/Development/findr-health/carrotly-provider-mvp`

## 🔑 Quick Reference
- **Test Account:** tim@findrhealth.com / Test1234!
- **Backend API:** https://fearless-achievement-production.up.railway.app/api
- **Provider Portal:** https://findrhealth-provider.vercel.app
- **Admin Dashboard:** https://admin-findrhealth-dashboard.vercel.app

## 📦 Git State
| Repo | Branch | Last Commit | Uncommitted |
|------|--------|-------------|-------------|
| findr-health-mobile | [BRANCH] | [COMMIT] | [Y/N] |
| carrotly-provider-database | [BRANCH] | [COMMIT] | [Y/N] |
| carrotly-provider-mvp | [BRANCH] | [COMMIT] | [Y/N] |

## 🎯 Today's Goals (Priority Order)
1. [ ] [GOAL 1]
2. [ ] [GOAL 2]
3. [ ] [GOAL 3]

## 🚨 Known Blockers
- [List any blockers from previous session]

## 📎 Attached Documents
- ECOSYSTEM_SUMMARY_v[X].md
- OUTSTANDING_ISSUES_v[X].md
- SESSION_PROTOCOL.md
- [Any specific files needed today]

Please verify you understand the folder structure and git workflow before we begin.
```

---

## 💻 DURING SESSION

### Commit Frequently
```bash
# After each significant change
git add -A
git commit -m "type(scope): description"

# Commit message format:
# feat(booking): add calendar date picker
# fix(auth): resolve Google login token storage
# docs(readme): update deployment instructions
# refactor(home): optimize provider list rendering
```

### If Creating New Files
- Always create in the correct repo folder
- Never create in Downloads, Desktop, or other locations
- Verify file location before committing

### If AI Creates Files
- Verify they're placed in correct location
- Move to correct location if needed
- Don't leave orphan files

---

## 🌙 END OF SESSION PROCEDURE

### Step 1: Commit All Changes

```bash
cd ~/Development/findr-health/findr-health-mobile
git add -A
git status  # Review changes
git commit -m "feat(scope): end of session - [brief summary]"

# Repeat for other repos if modified
```

### Step 2: Push to Remote

```bash
git push origin [branch-name]
# Or: git push origin main
```

### Step 3: Generate Session Summary

Use this prompt with Claude:

```markdown
Please generate my end-of-session summary. Include:

1. **Completed Today** - List everything we accomplished
2. **Code Changes** - Files modified with repo and brief description
3. **Git Status** - Commits made, branches used
4. **New Issues Discovered** - Any bugs or problems found
5. **Tomorrow's Priorities** - What should be tackled next
6. **Updated OUTSTANDING_ISSUES** - Generate new version (increment number)
7. **Files to Download** - List any documentation files to save

Format as a downloadable SESSION_END_[DATE].md file.
```

### Step 4: Update Documentation

- Save new OUTSTANDING_ISSUES_v[X+1].md
- Upload to project docs folder
- Commit documentation changes

---

## 📄 END OF SESSION SUMMARY TEMPLATE

Claude will generate:

```markdown
# FINDR HEALTH - Session End: [DATE]

## ✅ Completed Today
1. [x] Task 1 completed
2. [x] Task 2 completed
3. [ ] Task 3 - BLOCKED (reason)

## 📝 Code Changes
| Repo | File | Change | Committed |
|------|------|--------|-----------|
| findr-health-mobile | home_screen.dart | Logo size adjustment | ✅ |
| findr-health-mobile | terms_of_service_screen.dart | Full TOS content | ✅ |

## 📦 Git Status
| Repo | Branch | Commits | Pushed |
|------|--------|---------|--------|
| findr-health-mobile | feature/ui-fixes | 3 | ✅ |

## 🐛 New Issues Discovered
- **Issue:** [Description]
- **File:** [path]
- **Severity:** [High/Medium/Low]
- **Added to:** OUTSTANDING_ISSUES_v[X].md

## 📜 Tomorrow's Priorities
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

## 📥 Files to Save
1. SESSION_END_[DATE].md
2. OUTSTANDING_ISSUES_v[X].md
```

---

## 🔄 GIT WORKFLOW

### Branch Strategy
```
main                    ← Production-ready code only
├── develop             ← Integration branch (optional)
├── feature/[name]      ← New features
├── bugfix/[name]       ← Bug fixes
└── hotfix/[name]       ← Emergency production fixes
```

### Commit Message Format
```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code refactoring
- style: Formatting
- test: Tests
- chore: Maintenance

Examples:
feat(booking): add date range picker
fix(auth): resolve token refresh issue
docs(readme): update installation steps
```

### Pull Request Process
1. Push feature branch
2. Create PR on GitHub
3. Review changes
4. Merge to main
5. Delete feature branch

---

## 🚨 EMERGENCY RECOVERY

### If Local Changes Lost
```bash
# Check git reflog for recent commits
git reflog

# Recover specific commit
git checkout [commit-hash]

# Or reset to remote
git fetch origin
git reset --hard origin/main
```

### If Repo Corrupted
```bash
# Re-clone from GitHub
cd ~/Development/findr-health
rm -rf [repo-name]
git clone git@github.com:Findr-Health/[repo-name].git
```

### If SSH Key Issues
```bash
# Test SSH connection
ssh -T git@github.com

# If permission denied, re-add key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Or generate new key
ssh-keygen -t ed25519 -C "your-email@example.com"
# Add public key to GitHub Settings → SSH Keys
```

---

## ⚡ QUICK COMMANDS

### Get Git State for Start Prompt
```bash
cd ~/Development/findr-health
echo "=== findr-health-mobile ===" && \
cd findr-health-mobile && git branch --show-current && git log -1 --oneline && cd ..
echo "=== carrotly-provider-database ===" && \
cd carrotly-provider-database && git branch --show-current && git log -1 --oneline && cd ..
echo "=== carrotly-provider-mvp ===" && \
cd carrotly-provider-mvp && git branch --show-current && git log -1 --oneline
```

### Run Flutter App
```bash
cd ~/Development/findr-health/findr-health-mobile
flutter run
```

### Build for TestFlight
```bash
cd ~/Development/findr-health/findr-health-mobile
flutter clean && flutter pub get
flutter build ios --release
open ios/Runner.xcworkspace
# In Xcode: Product → Archive → Distribute App
```

---

## 📋 CHECKLISTS

### Pre-Session Checklist
- [ ] SSH key working (`ssh -T git@github.com`)
- [ ] All repos have `.git` folder
- [ ] Pulled latest from all repos
- [ ] Documents attached to AI session
- [ ] Created feature branch (if needed)

### Post-Session Checklist
- [ ] All changes committed
- [ ] All commits pushed to remote
- [ ] Session summary generated
- [ ] OUTSTANDING_ISSUES updated
- [ ] Documentation saved to project

### Weekly Maintenance
- [ ] Review and close completed issues
- [ ] Update ECOSYSTEM_SUMMARY if architecture changed
- [ ] Audit for hardcoded secrets
- [ ] Backup important documents

---

## ❌ DEPRECATED PATHS

**NEVER use these paths:**
- `~/Downloads/findr_health_app`
- `~/Downloads/Findr_health_APP`
- `~/Downloads/findr_health_flutter`
- `~/Downloads/findr-health-mobile`
- `~/Desktop/[any flutter app copy]`

**ALWAYS use:**
- `~/Development/findr-health/findr-health-mobile`
- `~/Development/findr-health/carrotly-provider-database`
- `~/Development/findr-health/carrotly-provider-mvp`

---

## 📞 ESCALATION

If you encounter issues:
1. Share exact error messages
2. Share `git status` output
3. Share relevant file contents
4. Describe expected vs actual behavior

---

*Protocol Version: 2.0 - January 12, 2026*
*Replaces: SESSION_PROTOCOL.md v1.0*
