# FINDR HEALTH - DAILY WORKFLOW
## Quick Reference Guide
## Version 1.0 - January 12, 2026

---

## ⚡ TL;DR - Daily Protocol

```bash
# MORNING (before any work)
cd ~/Development/findr-health && ./findr-start.sh

# EVENING (before closing)
cd ~/Development/findr-health && ./findr-end.sh
```

That's it. The scripts handle everything else.

---

## 🌅 START OF DAY (2 minutes)

### Step 1: Run the Start Script
```bash
cd ~/Development/findr-health
./findr-start.sh
```

### Step 2: What the Script Does
1. ✅ Verifies SSH connection to GitHub
2. ✅ Checks all repos exist with `.git` folder
3. ✅ Pulls latest changes from all repos
4. ✅ Reports any uncommitted changes
5. ✅ **Generates a ready-to-paste Claude prompt**

### Step 3: Start Your Claude Session
1. Copy the generated prompt from terminal
2. Open new Claude conversation
3. Paste the prompt
4. Attach these documents:
   - `FINDR_HEALTH_ECOSYSTEM_SUMMARY_v[latest].md`
   - `OUTSTANDING_ISSUES_v[latest].md`
   - `ENGINEERING_STANDARDS.md`
5. Fill in your goals for the day
6. Begin work

---

## 💻 DURING THE DAY

### Commit Frequently
```bash
cd ~/Development/findr-health/[repo]
git add -A
git commit -m "type(scope): description"
```

### Commit Message Format
| Type | Use For |
|------|---------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation |
| `refactor` | Code restructuring |
| `style` | Formatting |
| `chore` | Maintenance |

**Examples:**
```bash
git commit -m "feat(booking): add 12-month calendar range"
git commit -m "fix(auth): resolve Google login issue"
git commit -m "docs(readme): update installation steps"
```

### If You Create New Files
- Verify they're in the correct repo folder
- Never save to Downloads, Desktop, or other locations
- Commit immediately after creation

---

## 🌙 END OF DAY (2 minutes)

### Step 1: Run the End Script
```bash
cd ~/Development/findr-health
./findr-end.sh
```

### Step 2: What the Script Does
1. ✅ Shows uncommitted changes in each repo
2. ✅ Prompts for commit message
3. ✅ Commits and pushes to GitHub
4. ✅ **Generates a Claude prompt for session summary**

### Step 3: Generate Session Summary
1. Copy the generated prompt from terminal
2. Paste into Claude
3. Claude generates `SESSION_END_[DATE].md`
4. Download and save to `docs/sessions/`

### Step 4: Verify Clean State
```bash
# All repos should show "nothing to commit"
cd ~/Development/findr-health/findr-health-mobile && git status
cd ~/Development/findr-health/carrotly-provider-database && git status
cd ~/Development/findr-health/carrotly-provider-mvp && git status
```

---

## 📁 WHERE THINGS LIVE

```
~/Development/findr-health/
├── findr-start.sh              ← Run this every morning
├── findr-end.sh                ← Run this every evening
├── findr-health-mobile/        ← Flutter consumer app
├── carrotly-provider-database/ ← Backend + Admin Dashboard
├── carrotly-provider-mvp/      ← Provider Portal
└── docs/                       ← Shared documentation
    ├── ENGINEERING_STANDARDS.md
    ├── ECOSYSTEM_SUMMARY.md
    ├── OUTSTANDING_ISSUES.md
    ├── SESSION_PROTOCOL.md
    ├── DAILY_WORKFLOW.md       ← This file
    └── sessions/
        ├── SESSION_END_2026-01-12.md
        └── SESSION_END_2026-01-13.md
```

---

## 🚨 IF SOMETHING GOES WRONG

### SSH Permission Denied
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh -T git@github.com  # Should say "successfully authenticated"
```

### Missing .git Folder
```bash
# DO NOT initialize new git - you'll lose history
# Instead, re-clone:
cd ~/Development/findr-health
rm -rf [repo-name]
git clone git@github.com:Findr-Health/[repo-name].git
```

### Merge Conflicts
```bash
git status              # See conflicted files
# Edit files to resolve (remove <<<< ==== >>>> markers)
git add [file]
git commit -m "fix: resolve merge conflict"
```

### Flutter Issues
```bash
cd ~/Development/findr-health/findr-health-mobile
flutter clean
flutter pub get
flutter run
```

---

## ✅ CHECKLISTS

### Morning Checklist
- [ ] Ran `./findr-start.sh`
- [ ] Script shows all green checkmarks
- [ ] Pasted prompt into Claude
- [ ] Attached latest documents
- [ ] Filled in today's goals

### Evening Checklist
- [ ] Ran `./findr-end.sh`
- [ ] All changes committed with good messages
- [ ] All commits pushed to GitHub
- [ ] Generated session summary
- [ ] Saved SESSION_END file to docs/sessions/

### Weekly Checklist
- [ ] Delete old SESSION_END files (keep last 2 weeks)
- [ ] Update ECOSYSTEM_SUMMARY if architecture changed
- [ ] Review OUTSTANDING_ISSUES and close completed items
- [ ] Run security audit: `grep -r "AIza\|pk_live" .`

---

## 📞 QUICK REFERENCE

| Task | Command |
|------|---------|
| Start day | `cd ~/Development/findr-health && ./findr-start.sh` |
| End day | `cd ~/Development/findr-health && ./findr-end.sh` |
| Run Flutter app | `cd ~/Development/findr-health/findr-health-mobile && flutter run` |
| Check git status | `git status` |
| Commit changes | `git add -A && git commit -m "type(scope): msg"` |
| Push changes | `git push origin [branch]` |
| Pull latest | `git pull origin main` |

---

## 🔗 RELATED DOCUMENTS

| Document | Purpose |
|----------|---------|
| ENGINEERING_STANDARDS.md | Full governance rules |
| SESSION_PROTOCOL.md | Detailed session procedures |
| ECOSYSTEM_SUMMARY.md | System architecture |
| OUTSTANDING_ISSUES.md | Current bugs and priorities |

---

*Version 1.0 - January 12, 2026*
