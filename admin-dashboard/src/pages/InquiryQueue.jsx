import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function InquiryQueue() {
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');

  useEffect(() => { fetchInquiries(); }, [typeFilter, statusFilter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '100');
      const response = await api.get('/clarity-admin/inquiries?' + params);
      setInquiries(response.data.inquiries || []);
      setStats(response.data.stats);
      setError(null);
    } catch (err) {
      setError('Failed to load inquiries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch('/clarity-admin/inquiries/' + id + '/status', { status: newStatus });
      fetchInquiries();
      if (selectedInquiry?._id === id) setSelectedInquiry(prev => ({ ...prev, status: newStatus }));
    } catch (err) { alert('Failed to update status'); }
  };

  const saveNotes = async (id) => {
    try {
      await api.put('/clarity-admin/inquiries/' + id, { adminNotes: editingNotes });
      fetchInquiries();
      setSelectedInquiry(prev => ({ ...prev, adminNotes: editingNotes }));
    } catch (err) { alert('Failed to save notes'); }
  };

  const deleteInquiry = async (id) => {
    if (!confirm('Delete this inquiry?')) return;
    try {
      await api.delete('/clarity-admin/inquiries/' + id);
      fetchInquiries();
      setShowDetail(false);
    } catch (err) { alert('Failed to delete'); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getTypeLabel = (t) => ({ provider_outreach: 'Provider Outreach', international_validation: 'International', consultation: 'Consultation' }[t] || t);
  const getTypeColor = (t) => ({ provider_outreach: 'bg-blue-100 text-blue-800', international_validation: 'bg-purple-100 text-purple-800', consultation: 'bg-orange-100 text-orange-800' }[t] || 'bg-gray-100');
  const getStatusColor = (s) => ({ new: 'bg-red-100 text-red-800', in_progress: 'bg-yellow-100 text-yellow-800', completed: 'bg-green-100 text-green-800', declined: 'bg-gray-100 text-gray-800' }[s] || 'bg-gray-100');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inquiry Queue</h1>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">New</p><p className="text-2xl font-bold text-red-600">{stats.new || 0}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">In Progress</p><p className="text-2xl font-bold text-yellow-600">{stats.inProgress || 0}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600">{stats.completed || 0}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p></div>
        </div>
      )}
      <div className="flex flex-wrap gap-4 mb-6">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">All Types</option>
          <option value="provider_outreach">Provider Outreach</option>
          <option value="international_validation">International</option>
          <option value="consultation">Consultation</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="declined">Declined</option>
        </select>
        <button onClick={fetchInquiries} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Refresh</button>
      </div>
      {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">{error}</div>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inquiries.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No inquiries found</td></tr>
              ) : inquiries.map((inq) => (
                <tr key={inq._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(inq.createdAt)}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(inq.type)}`}>{getTypeLabel(inq.type)}</span></td>
                  <td className="px-6 py-4 text-sm">{inq.providerName || inq.facilityName || inq.userEmail || '-'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inq.status)}`}>{inq.status}</span></td>
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => { setSelectedInquiry(inq); setEditingNotes(inq.adminNotes || ''); setShowDetail(true); }} className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                    {inq.status === 'new' && <button onClick={() => updateStatus(inq._id, 'in_progress')} className="text-yellow-600">Start</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showDetail && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{getTypeLabel(selectedInquiry.type)}</h2>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={selectedInquiry.status} onChange={(e) => updateStatus(selectedInquiry._id, e.target.value)} className="px-3 py-2 border rounded-lg w-full">
                <option value="new">New</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="declined">Declined</option>
              </select>
            </div>
            <div className="space-y-3 mb-4">
              <div><label className="text-sm font-medium text-gray-700">Original Question</label><p className="bg-gray-50 p-3 rounded">{selectedInquiry.originalQuestion || 'N/A'}</p></div>
              <div><label className="text-sm font-medium text-gray-700">Created</label><p>{formatDate(selectedInquiry.createdAt)}</p></div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Admin Notes</label>
              <textarea value={editingNotes} onChange={(e) => setEditingNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              <button onClick={() => saveNotes(selectedInquiry._id)} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">Save Notes</button>
            </div>
            <div className="flex justify-between pt-4 border-t">
              <button onClick={() => deleteInquiry(selectedInquiry._id)} className="text-red-600">Delete</button>
              <button onClick={() => setShowDetail(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InquiryQueue;
