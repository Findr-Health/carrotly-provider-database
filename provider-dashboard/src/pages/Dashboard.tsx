import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatsCards } from '../components/dashboard/StatsCards';
import { TodaysSchedule } from '../components/dashboard/TodaysSchedule';
import { TransactionUpdateModal } from '../components/transactions/TransactionUpdateModal';
import { Calendar } from './Calendar';
import { Services } from './Services';
import type { DashboardStats, Appointment } from '../types';

// Mock data
const mockStats: DashboardStats = {
  todayAppointments: 8,
  weekRevenue: 2450,
  pendingBookings: 12,
};

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientName: 'Jane Smith',
    patientId: 'p1',
    serviceName: 'Annual Physical',
    serviceId: 's1',
    scheduledFor: new Date(new Date().setHours(9, 0, 0, 0)),
    duration: 45,
    amount: 15000,
    status: 'scheduled',
    paymentStatus: 'authorized',
  },
  {
    id: '2',
    patientName: 'John Doe',
    patientId: 'p2',
    serviceName: 'Sick Visit',
    serviceId: 's2',
    scheduledFor: new Date(new Date().setHours(10, 30, 0, 0)),
    duration: 20,
    amount: 10000,
    status: 'scheduled',
    paymentStatus: 'authorized',
  },
  {
    id: '3',
    patientName: 'Sarah Johnson',
    patientId: 'p3',
    serviceName: 'Lab Work',
    serviceId: 's3',
    scheduledFor: new Date(new Date().setHours(14, 0, 0, 0)),
    duration: 15,
    amount: 5000,
    status: 'scheduled',
    paymentStatus: 'card_saved',
  },
];

export function Dashboard() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showServices, setShowServices] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => mockStats,
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['todays-appointments'],
    queryFn: async () => mockAppointments,
  });

  // Show Calendar view
  if (showCalendar) {
    return <Calendar onBack={() => setShowCalendar(false)} />;
  }

  // Show Services view
  if (showServices) {
    return <Services onBack={() => setShowServices(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/findr-logo.svg" 
                alt="Findr Health" 
                className="h-24 w-auto"
              />
              <h1 className="text-2xl font-bold text-gray-900">
                Provider Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">
                <span className="text-2xl">🔔</span>
              </button>
              <button className="text-gray-600 hover:text-gray-900">
                <span className="text-2xl">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mock Data Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            📌 <strong>Using Mock Data</strong> - Backend API not connected. Showing sample appointments for testing.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards 
          stats={stats || mockStats} 
          isLoading={statsLoading}
          onAppointmentsClick={() => setShowCalendar(true)}
          onAnalyticsClick={() => alert('Analytics coming soon!')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <TodaysSchedule
              appointments={appointments || []}
              isLoading={appointmentsLoading}
              onAppointmentClick={(appointment) => setSelectedAppointment(appointment)}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowServices(true)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition flex items-center space-x-3 border border-gray-200"
              >
                <span className="text-2xl">⚕️</span>
                <div>
                  <div className="font-medium text-gray-900">Manage Services</div>
                  <div className="text-sm text-gray-500">Update prices & offerings</div>
                </div>
              </button>

              <button
                onClick={() => setShowCalendar(true)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition flex items-center space-x-3 border border-gray-200"
              >
                <span className="text-2xl">📅</span>
                <div>
                  <div className="font-medium text-gray-900">View Calendar</div>
                  <div className="text-sm text-gray-500">See full schedule</div>
                </div>
              </button>

              <button
                onClick={() => alert('Block time coming soon!')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition flex items-center space-x-3 border border-gray-200"
              >
                <span className="text-2xl">🕒</span>
                <div>
                  <div className="font-medium text-gray-900">Block Time Off</div>
                  <div className="text-sm text-gray-500">Set unavailable hours</div>
                </div>
              </button>

              <button
                onClick={() => alert('Financials coming soon!')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition flex items-center space-x-3 border border-gray-200"
              >
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-medium text-gray-900">View Financials</div>
                  <div className="text-sm text-gray-500">Payouts & revenue</div>
                </div>
              </button>

              <button
                onClick={() => alert('Team members coming soon!')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition flex items-center space-x-3 border border-gray-200"
              >
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-medium text-gray-900">Team Members</div>
                  <div className="text-sm text-gray-500">Manage staff</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
              <span className="text-2xl">📅</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New booking from Jane Smith</p>
                <p className="text-xs text-gray-500">Tomorrow at 2:00 PM - Annual Physical</p>
              </div>
              <span className="text-xs text-gray-500">5 min ago</span>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
              <span className="text-2xl">💳</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Payment received: $150</p>
                <p className="text-xs text-gray-500">John Doe - Sick Visit</p>
              </div>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
              <span className="text-2xl">❌</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Cancellation</p>
                <p className="text-xs text-gray-500">Mike Johnson - Friday 10 AM (50% fee charged)</p>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Update Modal */}
      {selectedAppointment && (
        <TransactionUpdateModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onSave={(data) => {
            console.log('Saving transaction:', data);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}
