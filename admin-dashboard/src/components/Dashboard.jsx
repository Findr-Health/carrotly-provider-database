import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userStats, setUserStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 });
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
        users = await userResponse.json();
      } catch (e) { console.log('No users yet'); }
      
      // Calculate user stats
      setUserStats({
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        pending: users.filter(u => u.status === 'pending').length,
        suspended: users.filter(u => u.status === 'suspended').length
      });

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
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
