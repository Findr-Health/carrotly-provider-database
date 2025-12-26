import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function PriceDatabase() {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [
    'Imaging', 'Labs', 'Procedure', 'Dental', 'Vision', 'Preventive', 'Specialty',
    'Cosmetic', 'Fitness', 'Massage', 'Mental Health', 'Skincare', 'Wellness', 'Other'
  ];
  
  const subcategories = {
    'Imaging': ['MRI', 'CT', 'X-Ray', 'Ultrasound', 'Mammogram', 'DEXA', 'Other'],
    'Labs': ['Blood Panel', 'Hormone', 'STD', 'Vitamin', 'Diagnostic', 'Other'],
    'Procedure': ['Endoscopy', 'Surgery', 'Minor Procedure', 'Other'],
    'Dental': ['Preventive', 'Restorative', 'Cosmetic', 'Emergency', 'Orthodontics', 'Other'],
    'Vision': ['Exam', 'Correction', 'Surgery', 'Other'],
    'Cosmetic': ['Injectables', 'Skin Treatments', 'Laser', 'Body Contouring', 'Hair', 'Consultations', 'Other'],
    'Fitness': ['Personal Training', 'Assessment', 'Group Classes', 'Nutrition', 'Other'],
    'Massage': ['Therapeutic', 'Relaxation', 'Sports', 'Specialty', 'Other'],
    'Mental Health': ['Therapy', 'Counseling', 'Psychiatry', 'Group', 'Other'],
    'Skincare': ['Facials', 'Treatments', 'Peels', 'Other'],
    'Wellness': ['Checkup', 'Vaccination', 'Screening', 'Other'],
    'Preventive': ['Checkup', 'Screening', 'Vaccination', 'Other'],
    'Specialty': ['Cardiology', 'Orthopedics', 'Neurology', 'Other'],
    'Other': ['Other']
  };
  
  const providerTypes = ['Imaging Center', 'Lab', 'Surgery Center', 'Hospital', 'Clinic', 'Dental', 'Pharmacy', 'Other'];

  useEffect(() => {
    if (activeTab === 'services') fetchServices();
    else if (activeTab === 'providers') fetchProviders();
    else if (activeTab === 'prices') fetchPrices();
  }, [activeTab]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clarity-admin/services');
      setServices(response.data.services || []);
      setError(null);
    } catch (err) { setError('Failed to load services'); console.error(err); }
    finally { setLoading(false); }
  };

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clarity-admin/clarity-providers');
      setProviders(response.data.providers || []);
      setError(null);
    } catch (err) { setError('Failed to load providers'); console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clarity-admin/prices');
      setPrices(response.data.prices || []);
      setError(null);
    } catch (err) { setError('Failed to load prices'); console.error(err); }
    finally { setLoading(false); }
  };

  const saveService = async (data) => {
    try {
      if (editingItem) await api.put('/clarity-admin/services/' + editingItem._id, data);
      else await api.post('/clarity-admin/services', data);
      fetchServices(); setShowModal(false); setEditingItem(null);
    } catch (err) { alert('Failed to save'); }
  };

  const saveProvider = async (data) => {
    try {
      if (editingItem) await api.put('/clarity-admin/clarity-providers/' + editingItem._id, data);
      else await api.post('/clarity-admin/clarity-providers', data);
      fetchProviders(); setShowModal(false); setEditingItem(null);
    } catch (err) { alert('Failed to save'); }
  };

  const savePrice = async (data) => {
    try {
      if (editingItem) await api.put('/clarity-admin/prices/' + editingItem._id, data);
      else await api.post('/clarity-admin/prices', data);
      fetchPrices(); setShowModal(false); setEditingItem(null);
    } catch (err) { alert('Failed to save'); }
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      const endpoint = activeTab === 'services' ? '/clarity-admin/services/' : activeTab === 'providers' ? '/clarity-admin/clarity-providers/' : '/clarity-admin/prices/';
      await api.delete(endpoint + id);
      if (activeTab === 'services') fetchServices();
      else if (activeTab === 'providers') fetchProviders();
      else fetchPrices();
    } catch (err) { alert('Failed to delete'); }
  };

  // Filter services by search and category
  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Price Database</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Services</p>
          <p className="text-2xl font-bold text-blue-600">{services.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Providers</p>
          <p className="text-2xl font-bold text-purple-600">{providers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Prices</p>
          <p className="text-2xl font-bold text-green-600">{prices.length}</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        {['services', 'providers', 'prices'].map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); setCategoryFilter('all'); }} className={`px-4 py-2 font-medium capitalize ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>{tab}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 border rounded-lg flex-1 min-w-[200px]" />
        {activeTab === 'services' && (
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add {activeTab.slice(0, -1)}</button>
      </div>

      {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">{error}</div>}

      {/* Services Tab */}
      {!loading && !error && activeTab === 'services' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subcategory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredServices.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No services found</td></tr>
              ) : filteredServices.map((svc) => (
                <tr key={svc._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{svc.name}</div>
                    {svc.cptCodes?.length > 0 && <div className="text-xs text-gray-400">CPT: {svc.cptCodes.join(', ')}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(svc.category)}`}>
                      {svc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{svc.subcategory || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{svc.typicalDuration ? `${svc.typicalDuration} min` : '-'}</td>
                  <td className="px-6 py-4 text-sm">{svc.typicalPriceRange ? '$' + svc.typicalPriceRange.low + ' - $' + svc.typicalPriceRange.high : '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setEditingItem(svc); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button onClick={() => deleteItem(svc._id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Providers Tab */}
      {!loading && !error && activeTab === 'providers' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No providers found</td></tr>
              ) : filteredProviders.map((prov) => (
                <tr key={prov._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{prov.name}</div>
                    {prov.contact?.phone && <div className="text-xs text-gray-400">{prov.contact.phone}</div>}
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{prov.type}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {prov.address?.city}, {prov.address?.state}
                    {prov.isInternational && <span className="ml-2 text-xs text-orange-600">🌍 International</span>}
                  </td>
                  <td className="px-6 py-4">
                    {prov.isPartner ? <span className="text-green-600 font-medium">✓ Partner</span> : <span className="text-gray-400">Standard</span>}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setEditingItem(prov); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button onClick={() => deleteItem(prov._id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Prices Tab */}
      {!loading && !error && activeTab === 'prices' && (
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
              {prices.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No prices found</td></tr>
              ) : prices.map((price) => (
                <tr key={price._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{price.serviceId?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-400">{price.serviceId?.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{price.providerId?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-400">{price.providerId?.address?.city}, {price.providerId?.address?.state}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-green-600">${price.cashPrice?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{price.priceSource?.replace('_', ' ') || '-'}</td>
                  <td className="px-6 py-4">{price.verified ? <span className="text-green-600">✓</span> : <span className="text-gray-400">-</span>}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setEditingItem(price); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button onClick={() => deleteItem(price._id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          activeTab={activeTab}
          editingItem={editingItem}
          categories={categories}
          subcategories={subcategories}
          providerTypes={providerTypes}
          services={services}
          providers={providers}
          onSave={activeTab === 'services' ? saveService : activeTab === 'providers' ? saveProvider : savePrice}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          fetchServices={fetchServices}
          fetchProviders={fetchProviders}
        />
      )}
    </div>
  );
}

// Category color helper
function getCategoryColor(category) {
  const colors = {
    'Imaging': 'bg-blue-100 text-blue-800',
    'Labs': 'bg-green-100 text-green-800',
    'Procedure': 'bg-red-100 text-red-800',
    'Dental': 'bg-cyan-100 text-cyan-800',
    'Vision': 'bg-indigo-100 text-indigo-800',
    'Preventive': 'bg-emerald-100 text-emerald-800',
    'Specialty': 'bg-amber-100 text-amber-800',
    'Cosmetic': 'bg-pink-100 text-pink-800',
    'Fitness': 'bg-orange-100 text-orange-800',
    'Massage': 'bg-purple-100 text-purple-800',
    'Mental Health': 'bg-teal-100 text-teal-800',
    'Skincare': 'bg-rose-100 text-rose-800',
    'Wellness': 'bg-lime-100 text-lime-800',
    'Other': 'bg-gray-100 text-gray-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
}

// Modal Component
function Modal({ activeTab, editingItem, categories, subcategories, providerTypes, services, providers, onSave, onClose, fetchServices, fetchProviders }) {
  const [form, setForm] = useState(() => {
    if (activeTab === 'services') return {
      name: editingItem?.name || '',
      category: editingItem?.category || 'Other',
      subcategory: editingItem?.subcategory || 'Other',
      cptCodes: editingItem?.cptCodes?.join(', ') || '',
      description: editingItem?.description || '',
      typicalDuration: editingItem?.typicalDuration || '',
      priceLow: editingItem?.typicalPriceRange?.low || '',
      priceHigh: editingItem?.typicalPriceRange?.high || '',
      keywords: editingItem?.keywords?.join(', ') || ''
    };
    if (activeTab === 'providers') return {
      name: editingItem?.name || '',
      type: editingItem?.type || 'Other',
      city: editingItem?.address?.city || '',
      state: editingItem?.address?.state || '',
      zip: editingItem?.address?.zip || '',
      country: editingItem?.address?.country || 'US',
      phone: editingItem?.contact?.phone || '',
      website: editingItem?.contact?.website || '',
      isPartner: editingItem?.isPartner || false,
      isInternational: editingItem?.isInternational || false
    };
    return {
      serviceId: editingItem?.serviceId?._id || '',
      providerId: editingItem?.providerId?._id || '',
      cashPrice: editingItem?.cashPrice || '',
      priceSource: editingItem?.priceSource || 'website',
      verified: editingItem?.verified || false
    };
  });

  const [availableSubcategories, setAvailableSubcategories] = useState(
    subcategories[form.category] || ['Other']
  );

  useEffect(() => {
    if (activeTab === 'prices' && services.length === 0) fetchServices();
    if (activeTab === 'prices' && providers.length === 0) fetchProviders();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    if (activeTab === 'services') {
      setAvailableSubcategories(subcategories[form.category] || ['Other']);
      if (!subcategories[form.category]?.includes(form.subcategory)) {
        setForm(prev => ({ ...prev, subcategory: 'Other' }));
      }
    }
  }, [form.category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'services') {
      onSave({
        name: form.name,
        category: form.category,
        subcategory: form.subcategory,
        cptCodes: form.cptCodes.split(',').map(c => c.trim()).filter(c => c),
        description: form.description,
        typicalDuration: form.typicalDuration ? Number(form.typicalDuration) : undefined,
        typicalPriceRange: form.priceLow && form.priceHigh ? { low: Number(form.priceLow), high: Number(form.priceHigh) } : undefined,
        keywords: form.keywords.split(',').map(k => k.trim()).filter(k => k)
      });
    } else if (activeTab === 'providers') {
      onSave({
        name: form.name,
        type: form.type,
        address: { city: form.city, state: form.state, zip: form.zip, country: form.country },
        contact: { phone: form.phone, website: form.website },
        isPartner: form.isPartner,
        isInternational: form.isInternational
      });
    } else {
      onSave({
        serviceId: form.serviceId,
        providerId: form.providerId,
        cashPrice: Number(form.cashPrice),
        priceSource: form.priceSource,
        verified: form.verified
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {activeTab === 'services' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategory</label>
                  <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    {availableSubcategories.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CPT Codes (comma-separated)</label>
                <input type="text" value={form.cptCodes} onChange={(e) => setForm({ ...form, cptCodes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="70553, 70551" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Typical Duration (minutes)</label>
                <input type="number" value={form.typicalDuration} onChange={(e) => setForm({ ...form, typicalDuration: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price Low ($)</label>
                  <input type="number" value={form.priceLow} onChange={(e) => setForm({ ...form, priceLow: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price High ($)</label>
                  <input type="number" value={form.priceHigh} onChange={(e) => setForm({ ...form, priceHigh: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keywords (comma-separated)</label>
                <input type="text" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="mri, brain, scan" />
              </div>
            </>
          )}
          
          {activeTab === 'providers' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  {providerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP</label>
                  <input type="text" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input type="text" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center"><input type="checkbox" checked={form.isPartner} onChange={(e) => setForm({ ...form, isPartner: e.target.checked })} className="mr-2" />Partner</label>
                <label className="flex items-center"><input type="checkbox" checked={form.isInternational} onChange={(e) => setForm({ ...form, isInternational: e.target.checked })} className="mr-2" />International</label>
              </div>
            </>
          )}
          
          {activeTab === 'prices' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Service *</label>
                <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select service</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.name} ({s.category})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Provider *</label>
                <select value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select provider</option>
                  {providers.map(p => <option key={p._id} value={p._id}>{p.name} - {p.address?.city}, {p.address?.state}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cash Price ($) *</label>
                <input type="number" value={form.cashPrice} onChange={(e) => setForm({ ...form, cashPrice: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <select value={form.priceSource} onChange={(e) => setForm({ ...form, priceSource: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="website">Website</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="user_report">User Report</option>
                  <option value="price_list">Price List</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <label className="flex items-center"><input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="mr-2" />Verified</label>
            </>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PriceDatabase;
