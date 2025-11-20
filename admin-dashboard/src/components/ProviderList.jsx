import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providersAPI } from '../utils/api';

export default function ProviderList() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const { data } = await providersAPI.getAll({ limit: 100 });
      setProviders(data.providers);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load providers:', error);
      setLoading(false);
    }
  };

  // Get unique cities and types for filters (FIXED: normalize case)
  const cities = [...new Set(providers.map(p => p.city))].sort();
  const types = [...new Set(
    providers.flatMap(p => 
      p.provider_types.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    )
  )].sort();

  const filtered = providers.filter(p => {
    const matchesSearch = p.practice_name.toLowerCase().includes(search.toLowerCase()) ||
                          p.phone.includes(search) ||
                          p.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || p.city === locationFilter;
    
    // FIXED: Case-insensitive type matching
    const matchesType = typeFilter === 'all' || 
      p.provider_types.some(t => t.toLowerCase() === typeFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesLocation && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Providers</h1>
          <p className="text-gray-600 mt-1">{filtered.length} providers found</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          >
            <option value="all">All Locations</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          >
            <option value="all">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {(search || statusFilter !== 'all' || locationFilter !== 'all' || typeFilter !== 'all') && (
          <div className="mt-3 flex flex-wrap gap-2">
            {search && (
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full flex items-center gap-1">
                Search: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-teal-900">×</button>
              </span>
            )}
            {locationFilter !== 'all' && (
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full flex items-center gap-1">
                Location: {locationFilter}
                <button onClick={() => setLocationFilter('all')} className="hover:text-teal-900">×</button>
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full flex items-center gap-1">
                Type: {typeFilter}
                <button onClick={() => setTypeFilter('all')} className="hover:text-teal-900">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full flex items-center gap-1">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="hover:text-teal-900">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setLocationFilter('all');
                setTypeFilter('all');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map(provider => (
              <tr
                key={provider.id}
                onClick={() => navigate(`/providers/${provider.id}`)}
                className="hover:bg-teal-50 transition cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{provider.practice_name}</div>
                  <div className="text-sm text-gray-500">{provider.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {provider.city}, {provider.state}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {provider.provider_types.join(', ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    provider.status === 'approved' ? 'bg-green-100 text-green-800' :
                    provider.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {provider.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No providers found matching your filters.</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setLocationFilter('all');
                setTypeFilter('all');
              }}
              className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
