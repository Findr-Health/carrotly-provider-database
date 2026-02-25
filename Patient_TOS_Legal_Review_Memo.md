# MEMORANDUM

**TO:** Tim / Findr Health  
**FROM:** Senior Legal Review  
**DATE:** January 1, 2026  
**RE:** Critical Review of Patient Terms of Service — Recommended Revisions

---

## EXECUTIVE SUMMARY

I have reviewed the draft Patient Terms of Service prepared for Findr Health. While the document provides a solid foundation and correctly establishes Findr Health's position as a technology platform rather than a healthcare provider, **I have identified 27 issues ranging from critical gaps to refinements** that should be addressed before deployment.

**Overall Assessment:** B-  
The document demonstrates understanding of the core liability issues but contains several enforceability risks, missing provisions, and inconsistencies that could expose Findr Health to unnecessary liability or result in unenforceable provisions.

---

## CRITICAL ISSUES (Must Fix)

### 1. Liability Cap is Unconscionably Low — HIGH RISK

**Current Language (Section 9.4):**
> "...shall not exceed the greater of: (A) the amounts paid by you to Findr Health (NOT to Providers) in the twelve (12) months preceding the claim; OR (B) ONE HUNDRED DOLLARS ($100)."

**Problem:** Since Findr Health collects service fees (not the full Provider payment), and many users may pay minimal or no direct fees to Findr Health, this cap could be as low as $0-$100. Courts have struck down liability caps as unconscionable when they are so low as to be illusory. This is especially risky in a healthcare context.

**Recommended Revision:**
> "...shall not exceed the greater of: (A) the total amounts paid by you through the Platform (including to Providers) in the twelve (12) months preceding the claim; or (B) Five Hundred Dollars ($500)."

**Alternative:** Tie it to the specific transaction at issue:
> "...shall not exceed the greater of: (A) the amount paid for the specific booking giving rise to the claim; or (B) Five Hundred Dollars ($500)."

---

### 2. No Carve-Outs for Gross Negligence/Fraud — ENFORCEABILITY RISK

**Problem:** The limitation of liability (Section 9) and release (Section 7.3) contain no carve-outs for Findr Health's own gross negligence, willful misconduct, or fraud. Many jurisdictions will not enforce liability limitations that purport to shield a party from its own intentional or grossly negligent conduct.

**Recommended Addition to Section 9 (new Section 9.6):**
> "**9.6 Exceptions.** The limitations and exclusions in this Section 9 shall not apply to: (a) Findr Health's gross negligence or willful misconduct; (b) Findr Health's fraud or intentional misrepresentation; (c) death or personal injury caused by Findr Health's negligence (to the extent such limitation is prohibited by applicable law); or (d) any liability that cannot be limited or excluded under applicable law."

---

### 3. Missing Indemnification Clause — GAP

**Problem:** The Provider Agreement includes robust indemnification from Providers. The Patient TOS has **no indemnification from users**. This is a significant gap if a user's conduct (fraudulent reviews, harassment, illegal activity) causes Findr Health to incur costs.

**Recommended Addition (new Section 10.3):**
> "**10.3 Indemnification.** You agree to indemnify, defend, and hold harmless Findr Health and its officers, directors, employees, agents, and affiliates from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Platform in violation of these Terms; (b) your violation of any applicable law or third-party rights; (c) any content you submit, including reviews; (d) your interaction with any Provider; or (e) any dispute between you and a Provider. This indemnification obligation shall survive termination of your account and these Terms."

---

### 4. Arbitration Clause Missing Critical Provisions — ENFORCEABILITY RISK

**Problems Identified:**

**(a) No Fee Allocation Provision**
The arbitration clause doesn't specify who pays filing fees and arbitrator costs. Under AAA Consumer Rules, consumers typically pay reduced fees, but this should be explicit.

**(b) No Injunctive Relief Carve-Out**
No exception for Findr Health to seek injunctive relief in court for IP violations, confidentiality breaches, or security threats.

