import React from 'react';
import type { DashboardStats } from '../../types';

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
  onAppointmentsClick?: () => void;
  onAnalyticsClick?: () => void;
}

export function StatsCards({ 
  stats, 
  isLoading,
  onAppointmentsClick,
  onAnalyticsClick 
}: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Appointments Card - Clickable */}
      <div
        onClick={onAppointmentsClick}
        className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-teal-400 transition-all"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">📅</div>
          <div className="text-3xl font-bold text-gray-900">{stats.todayAppointments}</div>
          <div className="text-sm text-gray-600 mt-1">Appointments</div>
          <div className="text-xs text-teal-600 mt-2 font-medium">
            Click to view calendar →
          </div>
        </div>
      </div>

      {/* Analytics Card - Clickable */}
      <div
        onClick={onAnalyticsClick}
        className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-teal-400 transition-all"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-3xl font-bold text-gray-900">Analytics</div>
          <div className="text-sm text-gray-600 mt-1">View Reports & Insights</div>
          <div className="text-xs text-teal-600 mt-2 font-medium">
            Click to view analytics →
          </div>
        </div>
      </div>
    </div>
  );
}
