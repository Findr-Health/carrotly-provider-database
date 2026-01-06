// Service Categories - synced with Flutter app and Admin Dashboard
export const SERVICE_CATEGORIES = [
  "Acute Care", "Assessment", "Chiropractic", "Chronic Care", "Coaching",
  "Compounding", "Consultation", "Cosmetic", "Diagnostic", "Emergency",
  "Evaluation", "Facials", "Group", "Holistic", "IV Therapy", "Immunizations",
  "Injectables", "Labs", "Laser", "Massage", "Mindfulness", "Minor Procedures",
  "Nutrition", "Personal Training", "Physical Therapy", "Pilates", "Preventive",
  "Psychiatry", "Rapid Tests", "Restorative", "Screenings", "Testing", "Therapy",
  "Urgent Care", "Vaccinations", "Virtual", "Wellness", "Yoga"
] as const;

// Provider Types - synced with Flutter app and backend enum
export const PROVIDER_TYPES = [
  { id: 'medical', name: 'Medical', icon: '🏥' },
  { id: 'urgent_care', name: 'Urgent Care', icon: '🚑' },
  { id: 'dental', name: 'Dental', icon: '🦷' },
  { id: 'mental_health', name: 'Mental Health', icon: '🧠' },
  { id: 'skincare', name: 'Skincare', icon: '✨' },
  { id: 'massage', name: 'Massage', icon: '💆' },
  { id: 'fitness', name: 'Fitness', icon: '💪' },
  { id: 'yoga', name: 'Yoga/Pilates', icon: '🧘' },
  { id: 'nutrition', name: 'Nutrition', icon: '🍎' },
  { id: 'pharmacy', name: 'Pharmacy/RX', icon: '💊' },
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
export type ProviderTypeId = typeof PROVIDER_TYPES[number]['id'];
