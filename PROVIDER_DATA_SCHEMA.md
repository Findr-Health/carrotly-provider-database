# Carrotly Provider Data Schema
## Comprehensive Information Requirements for Healthcare Marketplace

Based on analysis of successful marketplace apps (Fresha, Zocdoc, Healthgrades), here's the complete data structure needed for Carrotly providers.

---

## 📸 VISUAL ASSETS (Priority 1 - Currently Missing)

### Provider Photos (Minimum 3, Recommended 5-8)
```javascript
photos: {
  primary: {
    url: "https://...",
    alt: "Main provider photo",
    type: "exterior" // or "logo"
  },
  gallery: [
    {
      url: "https://...",
      alt: "Waiting room",
      type: "interior",
      order: 1
    },
    {
      url: "https://...",
      alt: "Examination room",
      type: "interior",
      order: 2
    },
    {
      url: "https://...",
      alt: "Dr. Sarah Johnson",
      type: "staff",
      staffId: "dr-johnson",
      order: 3
    },
    {
      url: "https://...",
      alt: "Reception desk",
      type: "interior",
      order: 4
    },
    {
      url: "https://...",
      alt: "Diagnostic equipment",
      type: "equipment",
      order: 5
    }
  ],
  logo: {
    url: "https://...",
    format: "png",
    size: "500x500"
  }
}
```

**Required Specifications:**
- Format: JPG or PNG
- Minimum resolution: 1200x800px
- Maximum file size: 5MB per image
- Professional quality (well-lit, in-focus)
- No watermarks or promotional text
- HIPAA compliant (no patient photos without consent)

---

## 🏥 BASIC INFORMATION

### Provider Identity
```javascript
{
  id: "prov_123456",
  name: "Midtown Family Medicine",
  legalName: "Midtown Family Medicine, PLLC",
  type: "private_practice", // or "hospital", "clinic", "group_practice"
  category: "Primary Care",
  subcategories: ["Family Medicine", "Preventive Care", "Chronic Disease Management"],
  
  // Contact
  contact: {
    phone: {
      main: "+1-555-123-4567",
      appointment: "+1-555-123-4568",
      afterHours: "+1-555-123-4569",
      fax: "+1-555-123-4570"
    },
    email: {
      general: "info@midtownfamily.com",
      appointments: "appointments@midtownfamily.com",
      billing: "billing@midtownfamily.com"
    },
    website: "https://www.midtownfamily.com",
    socialMedia: {
      facebook: "https://facebook.com/midtownfamily",
      instagram: "@midtownfamilymed",
      linkedin: null
    }
  },
  
  // Location
  location: {
    address: "456 Medical Plaza Drive",
    suite: "Suite 200",
    city: "Bozeman",
    state: "MT",
    zipCode: "59715",
    country: "USA",
    coordinates: {
      latitude: 45.6770,
      longitude: -111.0429
    },
    directions: "Located in the Medical Arts Building, 2nd floor. Entrance faces Main Street.",
    landmarks: "Next to Walgreens, across from Bozeman Health Hospital"
  },
  
  // Parking & Access
  access: {
    parking: {
      available: true,
      type: "Free parking lot with 50 spaces",
      handicapSpaces: 5,
      cost: "Free",
      instructions: "Park in lot B, use elevator to 2nd floor"
    },
    publicTransit: {
      available: true,
      routes: "Bus Route 5, stop at Medical Plaza",
      walkTime: "2 minutes from bus stop"
    },
    accessibility: {
      wheelchairAccessible: true,
      elevator: true,
      automaticDoors: true,
      accessibleRestrooms: true,
      brailleSignage: true,
      hearingLoop: false,
      notes: "Fully ADA compliant facility"
    }
  }
}
```

---

## 👨‍⚕️ STAFF & PROVIDERS