**(c) No Mass Arbitration Provision**
The Provider Agreement includes mass arbitration procedures, but Patient TOS does not. With potentially thousands of users, this is a significant oversight.

**(d) No Severability Specific to Arbitration**
If the class action waiver is struck down, the entire arbitration clause could fail without a severability savings clause.

**Recommended Revisions to Section 14:**

Add new Section 14.4A:
> "**14.4A Arbitration Fees.** Payment of filing, administration, and arbitrator fees will be governed by AAA's Consumer Arbitration Rules. If you demonstrate financial hardship, Findr Health will consider in good faith any request to pay fees that would otherwise be your responsibility."

Add new Section 14.4B:
> "**14.4B Injunctive Relief.** Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights, confidentiality obligations, or data security."

Add new Section 14.6A:
> "**14.6A Mass Arbitration.** If twenty-five (25) or more similar demands for arbitration are filed against Findr Health, the claims shall be resolved through staged proceedings. Claims shall be randomly selected and arbitrated in batches of ten (10). The results of each batch shall inform potential resolution of remaining claims. This process shall continue until all claims are resolved."

Add to Section 14.5 (end):
> "If any court or arbitrator determines that the class action waiver in this Section 14.5 is unenforceable as to a particular claim, then that claim (and only that claim) shall be severed from arbitration and may proceed in court, while all other claims shall remain subject to arbitration."

---

### 5. Release Language May Not Survive State Law Scrutiny — RISK

**Problem:** The broad release in Section 7.3 purports to release Findr Health from "any and all claims" related to Provider services. While Findr Health genuinely has no control over Providers, some states limit the enforceability of pre-injury releases, especially in healthcare contexts.

**Recommended Enhancement:**
Add acknowledgment language to strengthen the voluntary nature:

> "**7.6 Knowing and Voluntary Release.** YOU ACKNOWLEDGE THAT YOU HAVE CAREFULLY READ THIS SECTION 7, THAT YOU UNDERSTAND ITS CONTENTS, AND THAT YOU AGREE TO ITS TERMS KNOWINGLY AND VOLUNTARILY. YOU UNDERSTAND THAT BY AGREEING TO THIS RELEASE, YOU ARE GIVING UP SUBSTANTIAL LEGAL RIGHTS, INCLUDING THE RIGHT TO SUE FINDR HEALTH FOR CLAIMS ARISING FROM PROVIDER SERVICES. YOU HAVE HAD THE OPPORTUNITY TO CONSULT WITH AN ATTORNEY BEFORE ACCEPTING THESE TERMS."

---

### 6. No Statute of Limitations Provision — GAP

**Problem:** Without a contractual limitations period, users have the full statutory period (which varies by state and claim type) to bring claims. This creates long-tail liability exposure.

**Recommended Addition (new Section 16.10):**
> "**16.10 Limitation on Claims.** TO THE MAXIMUM EXTENT PERMITTED BY LAW, ANY CLAIM OR CAUSE OF ACTION ARISING OUT OF OR RELATED TO YOUR USE OF THE PLATFORM OR THESE TERMS MUST BE FILED WITHIN ONE (1) YEAR AFTER SUCH CLAIM OR CAUSE OF ACTION AROSE, OR BE FOREVER BARRED. This limitation applies regardless of whether the claim or cause of action is based on contract, tort, statute, or any other legal theory."

---

## SIGNIFICANT ISSUES (Should Fix)

### 7. Definitions Section Missing

**Problem:** Key terms are defined inline throughout the document, making them hard to locate and potentially inconsistent. Professional agreements typically include a definitions section.

**Recommendation:** Add a Definitions section after the Introduction or incorporate definitions into Section 1. Key terms needing formal definition:
- "Platform" (currently defined in intro)
- "Provider" (currently defined in Section 1)
- "Services" (not clearly defined)
- "Booking" (not defined)
- "User Content" (not defined)
- "Booking Fee" (not defined)

