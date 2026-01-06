import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providersAPI } from '../utils/api';


const SERVICE_CATEGORIES = [
  "Acute Care", "Assessment", "Chiropractic", "Chronic Care", "Coaching",
  "Compounding", "Consultation", "Cosmetic", "Diagnostic", "Emergency",
  "Evaluation", "Facials", "Group", "Holistic", "IV Therapy", "Immunizations",
  "Injectables", "Labs", "Laser", "Massage", "Mindfulness", "Minor Procedures",
  "Nutrition", "Personal Training", "Physical Therapy", "Pilates", "Preventive",
  "Psychiatry", "Rapid Tests", "Restorative", "Screenings", "Testing", "Therapy",
  "Urgent Care", "Vaccinations", "Virtual", "Wellness", "Yoga"
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

  useEffect(() => {
    fetchProvider();
  }, [id]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const response = await providersAPI.getById(id);
      setProvider(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const confirmMessage = newStatus === 'approved' 
      ? `Are you sure you want to APPROVE this provider? An email will be sent to notify them.`
      : newStatus === 'rejected'
      ? `Are you sure you want to REJECT this provider? An email will be sent to notify them.`
      : `Are you sure you want to change status to ${newStatus}?`;
    
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

  // FULL EXPORT - All provider details (not just services)
  const exportProvider = () => {
    const exportData = {
      // Provider Basic Info
      provider: {
        id: provider._id,
        practiceName: provider.practiceName,
        providerTypes: provider.providerTypes || [],
        status: provider.status,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      },
      
      // Contact Information
      contactInfo: {
        email: provider.contactInfo?.email || provider.email,
        phone: provider.contactInfo?.phone || provider.phone,
        website: provider.contactInfo?.website || provider.website
      },
      
      // Address
      address: {
        street: provider.address?.street,
        suite: provider.address?.suite,
        city: provider.address?.city,
        state: provider.address?.state,
        zip: provider.address?.zip
      },
      
      // Photos
      photos: (provider.photos || []).map((photo, idx) => ({
        url: photo.url || photo,
        isPrimary: photo.isPrimary || idx === 0,
        caption: photo.caption || ''
      })),
      
      // Services
      services: (provider.services || []).map(service => ({
        name: service.name,
        category: service.category,
        duration: service.duration,
        price: service.price,
        description: service.description || ''
      })),
      
      // Credentials & Licenses
      credentials: {
        licenseNumber: provider.credentials?.licenseNumber,
        licenseState: provider.credentials?.licenseState,
        licenseExpiration: provider.credentials?.licenseExpiration,
        yearsExperience: provider.credentials?.yearsExperience,
        education: provider.credentials?.education,
        certifications: provider.credentials?.certifications || []
      },
      
      // Team Members
      teamMembers: (provider.teamMembers || []).map(member => ({
        name: member.name,
        title: member.title,
        credentials: member.credentials,
        bio: member.bio,
        photo: member.photo,
        specialties: member.specialties || [],
        yearsExperience: member.yearsExperience,
        acceptsBookings: member.acceptsBookings
      })),
      
      // Insurance & Languages
      insuranceAccepted: provider.insuranceAccepted || [],
      languagesSpoken: provider.languagesSpoken || [],
      
      // Legal Agreement
      agreement: provider.agreement ? {
        signature: provider.agreement.signature,
        title: provider.agreement.title,
        agreedDate: provider.agreement.agreedDate,
        version: provider.agreement.version,
        initials: provider.agreement.initials
      } : null,
      
      // Export Metadata
      exportMetadata: {
        exportDate: new Date().toISOString(),
        exportVersion: '2.0',
        exportedBy: 'Carrotly Admin Dashboard'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provider-${provider.practiceName?.replace(/\s+/g, '-').toLowerCase() || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV (for spreadsheet use)
  const exportCSV = () => {
    // Provider info as CSV
    const rows = [
      ['Field', 'Value'],
      ['Practice Name', provider.practiceName],
      ['Status', provider.status],
      ['Email', provider.contactInfo?.email || provider.email],
      ['Phone', provider.contactInfo?.phone || provider.phone],
      ['Website', provider.contactInfo?.website || provider.website],
      ['Street', provider.address?.street],
      ['City', provider.address?.city],
      ['State', provider.address?.state],
      ['ZIP', provider.address?.zip],
      ['Provider Types', (provider.providerTypes || []).join(', ')],
      ['License Number', provider.credentials?.licenseNumber],
      ['License State', provider.credentials?.licenseState],
      ['Years Experience', provider.credentials?.yearsExperience],
      ['Certifications', (provider.credentials?.certifications || []).join(', ')],
      ['Insurance Accepted', (provider.insuranceAccepted || []).join(', ')],
      ['Languages Spoken', (provider.languagesSpoken || []).join(', ')],
      ['Photos Count', (provider.photos || []).length],
      ['Services Count', (provider.services || []).length],
      ['Team Members Count', (provider.teamMembers || []).length],
      ['Agreement Signed', provider.agreement ? 'Yes' : 'No'],
    ];

    const csvContent = rows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provider-${provider.practiceName?.replace(/\s+/g, '-').toLowerCase() || 'export'}-summary.csv`;
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
    { id: 'agreement', label: 'Agreement', icon: '✍️' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/providers')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <span>←</span> Back to Providers
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {provider.practiceName || 'Unnamed Provider'}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[provider.status] || statusColors.draft}`}>
            {provider.status || 'draft'}
          </span>
        </div>
        <div className="flex gap-2">
          {/* Export Dropdown */}
        {/* Export Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            onBlur={() => setTimeout(() => setShowExportMenu(false), 150)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            📥 Export
            <span className="text-xs">▼</span>
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
          {/* Status Buttons */}
          <span className="text-gray-700 font-medium">Status:</span>
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
          
          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 mx-2"></div>
          
          {/* Verified Badge Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={provider.isVerified || false}
              disabled={!editMode}
              onChange={async (e) => {
                const newValue = e.target.checked;
                console.log('Checkbox clicked!', newValue);
                try {
                  console.log('Calling API...');
                  await providersAPI.toggleVerified(id, newValue);
                  console.log('API success');
                  setProvider(prev => ({ ...prev, isVerified: newValue }));
                } catch (err) {
                  console.error('Error:', err);
                  alert('Failed to update verified status: ' + err.message);
                }
              }}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 font-medium flex items-center gap-1">
              <span className="text-blue-500">✓</span> Verified Badge
            </span>
          </label>
          
          {/* Featured Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={provider.isFeatured || false}
              disabled={!editMode}
              onChange={async (e) => {
                const newValue = e.target.checked;
                console.log('Featured clicked!', newValue);
                try {
                  console.log('Calling API...');
                  await providersAPI.toggleFeatured(id, newValue);
                  console.log('API success');
                  setProvider(prev => ({ ...prev, isFeatured: newValue }));
                } catch (err) {
                  console.error('Error:', err);
                  alert('Failed to update featured status: ' + err.message);
                }
              }}
              className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-500"
            />
            <span className="text-gray-700 font-medium flex items-center gap-1">
              <span className="text-yellow-500">⭐</span> Featured
            </span>
          </label>
        </div>
        
        {/* Badges Display */}
        <div className="flex gap-2 mt-3">
          {provider.isVerified && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
              ✓ Verified Provider
            </span>
          )}
          {provider.isFeatured && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
              ⭐ Featured
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
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
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🏢</span> Basic Information
            </h2>
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
                {editMode ? (
                  <div className="flex flex-wrap gap-2">
                    {['Medical', 'Urgent Care', 'Dental', 'Mental Health', 'Skincare/Aesthetics', 'Massage/Bodywork', 'Fitness/Training', 'Yoga/Pilates', 'Nutrition/Wellness', 'Pharmacy/RX'].map((type) => (
                      <label key={type} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        (provider.providerTypes || []).includes(type) 
                          ? 'bg-blue-100 border-blue-500 text-blue-800' 
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}>
                        <input
                          type="checkbox"
                          checked={(provider.providerTypes || []).includes(type)}
                          onChange={(e) => {
                            const current = provider.providerTypes || [];
                            if (e.target.checked) {
                              updateField('providerTypes', [...current, type]);
                            } else {
                              updateField('providerTypes', current.filter(t => t !== type));
                            }
                          }}
                          className="hidden"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📞</span> Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {editMode ? (
                  <input
                    type="email"
                    value={provider.contactInfo?.email || provider.email || ''}
                    onChange={(e) => updateNestedField('contactInfo', 'email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{provider.contactInfo?.email || provider.email || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {editMode ? (
                  <input
                    type="tel"
                    value={provider.contactInfo?.phone || provider.phone || ''}
                    onChange={(e) => updateNestedField('contactInfo', 'phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{provider.contactInfo?.phone || provider.phone || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                {editMode ? (
                  <input
                    type="url"
                    value={provider.contactInfo?.website || provider.website || ''}
                    onChange={(e) => updateNestedField('contactInfo', 'website', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://"
                  />
                ) : (
                  provider.contactInfo?.website || provider.website ? (
                    <a href={provider.contactInfo?.website || provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {provider.contactInfo?.website || provider.website}
                    </a>
                  ) : (
                    <p className="text-gray-500">N/A</p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📍</span> Address
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                {editMode ? (
                  <input
                    type="text"
                    value={provider.address?.street || ''}
                    onChange={(e) => updateNestedField('address', 'street', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{provider.address?.street || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suite/Unit</label>
                {editMode ? (
                  <input
                    type="text"
                    value={provider.address?.suite || ''}
                    onChange={(e) => updateNestedField('address', 'suite', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{provider.address?.suite || 'N/A'}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={provider.address?.city || ''}
                      onChange={(e) => updateNestedField('address', 'city', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{provider.address?.city || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={provider.address?.state || ''}
                      onChange={(e) => updateNestedField('address', 'state', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      maxLength={2}
                    />
                  ) : (
                    <p className="text-gray-900">{provider.address?.state || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={provider.address?.zip || ''}
                      onChange={(e) => updateNestedField('address', 'zip', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{provider.address?.zip || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Insurance & Languages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🏥</span> Insurance & Languages
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Accepted</label>
                {editMode ? (
                  <textarea
                    value={(provider.insuranceAccepted || []).join(', ')}
                    onChange={(e) => updateField('insuranceAccepted', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter insurance plans separated by commas"
                    rows={2}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(provider.insuranceAccepted || []).length > 0 ? (
                      provider.insuranceAccepted.map((ins, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {ins}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No insurance information</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                {editMode ? (
                  <textarea
                    value={(provider.languagesSpoken || []).join(', ')}
                    onChange={(e) => updateField('languagesSpoken', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter languages separated by commas"
                    rows={2}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(provider.languagesSpoken || []).length > 0 ? (
                      provider.languagesSpoken.map((lang, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No language information</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>📷</span> Photos ({(provider.photos || []).length}/5)
            </h2>
            {editMode && (provider.photos || []).length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  className="px-3 py-2 border rounded-lg w-64"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      updateField('photos', [...(provider.photos || []), { url: e.target.value, isPrimary: (provider.photos || []).length === 0 }]);
                      e.target.value = '';
                    }
                  }}
                />
                <span className="text-sm text-gray-500 self-center">Press Enter to add</span>
              </div>
            )}
          </div>
          
          {(provider.photos || []).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {provider.photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={photo.url || photo}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200x160?text=No+Image'; }}
                  />
                  {(photo.isPrimary || idx === 0) && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium">
                      Primary
                    </span>
                  )}
                  {editMode && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx !== 0 && (
                        <button
                          onClick={() => {
                            const updated = [...provider.photos];
                            updated[0].isPrimary = false;
                            updated[idx].isPrimary = true;
                            [updated[0], updated[idx]] = [updated[idx], updated[0]];
                            updateField('photos', updated);
                          }}
                          className="w-7 h-7 bg-blue-600 text-white rounded-full text-xs hover:bg-blue-700"
                          title="Set as primary"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const updated = provider.photos.filter((_, i) => i !== idx);
                          if (updated.length > 0 && idx === 0) updated[0].isPrimary = true;
                          updateField('photos', updated);
                        }}
                        className="w-7 h-7 bg-red-600 text-white rounded-full text-xs hover:bg-red-700"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">📷</span>
              <p className="text-gray-500">No photos uploaded</p>
              {editMode && <p className="text-sm text-gray-400 mt-1">Paste an image URL above to add photos</p>}
            </div>
          )}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>💼</span> Services ({(provider.services || []).length})
            </h2>
            {editMode && (
              <button onClick={addService} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
                <span>+</span> Add Service
              </button>
            )}
          </div>
          
          {(provider.services || []).length > 0 ? (
            <div className="space-y-4">
              {provider.services.map((service, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  {editMode ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Service Name</label>
                          <input
                            type="text"
                            value={service.name}
                            onChange={(e) => updateService(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                          <select
                            value={service.category || ''}
                            onChange={(e) => updateService(idx, 'category', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select category...</option>
                            {SERVICE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                            <input
                              type="number"
                              value={service.duration}
                              onChange={(e) => updateService(idx, 'duration', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="min"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                            <input
                              type="number"
                              value={service.price}
                              onChange={(e) => updateService(idx, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="$"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                        <textarea
                          value={service.description || ''}
                          onChange={(e) => updateService(idx, 'description', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Service description..."
                        />
                      </div>
                      <button
                        onClick={() => deleteService(idx)}
                        className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                      >
                        🗑️ Delete Service
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{service.name}</span>
                            {service.category && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {service.category}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="inline-flex items-center gap-1">
                              <span>⏱️</span> {service.duration} min
                            </span>
                            <span className="mx-2">•</span>
                            <span className="inline-flex items-center gap-1 font-medium text-green-600">
                              <span>💲</span> {service.price}
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-500 mt-2">{service.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">💼</span>
              <p className="text-gray-500">No services added</p>
              {editMode && (
                <button onClick={addService} className="mt-2 text-blue-600 hover:underline">
                  + Add your first service
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📜</span> Credentials & Licenses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              {editMode ? (
                <input
                  type="text"
                  value={provider.credentials?.licenseNumber || ''}
                  onChange={(e) => updateNestedField('credentials', 'licenseNumber', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-mono">{provider.credentials?.licenseNumber || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License State</label>
              {editMode ? (
                <input
                  type="text"
                  value={provider.credentials?.licenseState || ''}
                  onChange={(e) => updateNestedField('credentials', 'licenseState', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={2}
                  placeholder="e.g., NY"
                />
              ) : (
                <p className="text-gray-900">{provider.credentials?.licenseState || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Expiration</label>
              {editMode ? (
                <input
                  type="date"
                  value={provider.credentials?.licenseExpiration?.split('T')[0] || ''}
                  onChange={(e) => updateNestedField('credentials', 'licenseExpiration', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">
                  {provider.credentials?.licenseExpiration 
                    ? new Date(provider.credentials.licenseExpiration).toLocaleDateString()
                    : 'N/A'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
              {editMode ? (
                <input
                  type="number"
                  value={provider.credentials?.yearsExperience || ''}
                  onChange={(e) => updateNestedField('credentials', 'yearsExperience', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={0}
                />
              ) : (
                <p className="text-gray-900">
                  {provider.credentials?.yearsExperience 
                    ? `${provider.credentials.yearsExperience} years`
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Education & Training</label>
              {editMode ? (
                <textarea
                  value={provider.credentials?.education || ''}
                  onChange={(e) => updateNestedField('credentials', 'education', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Education background and training..."
                />
              ) : (
                <p className="text-gray-900">{provider.credentials?.education || 'N/A'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
              {editMode ? (
                <textarea
                  value={(provider.credentials?.certifications || []).join(', ')}
                  onChange={(e) => updateNestedField('credentials', 'certifications', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Enter certifications separated by commas"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(provider.credentials?.certifications || []).length > 0 ? (
                    provider.credentials.certifications.map((cert, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {cert}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No certifications listed</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>👥</span> Team Members ({(provider.teamMembers || []).length})
            </h2>
            {editMode && (
              <button onClick={addTeamMember} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
                <span>+</span> Add Team Member
              </button>
            )}
          </div>
          
          {(provider.teamMembers || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {provider.teamMembers.map((member, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:border-gray-300 transition-colors">
                  {editMode ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                          {member.photo ? (
                            <img src={member.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                              👤
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={member.photo || ''}
                          onChange={(e) => updateTeamMember(idx, 'photo', e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          placeholder="Photo URL"
                        />
                      </div>
                      <input
                        type="text"
                        value={member.name || ''}
                        onChange={(e) => updateTeamMember(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Full Name"
                      />
                      <input
                        type="text"
                        value={member.title || ''}
                        onChange={(e) => updateTeamMember(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Title/Role"
                      />
                      <input
                        type="text"
                        value={member.credentials || ''}
                        onChange={(e) => updateTeamMember(idx, 'credentials', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Credentials (e.g., MD, RN)"
                      />
                      <textarea
                        value={member.bio || ''}
                        onChange={(e) => updateTeamMember(idx, 'bio', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Short bio..."
                      />
                      <input
                        type="text"
                        value={(member.specialties || []).join(', ')}
                        onChange={(e) => updateTeamMember(idx, 'specialties', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Specialties (comma separated)"
                      />
                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={member.acceptsBookings !== false}
                            onChange={(e) => updateTeamMember(idx, 'acceptsBookings', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Accepts bookings</span>
                        </label>
                        <button
                          onClick={() => deleteTeamMember(idx)}
                          className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <span className="text-blue-600 text-xl font-medium">{member.name?.charAt(0) || '?'}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{member.name || 'Unnamed'}</div>
                          <div className="text-sm text-gray-600">{member.title}</div>
                          {member.credentials && (
                            <div className="text-xs text-blue-600 font-medium">{member.credentials}</div>
                          )}
                        </div>
                      </div>
                      {member.bio && (
                        <p className="text-sm text-gray-500 mb-2">{member.bio}</p>
                      )}
                      {member.specialties && member.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.specialties.map((spec, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                      {member.acceptsBookings && (
                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                          <span>✓</span> Accepts bookings
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">👥</span>
              <p className="text-gray-500">No team members added</p>
              {editMode && (
                <button onClick={addTeamMember} className="mt-2 text-blue-600 hover:underline">
                  + Add your first team member
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Agreement Tab */}
      {activeTab === 'agreement' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>✍️</span> Legal Agreement
          </h2>
          {provider.agreement ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                  <span>✓</span> Agreement Signed
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-gray-900">{provider.agreement.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Signed</label>
                  <p className="text-gray-900">
                    {provider.agreement.agreedDate 
                      ? new Date(provider.agreement.agreedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Version</label>
                  <p className="text-gray-900">{provider.agreement.version || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sections Initialed (16 sections)</label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {provider.agreement.initials && Object.entries(provider.agreement.initials).map(([section, initials]) => (
                    <div key={section} className="bg-green-100 text-green-800 rounded px-3 py-2 text-center">
                      <div className="text-xs text-green-600">§{section}</div>
                      <div className="font-mono font-bold">{initials}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
              <span className="text-4xl mb-2 block">⚠️</span>
              <p className="text-yellow-700 font-medium">Agreement Not Signed</p>
              <p className="text-yellow-600 text-sm mt-1">Provider has not completed the legal agreement yet.</p>
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