### Individual Provider Profiles
```javascript
staff: [
  {
    id: "dr_sarah_johnson",
    name: "Sarah Johnson",
    credentials: "MD, FAAFP",
    title: "Physician - Board Certified Family Medicine",
    
    photo: {
      url: "https://...",
      professionalHeadshot: true
    },
    
    about: "Dr. Johnson has been practicing family medicine for 15 years with a focus on women's health and preventive care. She believes in building long-term relationships with her patients and takes a holistic approach to healthcare.",
    
    education: [
      {
        degree: "Doctor of Medicine (MD)",
        institution: "University of Washington School of Medicine",
        year: 2008,
        location: "Seattle, WA"
      },
      {
        degree: "Bachelor of Science in Biology",
        institution: "Montana State University",
        year: 2004,
        location: "Bozeman, MT"
      }
    ],
    
    training: [
      {
        type: "Residency",
        specialty: "Family Medicine",
        institution: "Oregon Health & Science University",
        years: "2008-2011"
      }
    ],
    
    boardCertifications: [
      {
        board: "American Board of Family Medicine",
        certified: true,
        year: 2011,
        expires: 2027,
        recertifications: [2017, 2023]
      }
    ],
    
    licenses: [
      {
        type: "Medical License",
        state: "Montana",
        number: "MT-12345",
        status: "Active",
        issueDate: "2011-07-01",
        expirationDate: "2027-06-30",
        verified: true
      }
    ],
    
    specialties: [
      "Women's Health",
      "Preventive Medicine",
      "Chronic Disease Management",
      "Geriatric Care"
    ],
    
    clinicalInterests: [
      "Diabetes management",
      "Hypertension control",
      "Mental health integration",
      "LGBTQ+ health"
    ],
    
    languages: ["English", "Spanish (Conversational)"],
    
    experience: {
      years: 15,
      totalPatients: "2000+",
      visitCount: "25000+"
    },
    
    availability: {
      accepting: true,
      newPatients: true,
      schedule: {
        monday: { available: true, times: "8:00 AM - 5:00 PM" },
        tuesday: { available: true, times: "8:00 AM - 5:00 PM" },
        wednesday: { available: true, times: "8:00 AM - 5:00 PM" },
        thursday: { available: true, times: "8:00 AM - 5:00 PM" },
        friday: { available: true, times: "8:00 AM - 3:00 PM" },
        saturday: { available: false },
        sunday: { available: false }
      },
      averageWait: "5-7 days for new patients, 2-3 days established"
    },
    
    rating: {
      overall: 4.9,
      reviewCount: 342,
      breakdown: {
        communication: 5.0,
        bedside manner: 4.9,
        waitTime: 4.7,
        accuracy: 4.9
      }
    }
  },
  // Additional staff members...
]
```

---

## 🗓️ HOURS & AVAILABILITY

```javascript
hours: {
  regular: {
    monday: {
      open: "08:00",
      close: "17:00",
      breaks: [{ start: "12:00", end: "13:00", reason: "Lunch" }]
    },
    tuesday: { open: "08:00", close: "17:00" },
    wednesday: { open: "08:00", close: "17:00" },
    thursday: { open: "08:00", close: "17:00" },
    friday: { open: "08:00", close: "16:00" },
    saturday: { open: "09:00", close: "13:00", note: "Limited services" },
    sunday: { closed: true }
  },
  
  holidays: [
    { date: "2025-12-25", closed: true, reason: "Christmas Day" },
    { date: "2025-01-01", closed: true, reason: "New Year's Day" },
    { date: "2025-07-04", open: "09:00", close: "13:00", reason: "Independence Day - Half Day" }
  ],
  
  afterHours: {
    available: true,
    phone: "+1-555-123-4569",
    service: "Nurse advice line available 24/7",
    emergencyInstructions: "For life-threatening emergencies, call 911. For urgent medical questions after hours, call our 24/7 nurse line."
  },
  
  bookingWindow: {
    minAdvance: "1 hour", // Minimum time before appointment
    maxAdvance: "90 days", // How far out can book
    sameDayAvailable: true,
    walkInsAccepted: false
  }
}
```

---

## 💉 SERVICES CATALOG

