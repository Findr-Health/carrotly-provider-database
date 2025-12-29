import React, { useState, useEffect } from 'react';

// API functions
const API_BASE = 'https://fearless-achievement-production.up.railway.app/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

const fetchAdmins = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/admin/admins${queryString ? '?' + queryString : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch admins');
  return response.json();
};

const fetchRoles = async () => {
  const response = await fetch(`${API_BASE}/admin/roles`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch roles');
  return response.json();
};

const createAdmin = async (data) => {
  const response = await fetch(`${API_BASE}/admin/admins`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create admin');
  }
  return response.json();
};

const updateAdmin = async (id, data) => {
  const response = await fetch(`${API_BASE}/admin/admins/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update admin');
  }
  return response.json();
};

const deleteAdmin = async (id) => {
  const response = await fetch(`${API_BASE}/admin/admins/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete admin');
  }
  return response.json();
};

const resetPassword = async (id) => {
  const response = await fetch(`${API_BASE}/admin/admins/${id}/reset-password`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reset password');
  }
  return response.json();
};

// Role badge colors
const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  moderator: 'bg-green-100 text-green-700 border-green-200',
  support: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  analyst: 'bg-gray-100 text-gray-700 border-gray-200'
};

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  support: 'Support',
  analyst: 'Analyst'
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  suspended: 'bg-red-100 text-red-700'
};

// Role Badge Component
const RoleBadge = ({ role }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${ROLE_COLORS[role] || ROLE_COLORS.support}`}>
    {ROLE_LABELS[role] || role}
  </span>
);

// Status Badge Component
const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.inactive}`}>
    {status}
  </span>
);

