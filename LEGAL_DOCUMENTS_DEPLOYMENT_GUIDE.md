# Legal Documents - Deployment Instructions

**Date:** January 1, 2026  
**Version:** v3 (Provider Agreement), v2 (Patient TOS)

---

## Document Summary

| Document | Version | Status | Target Repo |
|----------|---------|--------|-------------|
| Provider Participation Agreement | v3 REVISED | ✅ Ready | `carrotly-provider-mvp` |
| Patient Terms of Service | v2 REVISED | ✅ Ready | Consumer App (pending) |
| Provider Agreement Legal Review | — | Reference | Project Knowledge |
| Patient TOS Legal Review | — | Reference | Project Knowledge |

---

## 1. Provider Participation Agreement v3

### Target Location
**Repo:** `Findr-Health/carrotly-provider-mvp`  
**Suggested Path:** `/public/legal/Findr_Health_Provider_Participation_Agreement.docx`

### Deployment Steps

1. **Download the file:**
   - `Findr_Health_Provider_Participation_Agreement_v3_REVISED.docx`

2. **Add to repo:**
   ```bash
   cd carrotly-provider-mvp
   mkdir -p public/legal
   cp /path/to/Findr_Health_Provider_Participation_Agreement_v3_REVISED.docx public/legal/Findr_Health_Provider_Participation_Agreement.docx
   ```

3. **Update any references in code:**
   - Search for existing agreement references in the codebase
   - Update file paths if necessary
   - The onboarding Step 10 (Legal Agreement) should reference this document

4. **Commit and deploy:**
   ```bash
   git add public/legal/
   git commit -m "Update Provider Participation Agreement to v3 - adds exclusion rights, class action waiver, background checks"
   git push origin main
   ```

### Key Changes in v3 (for changelog/release notes)
- **Section 14.3:** Strengthened termination/exclusion rights with 11 specific grounds
- **Section 14.3A:** Added Exclusion List provision
- **Section 15.5:** Added Class Action Waiver (aligns with Patient TOS)
- **Section 15.4A:** Added Injunctive Relief carve-out
- **Section 15.9:** Added 1-year Statute of Limitations
- **Section 6.6:** Added Background Check authorization
- **Section 9.7:** Added Non-Circumvention with liquidated damages
- **Section 9.8:** Added Audit Rights
- **Section 9.9:** Added Service Level Expectations
- **Section 9.10:** Added Anti-Corruption compliance
- **Section 12.4:** Added Insurance Cooperation clause

---

## 2. Patient Terms of Service v2

### Current Status
The consumer app codebase is not yet available. Until then, store this document safely.

### Recommended Storage Options

**Option A: Add to Backend Repo (Recommended)**
Store in the backend repo for centralized legal document management:

```bash
cd carrotly-provider-database
mkdir -p legal/patient
cp /path/to/Findr_Health_Patient_Terms_of_Service_v2_REVISED.docx legal/patient/
git add legal/
git commit -m "Add Patient Terms of Service v2 - pending consumer app deployment"
git push origin main
```

**Option B: Create Dedicated Legal Repo**
For better organization if you'll have many legal documents:

```bash
# Create new repo: Findr-Health/legal-documents
mkdir legal-documents
cd legal-documents
git init
mkdir provider patient shared
cp /path/to/Provider_Agreement*.docx provider/
cp /path/to/Patient_TOS*.docx patient/
git add .
git commit -m "Initial legal documents repository"
# Create repo on GitHub and push
```

**Option C: Keep in Claude Project Knowledge**
The document is already in your Claude Project files. This works for now but won't be accessible to developers.

### When Consumer App is Ready

1. **Suggested path:** `/public/legal/Findr_Health_Patient_Terms_of_Service.docx`

2. **Implementation requirements:**
   - Display key sections during registration
   - Require scroll-through or section acknowledgment
   - Store acceptance timestamp, IP, app version
   - Make full Terms downloadable
   - Implement 30-day notice mechanism for changes

3. **Critical sections to highlight in UI:**
   - Section 7: Assumption of Risk and Release
   - Section 9: Limitation of Liability
   - Section 14: Arbitration and Class Action Waiver
   - 30-day opt-out notice at top

---

## 3. Legal Review Memos

These are internal reference documents and should NOT be deployed publicly.

### Storage Recommendation
Keep in Claude Project Knowledge or internal documentation system (Notion, Confluence, etc.)

**Files:**
- `Provider_Agreement_Legal_Review_Memo.md`
- `Patient_TOS_Legal_Review_Memo.md`

---

## 4. Placeholders to Replace Before Go-Live

### Provider Agreement
| Placeholder | Replace With |
|-------------|--------------|
| `[DATE]` | Effective date |

### Patient Terms of Service
| Placeholder | Replace With |
|-------------|--------------|
| `[DATE]` | Effective date |
| `[SUPPORT EMAIL]` | support@findrhealth.com |
| `[OPT-OUT ADDRESS]` | Physical address for arbitration opt-out |
| `[CONTACT EMAIL]` | General contact email |
| `[CONTACT ADDRESS]` | Company mailing address |
| `[ACCESSIBILITY EMAIL]` | Accessibility support email |

---

## 5. Version Control Best Practices

### Naming Convention
```
Document_Name_v[VERSION]_[STATUS].docx

Examples:
- Findr_Health_Provider_Participation_Agreement_v3.docx (current)
- Findr_Health_Provider_Participation_Agreement_v3_REVISED.docx (working)
- Findr_Health_Provider_Participation_Agreement_v2_ARCHIVED.docx (old)
```

### Change Log
Maintain a CHANGELOG.md in the legal folder:

```markdown
# Legal Documents Changelog

## [Provider Agreement v3] - 2026-01-01
### Added
- Section 14.3A: Exclusion List
- Section 15.5: Class Action Waiver
- Section 15.4A: Injunctive Relief
- Section 15.9: Statute of Limitations
- Section 6.6: Background Checks
- Section 9.7-9.12: Compliance provisions

### Changed
- Section 14.3: Strengthened termination rights
- Section 6.2: Expanded material change notification
- Section 17.6: Clarified assignment restrictions

## [Patient TOS v2] - 2026-01-01
### Added
- Section 7.6: Knowing and Voluntary Release
- Section 9.6: Liability exceptions
- Section 10.3: User indemnification
- Sections 14.5-14.12: Enhanced arbitration provisions
...
```

---

## 6. Attorney Review Reminder

Before these documents go live, have Montana-licensed counsel review:

1. **Provider Agreement:**
   - Exclusion rights enforceability
   - Background check authorization scope
   - Non-circumvention liquidated damages
   - Class action waiver enforceability

2. **Patient TOS:**
   - Assumption of risk in healthcare context
   - $500 liability cap enforceability
   - Arbitration for healthcare claims
   - Release of claims scope

---

## Questions?

Refer to the Legal Review Memos for detailed analysis and recommendations.
