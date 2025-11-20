#!/bin/bash
echo "🎯 Creating Final Components - Setup 4/4 (Findr Health Branded)"

# Update Navbar with Findr Health branding
cat > src/components/Navbar.jsx << 'EOF'
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg">
                <span className="text-white text-xl font-bold">F</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">findr</span>
                <span className="text-xs text-gray-500 ml-1">Health</span>
              </div>
            </Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-lg text-sm font-medium transition">
              Dashboard
            </Link>
            <Link to="/providers" className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-lg text-sm font-medium transition">
              Providers
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
EOF

# Update Login with Findr Health branding
cat > src/components/Login.jsx << 'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-white text-3xl font-bold">F</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              findr <span className="text-teal-600">Health</span>
            </h1>
            <p className="text-gray-600 mt-2">Admin Portal</p>
          </div>
          {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                placeholder="admin@findrhealth.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-3 rounded-xl font-semibold transition shadow-lg disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Default: admin@carrotly.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# ProviderList
cat > src/components/ProviderList.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { providersAPI } from '../utils/api';

export default function ProviderList() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const { data } = await providersAPI.getAll({ limit: 100 });
      setProviders(data.providers);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load providers:', error);
      setLoading(false);
    }
  };

  const filtered = providers.filter(p => {
    const matchesSearch = p.practice_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Providers</h1>
          <p className="text-gray-600 mt-1">{filtered.length} providers found</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map(provider => (
              <tr key={provider.id} className="hover:bg-teal-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{provider.practice_name}</div>
                  <div className="text-sm text-gray-500">{provider.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {provider.city}, {provider.state}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {provider.provider_types.join(', ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    provider.status === 'approved' ? 'bg-green-100 text-green-800' :
                    provider.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {provider.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link to={`/providers/${provider.id}`} className="text-teal-600 hover:text-teal-700 font-medium">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
EOF

# ProviderDetail
cat > src/components/ProviderDetail.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providersAPI, servicesAPI } from '../utils/api';

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProvider();
    loadServices();
  }, [id]);

  const loadProvider = async () => {
    try {
      const { data } = await providersAPI.getById(id);
      setProvider(data.provider);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load provider:', error);
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const { data } = await servicesAPI.getByProvider(id);
      setServices(data.services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await providersAPI.updateStatus(id, newStatus);
      setProvider({ ...provider, status: newStatus });
      alert('Status updated successfully!');
    } catch (error) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div></div>;
  if (!provider) return <div className="text-center py-12 text-gray-600">Provider not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <button onClick={() => navigate('/providers')} className="text-teal-600 hover:text-teal-700 mb-2 flex items-center gap-1">
            <span>←</span> Back to Providers
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{provider.practice_name}</h1>
          <p className="text-gray-600 mt-1">{provider.provider_types.join(', ')}</p>
        </div>
        <div className="flex gap-2">
          {provider.status !== 'approved' && (
            <button onClick={() => updateStatus('approved')} className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-sm">
              Approve
            </button>
          )}
          {provider.status !== 'rejected' && (
            <button onClick={() => updateStatus('rejected')} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-sm">
              Reject
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <dl className="space-y-4">
            <div><dt className="text-sm text-gray-600 mb-1">Phone</dt><dd className="text-base font-medium text-gray-900">{provider.phone}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Email</dt><dd className="text-base font-medium text-gray-900">{provider.email}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Website</dt><dd className="text-base font-medium text-teal-600">{provider.website || 'N/A'}</dd></div>
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <dl className="space-y-4">
            <div><dt className="text-sm text-gray-600 mb-1">Address</dt><dd className="text-base font-medium text-gray-900">{provider.street_address}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">City, State</dt><dd className="text-base font-medium text-gray-900">{provider.city}, {provider.state} {provider.zip_code}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Source</dt><dd className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium inline-block">{provider.source}</dd></div>
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Services ({services.length})</h2>
        {services.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No services added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => (
              <div key={service.id} className="border border-gray-100 rounded-xl p-4 hover:border-teal-200 hover:bg-teal-50 transition">
                <h3 className="font-semibold text-gray-900">{service.service_name}</h3>
                <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-lg font-bold text-teal-600">${service.price}</span>
                  <span className="text-sm text-gray-500">{service.duration} min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
EOF

# App.jsx
cat > src/App.jsx << 'EOF'
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProviderList from './components/ProviderList';
import ProviderDetail from './components/ProviderDetail';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div></div>;
  return user ? children : <Navigate to="/" />;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/providers" element={<ProtectedRoute><Layout><ProviderList /></Layout></ProtectedRoute>} />
          <Route path="/providers/:id" element={<ProtectedRoute><Layout><ProviderDetail /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
EOF

# main.jsx
cat > src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

echo ""
echo "✅ ✅ ✅ ALL SETUP COMPLETE! ✅ ✅ ✅"
echo ""
echo "🎨 Findr Health Admin Dashboard is ready!"
echo ""
echo "🚀 Start with:"
echo "   npm run dev"
echo ""
echo "📱 Then open: http://localhost:5173"
echo "🔐 Login: admin@carrotly.com / admin123"
echo ""