---

### 8. Time Zone Ambiguity in Cancellation Policy

**Problem:** Cancellation deadlines are specified as "24 hours before" or "48 hours before" but there's no specification of whose time zone governs. This could lead to disputes.

**Recommended Addition to Section 5.1:**
> "All cancellation deadlines are calculated based on the local time zone of the Provider's location as displayed in the booking confirmation."

---

### 9. No Provider No-Show Protection

**Problem:** Section 5.2 addresses Provider cancellations but not Provider no-shows (when a Provider confirms but fails to appear). Users need recourse.

**Recommended Addition (new Section 5.7):**
> "**5.7 Provider No-Shows.** If a Provider fails to appear for a confirmed appointment without prior cancellation, you will receive a full refund (100%) of any amounts paid. Please report Provider no-shows through the Platform within 48 hours of the scheduled appointment time."

---

### 10. SMS/Communication Consent Missing

**Problem:** Section 16.7 mentions electronic communications broadly but doesn't specifically address SMS/text messages, which require explicit consent under TCPA.

**Recommended Revision to Section 16.7:**
> "**16.7 Electronic Communications and SMS Consent.** By using the Platform and providing your phone number, you expressly consent to receive communications from Findr Health, including: (a) emails regarding your account, bookings, and Platform updates; (b) push notifications through our mobile app; and (c) SMS/text messages regarding booking confirmations, reminders, and cancellations. Message and data rates may apply. You may opt out of promotional communications at any time, but transactional messages related to your bookings are a condition of using the Platform. Text STOP to cancel SMS messages."

---

### 11. Third-Party Links/Services Disclaimer Missing

**Problem:** The Platform likely links to external sites (Provider websites, payment processors, etc.). There's no disclaimer regarding third-party content.

**Recommended Addition (new Section 12.4):**
> "**12.4 Third-Party Links and Services.** The Platform may contain links to third-party websites, services, or resources, including Provider websites and payment processors. These third-party services are not under Findr Health's control, and Findr Health is not responsible for their content, privacy practices, or availability. Your use of third-party services is at your own risk and subject to those parties' terms and policies. The inclusion of any link does not imply endorsement by Findr Health."

---

### 12. Service Modification Rights Missing

**Problem:** There's no provision allowing Findr Health to modify, suspend, or discontinue Platform features or services.

**Recommended Addition (new Section 16.11):**
> "**16.11 Modification of Platform.** Findr Health reserves the right to modify, suspend, or discontinue any part of the Platform at any time, with or without notice. We may also impose limits on certain features or restrict access to parts of the Platform. Findr Health shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Platform or any part thereof."

---

### 13. Geographic Scope Unclear

**Problem:** The agreement doesn't specify geographic limitations. If the Platform is US-only, this should be stated. If international users can access it, additional considerations apply.

**Recommended Addition to Section 2 (new Section 2.6):**
> "**2.6 Geographic Availability.** The Platform is intended for use within the United States. By using the Platform, you represent that you are located in the United States. We make no representations that the Platform is appropriate or available for use in other locations. If you access the Platform from outside the United States, you do so at your own risk and are responsible for compliance with local laws."

---

### 14. CRFA Protection Statement Missing

**Problem:** The Consumer Review Fairness Act (CRFA) protects consumers' rights to post honest reviews. While Section 11 discusses review guidelines, it doesn't acknowledge CRFA protections, which could create legal risk and user confusion.

**Recommended Addition to Section 11 (new Section 11.5):**
> "**11.5 Your Review Rights.** Nothing in these Terms restricts your right to communicate truthfully about your experiences with Providers, whether in reviews on the Platform, on other websites, or to government agencies. Consistent with the Consumer Review Fairness Act, we do not prohibit or restrict your ability to leave honest reviews."

---

### 15. Beta Features Disclaimer Missing

**Problem:** If Findr Health releases beta or experimental features (like AI tools), there should be disclaimer language.

