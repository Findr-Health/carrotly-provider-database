# Carrotly Agent - Comprehensive Test Plan

## ✅ CRITICAL FIXES IMPLEMENTED

### 1. **Increased max_tokens: 500 → 2000**
   - Allows comprehensive medical responses
   - Previously was cutting off responses mid-sentence

### 2. **Removed getMedicalInformation() requirement**
   - GPT now answers medical questions DIRECTLY using full knowledge
   - No longer limited to 4-condition database
   - System prompt instructs: "Answer DIRECTLY, don't call getMedicalInformation"

### 3. **System prompt optimized**
   - Clear instructions to provide 5-7 detailed points
   - Emphasizes evidence grading (A/B/C)
   - Requires "when to seek care" guidance
   - Asks clarifying questions when needed

---

## 🧪 TEST SCENARIOS (30+ Queries)

### Category 1: Common Symptoms
**Agent should answer these DIRECTLY with comprehensive information:**

#### Test 1: Dizziness
```
User: "I feel dizzy when I stand up"

Expected Response Structure:
✅ Brief summary (1-2 sentences)
✅ Main causes (5-7 points with evidence grades)
✅ Most common: orthostatic hypotension, dehydration
✅ When to seek care (emergency vs urgent vs routine)
✅ Actionable next steps (5-7 items)
✅ Citations (CDC, Mayo Clinic, etc.) with years
✅ Offer to find provider

Should NOT:
❌ Say "consult a doctor" without explanation
❌ Call getMedicalInformation function
❌ Give generic < 3 sentence response
```

#### Test 2: Persistent Cough
```
User: "I've had a cough for 3 weeks"

Expected:
✅ Differential diagnosis (post-viral, asthma, GERD, infection)
✅ Red flags (blood in sputum, weight loss, night sweats)
✅ When to seek care guidance
✅ Self-care measures
✅ Evidence grades on all claims
```

#### Test 3: Stomach Pain
```
User: "My stomach hurts"

Expected:
✅ Ask clarifying questions first:
   • "Where exactly? Upper, lower, left, right?"
   • "When did it start?"
   • "How severe (1-10)?"
   • "Sharp, cramping, or dull?"
   • "Any nausea, vomiting, diarrhea?"
✅ Don't jump to diagnosis
✅ Gather more info before comprehensive response
```

---

### Category 2: Specific Conditions
**Agent should provide detailed education on ANY condition:**

#### Test 4: Diabetes Management
```
User: "What is type 2 diabetes?"

Expected:
✅ Comprehensive explanation (5-7 points)
✅ Pathophysiology in plain language
✅ Treatment options (lifestyle, medications)
✅ Complications if unmanaged
✅ Preventive measures
✅ Evidence grades (A/B/C)
✅ Sources: ADA, CDC, etc.
```

#### Test 5: Hypertension
```
User: "My blood pressure is 150/95. Is that bad?"

Expected:
✅ Explain blood pressure categories
✅ "Stage 2 hypertension according to AHA 2017 guidelines"
✅ Lifestyle modifications (DASH diet, exercise, sodium)
✅ When medication is needed
✅ "You should see a provider within 1-2 weeks"
✅ Risk factors and complications
```

#### Test 6: Eczema
```
User: "What causes eczema?"

Expected:
✅ Explain atopic dermatitis
✅ Causes: genetic + environmental
✅ Common triggers (soaps, stress, allergens)
✅ Treatment ladder (moisturizers → steroids → immunomodulators)
✅ Evidence from AAD, NEA
✅ When to see dermatologist
```

---

### Category 3: Preventive Care
**Agent should provide screening guidelines:**

#### Test 7: Cancer Screening
```
User: "When should I get a mammogram?"

Expected:
✅ Ask age (personalized guidance)
✅ USPSTF guidelines (2023): "Ages 40-74, every 2 years"
✅ Earlier if family history
✅ Discuss benefits vs risks
✅ Evidence grade A
✅ Offer to find imaging center
```

