import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function BookingHealthDashboard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const response = await api.get('/admin/bookings/stats');
      const stats = response.data || {};
      
      setHealth({
        pendingCount: stats.pending || 0,
        expiringSoonCount: 0,
        confirmedCount: stats.confirmed || 0,
        completedCount: stats.completed || 0,
        totalRevenue: stats.revenue || 0,
      });
    } catch (error) {
      console.error('Failed to load health:', error);
      setHealth({
        pendingCount: 0,
        expiringSoonCount: 0,
        confirmedCount: 0,
        completedCount: 0,
        totalRevenue: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded mb-6" />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-amber-900">{health?.pendingCount || 0}</div>
        <div className="text-sm text-amber-700">Pending Requests</div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-blue-900">{health?.confirmedCount || 0}</div>
        <div className="text-sm text-blue-700">Confirmed</div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-green-900">{health?.completedCount || 0}</div>
        <div className="text-sm text-green-700">Completed</div>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-purple-900">
          ${((health?.totalRevenue || 0) / 100).toLocaleString()}
        </div>
        <div className="text-sm text-purple-700">Revenue</div>
      </div>
    </div>
  );
}