```javascript
services: [
  {
    id: "service_001",
    name: "Annual Physical Exam (Well Visit)",
    category: "Preventive Care",
    
    description: "Comprehensive annual physical examination including vital signs, health risk assessment, review of systems, preventive screening recommendations, and wellness counseling. Includes age and gender-appropriate preventive services.",
    
    details: [
      "Complete medical history review",
      "Physical examination",
      "Blood pressure check",
      "BMI calculation",
      "Preventive screening recommendations",
      "Health risk assessment",
      "Vaccination review and updates",
      "Wellness counseling"
    ],
    
    duration: {
      typical: 45,
      range: { min: 30, max: 60 },
      unit: "minutes"
    },
    
    pricing: {
      cashPay: {
        newPatient: 200,
        established: 150
      },
      insurance: {
        covered: true,
        typicalCost: 0,
        note: "Preventive visits typically covered at 100% by insurance with no copay under ACA",
        plansThatCover: "Most insurance plans"
      },
      priceTransparency: {
        displayPrice: "$150-$200 cash-pay",
        insuranceNote: "Usually $0 with insurance (preventive care benefit)"
      }
    },
    
    requirements: {
      newPatient: true,
      established: true,
      referralRequired: false,
      authRequired: false,
      fasting: false,
      prepInstructions: "Please bring list of current medications and supplements"
    },
    
    ageRestrictions: {
      minimum: 18,
      maximum: null,
      note: "Adults 18 and older"
    },
    
    appointmentTypes: ["In-person"],
    
    availability: {
      sameDayAvailable: false,
      averageWait: "1-2 weeks"
    },
    
    tags: ["preventive", "routine", "wellness", "physical", "checkup", "annual"],
    
    relatedServices: ["service_002", "service_003"], // IDs of related services
    
    popular: true,
    featured: true
  },
  
  {
    id: "service_002",
    name: "Sick Visit (Acute Illness)",
    category: "Urgent Care",
    
    description: "Treatment for acute, non-emergency illnesses such as cold, flu, sore throat, ear infection, urinary tract infection, minor injuries, etc.",
    
    duration: { typical: 20, range: { min: 15, max: 30 }, unit: "minutes" },
    
    pricing: {
      cashPay: { base: 125 },
      insurance: {
        covered: true,
        typicalCopay: { min: 20, max: 50 },
        note: "Cost depends on your insurance plan and deductible"
      }
    },
    
    requirements: {
      referralRequired: false,
      sameDayAvailable: true
    },
    
    appointmentTypes: ["In-person", "Telehealth"],
    
    tags: ["sick visit", "acute", "illness", "urgent"]
  },
  
  {
    id: "service_003",
    name: "Chronic Disease Management",
    category: "Ongoing Care",
    
    description: "Follow-up care for chronic conditions such as diabetes, hypertension, high cholesterol, asthma, COPD, etc. Includes medication management, monitoring, and lifestyle counseling.",
    
    duration: { typical: 30, range: { min: 20, max: 45 }, unit: "minutes" },
    
    pricing: {
      cashPay: { base: 150 },
      insurance: {
        covered: true,
        typicalCopay: { min: 30, max: 75 }
      }
    },
    
    appointmentTypes: ["In-person", "Telehealth"],
    
    tags: ["chronic care", "diabetes", "hypertension", "follow-up"]
  },
  
  {
    id: "service_004",
    name: "Telehealth Video Visit",
    category: "Virtual Care",
    
    description: "Virtual doctor visit via secure video call for non-emergency conditions, medication refills, follow-ups, and consultations.",
    
    duration: { typical: 15, range: { min: 10, max: 30 }, unit: "minutes" },
    
    pricing: {
      cashPay: { base: 75 },
      insurance: {
        covered: true,
        typicalCopay: { min: 20, max: 50 },
        note: "Most insurance plans now cover telehealth"
      }
    },
    
    requirements: {
      technologyNeeded: ["Smartphone, tablet, or computer with camera", "Reliable internet connection"],
      platformNote: "Link provided upon booking"
    },
    
    appointmentTypes: ["Telehealth"],
    
    availability: {
      sameDayAvailable: true,
      eveningHours: true,
      weekendHours: true
    },
    
    tags: ["telehealth", "video visit", "virtual", "online"],
    popular: true
  }
]
```

---

## 💰 PRICING & PAYMENT

