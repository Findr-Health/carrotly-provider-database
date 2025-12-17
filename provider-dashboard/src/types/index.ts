export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description?: string;
  active: boolean;
  bookingsLast30Days: number;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  serviceName: string;
  serviceId: string;
  scheduledFor: Date;
  duration: number;
  amount: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  paymentStatus: 'card_saved' | 'authorized' | 'captured' | 'succeeded';
}

export interface DashboardStats {
  todayAppointments: number;
  weekRevenue: number;
  pendingBookings: number;
}

export interface QuickService {
  name: string;
  price: number;
}

export interface AddedService {
  name: string;
  price: number;
}
