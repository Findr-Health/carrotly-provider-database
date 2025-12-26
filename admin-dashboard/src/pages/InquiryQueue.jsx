/**
 * InquiryQueue Page
 * Admin dashboard for managing user inquiries (provider outreach, international validation, consultations)
 */

import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function InquiryQueue() {
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Selected inquiry for detail view
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // Notes editing
  const [editingNotes, setEditingNotes] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, [typeFilter, statusFilter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '100');
      
      const response = await api.get(`/api/clarity-admin/inquiries?${params}`);
      setInquiries(response.data.inquiries);
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
      await api.patch(`/api/clarity-admin/inquiries/${id}/status`, { status: newStatus });
      fetchInquiries();
      if (selectedInquiry?._id === id) {
        setSelectedInquiry(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update status');
      console.error(err);
    }
  };

  const saveNotes = async (id) => {
    try {
      await api.put(`/api/clarity-admin/inquiries/${id}`, { adminNotes: editingNotes });
      fetchInquiries();
      setSelectedInquiry(prev => ({ ...prev, adminNotes: editingNotes }));
    } catch (err) {
      alert('Failed to save notes');
      console.error(err);
    }
  };

  const deleteInquiry = async (id) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    
    try {
      await api.delete(`/api/clarity-admin/inquiries/${id}`);
      fetchInquiries();
      setShowDetail(false);
      setSelectedInquiry(null);
    } catch (err) {
      alert('Failed to delete inquiry');
      console.error(err);
    }
  };

  const openDetail = (inquiry) => {
    setSelectedInquiry(inquiry);
    setEditingNotes(inquiry.adminNotes || '');
    setShowDetail(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      'provider_outreach': 'Provider Outreach',
      'international_validation': 'International Validation',
      'consultation': 'Consultation'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      'provider_outreach': 'bg-blue-100 text-blue-800',
      'international_validation': 'bg-purple-100 text-purple-800',
      'consultation': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'new': 'bg-red-100 text-red-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'declined': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inquiry Queue</h1>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">New</p>
            <p className="text-2xl font-bold text-red-600">{stats.new}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="provider_outreach">Provider Outreach</option>
          <option value="international_validation">International Validation</option>
          <option value="consultation">Consultation</option>
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="declined">Declined</option>
        </select>
        
        <button
          onClick={fetchInquiries}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
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
      
      {/* Inquiries List */}
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
            <tbody className="bg-white divide-y divide-gray-200">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No inquiries found
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(inquiry.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(inquiry.type)}`}>
                        {getTypeLabel(inquiry.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {inquiry.type === 'provider_outreach' && (
                          <>
                            <strong>{inquiry.providerName}</strong>
                            {inquiry.providerLocation && ` - ${inquiry.providerLocation}`}
                            {inquiry.serviceDiscussed && <p className="text-gray-500">{inquiry.serviceDiscussed}</p>}
                          </>
                        )}
                        {inquiry.type === 'international_validation' && (
                          <>
                            <strong>{inquiry.facilityName}</strong>
                            {inquiry.country && ` - ${inquiry.country}`}
                            {inquiry.userEmail && <p className="text-gray-500">{inquiry.userEmail}</p>}
                          </>
                        )}
                        {inquiry.type === 'consultation' && (
                          <>
                            <strong>{inquiry.userEmail || 'No email'}</strong>
                            {inquiry.billAmount && <span className="ml-2 text-green-600">${inquiry.billAmount.toLocaleString()}</span>}
                            {inquiry.issueSummary && <p className="text-gray-500 truncate max-w-xs">{inquiry.issueSummary}</p>}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inquiry.status)}`}>
                        {inquiry.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openDetail(inquiry)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        View
                      </button>
                      {inquiry.status === 'new' && (
                        <button
                          onClick={() => updateStatus(inquiry._id, 'in_progress')}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          Start
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Detail Modal */}
      {showDetail && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {getTypeLabel(selectedInquiry.type)}
                </h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) => updateStatus(selectedInquiry._id, e.target.value)}
                  className="px-3 py-2 border rounded-lg w-full"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              
              {/* Details based on type */}
              <div className="space-y-4 mb-6">
                {selectedInquiry.type === 'provider_outreach' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Provider</label>
                      <p className="text-gray-900">{selectedInquiry.providerName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-gray-900">{selectedInquiry.providerLocation || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Discussed</label>
                      <p className="text-gray-900">{selectedInquiry.serviceDiscussed || 'N/A'}</p>
                    </div>
                  </>
                )}
                
                {selectedInquiry.type === 'international_validation' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Facility</label>
                      <p className="text-gray-900">{selectedInquiry.facilityName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <p className="text-gray-900">{selectedInquiry.country || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Email</label>
                      <p className="text-gray-900">{selectedInquiry.userEmail || 'N/A'}</p>
                    </div>
                  </>
                )}
                
                {selectedInquiry.type === 'consultation' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Email</label>
                      <p className="text-gray-900">{selectedInquiry.userEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Phone</label>
                      <p className="text-gray-900">{selectedInquiry.userPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bill Amount</label>
                      <p className="text-gray-900">
                        {selectedInquiry.billAmount ? `$${selectedInquiry.billAmount.toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issue Summary</label>
                      <p className="text-gray-900">{selectedInquiry.issueSummary || 'N/A'}</p>
                    </div>
                  </>
                )}
                
                {/* Common fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Original Question</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedInquiry.originalQuestion || 'N/A'}
                  </p>
                </div>
                
                {selectedInquiry.conversationContext && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Conversation Context</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {selectedInquiry.conversationContext}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-900">{formatDate(selectedInquiry.createdAt)}</p>
                </div>
              </div>
              
              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about this inquiry..."
                />
                <button
                  onClick={() => saveNotes(selectedInquiry._id)}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Notes
                </button>
              </div>
              
              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={() => deleteInquiry(selectedInquiry._id)}
                  className="px-4 py-2 text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InquiryQueue;