**Recommended Addition (new Section 6.6):**
> "**6.6 Beta and Experimental Features.** The Platform may include features designated as "beta," "preview," "experimental," or similar terms. Such features are provided for testing purposes, may contain errors, and may be modified or discontinued at any time. Beta features are provided "AS IS" without any warranty, and you use them at your own risk."

---

## MODERATE ISSUES (Consider Fixing)

### 16. Inconsistent Capitalization of Defined Terms

**Problem:** Some defined terms are capitalized inconsistently (e.g., "Platform" vs "platform," "Provider" vs "provider" in some instances). This could create interpretation issues.

**Recommendation:** Conduct a thorough review to ensure all defined terms are consistently capitalized throughout.

---

### 17. No Feedback/Suggestions License

**Problem:** If users provide feedback or suggestions about the Platform, Findr Health should have clear rights to use that feedback without obligation.

**Recommended Addition (new Section 11.6):**
> "**11.6 Feedback.** If you provide any feedback, suggestions, or ideas regarding the Platform ("Feedback"), you grant Findr Health a non-exclusive, perpetual, irrevocable, royalty-free, worldwide license to use, modify, and incorporate such Feedback into the Platform or any products or services, without any obligation to you."

---

### 18. No Accessibility Statement

**Problem:** While the Provider Agreement mentions ADA/WCAG cooperation, the Patient TOS has no accessibility statement.

**Recommended Addition (new Section 16.12):**
> "**16.12 Accessibility.** Findr Health is committed to making the Platform accessible to all users. If you experience any accessibility barriers or need assistance, please contact us at [ACCESSIBILITY EMAIL]. We welcome feedback on how to improve accessibility."

---

### 19. Booking Confirmation Timing Unclear

**Problem:** Section 3.2 says booking is confirmed "when you receive a confirmation notification" but doesn't address timing or what happens if confirmation is delayed.

**Recommended Revision to Section 3.2:**
> "**3.2 Booking Confirmation.** A booking is confirmed when you receive a confirmation notification through the Platform and/or email, typically within a few minutes of submitting your booking request. If you do not receive confirmation within 24 hours, please contact support. Until you receive confirmation, no appointment has been scheduled, and you should not rely on the booking."

---

### 20. No Mention of Account Credits

**Problem:** Your cancellation policy implementation includes an account credit option for late cancellations, but the Terms don't address credits.

**Recommended Addition to Section 5 (new Section 5.8):**
> "**5.8 Account Credits.** In certain circumstances, you may be offered account credits in lieu of a monetary refund for cancelled bookings. Account credits are non-transferable, cannot be redeemed for cash, and expire twelve (12) months from the date of issuance unless otherwise specified. Credits are applied automatically to future bookings."

---

### 21. Data Portability Not Addressed

**Problem:** Various state privacy laws (CCPA, etc.) give users rights to access and port their data. The Terms reference a Privacy Policy but don't acknowledge these rights.

**Recommended Revision to Section 13.1:**
> "**13.1 Privacy Policy.** Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand how we collect, use, and protect your information, and to learn about your rights regarding your personal data, including rights to access, correct, and delete your information where applicable."

---

### 22. Force Majeure Should Include Healthcare-Specific Events

**Problem:** Section 16.8 mentions "pandemics" but given the healthcare context, should be more specific about healthcare-related disruptions.

**Recommended Revision to Section 16.8:**
> "**16.8 Force Majeure.** Findr Health shall not be liable for any failure or delay caused by circumstances beyond our reasonable control, including natural disasters, pandemics, epidemics, public health emergencies, war, terrorism, labor disputes, infrastructure failures, government actions, healthcare system disruptions, or Provider unavailability due to emergency medical situations."

---

### 23. Survival Clause Missing

**Problem:** Unlike the Provider Agreement, the Patient TOS doesn't specify which provisions survive termination.