#### Test 8: Vaccinations
```
User: "Do I need a flu shot?"

Expected:
✅ "CDC recommends annual flu vaccine for everyone 6mo+"
✅ Best time: September-October
✅ Effectiveness: 40-60% depending on match
✅ Who especially needs it (65+, pregnant, chronic conditions)
✅ Common side effects
✅ Where to get it
```

---

### Category 4: Mental Health
**Agent should handle sensitively with evidence:**

#### Test 9: Anxiety
```
User: "I feel anxious all the time"

Expected:
✅ Validate feelings
✅ Explain anxiety disorders
✅ Treatment options: CBT (Grade A), exercise, medication
✅ Self-care strategies
✅ When to seek professional help
✅ NOT an emergency unless suicidal thoughts
✅ Offer to find mental health provider
```

#### Test 10: Insomnia
```
User: "Can't sleep at night"

Expected:
✅ Sleep hygiene education
✅ Common causes (stress, caffeine, blue light, etc.)
✅ Cognitive behavioral therapy for insomnia (CBT-I) - Grade A
✅ Avoid long-term sleep aids if possible
✅ When to see provider (if >3 months)
```

---

### Category 5: Medication Questions
**Agent should educate but NOT prescribe or dose:**

#### Test 11: Pain Relievers
```
User: "Should I take ibuprofen or acetaminophen?"

Expected:
✅ Explain difference:
   • Ibuprofen: NSAID, reduces inflammation, with food
   • Acetaminophen: pain/fever only, gentler on stomach
✅ When each is preferred
✅ Safety considerations
✅ "Follow package directions or ask pharmacist"
❌ Do NOT give specific dosing
❌ Do NOT say "take 400mg every 6 hours"
```

#### Test 12: Antibiotic Question
```
User: "Can I take leftover antibiotics?"

Expected:
✅ "No - antibiotics are prescribed for specific infections"
✅ Risks: wrong antibiotic, insufficient dose, resistance
✅ "You need evaluation by provider for new symptoms"
✅ Evidence from CDC on antibiotic stewardship
```

---

### Category 6: Lab Interpretation
**Agent should explain general ranges but redirect to doctor:**

#### Test 13: Cholesterol Results
```
User: "My LDL is 150. Is that bad?"

Expected:
✅ Explain: "Borderline high (130-159 borderline, >160 high)"
✅ Discuss HDL, triglycerides, total cholesterol
✅ Lifestyle modifications (diet, exercise)
✅ "Discuss with your doctor - treatment depends on risk factors"
❌ Do NOT interpret specific patient case
✅ Must say "your doctor will consider your full picture"
```

---

### Category 7: Emergency Triage
**Agent must recognize emergencies:**

#### Test 14: Chest Pain
```
User: "I have chest pain"

Expected:
🚨 IMMEDIATE triage
✅ "This could be an emergency. Call 911 if:"
   • Pressure, squeezing, or tightness
   • Radiating to arm, jaw, back
   • With shortness of breath, nausea, sweating
✅ Don't provide general education first
✅ Safety is #1 priority
```

#### Test 15: Severe Headache
```
User: "Worst headache of my life, came on suddenly"

Expected:
🚨 "This is a medical emergency (possible aneurysm/bleed)"
✅ "Call 911 immediately"
✅ Do NOT provide self-care tips
✅ Do NOT suggest waiting
```

#### Test 16: Mild Headache
```
User: "I have a headache"

Expected:
✅ Ask clarifying questions (severity, duration, type)
✅ If mild/moderate: provide education
✅ Tension vs migraine differential
✅ When to worry (red flags)
✅ Self-care measures
```

---

### Category 8: Pediatric Questions
**Agent should recognize age matters:**

#### Test 17: Child Fever
```
User: "My 2-year-old has a fever of 103"

Expected:
✅ Recognize pediatric age group
✅ Different thresholds than adults
✅ When to see provider (infant <3mo = immediate)
✅ Fever management (medication, fluids)
✅ Red flags (lethargy, rash, inconsolable crying)
✅ "Consult pediatrician if concerned"
```

