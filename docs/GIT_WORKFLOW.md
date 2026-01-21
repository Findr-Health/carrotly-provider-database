# FINDR HEALTH - GIT WORKFLOW STANDARDS
## Standardized Procedures to Prevent Common Issues

**Purpose:** Eliminate confusion and wasted time from git/save issues  
**Created:** January 21, 2026  
**Status:** Mandatory for all code changes

---

## ⚠️ COMMON PROBLEM: VS CODE CACHE ISSUE

**Symptom:** You edit a file in VS Code, but git doesn't see the changes.

**What's happening:**
- VS Code displays your edits in the UI
- File is NOT actually written to disk
- Git sees the old file contents
- `git diff` shows nothing
- `git commit` fails (nothing to commit)

**This has caused multiple production delays!**

---

## ✅ MANDATORY WORKFLOW

**Use this process for EVERY code change:**

### Step 1: Make Changes
```bash
# Open file in VS Code or terminal editor
code path/to/file.js
```

### Step 2: Save File (CRITICAL)
```bash
# In VS Code: Press ⌘+S (Mac) or Ctrl+S (Windows)
# VERIFY the dot disappears from tab (shows it's saved)

# Alternative: Close VS Code completely to force flush
# ⌘+Q on Mac, Alt+F4 on Windows
```

### Step 3: Verify File Actually Changed
```bash
# BEFORE staging, verify git sees the changes:
git status

# Should show:
# modified:   path/to/file.js (in RED)

# View what changed:
git diff path/to/file.js

# Should show your changes in green (+) and red (-)
```

**⚠️ If git diff shows NOTHING:**
- File was NOT actually saved to disk
- Go back to Step 2
- Try closing VS Code completely
- Or use terminal editor (see below)

### Step 4: Stage Changes
```bash
# Only stage once you see changes in git diff
git add path/to/file.js

# Verify it staged:
git status
# Should show:
# modified:   path/to/file.js (in GREEN)
```

### Step 5: Final Verification
```bash
# View what you're about to commit:
git diff --staged

# Should show your changes
# This is your last check before committing
```

### Step 6: Commit
```bash
git commit -m "descriptive message"

# Verify commit was created:
git log --oneline -n 1
# Should show your commit at top
```

### Step 7: Push
```bash
git push origin main

# Watch terminal output
# Should see "Writing objects", "Delta compression"
# Should NOT see "Everything up-to-date" if you made changes
```

### Step 8: Verify Deployment
```bash
# Check Railway/Vercel dashboard
# New deployment should appear within 60 seconds
# Click deployment to see logs
```

---

## 🔧 ALTERNATIVE: Terminal Editors

When VS Code won't save properly, use terminal:

### Option 1: nano (Easiest)
```bash
nano path/to/file.js

# Edit file
# Ctrl+X to exit
# Y to save
# Enter to confirm
```

### Option 2: vim (Power users)
```bash
vim path/to/file.js

# Press 'i' to enter insert mode
# Make edits
# Press Esc
# Type ':wq' and Enter to save and quit
```

### Option 3: cat with heredoc (Automated)
```bash
# Replace entire file contents:
cat > path/to/file.js << 'EOF'
[paste your new content here]
EOF

# Verify:
git diff path/to/file.js
```

---

## 🚨 DEBUGGING CHECKLIST

If git commands aren't working as expected:

### Issue: "nothing to commit, working tree clean"

**Diagnosis:**
```bash
# 1. Check if file actually changed on disk
cat path/to/file.js | head -20

# 2. Check git status
git status

# 3. Check if you're in right directory
pwd
# Should be in repo root
```

**Solution:**
- File wasn't actually saved
- Close VS Code completely (⌘+Q)
- Re-open and re-edit
- Or use terminal editor

---

### Issue: "git push" says "Everything up-to-date"

**Diagnosis:**
```bash
# Check if commit exists
git log --oneline -n 3

# Check current branch
git branch
# Should show * main

# Check if ahead of remote
git status
# Should show "Your branch is ahead of 'origin/main' by N commits"
```

**Solution:**
- No commit was actually created
- Git staging/commit didn't work
- Start over from Step 3 (Verify File Changed)

---

### Issue: Files not updating in Railway/Vercel

**Diagnosis:**
```bash
# 1. Verify push succeeded
git log --oneline -n 1
git ls-remote origin main
# Commit hashes should match

# 2. Check Railway/Vercel dashboard
# Should show new deployment in progress

# 3. Wait 2-3 minutes for deploy
# Then test endpoint
```

**Solution:**
- Push didn't actually complete
- Or deployment failed (check logs)
- Or caching issue (wait longer, or force redeploy)

---

## 📝 COMMIT MESSAGE STANDARDS

### Good Commit Messages:
```bash
✅ "fix: add GET /providers endpoint for admin dashboard"
✅ "feat: implement skeleton loading states"
✅ "docs: update API endpoint registry"
✅ "fix: resolve 2px overflow on appointment card"
```

### Bad Commit Messages:
```bash
❌ "updates"
❌ "fix"
❌ "changes"
❌ "wip"
```

### Format:
```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation only
- refactor: Code change that neither fixes nor adds feature
- style: Formatting, missing semicolons, etc
- test: Adding tests
- chore: Maintenance
```

---

## 🔄 COMMON WORKFLOWS

### Workflow A: Single File Change
```bash
# 1. Edit file in VS Code
# 2. Save (⌘+S)
# 3. Close VS Code (⌘+Q) - ensures flush
git status
git diff path/to/file.js
git add path/to/file.js
git commit -m "fix: description"
git push origin main
```