```javascript
pricing: {
  philosophy: "Transparent, upfront pricing for all services",
  
  cashPay: {
    discount: 20, // 20% discount for cash-pay patients
    discountReason: "No insurance billing overhead",
    priceGuarantee: "Price quoted is price charged - no surprise bills"
  },
  
  insurance: {
    accepted: [
      {
        name: "Blue Cross Blue Shield of Montana",
        plans: ["All plans"],
        inNetwork: true,
        credentialing: "verified"
      },
      {
        name: "Aetna",
        plans: ["PPO", "HMO", "EPO"],
        inNetwork: true
      },
      {
        name: "UnitedHealthcare",
        plans: ["All plans"],
        inNetwork: true
      },
      {
        name: "Cigna",
        plans: ["All plans"],
        inNetwork: false,
        note: "Out-of-network benefits may apply"
      },
      {
        name: "Medicare",
        accepted: true,
        medicareAdvantage: true
      },
      {
        name: "Medicaid",
        accepted: true,
        program: "Montana Medicaid"
      }
    ],
    
    verifyBenefits: true,
    verifyBeforeVisit: "We verify your insurance benefits before your appointment",
    
    estimateProcess: "Call us with your insurance info for a cost estimate before your visit"
  },
  
  paymentMethods: {
    accepted: ["Cash", "Check", "Credit Card", "Debit Card", "HSA", "FSA", "CareCredit"],
    online: true,
    phone: true,
    inPerson: true
  },
  
  paymentPlans: {
    available: true,
    minimumAmount: 500,
    terms: "Interest-free payment plans available for balances over $500",
    provider: "CareCredit"
  },
  
  billing: {
    selfPay: "Payment due at time of service",
    insurance: "We bill your insurance, you pay copay/deductible at visit",
    statementsent: "within 30 days of visit",
    questionsContact: "billing@midtownfamily.com or 555-123-4570"
  },
  
  policies: {
    noShow: {
      fee: 50,
      waived: "First time is warning only",
      policy: "$50 fee for no-shows or cancellations with less than 24 hours notice"
    },
    cancellation: {
      notice: "24 hours",
      fee: 0,
      policy: "Please provide 24 hours notice to avoid $50 fee"
    },
    lateness: {
      grace: 10,
      policy: "If more than 10 minutes late, may need to reschedule"
    }
  }
}
```

---

## ⭐ RATINGS & REVIEWS

```javascript
ratings: {
  overall: 4.8,
  totalReviews: 1247,
  
  breakdown: {
    5: 892, // 71.5%
    4: 267, // 21.4%
    3: 52,  // 4.2%
    2: 21,  // 1.7%
    1: 15   // 1.2%
  },
  
  categories: {
    provider: {
      expertise: 4.9,
      communication: 4.8,
      bedsidemanner: 4.9,
      timeSpent: 4.7
    },
    facility: {
      cleanliness: 4.9,
      comfort: 4.7,
      privacy: 4.8
    },
    office: {
      scheduling: 4.6,
      waitTime: 4.5,
      staff: 4.8,
      billing: 4.4
    }
  },
  
  recentReviews: [
    {
      id: "review_001",
      rating: 5,
      author: "Jane D.",
      verified: true,
      date: "2025-10-20",
      title: "Best doctor I've ever had!",
      text: "Dr. Johnson is thorough, caring, and really listens. She doesn't rush through appointments and takes time to explain everything. The office staff is friendly and efficient.",
      helpful: 23,
      providerResponse: {
        text: "Thank you for the kind words, Jane! We're so glad you're happy with your care.",
        date: "2025-10-21",
        respondent: "Office Manager"
      }
    }
  ],
  
  commonPraise: [
    "Caring and thorough",
    "Great communication",
    "Short wait times",
    "Friendly staff"
  ],
  
  commonComplaints: [
    "Parking can be difficult",
    "Sometimes hard to get appointments"
  ]
}
```

---

## 🏢 FACILITY INFORMATION

```javascript
facility: {
  type: "Medical Office Building",
  yearEstablished: 2010,
  squareFootage: 4500,
  
  features: {
    waitingArea: {
      seating: 20,
      amenities: ["Free WiFi", "Coffee", "Water", "Magazines", "TV", "Kids play area"],
      comfort: "Comfortable seating with natural lighting"
    },
    
    examRooms: {
      count: 8,
      private: true,
      equipped: ["Examination table", "Digital scale", "Blood pressure monitor", "EKG machine"]
    },
    
    onSite: {
      lab: true,
      labDetails: "Basic lab work (blood draw, urinalysis, strep tests, flu tests)",
      pharmacy: false,
      xray: false,
      ultrasound: false,
      procedureRoom: true,
      procedures: ["Minor procedures", "Sutures", "Biopsies", "Joint injections"]
    },
    
    technology: {
      ehr: "Epic MyChart",
      patientPortal: true,
      portalFeatures: ["View results", "Request refills", "Message provider", "Schedule appointments", "Pay bills"],
      telemedicine: true,
      telehealthPlatform: "Doxy.me (HIPAA compliant)"
    },
    
    safety: {
      covidProtocols: "Masks optional, sanitization stations available",
      emergencyEquipment: ["AED", "Emergency medical kit", "Oxygen"],
      securityCameras: true
    },
    
    comfort: {
      temperature: "Climate controlled",
      noise: "Quiet, professional atmosphere",
      privacy: "Private exam rooms with soundproofing"
    }
  },
  
  certifications: [
    "HIPAA Compliant",
    "OSHA Certified",
    "ADA Accessible",
    "Joint Commission Accredited"
  ]
}
```

