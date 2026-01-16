import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import BookingHealthDashboard from './BookingHealthDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userStats, setUserStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 });
  const [reviewStats, setReviewStats] = useState({ total: 0, pending: 0, approved: 0, flagged: 0 });
  const [bookingStats, setBookingStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0 });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    byType: {}
  });
  const [recentProviders, setRecentProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const API_URL = 'https://fearless-achievement-production.up.railway.app/api';
      // Fetch users
      let users = [];
      try {
        const userResponse = await fetch(`${API_URL}/users`);
        const userData = await userResponse.json();
        users = userData.users || [];
      } catch (e) { console.log('No users yet'); }
      
      // Calculate user stats
      setUserStats({
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        pending: users.filter(u => u.status === 'pending').length,
        suspended: users.filter(u => u.status === 'suspended').length
      });

      // Fetch review stats
      try {
        const reviewResponse = await api.get('/admin/reviews/stats');
        setReviewStats(reviewResponse.data);
      } catch (e) { console.log('No review stats yet'); }

      // Fetch booking stats
      try {
        const bookingResponse = await api.get('/admin/bookings/stats');
        setBookingStats(bookingResponse.data);
      } catch (e) { console.log('No booking stats yet'); }

      // GET ALL PROVIDERS (limit: 1000)
      const { data } = await providersAPI.getAll({ limit: 1000 });
      const providers = data.providers || [];
      
      console.log('Dashboard loaded providers:', providers.length);
      
      // Calculate stats
      const stats = {
        total: providers.length,
        pending: providers.filter(p => p.status === 'pending').length,
        approved: providers.filter(p => p.status === 'approved').length,
        rejected: providers.filter(p => p.status === 'rejected').length,
        byType: {}
      };

      // Normalize providers for display
      const normalizedProviders = providers.map(p => ({
        _id: p._id,
        practice_name: p.practiceName || p.practice_name || 'Unnamed',
        city: p.address?.city || p.city || 'N/A',
        state: p.address?.state || p.state || 'N/A',
        provider_types: p.providerTypes || p.provider_types || [],
        status: p.status || 'pending'
      }));
      
      // Count by type
      normalizedProviders.forEach(p => {
        (p.provider_types || []).forEach(type => {
          const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
          stats.byType[normalized] = (stats.byType[normalized] || 0) + 1;
        });
      });

      setStats(stats);
      // Show last 5 providers
      setRecentProviders(normalizedProviders.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      
      // If 401, token expired - logout
      if (error.response?.status === 401) {
        logout();
        navigate('/');
      } else {
        setError(error.response?.data?.error || error.message);
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>


      {/* Booking Health Dashboard */}
      <BookingHealthDashboard />
      {/* Provider Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md" onClick={() => navigate('/providers')}>
          <div className="text-sm font-medium text-gray-500">Total Providers</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Pending Review</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Approved</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{stats.approved}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Rejected</div>
          <div className="mt-2 text-3xl font-bold text-red-600">{stats.rejected}</div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md" onClick={() => navigate('/users')}>
          <div className="text-sm font-medium text-gray-500">Total Users</div>
          <div className="mt-2 text-3xl font-bold text-purple-600">{userStats.total}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Active Users</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{userStats.active}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Pending Users</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">{userStats.pending}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Suspended Users</div>
          <div className="mt-2 text-3xl font-bold text-red-600">{userStats.suspended}</div>
        </div>
      </div>

      {/* Reviews & Bookings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reviews Widget */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">⭐ Reviews</h2>
            <button
              onClick={() => navigate('/reviews')}
              className="text-teal-600 hover:text-teal-700 font-medium text-sm"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{reviewStats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{reviewStats.pending}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reviewStats.approved}</div>
              <div className="text-xs text-gray-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{reviewStats.flagged}</div>
              <div className="text-xs text-gray-500">Flagged</div>
            </div>
          </div>
        </div>

        {/* Bookings Widget */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">📅 Bookings</h2>
            <button
              onClick={() => navigate('/bookings')}
              className="text-teal-600 hover:text-teal-700 font-medium text-sm"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{bookingStats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{bookingStats.confirmed}</div>
              <div className="text-xs text-gray-500">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{bookingStats.completed}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{bookingStats.cancelled}</div>
              <div className="text-xs text-gray-500">Cancelled</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Revenue</span>
              <span className="text-xl font-bold text-green-600">${bookingStats.revenue?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Types */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Providers by Type</h2>
        {Object.keys(stats.byType).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">{count}</div>
                <div className="text-sm text-gray-600">{type}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No providers yet</p>
        )}
      </div>

      {/* Recent Providers */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Providers</h2>
          <button
            onClick={() => navigate('/providers')}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            View All →
          </button>
        </div>
        
        {recentProviders.length > 0 ? (
          <div className="space-y-3">
            {recentProviders.map(provider => (
              <div
                key={provider._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/providers/${provider._id}`)}
              >
                <div>
                  <div className="font-medium text-gray-900">{provider.practice_name}</div>
                  <div className="text-sm text-gray-500">
                    {provider.city}, {provider.state} • {(provider.provider_types || []).join(', ')}
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  provider.status === 'approved' ? 'bg-green-100 text-green-800' :
                  provider.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {provider.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No providers yet</p>
        )}
      </div>
    </div>
  );
}