**Recommended Addition to Section 15.3:**
> "**15.3 Effect of Termination.** Upon termination: (a) your access to the Platform will be disabled; (b) you remain responsible for any outstanding payments; (c) the following provisions shall survive termination: Section 7 (Assumption of Risk), Section 9 (Limitation of Liability), Section 10.3 (Indemnification), Section 11.3 (License to Reviews), Section 12 (Intellectual Property), Section 13 (Privacy), Section 14 (Dispute Resolution), and Section 16 (General Terms)."

---

### 24. Headings Disclaimer Missing

**Problem:** The Provider Agreement includes a headings disclaimer (17.11) but the Patient TOS does not.

**Recommended Addition (new Section 16.13):**
> "**16.13 Headings.** Section headings are for convenience only and shall not affect the interpretation of these Terms."

---

## MINOR ISSUES (Optional)

### 25. Consider Plain-Language Summary Box

**Recommendation:** While not legally required, adding a "Key Terms Summary" box at the beginning (clearly marked as non-binding) improves user understanding and demonstrates good faith.

---

### 26. Emergency Contact Information

**Recommendation:** Section 6.4 tells users to call 911 but could also include the National Suicide Prevention Lifeline and Crisis Text Line for mental health Providers:
> "If you are experiencing a mental health crisis, contact the 988 Suicide & Crisis Lifeline by calling or texting 988."

---

### 27. Consistent Reference to "Terms"

**Problem:** The document sometimes refers to "these Terms," "this Agreement," "Terms of Service," etc. Pick one and use consistently.

**Recommendation:** Use "these Terms" consistently throughout.

---

## SUMMARY OF RECOMMENDED ADDITIONS

| Priority | Issue | Section to Add/Modify |
|----------|-------|----------------------|
| CRITICAL | Raise liability cap | Section 9.4 |
| CRITICAL | Carve-outs for gross negligence | New Section 9.6 |
| CRITICAL | User indemnification | New Section 10.3 |
| CRITICAL | Arbitration fee allocation | New Section 14.4A |
| CRITICAL | Injunctive relief carve-out | New Section 14.4B |
| CRITICAL | Mass arbitration | New Section 14.6A |
| CRITICAL | Arbitration severability | Add to Section 14.5 |
| CRITICAL | Knowing waiver acknowledgment | New Section 7.6 |
| CRITICAL | Statute of limitations | New Section 16.10 |
| SIGNIFICANT | Time zone for cancellations | Add to Section 5.1 |
| SIGNIFICANT | Provider no-show policy | New Section 5.7 |
| SIGNIFICANT | SMS consent | Revise Section 16.7 |
| SIGNIFICANT | Third-party links | New Section 12.4 |
| SIGNIFICANT | Platform modification rights | New Section 16.11 |
| SIGNIFICANT | Geographic scope | New Section 2.6 |
| SIGNIFICANT | CRFA acknowledgment | New Section 11.5 |
| SIGNIFICANT | Beta features | New Section 6.6 |
| MODERATE | Feedback license | New Section 11.6 |
| MODERATE | Accessibility | New Section 16.12 |
| MODERATE | Account credits | New Section 5.8 |
| MODERATE | Survival clause | Revise Section 15.3 |
| MODERATE | Headings disclaimer | New Section 16.13 |

---

## CONCLUSION

The draft Terms of Service correctly positions Findr Health as a technology platform and includes appropriate disclaimers regarding Provider services. However, the critical issues identified—particularly the unconscionably low liability cap, missing indemnification, and incomplete arbitration provisions—create meaningful legal risk.

**Recommended Next Steps:**
1. Implement all CRITICAL revisions before deployment
2. Implement SIGNIFICANT revisions before deployment
3. Implement MODERATE revisions as time permits
4. Have Montana counsel review the revised document
5. Consider user testing for comprehension of key provisions

I am available to discuss these recommendations and assist with revisions.

---

*This memorandum is prepared for internal review purposes and does not constitute legal advice. Final terms should be reviewed by licensed Montana counsel before implementation.*
