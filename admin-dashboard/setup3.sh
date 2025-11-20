#!/bin/bash
echo "📊 Creating Dashboard - Setup 3/4 (Findr Health Branded)"

cat > src/components/Dashboard.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { providersAPI } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, byType: {}, byStatus: {}, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await providersAPI.getAll({ limit: 100 });
      const providers = data.providers;
      const byType = {}, byStatus = {};
      providers.forEach(p => {
        p.provider_types.forEach(type => byType[type] = (byType[type] || 0) + 1);
        byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      });
      setStats({ total: providers.length, byType, byStatus, recent: providers.slice(0, 5) });
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setLoading(false);
    }
  };

  const typeIcons = { 'Medical': '🏥', 'Dental': '🦷', 'Cosmetic': '✨', 'Fitness': '💪', 'Massage': '💆', 'Mental Health': '🧠', 'Skincare': '🧴' };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Provider management overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Providers', value: stats.total, icon: '👥', bgColor: 'bg-teal-50', textColor: 'text-teal-600' },
          { label: 'Approved', value: stats.byStatus.approved || 0, icon: '✅', bgColor: 'bg-green-50', textColor: 'text-green-600' },
          { label: 'Pending', value: stats.byStatus.pending || 0, icon: '⏳', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
          { label: 'Draft', value: stats.byStatus.draft || 0, icon: '📝', bgColor: 'bg-gray-50', textColor: 'text-gray-600' }
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Providers by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-teal-50 transition">
              <span className="text-2xl">{typeIcons[type] || '📋'}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{type}</p>
                <p className="text-lg font-bold text-teal-600">{count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Providers</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recent.map(provider => (
            <Link key={provider.id} to={`/providers/${provider.id}`} className="block px-6 py-4 hover:bg-teal-50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{provider.practice_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{provider.city}, {provider.state} • {provider.provider_types.join(', ')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  provider.status === 'approved' ? 'bg-green-100 text-green-800' :
                  provider.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {provider.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Link to="/providers" className="text-sm font-medium text-teal-600 hover:text-teal-700">View all providers →</Link>
        </div>
      </div>
    </div>
  );
}
EOF

echo "✅ Setup 3/4 complete! Run: bash setup4.sh"
