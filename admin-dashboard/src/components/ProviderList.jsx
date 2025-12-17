import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providersAPI } from '../utils/api';

export default function ProviderList() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      console.log('Raw API Response:', data);
      
      // CORRECT FIELD MAPPING - backend uses camelCase!
      const normalized = data.providers.map(p => ({
        _id: p._id,
        // Try camelCase FIRST (backend format), then snake_case (frontend format)
        practice_name: p.practiceName || p.practice_name || p.contactInfo?.practiceName || 'Unnamed',
        phone: p.contactInfo?.phone || p.phone || 'No phone',
        email: p.contactInfo?.email || p.email || 'No email',
        city: p.address?.city || p.city || 'N/A',
        state: p.address?.state || p.state || 'N/A',
        provider_types: p.providerTypes || p.provider_types || [],
        status: p.status || 'pending',
        raw: p
      }));
      
      console.log('Normalized first provider:', normalized[0]);
      setProviders(normalized);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load providers:', error);
      setError(error.response?.data?.error || error.message);
      setLoading(false);
    }
  };

  const cities = [...new Set(
    providers.map(p => p.city).filter(Boolean)
  )].sort();
  
  const types = [...new Set(
    providers
      .flatMap(p => p.provider_types)
      .filter(Boolean)
      .map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
  )].sort();

  const filtered = providers.filter(p => {
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        p.practice_name.toLowerCase().includes(searchLower) ||
        p.phone.includes(search) ||
        p.email.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (locationFilter !== 'all' && p.city !== locationFilter) return false;
    
    if (typeFilter !== 'all') {
      const hasType = p.provider_types.some(t => 
        t.toLowerCase() === typeFilter.toLowerCase()
      );
      if (!hasType) return false;
    }
    
    return true;
  });

  console.log('Filter stats:', {
    total: providers.length,
    filtered: filtered.length,
    search,
    statusFilter,
    locationFilter,
    typeFilter
  });

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
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Providers</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadProviders}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Providers ({providers.length})
          {filtered.length !== providers.length && (
            <span className="text-lg text-gray-500 ml-2">({filtered.length} shown)</span>
          )}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Cities ({cities.length})</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Types ({types.length})</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(provider => (
              <tr 
                key={provider._id} 
                className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => navigate(`/providers/${provider._id}`)}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{provider.practice_name}</div>
                  <div className="text-sm text-gray-500">{provider.phone}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {provider.provider_types.join(', ')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {provider.city}, {provider.state}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    provider.status === 'approved' ? 'bg-green-100 text-green-800' :
                    provider.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {provider.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/providers/${provider._id}`);
                    }}
                    className="text-teal-600 hover:text-teal-900 font-medium"
                  >
                    View Details →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filtered.length === 0 && providers.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No providers found</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setLocationFilter('all');
                setTypeFilter('all');
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