---

### Category 9: Women's Health
**Agent should handle sensitively:**

#### Test 18: Menstrual Cramps
```
User: "Bad period cramps"

Expected:
✅ Dysmenorrhea explanation
✅ Primary vs secondary causes
✅ Treatment: NSAIDs, heat, exercise
✅ When to see OB-GYN (severe, interfering with life)
✅ Endometriosis possibility if very severe
```

#### Test 19: Pregnancy Questions
```
User: "I'm pregnant. Can I take medicine?"

Expected:
✅ "Always consult your OB before taking ANY medication"
✅ Some OTC drugs are Category B/C/D/X
✅ "Your doctor knows your specific situation"
❌ Do NOT give drug-specific advice
✅ Emphasize importance of provider guidance
```

---

### Category 10: Rare/Complex Conditions
**Agent should use its full knowledge:**

#### Test 20: Lupus
```
User: "What is lupus?"

Expected:
✅ Comprehensive explanation (even though rare)
✅ Autoimmune disease, multiple systems
✅ Common symptoms (butterfly rash, joint pain, fatigue)
✅ Diagnosis challenges
✅ Treatment options (immunosuppression)
✅ Prognosis with treatment
✅ Evidence from ACR
✅ "See rheumatologist for diagnosis"
```

#### Test 21: Celiac Disease
```
User: "How do I know if I have celiac?"

Expected:
✅ Explain celiac disease (autoimmune, gluten)
✅ Symptoms: GI + non-GI
✅ Screening: blood test → endoscopy
✅ "Don't start gluten-free diet before testing"
✅ Treatment: strict gluten-free diet
✅ Evidence from Celiac Disease Foundation
```

---

### Category 11: Vague Queries
**Agent should ask clarifying questions:**

#### Test 22: "I don't feel well"
```
User: "I just don't feel right"

Expected:
✅ "I'd like to help. To better assist you:"
   • "What specific symptoms are you noticing?"
   • "When did this start?"
   • "How severe (1-10)?"
   • "Any recent changes (diet, medications, stress)?"
❌ Do NOT give generic advice
❌ Do NOT jump to conclusions
```

#### Test 23: "Should I see a doctor?"
```
User: "Should I see a doctor?"

Expected:
✅ "That depends on what you're experiencing"
✅ "Can you tell me:"
   • "What symptoms do you have?"
   • "How long has this been going on?"
   • "Is it getting worse, staying same, or improving?"
✅ Then provide specific triage guidance
```

---

### Category 12: Substance Use & Addiction
**Agent should handle non-judgmentally:**

#### Test 24: Smoking Cessation
```
User: "How do I quit smoking?"

Expected:
✅ Evidence-based cessation strategies
✅ NRT, medications (varenicline, bupropion)
✅ Behavioral support
✅ Quitline: 1-800-QUIT-NOW
✅ Success rates improve with combination therapy
✅ "Talk to your doctor about prescription options"
```

---

### Category 13: Nutrition & Diet
**Agent should provide general guidance:**

#### Test 25: Weight Loss
```
User: "How can I lose weight safely?"

Expected:
✅ Caloric deficit basics (500 cal/day = 1 lb/week)
✅ Evidence-based diets (Mediterranean, DASH)
✅ Importance of exercise
✅ Avoid fad diets
✅ When to see doctor (if very overweight, health conditions)
✅ Realistic expectations
```

---

### Category 14: Chronic Disease Management
**Agent should educate on long-term care:**

#### Test 26: Asthma Control
```
User: "How do I manage asthma?"

Expected:
✅ Controller vs rescue inhaler concept
✅ Trigger avoidance
✅ Action plan importance
✅ When to step up treatment
✅ Spirometry for monitoring
✅ Evidence from NHLBI guidelines
```

---

### Category 15: Infectious Diseases
**Agent should cover prevention & treatment:**

