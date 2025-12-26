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

  const categories = ['Imaging', 'Labs', 'Procedure', 'Dental', 'Vision', 'Preventive', 'Specialty', 'Other'];
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Price Database</h1>
      
      <div className="flex border-b mb-6">
        {['services', 'providers', 'prices'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium capitalize ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>{tab}</button>
        ))}
      </div>

      <div className="flex justify-between mb-6">
        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 border rounded-lg w-64" />
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add {activeTab.slice(0, -1)}</button>
      </div>

      {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">{error}</div>}

      {!loading && !error && activeTab === 'services' && (
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
              {services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No services found</td></tr>
              ) : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((svc) => (
                <tr key={svc._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{svc.name}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{svc.category}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{svc.cptCodes?.join(', ') || '-'}</td>
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

      {!loading && !error && activeTab === 'providers' && (
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
              {providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No providers found</td></tr>
              ) : providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((prov) => (
                <tr key={prov._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{prov.name}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{prov.type}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{prov.address?.city}, {prov.address?.state}</td>
                  <td className="px-6 py-4">{prov.isPartner ? <span className="text-green-600">✓</span> : '-'}</td>
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

      {!loading && !error && activeTab === 'prices' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cash Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {prices.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No prices found</td></tr>
              ) : prices.map((price) => (
                <tr key={price._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{price.serviceId?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm">{price.providerId?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 font-medium text-green-600">${price.cashPrice?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{price.priceSource || '-'}</td>
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

      {showModal && (
        <Modal
          activeTab={activeTab}
          editingItem={editingItem}
          categories={categories}
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

function Modal({ activeTab, editingItem, categories, providerTypes, services, providers, onSave, onClose, fetchServices, fetchProviders }) {
  const [form, setForm] = useState(() => {
    if (activeTab === 'services') return { name: editingItem?.name || '', category: editingItem?.category || 'Other', cptCodes: editingItem?.cptCodes?.join(', ') || '', description: editingItem?.description || '', priceLow: editingItem?.typicalPriceRange?.low || '', priceHigh: editingItem?.typicalPriceRange?.high || '' };
    if (activeTab === 'providers') return { name: editingItem?.name || '', type: editingItem?.type || 'Other', city: editingItem?.address?.city || '', state: editingItem?.address?.state || '', zip: editingItem?.address?.zip || '', phone: editingItem?.contact?.phone || '', website: editingItem?.contact?.website || '', isPartner: editingItem?.isPartner || false };
    return { serviceId: editingItem?.serviceId?._id || '', providerId: editingItem?.providerId?._id || '', cashPrice: editingItem?.cashPrice || '', priceSource: editingItem?.priceSource || 'website', verified: editingItem?.verified || false };
  });

  useEffect(() => {
    if (activeTab === 'prices' && services.length === 0) fetchServices();
    if (activeTab === 'prices' && providers.length === 0) fetchProviders();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'services') {
      onSave({ name: form.name, category: form.category, cptCodes: form.cptCodes.split(',').map(c => c.trim()).filter(c => c), description: form.description, typicalPriceRange: form.priceLow && form.priceHigh ? { low: Number(form.priceLow), high: Number(form.priceHigh) } : undefined });
    } else if (activeTab === 'providers') {
      onSave({ name: form.name, type: form.type, address: { city: form.city, state: form.state, zip: form.zip }, contact: { phone: form.phone, website: form.website }, isPartner: form.isPartner });
    } else {
      onSave({ serviceId: form.serviceId, providerId: form.providerId, cashPrice: Number(form.cashPrice), priceSource: form.priceSource, verified: form.verified });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'services' && (
            <>
              <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">CPT Codes (comma-separated)</label><input type="text" value={form.cptCodes} onChange={(e) => setForm({ ...form, cptCodes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Price Low ($)</label><input type="number" value={form.priceLow} onChange={(e) => setForm({ ...form, priceLow: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Price High ($)</label><input type="number" value={form.priceHigh} onChange={(e) => setForm({ ...form, priceHigh: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
            </>
          )}
          {activeTab === 'providers' && (
            <>
              <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">{providerTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">City</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">State</label><input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <label className="flex items-center"><input type="checkbox" checked={form.isPartner} onChange={(e) => setForm({ ...form, isPartner: e.target.checked })} className="mr-2" />Partner</label>
            </>
          )}
          {activeTab === 'prices' && (
            <>
              <div><label className="block text-sm font-medium mb-1">Service *</label><select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required><option value="">Select service</option>{services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Provider *</label><select value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required><option value="">Select provider</option>{providers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Cash Price ($) *</label><input type="number" value={form.cashPrice} onChange={(e) => setForm({ ...form, cashPrice: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Source</label><select value={form.priceSource} onChange={(e) => setForm({ ...form, priceSource: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="website">Website</option><option value="phone_call">Phone Call</option><option value="user_report">User Report</option><option value="price_list">Price List</option></select></div>
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