### Workflow B: Multiple Files
```bash
# 1. Edit files
# 2. Save all (⌘+K, S in VS Code)
# 3. Close VS Code
git status
git diff
# Review all changes
git add .
git commit -m "feat: description"
git push origin main
```

### Workflow C: Urgent Production Fix
```bash
# 1. Use terminal editor (nano) to avoid VS Code issues
nano path/to/file.js
# Make fix
# Ctrl+X, Y, Enter

# 2. Verify immediately
git diff path/to/file.js

# 3. Fast commit
git add path/to/file.js
git commit -m "hotfix: critical issue description"
git push origin main

# 4. Watch Railway dashboard for deploy
# 5. Test immediately after deploy
```

---

## 🎯 PRE-COMMIT CHECKLIST

**BEFORE running `git commit`, verify:**

```bash
[ ] File saved in editor (dot gone from tab)
[ ] VS Code closed (or ⌘+S pressed and verified)
[ ] git status shows modified files (RED)
[ ] git diff shows your changes
[ ] Changes are correct
[ ] No unintended changes included
[ ] Commit message is descriptive
```

---

## 📊 GIT STATUS INTERPRETATION

### What You See vs What It Means:

```bash
# Untracked files (never added to git):
Untracked files:
  new-file.js

# Modified, not staged (RED):
Changes not staged for commit:
  modified:   file.js
→ File changed on disk, not staged yet

# Modified, staged (GREEN):
Changes to be committed:
  modified:   file.js
→ File staged, ready to commit

# Clean working tree:
nothing to commit, working tree clean
→ No changes detected
→ If you expect changes: FILE NOT SAVED!
```

---

## 🔍 VERIFICATION COMMANDS

**After every step, verify:**

```bash
# After editing:
git status          # Shows modified files?
git diff file.js    # Shows your changes?

# After staging:
git status          # File in green?
git diff --staged   # Shows changes to commit?

# After committing:
git log -n 1        # Shows your commit?
git show            # Shows commit details?

# After pushing:
git log --oneline -n 3
git ls-remote origin main
# Commit hashes should match
```

---

## 🚨 EMERGENCY PROCEDURES

### Emergency: Need to undo changes

```bash
# Undo unstaged changes (file not added yet):
git checkout -- file.js

# Undo staged changes (after git add):
git reset HEAD file.js
git checkout -- file.js

# Undo commit (before push):
git reset --soft HEAD~1
# Changes back to staged state

# Undo commit (after push) - DANGEROUS:
# DON'T DO THIS unless coordinated
# Better to make a new commit that reverts:
git revert HEAD
git push origin main
```

### Emergency: Deployment broke production

```bash
# 1. Identify working commit
git log --oneline -n 10

# 2. Revert to working commit
git revert <bad-commit-hash>
git push origin main

# 3. Notify team
# 4. Debug issue offline
# 5. Fix and redeploy properly
```

---

## 🐛 KNOWN ISSUES & WORKAROUNDS

### Issue 1: VS Code Auto-Save Not Working
**Symptoms:** 
- Auto-save enabled but files don't save
- Dot stays on tab after typing
- Git doesn't see changes

**Workaround:**
- Manual save (⌘+S) after every change
- OR: Disable auto-save, always save manually
- OR: Close VS Code completely after editing

**Permanent Fix:**
```json
// In VS Code settings.json:
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

---

### Issue 2: Git Cache Confusion
**Symptoms:**
- Git shows old file contents
- Even after saving and closing editor
- `git diff` shows nothing

**Workaround:**
```bash
# Clear git cache for file:
git rm --cached file.js
git add file.js
```

---

### Issue 3: Railway Not Deploying
**Symptoms:**
- Git push succeeds
- Railway shows no new deployment
- Changes don't appear

**Diagnosis:**
```bash
# Check Railway is watching correct branch:
# Railway → Settings → Service → Branch (should be "main")

# Check Railway logs for errors
```

**Workaround:**
- Manual deploy via Railway dashboard
- OR: Force push (dangerous, coordinate first)

---

## 📚 RESOURCES

### Git Basics
- `git status` - Check state of working directory
- `git diff` - View changes not yet staged
- `git diff --staged` - View staged changes
- `git log` - View commit history
- `git show` - View last commit details

### Advanced Git
- `git stash` - Temporarily save changes
- `git stash pop` - Restore stashed changes
- `git branch` - List/create branches
- `git checkout -b` - Create and switch to branch

### Debugging
- `git reflog` - View full history (even undone commits)
- `git fsck` - Check repository integrity
- `git clean -fd` - Remove untracked files (careful!)

---

## 🎓 TRAINING

**New developers should:**
1. Read this document fully
2. Practice workflow on test branch
3. Make 5 commits with verification at each step
4. Understand all diagnostic commands
5. Know when to use terminal editors

---

## ✅ QUICK REFERENCE

**The 8-Step Workflow:**
1. Edit file
2. Save (⌘+S)
3. Verify: `git diff file.js`
4. Stage: `git add file.js`
5. Verify: `git diff --staged`
6. Commit: `git commit -m "message"`
7. Push: `git push origin main`
8. Verify: Check Railway/Vercel dashboard

**If anything goes wrong:**
- Check this document
- Use terminal editor as backup
- Verify at every step
- Don't proceed until verification passes

---

*Last Updated: January 21, 2026*  
*Version: 1.0*  
*Status: Mandatory workflow*  
*Created after: Multiple VS Code save issues*  
*Purpose: Eliminate git/save confusion forever*
