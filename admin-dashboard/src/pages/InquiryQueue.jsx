import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function InquiryQueue() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [stats, setStats] = useState({});
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ toEmail: '', providerName: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Manual follow-up
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ method: 'phone', notes: '', outcome: '' });

  useEffect(() => {
    fetchInquiries();
    fetchStats();
  }, [filter, sourceFilter, typeFilter]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/inquiries/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (sourceFilter !== 'all') params.append('source', sourceFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const response = await api.get(`/admin/inquiries?${params.toString()}`);
      setInquiries(response.data.inquiries || response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/inquiries/${id}/status`, { status });
      fetchInquiries();
      fetchStats();
      if (selectedInquiry?._id === id) {
        setSelectedInquiry(prev => ({ ...prev, status }));
      }
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const addFollowUp = async (id) => {
    if (!followUpForm.notes.trim()) {
      alert('Please add notes');
      return;
    }
    try {
      await api.post(`/admin/inquiries/${id}/followup`, followUpForm);
      setFollowUpForm({ method: 'phone', notes: '', outcome: '' });
      setShowAddFollowUp(false);
      // Refresh the selected inquiry
      const response = await api.get(`/admin/inquiries/${id}`);
      setSelectedInquiry(response.data);
      fetchInquiries();
    } catch (err) {
      alert('Failed to add follow-up: ' + err.message);
    }
  };

  const updateOutcome = async (id, outcome) => {
    try {
      await api.patch(`/admin/inquiries/${id}/outcome`, { outcome });
      fetchInquiries();
      fetchStats();
      if (selectedInquiry?._id === id) {
        setSelectedInquiry(prev => ({ ...prev, outcome, status: outcome === 'pending' ? 'in_progress' : 'closed' }));
      }
    } catch (err) {
      alert('Failed to update outcome: ' + err.message);
    }
  };

  const deleteInquiry = async (id) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await api.delete(`/admin/inquiries/${id}`);
      setSelectedInquiry(null);
      fetchInquiries();
      fetchStats();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  // Send provider invite email
  const sendProviderInvite = async () => {
    if (!emailForm.toEmail) {
      alert('Please enter a provider email address');
      return;
    }
    
    setSendingEmail(true);
    try {
      await api.post('/admin/email/provider-invite', {
        toEmail: emailForm.toEmail,
        providerName: emailForm.providerName,
        providerType: selectedInquiry?.requestedProviderType,
        city: selectedInquiry?.location?.city,
        state: selectedInquiry?.location?.state,
        inquiryId: selectedInquiry?._id
      });
      
      alert('✅ Provider invite sent successfully!');
      setShowEmailModal(false);
      setEmailForm({ toEmail: '', providerName: '' });
      
      // Refresh the selected inquiry to show the new follow-up
      const response = await api.get(`/admin/inquiries/${selectedInquiry._id}`);
      setSelectedInquiry(response.data);
      fetchInquiries();
    } catch (err) {
      alert('Failed to send email: ' + (err.response?.data?.details || err.message));
    } finally {
      setSendingEmail(false);
    }
  };

  // Test email configuration
  const testEmail = async () => {
    setSendingEmail(true);
    try {
      await api.post('/admin/email/test', {});
      alert('✅ Test email sent! Check providers@findrhealth.com');
    } catch (err) {
      alert('Email test failed: ' + (err.response?.data?.details || err.message));
    } finally {
      setSendingEmail(false);
    }
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-purple-100 text-purple-800',
    converted: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    spam: 'bg-red-100 text-red-800'
  };

  const sourceColors = {
    ai_chat: 'bg-indigo-100 text-indigo-800',
    app: 'bg-teal-100 text-teal-800',
    website: 'bg-blue-100 text-blue-800',
    manual: 'bg-gray-100 text-gray-800'
  };

  const methodIcons = {
    email: '✉️',
    phone: '📞',
    sms: '💬',
    in_app: '📱'
  };

  if (loading && inquiries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📬 Inquiry Queue</h1>
          <p className="text-gray-600 mt-1">Manage inquiries and provider outreach</p>
        </div>
        <button
          onClick={testEmail}
          disabled={sendingEmail}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
        >
          🧪 Test Email Config
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{stats.new || 0}</div>
          <div className="text-xs text-gray-600">New</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress || 0}</div>
          <div className="text-xs text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{stats.contacted || 0}</div>
          <div className="text-xs text-gray-600">Contacted</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
          <div className="text-2xl font-bold text-indigo-600">{stats.aiChat || 0}</div>
          <div className="text-xs text-gray-600">From AI Chat</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
          <div className="text-2xl font-bold text-teal-600">{stats.providerOutreach || 0}</div>
          <div className="text-xs text-gray-600">Provider Outreach</div>
        </div>
      </div>

      {/* Top Requested Types */}
      {stats.topRequestedTypes && stats.topRequestedTypes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">🔥 Top Requested Provider Types (No Coverage)</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topRequestedTypes.map((item, idx) => (
              <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                {item._id || 'Unknown'}: {item.count} requests
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Sources</option>
              <option value="ai_chat">🤖 AI Chat</option>
              <option value="app">📱 App</option>
              <option value="website">🌐 Website</option>
              <option value="manual">✍️ Manual</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="provider_outreach">🏥 Provider Outreach</option>
              <option value="general">💬 General</option>
              <option value="support">🆘 Support</option>
              <option value="feedback">📝 Feedback</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* Inquiries List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {inquiries.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-2 block">📭</span>
            <p className="text-gray-500">No inquiries found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {inquiries.map((inquiry) => (
              <div 
                key={inquiry._id} 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedInquiry(inquiry)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inquiry.status]}`}>
                        {inquiry.status?.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sourceColors[inquiry.source]}`}>
                        {inquiry.source === 'ai_chat' ? '🤖 AI Chat' : inquiry.source}
                      </span>
                    </div>

                    {inquiry.requestedProviderType && (
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        Looking for: <span className="text-teal-600">{inquiry.requestedProviderType}</span>
                      </div>
                    )}

                    {(inquiry.location?.city || inquiry.location?.state) && (
                      <div className="text-sm text-gray-600 mb-1">
                        📍 {inquiry.location.city}{inquiry.location.city && inquiry.location.state ? ', ' : ''}{inquiry.location.state}
                      </div>
                    )}

                    {inquiry.userMessage && (
                      <div className="text-sm text-gray-500 italic">
                        "{inquiry.userMessage.substring(0, 50)}{inquiry.userMessage.length > 50 ? '...' : ''}"
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(inquiry.createdAt).toLocaleDateString()} • {inquiry.followUps?.length || 0} follow-ups
                    </div>
                  </div>

                  {inquiry.type === 'provider_outreach' && inquiry.status !== 'closed' && (
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedInquiry(inquiry);
                        setShowEmailModal(true); 
                      }}
                      className="px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700"
                    >
                      ✉️ Send Invite
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Improved Detail Modal */}
      {selectedInquiry && !showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">📬</span>
                <h2 className="text-lg font-bold text-gray-900">Inquiry Details</h2>
              </div>
              <button
                onClick={() => { setSelectedInquiry(null); setShowAddFollowUp(false); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status badges & Send Invite */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedInquiry.status]}`}>
                    {selectedInquiry.status?.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${sourceColors[selectedInquiry.source]}`}>
                    {selectedInquiry.source === 'ai_chat' ? '🤖 AI Chat' : selectedInquiry.source}
                  </span>
                </div>
                {selectedInquiry.type === 'provider_outreach' && selectedInquiry.status !== 'closed' && (
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 flex items-center gap-2"
                  >
                    ✉️ Send Invite
                  </button>
                )}
              </div>

              {/* Request Details Box */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {selectedInquiry.requestedProviderType && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Looking for</div>
                    <div className="font-semibold text-teal-700">{selectedInquiry.requestedProviderType}</div>
                  </div>
                )}
                
                {(selectedInquiry.location?.city || selectedInquiry.location?.state) && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Location</div>
                    <div className="text-gray-900">
                      📍 {selectedInquiry.location.city}{selectedInquiry.location.city && selectedInquiry.location.state ? ', ' : ''}{selectedInquiry.location.state}
                    </div>
                  </div>
                )}
                
                {selectedInquiry.userMessage && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">User's Request</div>
                    <div className="text-gray-700 italic">"{selectedInquiry.userMessage}"</div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 pt-2 border-t">
                  Created: {new Date(selectedInquiry.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Outreach History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">📋 Outreach History</h3>
                  <span className="text-xs text-gray-500">{selectedInquiry.followUps?.length || 0} activities</span>
                </div>
                
                {selectedInquiry.followUps && selectedInquiry.followUps.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInquiry.followUps.map((fu, idx) => (
                      <div key={idx} className="bg-white border rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{methodIcons[fu.method] || '📝'}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-900 capitalize">{fu.method}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(fu.date).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{fu.notes}</div>
                            {fu.outcome && (
                              <div className="text-xs text-green-600 mt-1">✓ {fu.outcome}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-500 text-sm">
                    No outreach yet. Send an invite or add a follow-up.
                  </div>
                )}
                
                {/* Add Follow-up Button/Form */}
                {!showAddFollowUp ? (
                  <button
                    onClick={() => setShowAddFollowUp(true)}
                    className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-500 hover:text-teal-600 text-sm"
                  >
                    + Add Manual Follow-up
                  </button>
                ) : (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Add Follow-up</span>
                      <button onClick={() => setShowAddFollowUp(false)} className="text-gray-400 hover:text-gray-600">×</button>
                    </div>
                    <select
                      value={followUpForm.method}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, method: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="phone">📞 Phone Call</option>
                      <option value="email">✉️ Email (manual)</option>
                      <option value="sms">💬 SMS</option>
                      <option value="in_app">📱 In-App</option>
                    </select>
                    <textarea
                      value={followUpForm.notes}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                      placeholder="What happened? (e.g., Left voicemail, Spoke with office manager...)"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      rows={2}
                    />
                    <input
                      type="text"
                      value={followUpForm.outcome}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, outcome: e.target.value })}
                      placeholder="Outcome (optional)"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <button
                      onClick={() => addFollowUp(selectedInquiry._id)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Save Follow-up
                    </button>
                  </div>
                )}
              </div>

              {/* Set Outcome */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">🎯 Set Outcome</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateOutcome(selectedInquiry._id, 'provider_onboarded')}
                    className={`px-4 py-2 text-sm rounded-lg transition ${
                      selectedInquiry.outcome === 'provider_onboarded' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    ✓ Provider Onboarded
                  </button>
                  <button
                    onClick={() => updateOutcome(selectedInquiry._id, 'provider_declined')}
                    className={`px-4 py-2 text-sm rounded-lg transition ${
                      selectedInquiry.outcome === 'provider_declined' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    ✗ Declined
                  </button>
                  <button
                    onClick={() => updateOutcome(selectedInquiry._id, 'no_response')}
                    className={`px-4 py-2 text-sm rounded-lg transition ${
                      selectedInquiry.outcome === 'no_response' 
                        ? 'bg-gray-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No Response
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between">
              <button
                onClick={() => deleteInquiry(selectedInquiry._id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => { setSelectedInquiry(null); setShowAddFollowUp(false); }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">✉️ Send Provider Invite</h2>
                <button
                  onClick={() => { setShowEmailModal(false); setEmailForm({ toEmail: '', providerName: '' }); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Context */}
              <div className="bg-teal-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-teal-600">Searching for:</div>
                <div className="font-bold text-teal-800">{selectedInquiry.requestedProviderType || 'Healthcare Provider'}</div>
                <div className="text-sm text-teal-600 mt-1">
                  in {selectedInquiry.location?.city}{selectedInquiry.location?.city && selectedInquiry.location?.state ? ', ' : ''}{selectedInquiry.location?.state || 'Unknown location'}
                </div>
              </div>

              {/* Email Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={emailForm.toEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, toEmail: e.target.value })}
                    placeholder="provider@example.com"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider/Practice Name (optional)
                  </label>
                  <input
                    type="text"
                    value={emailForm.providerName}
                    onChange={(e) => setEmailForm({ ...emailForm, providerName: e.target.value })}
                    placeholder="Dr. Smith or Smith Family Practice"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <div className="text-gray-600 mb-1">📧 Email will include:</div>
                  <ul className="text-gray-500 text-xs space-y-1">
                    <li>• Patient demand in their area</li>
                    <li>• Benefits of joining Findr Health</li>
                    <li>• Link to providers.findrhealth.com</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { setShowEmailModal(false); setEmailForm({ toEmail: '', providerName: '' }); }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={sendProviderInvite}
                  disabled={sendingEmail || !emailForm.toEmail}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>✉️ Send Invite</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
