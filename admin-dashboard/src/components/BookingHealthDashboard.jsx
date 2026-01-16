import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';

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
      // For now, calculate from bookings list
      const response = await adminAPI.getBookings({ status: 'pending_confirmation' });
      const pendingBookings = response.data?.bookings || [];
      
      const now = new Date();
      const expiringSoon = pendingBookings.filter(b => {
        if (!b.confirmation?.expiresAt) return false;
        const expires = new Date(b.confirmation.expiresAt);
        return (expires - now) < 4 * 60 * 60 * 1000; // 4 hours
      });
      
      setHealth({
        pendingCount: pendingBookings.length,
        expiringSoonCount: expiringSoon.length,
        confirmationRate: 0.85, // Placeholder
        avgResponseTimeMinutes: 120, // Placeholder
        activeHoldsAmount: 0, // Placeholder
        activeHoldsCount: 0, // Placeholder
      });
    } catch (error) {
      console.error('Failed to load booking health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded" />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-amber-900">{health?.pendingCount || 0}</div>
        <div className="text-sm text-amber-700">Pending Requests</div>
        {(health?.expiringSoonCount || 0) > 0 && (
          <div className="text-xs text-red-600 mt-1">
            ⚠️ {health?.expiringSoonCount} expiring soon
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-green-900">
          {((health?.confirmationRate || 0) * 100).toFixed(0)}%
        </div>
        <div className="text-sm text-green-700">Confirmation Rate</div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-blue-900">
          {health?.avgResponseTimeMinutes ? `${Math.round(health.avgResponseTimeMinutes / 60)}h` : 'N/A'}
        </div>
        <div className="text-sm text-blue-700">Avg Response Time</div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-purple-900">
          ${((health?.activeHoldsAmount || 0) / 100).toLocaleString()}
        </div>
        <div className="text-sm text-purple-700">
          Active Holds ({health?.activeHoldsCount || 0})
        </div>
      </div>
    </div>
  );
}
