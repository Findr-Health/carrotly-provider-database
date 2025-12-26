/**
 * PriceDatabase Page
 * Admin dashboard for managing services, providers, and prices
 */

import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function PriceDatabase() {
  // Tab state
  const [activeTab, setActiveTab] = useState('services');
  
  // Data states
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'service', 'provider', 'price'
  const [editingItem, setEditingItem] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'services') {
        const res = await api.get('/api/clarity-admin/services?limit=100');
        setServices(res.data.services);
      } else if (activeTab === 'providers') {
        const res = await api.get('/api/clarity-admin/clarity-providers?limit=100');
        setProviders(res.data.providers);
      } else if (activeTab === 'prices') {
        // Fetch all for prices tab
        const [servicesRes, providersRes, pricesRes] = await Promise.all([
          api.get('/api/clarity-admin/services?limit=200'),
          api.get('/api/clarity-admin/clarity-providers?limit=200'),
          api.get('/api/clarity-admin/prices?limit=200')
        ]);
        setServices(servicesRes.data.services);
        setProviders(providersRes.data.providers);
        setPrices(pricesRes.data.prices);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for creating/editing
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    
    if (item) {
      setFormData({ ...item });
    } else {
      // Default values for new items
      if (type === 'service') {
        setFormData({
          name: '',
          category: 'Imaging',
          cptCodes: [],
          description: '',
          typicalPriceRange: { low: '', high: '' }
        });
      } else if (type === 'provider') {
        setFormData({
          name: '',
          type: 'Imaging Center',
          address: { city: '', state: '', country: 'US' },
          contact: { phone: '', website: '' },
          isInternational: false,
          isPartner: false
        });
      } else if (type === 'price') {
        setFormData({
          serviceId: '',
          providerId: '',
          cashPrice: '',
          priceSource: 'website',
          sourceUrl: '',
          verified: false
        });
      }
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  // Save item
  const saveItem = async () => {
    try {
      let endpoint = '';
      let data = { ...formData };
      
      if (modalType === 'service') {
        endpoint = '/api/clarity-admin/services';
        // Convert comma-separated CPT codes to array
        if (typeof data.cptCodes === 'string') {
          data.cptCodes = data.cptCodes.split(',').map(c => c.trim()).filter(Boolean);
        }
        // Convert price range to numbers
        if (data.typicalPriceRange) {
          data.typicalPriceRange.low = Number(data.typicalPriceRange.low) || 0;
          data.typicalPriceRange.high = Number(data.typicalPriceRange.high) || 0;
        }
      } else if (modalType === 'provider') {
        endpoint = '/api/clarity-admin/clarity-providers';
      } else if (modalType === 'price') {
        endpoint = '/api/clarity-admin/prices';
        data.cashPrice = Number(data.cashPrice);
      }
      
      if (editingItem) {
        await api.put(`${endpoint}/${editingItem._id}`, data);
      } else {
        await api.post(endpoint, data);
      }
      
      closeModal();
      fetchData();
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  // Delete item
  const deleteItem = async (type, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      let endpoint = '';
      if (type === 'service') endpoint = '/api/clarity-admin/services';
      else if (type === 'provider') endpoint = '/api/clarity-admin/clarity-providers';
      else if (type === 'price') endpoint = '/api/clarity-admin/prices';
      
      await api.delete(`${endpoint}/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete');
      console.error(err);
    }
  };

  // Filter by search
  const filterItems = (items, fields) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      fields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(term);
      })
    );
  };

  const categories = ['Imaging', 'Labs', 'Procedure', 'Dental', 'Vision', 'Preventive', 'Specialty', 'Other'];
  const providerTypes = ['Imaging Center', 'Lab', 'Surgery Center', 'Hospital', 'Clinic', 'Dental', 'Pharmacy', 'Other'];
  const priceSources = ['website', 'phone_call', 'user_report', 'price_list', 'other'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Price Database</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {['services', 'providers', 'prices'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
              className={`py-2 px-4 font-medium border-b-2 -mb-px capitalize ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Search + Add */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => openModal(activeTab.slice(0, -1))} // Remove 's' from tab name
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add {activeTab.slice(0, -1)}
        </button>
      </div>
      
      {/* Loading/Error */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}
      
      {/* Services Table */}
      {!loading && activeTab === 'services' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPT Codes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filterItems(services, ['name', 'category', 'cptCodes']).map(service => (
                <tr key={service._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{service.name}</td>
                  <td className="px-6 py-4 text-gray-500">{service.category}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {service.cptCodes?.join(', ') || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {service.typicalPriceRange?.low && service.typicalPriceRange?.high 
                      ? `$${service.typicalPriceRange.low} - $${service.typicalPriceRange.high}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => openModal('service', service)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteItem('service', service._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filterItems(services, ['name', 'category']).length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No services found. Add your first service!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Providers Table */}
      {!loading && activeTab === 'providers' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filterItems(providers, ['name', 'type', 'address.city', 'address.state']).map(provider => (
                <tr key={provider._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {provider.name}
                    {provider.isInternational && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                        Intl
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{provider.type}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {provider.address?.city && `${provider.address.city}, `}
                    {provider.address?.state}
                    {provider.address?.country !== 'US' && ` (${provider.address?.country})`}
                  </td>
                  <td className="px-6 py-4">
                    {provider.isPartner && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Partner
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => openModal('provider', provider)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteItem('provider', provider._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filterItems(providers, ['name', 'type']).length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No providers found. Add your first provider!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Prices Table */}
      {!loading && activeTab === 'prices' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cash Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {prices.map(price => (
                <tr key={price._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {price.serviceId?.name || 'Unknown Service'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {price.providerId?.name || 'Unknown Provider'}
                    {price.providerId?.address?.city && (
                      <span className="text-gray-400 text-sm ml-1">
                        ({price.providerId.address.city})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-green-600">
                    ${price.cashPrice?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {price.priceSource?.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4">
                    {price.verified ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">✓</span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => openModal('price', price)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteItem('price', price._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {prices.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No prices found. Add services and providers first, then add prices!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 capitalize">
                  {editingItem ? 'Edit' : 'Add'} {modalType}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              {/* Service Form */}
              {modalType === 'service' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="MRI Brain without contrast"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={formData.category || 'Imaging'}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPT Codes</label>
                    <input
                      type="text"
                      value={Array.isArray(formData.cptCodes) ? formData.cptCodes.join(', ') : formData.cptCodes || ''}
                      onChange={(e) => setFormData({...formData, cptCodes: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="70551, 70552"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated codes</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Low ($)</label>
                      <input
                        type="number"
                        value={formData.typicalPriceRange?.low || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          typicalPriceRange: {...formData.typicalPriceRange, low: e.target.value}
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price High ($)</label>
                      <input
                        type="number"
                        value={formData.typicalPriceRange?.high || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          typicalPriceRange: {...formData.typicalPriceRange, high: e.target.value}
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Provider Form */}
              {modalType === 'provider' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Valley Imaging Center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={formData.type || 'Imaging Center'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {providerTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.address?.city || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, city: e.target.value}
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.address?.state || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, state: e.target.value}
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="CA"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.address?.country || 'US'}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, country: e.target.value}
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="text"
                      value={formData.contact?.website || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contact: {...formData.contact, website: e.target.value}
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.contact?.phone || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contact: {...formData.contact, phone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isInternational || false}
                        onChange={(e) => setFormData({...formData, isInternational: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">International</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isPartner || false}
                        onChange={(e) => setFormData({...formData, isPartner: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Partner</span>
                    </label>
                  </div>
                </div>
              )}
              
              {/* Price Form */}
              {modalType === 'price' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                    <select
                      value={formData.serviceId?._id || formData.serviceId || ''}
                      onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a service</option>
                      {services.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.category})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
                    <select
                      value={formData.providerId?._id || formData.providerId || ''}
                      onChange={(e) => setFormData({...formData, providerId: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a provider</option>
                      {providers.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.address?.city && `(${p.address.city}, ${p.address.state})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cash Price ($) *</label>
                    <input
                      type="number"
                      value={formData.cashPrice || ''}
                      onChange={(e) => setFormData({...formData, cashPrice: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="350"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Source</label>
                    <select
                      value={formData.priceSource || 'website'}
                      onChange={(e) => setFormData({...formData, priceSource: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {priceSources.map(src => (
                        <option key={src} value={src}>{src.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
                    <input
                      type="text"
                      value={formData.sourceUrl || ''}
                      onChange={(e) => setFormData({...formData, sourceUrl: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.verified || false}
                      onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Verified</span>
                  </label>
                </div>
              )}
              
              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingItem ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PriceDatabase;
