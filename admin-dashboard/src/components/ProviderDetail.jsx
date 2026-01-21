import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providersAPI } from '../utils/api';


const SERVICE_CATEGORIES = [
  "Acne Treatment", "Acute Care", "Assessment", "Body Treatment", "Chiropractic",
  "Chronic Care", "Coaching", "Compounding", "Consultation", "Cosmetic",
  "Couples/Family", "Diagnostic", "Emergency", "Evaluation", "Facials",
  "Group", "Group Class", "Holistic", "Immunization", "Immunizations",
  "Individual Therapy", "Injectables", "IV Therapy", "Labs", "Laser",
  "Massage", "Meal Planning", "Mindfulness", "Minor Procedures", "Nutrition",
  "Personal Training", "Physical Therapy", "Pilates", "Preventive", "Private Session",
  "Procedures", "Program", "Psychiatry", "Rapid Tests", "Relaxation",
  "Restorative", "Screenings", "Specialty", "Sports", "Surgical",
  "Testing", "Therapeutic", "Therapy", "Treatment", "Urgent Care",
  "Vaccinations", "Virtual", "Walk-in Visit", "Weight Loss", "Wellness",
  "Workshop", "Yoga"
];

const CANCELLATION_POLICY_TYPES = [
  { value: 'flexible', label: 'Flexible', description: 'Free cancellation up to 24 hours before' },
  { value: 'moderate', label: 'Moderate', description: 'Free cancellation up to 48 hours before, 50% refund after' },
  { value: 'strict', label: 'Strict', description: 'Free cancellation up to 7 days before, 50% refund up to 48 hours' },
  { value: 'custom', label: 'Custom', description: 'Define your own policy terms' }
];

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchProvider();
  }, [id]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const response = await providersAPI.getById(id);
      setProvider(response.data.provider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const confirmMessage = newStatus === 'approved' 
      ? 'Are you sure you want to APPROVE this provider? An email will be sent to notify them.'
      : newStatus === 'rejected'
      ? 'Are you sure you want to REJECT this provider? An email will be sent to notify them.'
      : 'Are you sure you want to change status to ' + newStatus + '?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      await providersAPI.updateStatus(id, newStatus);
      setProvider({ ...provider, status: newStatus });
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await providersAPI.update(id, provider);
      setEditMode(false);
      alert('Provider updated successfully!');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      if ((provider.photos || []).length >= 5) {
        alert('Maximum 5 photos allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File exceeds 10MB limit');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }
      
      setUploadingPhoto(true);
      
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const API_URL = import.meta.env.VITE_API_URL || 'https://fearless-achievement-production.up.railway.app/api';
        const response = await fetch(API_URL + '/upload/image', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const result = await response.json();
        
        if (result.success && result.url) {
          const newPhoto = { url: result.url, isPrimary: (provider.photos || []).length === 0 };
          updateField('photos', [...(provider.photos || []), newPhoto]);
        } else {
          throw new Error('No URL returned');
        }
      } catch (error) {
        console.error('Photo upload error:', error);
        alert('Failed to upload photo. Please try again.');
      } finally {
        setUploadingPhoto(false);
      }
    }
    e.target.value = '';
  };

  const updateField = (field, value) => {
    setProvider({ ...provider, [field]: value });
  };

  const updateNestedField = (parent, field, value) => {
    setProvider({
      ...provider,
      [parent]: { ...provider[parent], [field]: value }
    });
  };

  const updateService = (idx, field, value) => {
    const updated = [...provider.services];
    updated[idx] = { ...updated[idx], [field]: value };
    setProvider({ ...provider, services: updated });
  };

  const deleteService = (idx) => {
    const updated = provider.services.filter((_, i) => i !== idx);
    setProvider({ ...provider, services: updated });
  };

  const addService = () => {
    const newService = {
      name: 'New Service',
      category: '',
      duration: 30,
      price: 0,
      description: ''
    };
    setProvider({ ...provider, services: [newService, ...(provider.services || [])] });
  };

  const addTeamMember = () => {
    const newMember = {
      name: '',
      title: '',
      credentials: '',
      bio: '',
      photo: '',
      specialties: [],
      yearsExperience: 0,
      acceptsBookings: true
    };
    setProvider({ ...provider, teamMembers: [...(provider.teamMembers || []), newMember] });
  };

  const updateTeamMember = (idx, field, value) => {
    const updated = [...(provider.teamMembers || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setProvider({ ...provider, teamMembers: updated });
  };

  const deleteTeamMember = (idx) => {
    const updated = (provider.teamMembers || []).filter((_, i) => i !== idx);
    setProvider({ ...provider, teamMembers: updated });
  };

  // Helper function to format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get time ago string
  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return diffMins + ' minutes ago';
    if (diffHours < 24) return diffHours + ' hours ago';
    if (diffDays < 7) return diffDays + ' days ago';
    return formatDate(dateString);
  };

  // Get calendar health status with color
  const getCalendarHealthStatus = () => {
    const cal = provider?.calendar;
    if (!cal || !cal.provider) {
      return { status: 'Not Connected', color: 'gray', icon: '○' };
    }
    
    if (cal.tokenExpiry && new Date(cal.tokenExpiry) < new Date()) {
      return { status: 'Token Expired', color: 'red', icon: '✗' };
    }
    
    if (cal.syncFailureCount >= 3) {
      return { status: 'Sync Failing', color: 'red', icon: '✗' };
    }
    
    if (cal.tokenRefreshFailures >= 2) {
      return { status: 'Token Issues', color: 'orange', icon: '⚠' };
    }
    
    if (cal.lastSyncStatus === 'failed') {
      return { status: 'Last Sync Failed', color: 'orange', icon: '⚠' };
    }
    
    return { status: 'Healthy', color: 'green', icon: '✓' };
  };

  // Get Stripe Connect status with color
  const getStripeStatus = () => {
    const stripe = provider?.stripeConnect;
    if (!stripe || !stripe.accountId) {
      return { status: 'Not Connected', color: 'gray', icon: '○' };
    }
    
    if (stripe.accountStatus === 'disabled') {
      return { status: 'Disabled', color: 'red', icon: '✗' };
    }
    
    if (stripe.accountStatus === 'restricted') {
      return { status: 'Restricted', color: 'orange', icon: '⚠' };
    }
    
    if (!stripe.payoutsEnabled || !stripe.chargesEnabled) {
      return { status: 'Incomplete', color: 'yellow', icon: '⏳' };
    }
    
    if (stripe.accountStatus === 'active' && stripe.payoutsEnabled && stripe.chargesEnabled) {
      return { status: 'Active', color: 'green', icon: '✓' };
    }
    
    return { status: 'Pending', color: 'yellow', icon: '⏳' };
  };

  const exportProvider = () => {
    const exportData = {
      provider: {
        id: provider._id,
        practiceName: provider.practiceName,
        providerTypes: provider.providerTypes || [],
        status: provider.status,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      },
      contactInfo: {
        email: provider.contactInfo?.email || provider.email,
        phone: provider.contactInfo?.phone || provider.phone,
        website: provider.contactInfo?.website || provider.website
      },
      address: provider.address,
      photos: provider.photos || [],
      services: provider.services || [],
      credentials: provider.credentials,
      teamMembers: provider.teamMembers || [],
      insuranceAccepted: provider.insuranceAccepted || [],
      languagesSpoken: provider.languagesSpoken || [],
      calendar: provider.calendar,
      stripeConnect: provider.stripeConnect,
      cancellationPolicy: provider.cancellationPolicy,
      agreement: provider.agreement,
      exportMetadata: {
        exportDate: new Date().toISOString(),
        exportVersion: '3.0',
        exportedBy: 'Findr Health Admin Dashboard'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'provider-' + (provider.practiceName?.replace(/\s+/g, '-').toLowerCase() || 'export') + '-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = [
      ['Field', 'Value'],
      ['Practice Name', provider.practiceName],
      ['Status', provider.status],
      ['Email', provider.contactInfo?.email || provider.email],
      ['Phone', provider.contactInfo?.phone || provider.phone],
      ['Calendar Connected', provider.calendarConnected ? 'Yes' : 'No'],
      ['Calendar Provider', provider.calendar?.provider || 'N/A'],
      ['Stripe Connected', provider.stripeConnect?.accountId ? 'Yes' : 'No'],
      ['Stripe Status', provider.stripeConnect?.accountStatus || 'N/A'],
    ];

    const csvContent = rows.map(row => row.map(cell => '"' + (cell || '') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'provider-' + (provider.practiceName?.replace(/\s+/g, '-').toLowerCase() || 'export') + '-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!provider) return null;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800'
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'photos', label: 'Photos', icon: '📷' },
    { id: 'services', label: 'Services', icon: '💼' },
    { id: 'credentials', label: 'Credentials', icon: '📜' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'hours', label: 'Hours', icon: '🕐' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'policies', label: 'Policies', icon: '📄' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'agreement', label: 'Agreement', icon: '✍️' }
  ];

  const calendarHealth = getCalendarHealthStatus();
  const stripeStatus = getStripeStatus();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/providers')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            ← Back to Providers
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {provider.practiceName || 'Unnamed Provider'}
          </h1>
          <span className={'px-3 py-1 rounded-full text-sm font-medium ' + (statusColors[provider.status] || statusColors.draft)}>
            {provider.status || 'draft'}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              onBlur={() => setTimeout(() => setShowExportMenu(false), 150)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              📥 Export ▼
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { exportProvider(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg"
                >
                  📄 Export as JSON
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { exportCSV(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-b-lg"
                >
                  📊 Export as CSV
                </button>
              </div>
            )}
          </div>
          
          {editMode ? (
            <>
              <button
                onClick={() => { setEditMode(false); fetchProvider(); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ✏️ Edit Provider
            </button>
          )}
        </div>
      </div>

      {/* Status Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-700 font-medium">Change Status:</span>
          <button
            onClick={() => handleStatusChange('approved')}
            disabled={provider.status === 'approved'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => handleStatusChange('pending')}
            disabled={provider.status === 'pending'}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏳ Pending
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            disabled={provider.status === 'rejected'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✗ Reject
          </button>
          
          <div className="h-8 w-px bg-gray-300 mx-2"></div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={provider.verified || false}
              disabled={!editMode}
              onChange={async (e) => {
                const newValue = e.target.checked;
                try {
                  await providersAPI.toggleVerified(id, newValue);
                  setProvider(prev => ({ ...prev, verified: newValue }));
                } catch (err) {
                  alert('Failed to update verified status: ' + err.message);
                }
              }}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 font-medium">✓ Verified Badge</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={provider.featured || false}
              disabled={!editMode}
              onChange={async (e) => {
                const newValue = e.target.checked;
                try {
                  await providersAPI.toggleFeatured(id, newValue);
                  setProvider(prev => ({ ...prev, featured: newValue }));
                } catch (err) {
                  alert('Failed to update featured status: ' + err.message);
                }
              }}
              className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-500"
            />
            <span className="text-gray-700 font-medium">⭐ Featured</span>
          </label>
        </div>
        
        <div className="flex gap-2 mt-3">
          {provider.verified && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              ✓ Verified Provider
            </span>
          )}
          {provider.featured && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              ⭐ Featured
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={'px-4 py-3 font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors whitespace-nowrap ' +
                (activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50')
              }
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">🏢 Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Practice Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={provider.practiceName || ''}
                    onChange={(e) => updateField('practiceName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{provider.practiceName || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider Types</label>
                <div className="flex flex-wrap gap-2">
                  {(provider.providerTypes || []).length > 0 ? (
                    provider.providerTypes.map((type, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {type}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No types specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">📞 Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{provider.contactInfo?.email || provider.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{provider.contactInfo?.phone || provider.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <p className="text-gray-900">{provider.contactInfo?.website || provider.website || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">📍 Address</h2>
            <p className="text-gray-900">
              {provider.address?.street || 'N/A'}<br/>
              {provider.address?.city}, {provider.address?.state} {provider.address?.zip}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">🏥 Insurance & Languages</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Accepted</label>
                <div className="flex flex-wrap gap-2">
                  {(provider.insuranceAccepted || []).length > 0 ? (
                    provider.insuranceAccepted.map((ins, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{ins}</span>
                    ))
                  ) : (
                    <p className="text-gray-500">No insurance information</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {(provider.languagesSpoken || []).length > 0 ? (
                    provider.languagesSpoken.map((lang, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">{lang}</span>
                    ))
                  ) : (
                    <p className="text-gray-500">No language information</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📷 Photos ({(provider.photos || []).length}/5)</h2>
          {(provider.photos || []).length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {provider.photos.map((photo, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={photo.url || photo}
                      alt={'Photo ' + (idx + 1)}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                    />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto || (provider.photos || []).length >= 5}
                  />
                  {uploadingPhoto ? '⏳ Uploading...' : `📤 Add More Photos (${(provider.photos || []).length}/5)`}
                </label>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">📷</span>
              <p className="text-gray-500 mb-4">No photos uploaded</p>
              <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto ? '⏳ Uploading...' : '📤 Upload Photos'}
              </label>
              <p className="text-xs text-gray-400 mt-2">Max 5 photos, 10MB each</p>
            </div>
          )}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">💼 Services ({(provider.services || []).length})</h2>
            {editMode && (
              <button onClick={addService} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                + Add Service
              </button>
            )}
          </div>
          
          {(provider.services || []).length > 0 ? (
            <div className="space-y-4">
              {provider.services.map((service, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{service.name}</span>
                    {service.category && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{service.category}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    ⏱️ {service.duration} min • 💲 {service.price}
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-500 mt-2">{service.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">💼</span>
              <p className="text-gray-500">No services added</p>
            </div>
          )}
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📜 Credentials & Licenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <p className="text-gray-900 font-mono">{provider.credentials?.licenseNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License State</label>
              <p className="text-gray-900">{provider.credentials?.licenseState || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
              <p className="text-gray-900">{provider.credentials?.yearsExperience ? provider.credentials.yearsExperience + ' years' : 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              <p className="text-gray-900">{provider.credentials?.education || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">👥 Team Members ({(provider.teamMembers || []).length})</h2>
          {(provider.teamMembers || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {provider.teamMembers.map((member, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-blue-600 text-xl font-medium">{member.name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{member.name || 'Unnamed'}</div>
                      <div className="text-sm text-gray-600">{member.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">👥</span>
              <p className="text-gray-500">No team members added</p>
            </div>
          )}
        </div>
      )}

      {/* Hours Tab */}
      {activeTab === 'hours' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">🕐 Hours of Operation</h2>
          <div className="grid gap-4">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
              const hours = provider.calendar?.businessHours?.[day];
              const isOpen = hours?.isOpen ?? false;
              return (
                <div key={day} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-900 capitalize w-32">{day}</span>
                  <span className={'text-sm ' + (isOpen ? 'text-gray-600' : 'text-red-500 font-medium')}>
                    {isOpen ? (hours?.open || '9:00') + ' - ' + (hours?.close || '17:00') : 'Closed'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">📅 Calendar Integration</h2>
            
            {provider.calendar?.provider ? (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className={'p-4 rounded-lg border-2 ' + 
                  (calendarHealth.color === 'green' ? 'bg-green-50 border-green-200' :
                   calendarHealth.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                   calendarHealth.color === 'red' ? 'bg-red-50 border-red-200' :
                   'bg-gray-50 border-gray-200')
                }>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={'text-2xl ' + 
                        (calendarHealth.color === 'green' ? 'text-green-600' :
                         calendarHealth.color === 'orange' ? 'text-orange-600' :
                         calendarHealth.color === 'red' ? 'text-red-600' : 'text-gray-600')
                      }>{calendarHealth.icon}</span>
                      <div>
                        <p className={'font-semibold ' +
                          (calendarHealth.color === 'green' ? 'text-green-800' :
                           calendarHealth.color === 'orange' ? 'text-orange-800' :
                           calendarHealth.color === 'red' ? 'text-red-800' : 'text-gray-800')
                        }>{calendarHealth.status}</p>
                        <p className="text-sm text-gray-600">
                          Connected via {provider.calendar.provider === 'google' ? 'Google Calendar' : 
                                        provider.calendar.provider === 'microsoft' ? 'Microsoft Outlook' : 
                                        provider.calendar.provider}
                        </p>
                      </div>
                    </div>
                    <span className={'px-3 py-1 rounded-full text-sm font-medium ' +
                      (provider.calendar.provider === 'google' ? 'bg-blue-100 text-blue-800' :
                       provider.calendar.provider === 'microsoft' ? 'bg-indigo-100 text-indigo-800' :
                       'bg-gray-100 text-gray-800')
                    }>
                      {provider.calendar.provider === 'google' ? '📧 Google' : 
                       provider.calendar.provider === 'microsoft' ? '📧 Microsoft' : 
                       provider.calendar.provider}
                    </span>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Connected Email</label>
                    <p className="text-gray-900 font-medium">{provider.calendar.calendarEmail || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Connected At</label>
                    <p className="text-gray-900">{formatDate(provider.calendar.connectedAt)}</p>
                    <p className="text-xs text-gray-500">{getTimeAgo(provider.calendar.connectedAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sync Direction</label>
                    <p className="text-gray-900">{provider.calendar.syncDirection || 'two-way'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Buffer Between Appointments</label>
                    <p className="text-gray-900">{provider.calendar.bufferMinutes || 0} minutes</p>
                  </div>
                </div>

                {/* Token Health */}
                <div className="border-t pt-6">
                  <h3 className="text-md font-semibold mb-4">🔐 OAuth Token Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Token Expiry</label>
                      <p className={'font-medium ' + 
                        (provider.calendar.tokenExpiry && new Date(provider.calendar.tokenExpiry) < new Date() ? 'text-red-600' : 'text-gray-900')
                      }>
                        {formatDate(provider.calendar.tokenExpiry)}
                      </p>
                      {provider.calendar.tokenExpiry && new Date(provider.calendar.tokenExpiry) < new Date() && (
                        <p className="text-xs text-red-500 font-medium mt-1">⚠️ EXPIRED</p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Token Refresh</label>
                      <p className="text-gray-900">{formatDate(provider.calendar.lastTokenRefreshAt) || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Token Refresh Failures</label>
                      <p className={'font-medium ' + ((provider.calendar.tokenRefreshFailures || 0) >= 2 ? 'text-red-600' : 'text-gray-900')}>
                        {provider.calendar.tokenRefreshFailures || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sync Diagnostics */}
                <div className="border-t pt-6">
                  <h3 className="text-md font-semibold mb-4">🔄 Sync Diagnostics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Sync</label>
                      <p className="text-gray-900">{formatDate(provider.calendar.lastSyncAt) || 'Never'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Sync Status</label>
                      <p className={'font-medium ' +
                        (provider.calendar.lastSyncStatus === 'success' ? 'text-green-600' :
                         provider.calendar.lastSyncStatus === 'failed' ? 'text-red-600' : 'text-gray-600')
                      }>
                        {provider.calendar.lastSyncStatus || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Consecutive Failures</label>
                      <p className={'font-medium ' + ((provider.calendar.syncFailureCount || 0) >= 3 ? 'text-red-600' : 'text-gray-900')}>
                        {provider.calendar.syncFailureCount || 0}
                      </p>
                    </div>
                  </div>
                  
                  {provider.calendar.lastSyncError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <label className="block text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Last Sync Error</label>
                      <p className="text-red-800 font-mono text-sm">{provider.calendar.lastSyncError}</p>
                    </div>
                  )}
                </div>

                {/* FreeBusy & Event Creation */}
                <div className="border-t pt-6">
                  <h3 className="text-md font-semibold mb-4">📊 Booking Integration Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">FreeBusy Queries (Availability)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Last Query:</span>
                          <span className="text-sm text-gray-900">{formatDate(provider.calendar.lastFreeBusyQueryAt) || 'Never'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={'text-sm font-medium ' +
                            (provider.calendar.lastFreeBusyStatus === 'success' ? 'text-green-600' :
                             provider.calendar.lastFreeBusyStatus === 'failed' ? 'text-red-600' : 'text-gray-600')
                          }>
                            {provider.calendar.lastFreeBusyStatus || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Event Creation (Bookings)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Events Created:</span>
                          <span className="text-sm text-gray-900 font-medium">{provider.calendar.eventsCreatedCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Last Event Created:</span>
                          <span className="text-sm text-gray-900">{formatDate(provider.calendar.lastEventCreatedAt) || 'Never'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <span className="text-4xl mb-2 block">📅</span>
                <p className="text-gray-700 font-medium">Calendar Not Connected</p>
                <p className="text-gray-500 text-sm mt-1">Provider has not connected their calendar yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📄 Cancellation Policy</h2>
          
          {provider.cancellationPolicy ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className={'px-4 py-2 rounded-full text-sm font-semibold ' +
                  (provider.cancellationPolicy.type === 'flexible' ? 'bg-green-100 text-green-800' :
                   provider.cancellationPolicy.type === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                   provider.cancellationPolicy.type === 'strict' ? 'bg-red-100 text-red-800' :
                   'bg-purple-100 text-purple-800')
                }>
                  {(provider.cancellationPolicy.type || 'moderate').charAt(0).toUpperCase() + 
                   (provider.cancellationPolicy.type || 'moderate').slice(1)} Policy
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs text-gray-500 mb-1">Hours Notice</label>
                  <p className="text-lg font-semibold text-gray-900">{provider.cancellationPolicy.hoursNotice || 24}h</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs text-gray-500 mb-1">On-Time Refund</label>
                  <p className="text-lg font-semibold text-green-600">{provider.cancellationPolicy.refundPercentage ?? 100}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs text-gray-500 mb-1">Late Refund</label>
                  <p className="text-lg font-semibold text-orange-600">{provider.cancellationPolicy.lateRefundPercentage ?? 0}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs text-gray-500 mb-1">No-Show Fee</label>
                  <p className="text-lg font-semibold text-red-600">{provider.cancellationPolicy.noShowFee ?? 100}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs text-gray-500 mb-1">Reschedule</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {provider.cancellationPolicy.allowReschedule ? '✓ Allowed' : '✗ Not Allowed'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs text-gray-500 mb-1">Reschedule Notice</label>
                  <p className="text-lg font-semibold text-gray-900">{provider.cancellationPolicy.rescheduleHoursNotice || 24}h</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-3xl mb-2 block">📄</span>
              <p className="text-gray-700 font-medium">No Policy Set</p>
              <p className="text-gray-500 text-sm mt-1">Using default moderate policy (24h notice, 100% refund)</p>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">💳 Stripe Connect (Payouts)</h2>
            
            {provider.stripeConnect?.accountId ? (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className={'p-4 rounded-lg border-2 ' +
                  (stripeStatus.color === 'green' ? 'bg-green-50 border-green-200' :
                   stripeStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                   stripeStatus.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                   stripeStatus.color === 'red' ? 'bg-red-50 border-red-200' :
                   'bg-gray-50 border-gray-200')
                }>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={'text-2xl ' +
                        (stripeStatus.color === 'green' ? 'text-green-600' :
                         stripeStatus.color === 'yellow' ? 'text-yellow-600' :
                         stripeStatus.color === 'orange' ? 'text-orange-600' :
                         stripeStatus.color === 'red' ? 'text-red-600' : 'text-gray-600')
                      }>{stripeStatus.icon}</span>
                      <div>
                        <p className={'font-semibold ' +
                          (stripeStatus.color === 'green' ? 'text-green-800' :
                           stripeStatus.color === 'yellow' ? 'text-yellow-800' :
                           stripeStatus.color === 'orange' ? 'text-orange-800' :
                           stripeStatus.color === 'red' ? 'text-red-800' : 'text-gray-800')
                        }>{stripeStatus.status}</p>
                        <p className="text-sm text-gray-600">Stripe Connect Express Account</p>
                      </div>
                    </div>
                    <a
                      href={'https://dashboard.stripe.com/connect/accounts/' + provider.stripeConnect.accountId}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      View in Stripe →
                    </a>
                  </div>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Account ID</label>
                    <p className="text-gray-900 font-mono text-sm">{provider.stripeConnect.accountId}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Account Status</label>
                    <p className={'font-medium ' +
                      (provider.stripeConnect.accountStatus === 'active' ? 'text-green-600' :
                       provider.stripeConnect.accountStatus === 'pending' ? 'text-yellow-600' : 'text-red-600')
                    }>
                      {provider.stripeConnect.accountStatus || 'Unknown'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Connected At</label>
                    <p className="text-gray-900">{formatDate(provider.stripeConnect.connectedAt)}</p>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={'p-4 rounded-lg border ' + (provider.stripeConnect.chargesEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                    <div className="flex items-center gap-2">
                      <span className={provider.stripeConnect.chargesEnabled ? 'text-green-600' : 'text-red-600'}>
                        {provider.stripeConnect.chargesEnabled ? '✓' : '✗'}
                      </span>
                      <span className="font-medium">Charges Enabled</span>
                    </div>
                  </div>
                  <div className={'p-4 rounded-lg border ' + (provider.stripeConnect.payoutsEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                    <div className="flex items-center gap-2">
                      <span className={provider.stripeConnect.payoutsEnabled ? 'text-green-600' : 'text-red-600'}>
                        {provider.stripeConnect.payoutsEnabled ? '✓' : '✗'}
                      </span>
                      <span className="font-medium">Payouts Enabled</span>
                    </div>
                  </div>
                  <div className={'p-4 rounded-lg border ' + (provider.stripeConnect.detailsSubmitted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200')}>
                    <div className="flex items-center gap-2">
                      <span className={provider.stripeConnect.detailsSubmitted ? 'text-green-600' : 'text-yellow-600'}>
                        {provider.stripeConnect.detailsSubmitted ? '✓' : '⏳'}
                      </span>
                      <span className="font-medium">Details Submitted</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <span className="text-4xl mb-2 block">💳</span>
                <p className="text-gray-700 font-medium">Stripe Connect Not Set Up</p>
                <p className="text-gray-500 text-sm mt-1">Provider has not connected their Stripe account for payouts.</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Platform Fee Structure</h3>
            <p className="text-blue-700 text-sm">
              <strong>10% + $1.50</strong> per booking (capped at <strong>$35</strong> maximum)
            </p>
          </div>
        </div>
      )}

      {/* Agreement Tab */}
      {activeTab === 'agreement' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">✍️ Legal Agreement</h2>
          {provider.agreement ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                  ✓ Agreement Signed
                </div>
                <p className="text-green-600 text-sm">Provider has signed the participation agreement.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                  <p className="text-gray-900 font-serif text-2xl italic border-b-2 border-gray-300 pb-1">
                    {provider.agreement.signature}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Signed</label>
                  <p className="text-gray-900">
                    {provider.agreement.agreedDate 
                      ? new Date(provider.agreement.agreedDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
              <span className="text-4xl mb-2 block">⚠️</span>
              <p className="text-yellow-700 font-medium">Agreement Not Signed</p>
            </div>
          )}
        </div>
      )}

      {/* Metadata Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
        <p><span className="font-medium">Created:</span> {new Date(provider.createdAt).toLocaleString()}</p>
        {provider.updatedAt && <p><span className="font-medium">Updated:</span> {new Date(provider.updatedAt).toLocaleString()}</p>}
        <p><span className="font-medium">ID:</span> <code className="bg-gray-100 px-1 rounded">{provider._id}</code></p>
      </div>
    </div>
  );
}