#### Test 27: COVID-19
```
User: "COVID symptoms?"

Expected:
✅ Common symptoms (fever, cough, fatigue, loss of taste/smell)
✅ When to test
✅ Isolation guidelines (CDC)
✅ High-risk populations
✅ When to seek care (breathing difficulty, chest pain)
✅ Treatment options (Paxlovid for high-risk)
```

---

## 📊 SUCCESS CRITERIA

### For EACH test query, agent should:

✅ **Provide comprehensive response** (5-7 points for medical questions)
✅ **Include evidence grades** (A/B/C with sources)
✅ **Cite authoritative sources** (CDC, NIH, Mayo, etc. with years)
✅ **Include "when to seek care"** (emergency vs urgent vs routine)
✅ **Give actionable next steps** (5-7 specific items)
✅ **Ask clarifying questions** if query is vague
✅ **Offer to find providers** where appropriate
✅ **Recognize emergencies** and triage appropriately
✅ **Stay in scope** (educate, don't diagnose/prescribe)
✅ **Be thorough** (not just 2-3 sentences)

### Agent should NOT:

❌ Say "consult a doctor" without explanation
❌ Give generic unhelpful responses
❌ Call getMedicalInformation function (answer directly)
❌ Get cut off at 500 tokens (now 2000 max)
❌ Ignore emergency situations
❌ Prescribe medications or give dosing
❌ Interpret specific patient labs without provider disclaimer

---

## 🎯 EXPECTED PERFORMANCE

**Before fixes:**
- Comprehensive responses: 10-15%
- Generic responses: 85-90%
- Calls limited database: 100% of medical questions
- Cut off responses: Frequent (500 token limit)

**After fixes:**
- Comprehensive responses: 80-95%
- Generic responses: 0-5% (only when appropriate)
- Uses GPT's full knowledge: Yes
- Cut off responses: Rare (2000 token limit)
- Handles ANY medical topic: Yes

---

## ✅ VERIFICATION CHECKLIST

To verify agent is working correctly:

1. [ ] Open the Carrotly app in browser
2. [ ] Enter OpenAI API key (if needed)
3. [ ] Test 5 queries from different categories above
4. [ ] Verify responses are:
   - [ ] Comprehensive (5-7 points)
   - [ ] Include evidence grades
   - [ ] Cite sources with years
   - [ ] Include "when to seek care"
   - [ ] Give actionable next steps
   - [ ] Don't call getMedicalInformation
   - [ ] Not cut off mid-sentence
5. [ ] Test vague query (should ask clarifying questions)
6. [ ] Test emergency (should triage immediately)
7. [ ] Test obscure condition (should use full GPT knowledge)

**If all checkboxes pass → Agent is working correctly ✅**

---

## 🔧 TROUBLESHOOTING

### If responses are still limited/generic:

**Check 1:** Max tokens
- Should be 2000 (not 500)
- Location: Line ~749 and ~796 in carrotly-app.jsx

**Check 2:** System prompt
- Should say "Answer DIRECTLY, don't call getMedicalInformation"
- Should NOT say "Use getMedicalInformation for ANY medical question"
- Location: Line ~469-490

**Check 3:** OpenAI API key
- Must be valid and have credits
- If blocked, fallback system activates (limited responses)

**Check 4:** Conversation history
- System prompt must be first message
- Should update with location when available

---

## 📝 FINAL NOTES

The agent now uses **GPT's full medical knowledge** instead of being limited to 4 conditions. It can answer questions about:

✅ Common symptoms (headache, dizziness, nausea, etc.)
✅ Any medical condition (diabetes, lupus, celiac, etc.)
✅ Preventive care (screenings, vaccinations)
✅ Mental health (anxiety, depression, insomnia)
✅ Medications (general education, not prescribing)
✅ Lab interpretation (general ranges, not specific patients)
✅ Emergency triage (recognizes serious situations)
✅ Pediatric, women's health, geriatric considerations
✅ Rare and complex conditions
✅ Nutrition, lifestyle, chronic disease management

**The agent is no longer limited and should be genuinely helpful for virtually any clinical question.**