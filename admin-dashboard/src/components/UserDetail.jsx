import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://fearless-achievement-production.up.railway.app/api';

export default function UserDetail({ user, onBack, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [saving, setSaving] = useState(false);
  
  // Password reset state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const updated = await response.json();
        onUpdate(updated);
        setEditing(false);
        alert('User updated successfully');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      alert('Error updating user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Change user status to ${newStatus}?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/users/${user._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const updated = await response.json();
        onUpdate(updated);
        alert('Status updated');
      }
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleResetPassword = async () => {
    setResetError('');
    setResetSuccess('');

    if (!newPassword || newPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setResettingPassword(true);
    try {
      const response = await fetch(`${API_URL}/users/${user._id}/admin-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetSuccess('Password reset successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowResetPassword(false);
        setResetSuccess('');
      }, 2000);

    } catch (error) {
      setResetError(error.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      deleted: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getAuthProviderInfo = (provider) => {
    const config = {
      google: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: '🔴', label: 'Google Account', desc: 'Signed up via Google OAuth' },
      apple: { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-800', icon: '🍎', label: 'Apple ID', desc: 'Signed up via Apple Sign-In' },
      facebook: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: '🔵', label: 'Facebook', desc: 'Signed up via Facebook Login' },
      email: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', icon: '✉️', label: 'Email & Password', desc: 'Traditional email registration' }
    };
    return config[provider] || config.email;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'payment', label: 'Payment' },
    { id: 'security', label: 'Security' },
    { id: 'activity', label: 'Activity' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Users
        </button>
        
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-600 font-bold text-xl">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status)}`}>
                {user.status}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {user.status === 'active' && (
              <button
                onClick={() => handleStatusChange('suspended')}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Suspend
              </button>
            )}
            {user.status === 'suspended' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                Reactivate
              </button>
            )}
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{user.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{user.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                ) : (
                  <p className="font-medium">{user.phone}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                  <p className="font-medium">{formatDate(user.dateOfBirth)?.split(',')[0]}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Age</label>
                  <p className="font-medium">{calculateAge(user.dateOfBirth)} years</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gender</label>
                <p className="font-medium capitalize">{user.gender?.replace('-', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Street</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.address?.street || ''}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                ) : (
                  <p className="font-medium">{user.address?.street || 'N/A'}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">City</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.address?.city || ''}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{user.address?.city || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">State</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.address?.state || ''}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{user.address?.state || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">ZIP</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.address?.zip || ''}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, zip: e.target.value}})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{user.address?.zip || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <p className="font-medium">{user.emergencyContact?.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <p className="font-medium">{user.emergencyContact?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Relationship</label>
                <p className="font-medium">{user.emergencyContact?.relationship || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Account Created</label>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last Login</label>
                <p className="font-medium">{formatDate(user.lastLogin) || 'Never'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Total Logins</label>
                <p className="font-medium">{user.loginCount || 0}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email Verified</label>
                <p className="font-medium">{user.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Authentication Method */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Authentication Method</h3>
            {(() => {
              const auth = getAuthProviderInfo(user.authProvider);
              return (
                <div className={`p-4 rounded-lg border ${auth.bg}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{auth.icon}</span>
                    <div>
                      <p className={`font-semibold ${auth.text}`}>{auth.label}</p>
                      <p className="text-sm text-gray-600">{auth.desc}</p>
                    </div>
                  </div>
                  {user.socialId && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className="block text-xs text-gray-500 mb-1">Social ID</label>
                      <p className="text-sm font-mono text-gray-700">{user.socialId}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {editing && (
            <div className="col-span-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'insurance' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Insurance Information</h3>
          {user.insurance?.hasInsurance ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Provider</label>
                <p className="font-medium">{user.insurance.provider || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Member ID</label>
                <p className="font-medium">{user.insurance.memberId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Group Number</label>
                <p className="font-medium">{user.insurance.groupNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Insurance Phone</label>
                <p className="font-medium">{user.insurance.insurancePhone || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No insurance information on file</p>
          )}
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          {user.paymentMethods?.length > 0 ? (
            <div className="space-y-4">
              {user.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      💳
                    </div>
                    <div>
                      <p className="font-medium capitalize">{method.type} •••• {method.lastFour}</p>
                      <p className="text-sm text-gray-500">
                        {method.nickname || `Expires ${method.expiryMonth}/${method.expiryYear}`}
                      </p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No payment methods on file</p>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Reset */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Password Management</h3>
            
            {!showResetPassword ? (
              <div>
                <p className="text-gray-600 mb-4">Reset this user's password. They will need to use the new password to log in.</p>
                <button
                  onClick={() => setShowResetPassword(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Reset Password
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-w-md">
                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {resetError}
                  </div>
                )}
                
                {resetSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {resetSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Re-enter password"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleResetPassword}
                    disabled={resettingPassword}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {resettingPassword ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                  <button
                    onClick={() => {
                      setShowResetPassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setResetError('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account Security Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Security Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last Password Change</label>
                <p className="font-medium">{formatDate(user.lastPasswordChange) || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email Verified</label>
                <p className="font-medium">{user.emailVerified ? '✅ Yes' : '❌ No'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Failed Login Attempts</label>
                <p className="font-medium">{user.failedLoginAttempts || 0}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Account Locked</label>
                <p className="font-medium">{user.lockUntil && new Date(user.lockUntil) > new Date() ? '🔒 Yes' : '🔓 No'}</p>
              </div>
            </div>
          </div>

          {/* Agreement Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Agreement Status</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Agreement Signed</label>
                <p className="font-medium">{user.agreement?.signed ? '✅ Yes' : '❌ No'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Agreement Version</label>
                <p className="font-medium">{user.agreement?.version || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Signed At</label>
                <p className="font-medium">{formatDate(user.agreement?.signedAt)}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">IP Address</label>
                <p className="font-medium">{user.agreement?.ipAddress || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Account created</p>
                <p className="text-xs text-gray-500">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            {user.agreement?.signedAt && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Agreement signed (v{user.agreement.version})</p>
                  <p className="text-xs text-gray-500">{formatDate(user.agreement.signedAt)}</p>
                </div>
              </div>
            )}
            {user.lastLogin && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Last login</p>
                  <p className="text-xs text-gray-500">{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            )}
            {user.lastPasswordChange && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Password changed</p>
                  <p className="text-xs text-gray-500">{formatDate(user.lastPasswordChange)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