// Admin Card Component
const AdminCard = ({ admin, onEdit, onDelete, onResetPassword, currentAdminId }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isCurrentUser = admin.id === currentAdminId;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-lg">
            {admin.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900">{admin.name}</h3>
              {isCurrentUser && (
                <span className="text-xs text-gray-500">(You)</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{admin.email}</p>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => { onEdit(admin); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit User
                </button>
                <button
                  onClick={() => { onResetPassword(admin); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Reset Password
                </button>
                {!isCurrentUser && (
                  <button
                    onClick={() => { onDelete(admin); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete User
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <RoleBadge role={admin.role} />
          <StatusBadge status={admin.status} />
        </div>
        <div className="text-xs text-gray-400">
          {admin.lastLoginAt ? (
            <>Last login: {new Date(admin.lastLoginAt).toLocaleDateString()}</>
          ) : (
            <>Never logged in</>
          )}
        </div>
      </div>
    </div>
  );
};

// Add/Edit User Modal
const UserModal = ({ isOpen, onClose, onSave, user, roles, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin',
    password: '',
    requirePasswordChange: true,
    status: 'active'
  });
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'admin',
        password: '',
        requirePasswordChange: false,
        status: user.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'admin',
        password: '',
        requirePasswordChange: true,
        status: 'active'
      });
    }
    setError('');
  }, [user, isOpen]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!user && !formData.password) {
      setError('Password is required for new users');
      return;
    }
    
    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    try {
      await onSave(formData, user?.id);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {user ? 'Edit User' : 'Add New User'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="john@example.com"
                disabled={!!user}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {roles.map(role => (
                  <option key={role.role} value={role.role}>
                    {ROLE_LABELS[role.role] || role.role}
                  </option>
                ))}
              </select>
              {roles.find(r => r.role === formData.role) && (
                <p className="mt-1 text-xs text-gray-500">
                  {roles.find(r => r.role === formData.role)?.description}
                </p>
              )}
            </div>
            
            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Min 8 characters"
                />
              </div>
            )}
            
            {!user && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requirePasswordChange"
                  checked={formData.requirePasswordChange}
                  onChange={(e) => setFormData({ ...formData, requirePasswordChange: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="requirePasswordChange" className="ml-2 text-sm text-gray-600">
                  Require password change on first login
                </label>
              </div>
            )}
            
            {user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : user ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, loading }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Users & Roles Component
const UsersRoles = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byRole: {} });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [activeTab, setActiveTab] = useState('all');
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  
  // Get current admin ID
  const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');
  
  useEffect(() => {
    loadData();
  }, [filters, activeTab, pagination.page]);
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (activeTab !== 'all') {
        params.role = activeTab;
      } else if (filters.role) {
        params.role = filters.role;
      }
      
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      const [adminsRes, rolesRes] = await Promise.all([
        fetchAdmins(params),
        fetchRoles()
      ]);
      
      setAdmins(adminsRes.admins || []);
      setCounts(adminsRes.counts || { total: 0, byRole: {} });
      setPagination(adminsRes.pagination || pagination);
      setRoles(rolesRes.roles || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveUser = async (formData, userId) => {
    setSaving(true);
    try {
      if (userId) {
        await updateAdmin(userId, formData);
      } else {
        await createAdmin(formData);
      }
      await loadData();
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    setSaving(true);
    try {
      await deleteAdmin(deletingUser.id);
      setShowDeleteModal(false);
      setDeletingUser(null);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleResetPassword = async () => {
    if (!resettingUser) return;
    
    setSaving(true);
    try {
      const result = await resetPassword(resettingUser.id);
      setTempPassword(result.temporaryPassword);
    } catch (err) {
      alert(err.message);
      setShowResetModal(false);
    } finally {
      setSaving(false);
    }
  };
  
  const tabs = [
    { key: 'all', label: 'All Users', count: counts.total },
    { key: 'super_admin', label: 'Super Admins', count: counts.byRole?.super_admin || 0 },
    { key: 'admin', label: 'Admins', count: counts.byRole?.admin || 0 },
    { key: 'moderator', label: 'Moderators', count: counts.byRole?.moderator || 0 },
    { key: 'support', label: 'Support', count: counts.byRole?.support || 0 },
    { key: 'analyst', label: 'Analysts', count: counts.byRole?.analyst || 0 }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-500 mt-1">Manage admin users and their permissions</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowUserModal(true); }}
          className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add User</span>
        </button>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPagination({ ...pagination, page: 1 }); }}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Search & Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
          <button onClick={loadData} className="ml-2 underline">Try again</button>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      )}
      
      {/* Users Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admins.map(admin => (
              <AdminCard
                key={admin.id}
                admin={admin}
                currentAdminId={currentAdmin.id}
                onEdit={(a) => { setEditingUser(a); setShowUserModal(true); }}
                onDelete={(a) => { setDeletingUser(a); setShowDeleteModal(true); }}
                onResetPassword={(a) => { setResettingUser(a); setTempPassword(''); setShowResetModal(true); }}
              />
            ))}
          </div>
          
          {admins.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No users found matching your criteria
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => { setShowUserModal(false); setEditingUser(null); }}
        onSave={handleSaveUser}
        user={editingUser}
        roles={roles}
        loading={saving}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingUser(null); }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${deletingUser?.name}? This action cannot be undone.`}
        confirmText="Delete"
        loading={saving}
      />
      
      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => { setShowResetModal(false); setResettingUser(null); setTempPassword(''); }} />
            
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reset Password</h2>
              
              {!tempPassword ? (
                <>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to reset the password for {resettingUser?.name}?
                    They will receive a temporary password and be required to change it on next login.
                  </p>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => { setShowResetModal(false); setResettingUser(null); }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetPassword}
                      disabled={saving}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
                    >
                      {saving ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-medium mb-2">Password Reset Successful!</p>
                    <p className="text-green-700 text-sm">
                      Send this temporary password to the user. They will be required to change it on their next login.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-500 mb-1">Temporary Password:</p>
                    <p className="font-mono text-lg font-bold text-gray-900">{tempPassword}</p>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setShowResetModal(false); setResettingUser(null); setTempPassword(''); }}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersRoles;
