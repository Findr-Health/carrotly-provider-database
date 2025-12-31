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
  const [followUpForm, setFollowUpForm] = useState({ method: 'email', notes: '', outcome: '' });
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ toEmail: '', providerName: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

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
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const addFollowUp = async (id) => {
    try {
      await api.post(`/admin/inquiries/${id}/followup`, followUpForm);
      setFollowUpForm({ method: 'email', notes: '', outcome: '' });
      setSelectedInquiry(null);
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
      fetchInquiries(); // Refresh to show follow-up
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
      alert('✅ Test email sent! Check findrhealth@gmail.com');
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

  const typeIcons = {
    provider_outreach: '🏥',
    general: '💬',
    support: '🆘',
    feedback: '📝',
    partnership: '🤝'
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📬 Inquiry Queue
          </h1>
          <p className="text-gray-600 mt-1">Manage inquiries and provider outreach requests</p>
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
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{typeIcons[inquiry.type] || '📋'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inquiry.status]}`}>
                        {inquiry.status?.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sourceColors[inquiry.source]}`}>
                        {inquiry.source === 'ai_chat' ? '🤖 AI Chat' : inquiry.source}
                      </span>
                      {inquiry.type === 'provider_outreach' && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          Outreach Needed
                        </span>
                      )}
                    </div>

                    {/* Provider Type Request */}
                    {inquiry.requestedProviderType && (
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        Looking for: <span className="text-teal-600">{inquiry.requestedProviderType}</span>
                      </div>
                    )}

                    {/* Location */}
                    {(inquiry.location?.city || inquiry.location?.state) && (
                      <div className="text-sm text-gray-600 mb-1">
                        📍 {inquiry.location.city}{inquiry.location.city && inquiry.location.state ? ', ' : ''}{inquiry.location.state}
                      </div>
                    )}

                    {/* User Message */}
                    {inquiry.userMessage && (
                      <div className="text-sm text-gray-500 italic mb-1">
                        "{inquiry.userMessage}"
                      </div>
                    )}

                    {/* Notes */}
                    {inquiry.notes && !inquiry.userMessage && (
                      <div className="text-sm text-gray-500">
                        {inquiry.notes}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(inquiry.createdAt).toLocaleDateString()} • 
                      {inquiry.followUps?.length || 0} follow-ups
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-col gap-1 ml-4">
                    {inquiry.type === 'provider_outreach' && inquiry.status !== 'contacted' && (
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedInquiry(inquiry);
                          setShowEmailModal(true); 
                        }}
                        className="px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 flex items-center gap-1"
                      >
                        ✉️ Send Invite
                      </button>
                    )}
                    {inquiry.status === 'new' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStatus(inquiry._id, 'in_progress'); }}
                        className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInquiry && !showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {typeIcons[selectedInquiry.type]} Inquiry Details
                </h2>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Status & Source */}
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedInquiry.status]}`}>
                    {selectedInquiry.status?.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${sourceColors[selectedInquiry.source]}`}>
                    {selectedInquiry.source === 'ai_chat' ? '🤖 AI Chat' : selectedInquiry.source}
                  </span>
                </div>

                {/* Send Email Button */}
                {selectedInquiry.type === 'provider_outreach' && (
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 font-medium"
                  >
                    ✉️ Send Provider Invite Email
                  </button>
                )}

                {/* Provider Type */}
                {selectedInquiry.requestedProviderType && (
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <div className="text-sm text-teal-600 font-medium">Requested Provider Type</div>
                    <div className="text-lg font-bold text-teal-800">{selectedInquiry.requestedProviderType}</div>
                  </div>
                )}

                {/* Location */}
                {selectedInquiry.location && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium">Location</div>
                    <div className="text-gray-900">
                      {selectedInquiry.location.city}{selectedInquiry.location.city && selectedInquiry.location.state ? ', ' : ''}{selectedInquiry.location.state}
                    </div>
                    {selectedInquiry.location.coordinates && (
                      <div className="text-xs text-gray-500 mt-1">
                        Coordinates: {selectedInquiry.location.coordinates[1]?.toFixed(4)}, {selectedInquiry.location.coordinates[0]?.toFixed(4)}
                      </div>
                    )}
                  </div>
                )}

                {/* User Message */}
                {selectedInquiry.userMessage && (
                  <div>
                    <div className="text-sm text-gray-600 font-medium mb-1">User's Request</div>
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-900 italic">
                      "{selectedInquiry.userMessage}"
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedInquiry.notes && (
                  <div>
                    <div className="text-sm text-gray-600 font-medium mb-1">Notes</div>
                    <div className="text-gray-700">{selectedInquiry.notes}</div>
                  </div>
                )}

                {/* Follow-ups */}
                {selectedInquiry.followUps && selectedInquiry.followUps.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 font-medium mb-2">Follow-up History</div>
                    <div className="space-y-2">
                      {selectedInquiry.followUps.map((fu, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium capitalize flex items-center gap-1">
                              {fu.method === 'email' && '✉️'}
                              {fu.method === 'phone' && '📞'}
                              {fu.method === 'sms' && '💬'}
                              {fu.method}
                            </span>
                            <span className="text-gray-500">{new Date(fu.date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-gray-700 mt-1">{fu.notes}</div>
                          {fu.outcome && <div className="text-green-600 mt-1">Outcome: {fu.outcome}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Follow-up */}
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 font-medium mb-2">Add Follow-up</div>
                  <div className="space-y-2">
                    <select
                      value={followUpForm.method}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, method: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="email">📧 Email</option>
                      <option value="phone">📞 Phone</option>
                      <option value="sms">💬 SMS</option>
                      <option value="in_app">📱 In-App</option>
                    </select>
                    <textarea
                      value={followUpForm.notes}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                      placeholder="Follow-up notes..."
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                    />
                    <input
                      type="text"
                      value={followUpForm.outcome}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, outcome: e.target.value })}
                      placeholder="Outcome (optional)"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <button
                      onClick={() => addFollowUp(selectedInquiry._id)}
                      disabled={!followUpForm.notes}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Follow-up
                    </button>
                  </div>
                </div>

                {/* Outcome */}
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 font-medium mb-2">Set Outcome</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateOutcome(selectedInquiry._id, 'provider_onboarded')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      ✓ Provider Onboarded
                    </button>
                    <button
                      onClick={() => updateOutcome(selectedInquiry._id, 'provider_declined')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      ✗ Provider Declined
                    </button>
                    <button
                      onClick={() => updateOutcome(selectedInquiry._id, 'no_response')}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      No Response
                    </button>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-gray-500 border-t pt-4">
                  <div>Created: {new Date(selectedInquiry.createdAt).toLocaleString()}</div>
                  {selectedInquiry.contactedAt && (
                    <div>Contacted: {new Date(selectedInquiry.contactedAt).toLocaleString()}</div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-between">
                <button
                  onClick={() => deleteInquiry(selectedInquiry._id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
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
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Context */}
              <div className="bg-teal-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-teal-600">Searching for:</div>
                <div className="font-bold text-teal-800">{selectedInquiry.requestedProviderType}</div>
                <div className="text-sm text-teal-600 mt-1">
                  in {selectedInquiry.location?.city}{selectedInquiry.location?.city && selectedInquiry.location?.state ? ', ' : ''}{selectedInquiry.location?.state}
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
                    placeholder="Dr. Smith or Smith Family Dental"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">📧 Email Preview:</div>
                  <div className="text-sm">
                    <strong>Subject:</strong> Patients in {selectedInquiry.location?.city || 'your area'} are looking for {selectedInquiry.requestedProviderType} providers - Join Findr Health
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Includes: Benefits of joining, free listing info, call to action
                  </div>
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
