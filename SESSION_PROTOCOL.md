# FINDR HEALTH - SESSION PROTOCOL
## Daily Development Workflow Guide

---

## 🎯 Purpose

This document ensures continuity between development sessions with Claude AI. Following this protocol prevents information loss and accelerates daily progress.

---

## 🌅 START OF DAY PROCEDURE

### Step 1: Copy the Start Prompt Template
Copy the template below, fill in the blanks, and paste into a new Claude conversation.

### Step 2: Attach Required Documents
Always attach these files from your project:
1. `FINDR_HEALTH_ECOSYSTEM_SUMMARY_v[X].md` (latest version)
2. `OUTSTANDING_ISSUES_v[X].md` (latest version)
3. Any files you'll be working on today

### Step 3: Verify Claude has context
Claude should summarize what it knows before starting work.

---

## 📝 START OF DAY PROMPT TEMPLATE

```markdown
# FINDR HEALTH - Session Start: [DATE]

## 👤 Context
I'm Tim, continuing development on Findr Health. This is a healthcare marketplace with:
- Flutter consumer app (iOS/Android)
- Node.js/MongoDB backend on Railway
- React provider portal and admin dashboard on Vercel

## 🔑 Quick Reference
- **Test Account:** Gagi@findrhealth.com / Test1234!
- **Backend API:** https://fearless-achievement-production.up.railway.app/api
- **Provider Portal:** https://findrhealth-provider.vercel.app
- **Admin Dashboard:** https://admin-findrhealth-dashboard.vercel.app

## 📦 Git State (run `git log -1 --oneline` in each repo)
| Repo | Branch | Last Commit |
|------|--------|-------------|
| carrotly-provider-database | main | [COMMIT] |
| carrotly-provider-mvp | main | [COMMIT] |
| findr-health-mobile | main | [COMMIT] |

## 🎯 Today's Goals (Priority Order)
1. [ ] [GOAL 1]
2. [ ] [GOAL 2]
3. [ ] [GOAL 3]

## 🚨 Known Blockers
- [List any blockers from previous session]

## 📎 Attached Documents
- ECOSYSTEM_SUMMARY_v[X].md
- OUTSTANDING_ISSUES_v[X].md
- [Any specific files needed today]

## ❓ Questions for Claude
1. [Any specific questions]

Please review the attached documents and confirm you understand the current state before we begin.
```

---

## 🌙 END OF DAY PROCEDURE

### Step 1: Document Progress
Ask Claude to generate the end-of-day summary.

### Step 2: Update Project Documents
- Update `OUTSTANDING_ISSUES_v[X].md` with new version number
- Update `ECOSYSTEM_SUMMARY` if architecture changed
- Commit documentation changes to git

### Step 3: Save Key Files
Download any new files Claude created and add to project.

---

## 📝 END OF DAY PROMPT

Copy and paste this at the end of your session:

```markdown
Please generate my end-of-day summary. Include:

1. **Completed Today** - List everything we accomplished
2. **Code Changes** - Files modified with brief description
3. **New Issues Discovered** - Any bugs or problems found
4. **Tomorrow's Priorities** - What should be tackled next
5. **Updated OUTSTANDING_ISSUES** - Generate new version
6. **Files to Download** - List any files I should save

Format as a downloadable SESSION_END_[DATE].md file.
```

---

## 📋 END OF DAY SUMMARY TEMPLATE

Claude will generate something like this:

```markdown
# FINDR HEALTH - Session End: [DATE]

## ✅ Completed Today
1. [x] Fixed calendar date picker - now shows 60 days
2. [x] Updated payment UX with "Pay at Visit" option
3. [ ] TestFlight build - BLOCKED (need provisioning profile)

## 📝 Code Changes
| File | Change | Status |
|------|--------|--------|
| datetime_selection_screen.dart | Monthly calendar with 60-day range | Ready to commit |
| booking_review_screen.dart | Pay at Visit option | Ready to commit |

## 🐛 New Issues Discovered
- **Issue:** Calendar crashes if provider has no business hours
- **File:** datetime_selection_screen.dart:145
- **Severity:** Medium
- **Workaround:** Added null check

## 🔜 Tomorrow's Priorities
1. TestFlight build and submission
2. Provider photo uploads
3. Push notification setup

## 📥 Files to Download
1. datetime_selection_screen.dart (updated)
2. booking_review_screen.dart (updated)
3. OUTSTANDING_ISSUES_v7.md (new version)

## 🔐 Security Actions Taken
- [x] Rotated Google API key
- [ ] Pending: Move keys to environment variables
```

---

## 🔄 VERSION CONTROL PROTOCOL

### Document Versioning
- Increment version number at end of each session
- Format: `DOCUMENT_NAME_v[N].md`
- Keep last 3 versions in project

### Git Commits (End of Day)
```bash
# Stage documentation
git add docs/OUTSTANDING_ISSUES_v*.md
git add docs/ECOSYSTEM_SUMMARY_v*.md

# Commit with session date
git commit -m "docs: End of session Jan 10, 2026 - [brief summary]"

# Push
git push origin main
```

---

## 📁 RECOMMENDED PROJECT STRUCTURE

```
findr-health-mobile/
├── docs/
│   ├── FINDR_HEALTH_ECOSYSTEM_SUMMARY_v6.md
│   ├── OUTSTANDING_ISSUES_v6.md
│   ├── SESSION_PROTOCOL.md (this file)
│   ├── DEVELOPER_HANDOFF.md
│   └── sessions/
│       ├── SESSION_END_2026-01-09.md
│       └── SESSION_END_2026-01-10.md
├── lib/
│   └── ... (Flutter code)
└── ...
```

---

## ⚡ QUICK COMMANDS

### Get Git State for Start Prompt
```bash
# Run this to get commit info for all repos
echo "=== carrotly-provider-database ===" && \
cd ~/Desktop/carrotly-provider-database && git log -1 --oneline && \
echo "=== carrotly-provider-mvp ===" && \
cd ~/Desktop/carrotly-provider-mvp && git log -1 --oneline && \
echo "=== findr-health-mobile ===" && \
cd ~/Downloads/Findr_health_APP && git log -1 --oneline
```

### Quick File Prep for Session
```bash
# Copy key docs to desktop for easy upload
cp ~/Downloads/Findr_health_APP/docs/OUTSTANDING_ISSUES_v*.md ~/Desktop/
cp ~/Downloads/Findr_health_APP/docs/ECOSYSTEM_SUMMARY_v*.md ~/Desktop/
```

---

## 🚨 IMPORTANT REMINDERS

1. **Always attach documents** - Claude's memory resets between conversations
2. **Share files early** - Paste file contents if Claude needs to modify them
3. **Version everything** - Never overwrite without incrementing version
4. **Commit often** - Don't lose work to a crash
5. **Test before ending** - Verify changes work before closing session

---

## 📞 ESCALATION

If you get stuck:
1. Share exact error messages
2. Share relevant file contents
3. Share terminal output
4. Describe what you expected vs what happened

---

*Protocol Version: 1.0 - January 10, 2026*