---

## 👥 PATIENT DEMOGRAPHICS & SPECIALTIES

```javascript
demographics: {
  ageGroups: ["Adults (18+)", "Seniors (65+)"],
  noSeeChildren: "Pediatric patients referred to pediatricians",
  
  specialPopulations: [
    {
      group: "LGBTQ+",
      welcoming: true,
      training: "Staff trained in LGBTQ+ health and cultural competency",
      services: "Hormone therapy, PrEP, comprehensive care"
    },
    {
      group: "Veterans",
      experienced: true,
      note: "Experience with VA coordination and PTSD awareness"
    },
    {
      group: "Pregnant/Postpartum",
      services: "Prenatal care coordination, postpartum visits"
    },
    {
      group: "Spanish-speaking",
      services: "Spanish-speaking providers and staff available",
      interpreter: "Professional interpreter services for other languages"
    }
  ],
  
  languages: {
    fluent: ["English", "Spanish"],
    interpreterAvailable: ["All major languages via video/phone interpreter service"],
    signLanguage: "ASL interpreter available upon request (48 hours notice)"
  },
  
  culturalCompetencies: [
    "LGBTQ+ affirming care",
    "Trauma-informed care",
    "Cultural sensitivity training",
    "Implicit bias training"
  ]
}
```

---

## 🎯 QUALITY METRICS & OUTCOMES

```javascript
quality: {
  publicReporting: true,
  
  metrics: {
    patientSatisfaction: {
      score: 4.8,
      benchmark: "95th percentile nationally"
    },
    
    clinicalQuality: [
      {
        measure: "Diabetes Control (HbA1c <8%)",
        performance: "89%",
        benchmark: "National avg: 67%"
      },
      {
        measure: "Blood Pressure Control",
        performance: "82%",
        benchmark: "National avg: 64%"
      },
      {
        measure: "Preventive Screenings Up-to-Date",
        performance: "91%",
        benchmark: "National avg: 72%"
      }
    ],
    
    patientOutcomes: {
      hospitalReadmissions: "Below national average",
      emergencyRoomVisits: "25% below state average",
      preventableComplications: "Significantly below average"
    }
  },
  
  awards: [
    {
      name: "Top 10 Primary Care Practices in Montana",
      organization: "Montana Healthcare Association",
      year: 2024
    },
    {
      name: "Patient-Centered Medical Home (PCMH) Level 3",
      organization: "NCQA",
      year: 2023
    }
  ],
  
  affiliations: [
    "Bozeman Health Deaconess Hospital",
    "Montana State University Community Health Partners",
    "American Academy of Family Physicians"
  ]
}
```

---

## 📱 BOOKING & PATIENT EXPERIENCE

```javascript
booking: {
  methods: ["Online via Carrotly", "Phone", "Patient Portal"],
  
  onlineBooking: {
    enabled: true,
    realTime: true,
    confirmationMethod: ["Email", "SMS"],
    remindersSent: true,
    reminderTiming: ["24 hours before", "2 hours before"],
    
    newPatientForms: {
      available: true,
      completeBeforeVisit: true,
      url: "https://midtownfamily.com/forms",
      paperlessOption: true
    }
  },
  
  waitTimes: {
    newPatient: {
      average: "5-7 business days",
      urgent: "Same or next day for urgent issues"
    },
    established: {
      routine: "2-3 business days",
      urgent: "Same day"
    },
    walkIn: false
  },
  
  checkIn: {
    online: true,
    kiosk: true,
    traditional: true,
    earlyArrival: "Please arrive 10 minutes early for check-in"
  },
  
  waitingRoom: {
    averageWait: "10-15 minutes",
    textWhenReady: true,
    waitOutside: "Text us when you arrive and wait in car if preferred"
  },
  
  followUp: {
    automated: true,
    timing: "Within 1-3 days after visit",
    method: "Phone call or patient portal message",
    ensures: "Results received, questions answered, follow-up scheduled"
  }
}
```

---

## 🔒 COMPLIANCE & LEGAL

```javascript
compliance: {
  hipaa: {
    compliant: true,
    privacyOfficer: "Jane Smith, HIPAA Compliance Officer",
    breachHistory: "No breaches",
    patientRights: "https://midtownfamily.com/privacy"
  },
  
  insurance: {
    malpractice: {
      carrier: "The Doctors Company",
      coverage: "$1,000,000 per occurrence / $3,000,000 aggregate",
      expires: "2026-12-31",
      verified: true
    },
    
    generalLiability: {
      carrier: "State Farm",
      coverage: "$2,000,000",
      expires: "2026-06-30"
    }
  },
  
  licenses: {
    businessLicense: {
      number: "BZ-2024-1234",
      issuer: "City of Bozeman",
      expires: "2025-12-31",
      status: "Active"
    },
    
    dea: {
      number: "AB1234567",
      expires: "2026-08-31",
      verified: true
    }
  },
  
  accreditations: [
    {
      organization: "Joint Commission",
      type: "Ambulatory Care Accreditation",
      status: "Accredited",
      expires: "2026-12-31"
    },
    {
      organization: "NCQA",
      type: "Patient-Centered Medical Home (PCMH)",
      level: 3,
      expires: "2025-06-30"
    }
  ]
}
```

---

## 🎁 ADDITIONAL SERVICES & BENEFITS

```javascript
additional: {
  membershipPrograms: {
    available: false
    // Some practices offer monthly membership for uninsured
  },
  
  communityPrograms: {
    available: true,
    programs: [
      {
        name: "Free Blood Pressure Checks",
        schedule: "First Saturday of month, 9-11am",
        target: "Community members"
      },
      {
        name: "Senior Wellness Program",
        description: "Monthly educational seminars for seniors",
        cost: "Free"
      }
    ]
  },
  
  valueAddedServices: [
    "Same-day appointments for urgent needs",
    "24/7 nurse advice line",
    "Free parking",
    "Patient portal with 24/7 access",
    "Coordination with specialists",
    "Medication management",
    "Care coordination for complex needs"
  ],
  
  partnerships: [
    "Discount pharmacy program",
    "Home health services coordination",
    "Mental health integration"
  ]
}
```

---

## 📊 DATA COLLECTION PRIORITY

### Phase 1 - CRITICAL (Launch Blockers)
Must have before going live:
- [ ] Provider name, category, address
- [ ] At least 1 professional photo
- [ ] Phone number and email
- [ ] Operating hours
- [ ] At least 3 services with prices
- [ ] Payment methods accepted
- [ ] New patient acceptance status

### Phase 2 - HIGH PRIORITY (Week 1-2)
- [ ] 3-5 professional photos
- [ ] All services with detailed descriptions
- [ ] Staff profiles with photos
- [ ] Insurance accepted list
- [ ] Detailed pricing (cash vs insurance)
- [ ] Patient reviews/ratings
- [ ] Booking policies

### Phase 3 - MEDIUM PRIORITY (Month 1)
- [ ] Facility amenities
- [ ] Language services
- [ ] Accessibility features
- [ ] After-hours contact
- [ ] Quality metrics
- [ ] Patient demographics served

### Phase 4 - NICE TO HAVE (Ongoing)
- [ ] Awards and certifications
- [ ] Community programs
- [ ] Provider bios (education, training)
- [ ] Video tours
- [ ] Patient testimonials

---

## 📝 PROVIDER ONBOARDING FORM

**Minimum Required Fields:**
1. Practice/Provider Name *
2. Primary Category * (dropdown)
3. Street Address *
4. City, State, ZIP *
5. Phone Number *
6. Email *
7. Website (optional)
8. Primary Photo * (upload)
9. Hours of Operation * (at least Mon-Fri)
10. Do you accept new patients? * (Yes/No)
11. List 3-5 services with cash-pay prices *
12. Payment methods accepted *
13. Insurance plans accepted (or "Cash only")

**Recommended Fields:**
14. Additional 2-4 photos
15. Provider/Doctor profiles (name, credentials, photo)
16. Detailed service descriptions
17. Parking information
18. Accessibility features
19. Languages spoken
20. Online booking URL

---

This comprehensive schema ensures Carrotly can compete with established marketplace apps while maintaining our healthcare-specific focus.