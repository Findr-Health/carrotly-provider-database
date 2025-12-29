import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const linkClass = (path) => `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive(path) 
      ? 'text-teal-600 bg-teal-50' 
      : 'text-gray-600 hover:text-teal-600'
  }`;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center">
              <img 
                src="/findr-logo.svg" 
                alt="Findr Health" 
                className="h-20 w-auto"
              />
            </Link>
            <Link to="/dashboard" className={linkClass('/dashboard')}>
              Dashboard
            </Link>
            <Link to="/providers" className={linkClass('/providers')}>
              Providers
            </Link>
            <Link to="/users" className={linkClass('/users')}>
              Users
            </Link>
            <Link to="/inquiries" className={linkClass('/inquiries')}>
              Inquiries
            </Link>
            <Link to="/price-database" className={linkClass('/price-database')}>
              Price Database
            </Link>
            <Link to="/feedback" className={linkClass('/feedback')}>
              AI Feedback
            </Link>
            <Link to="/analytics" className={linkClass('/analytics')}>
              Analytics
            </Link>
            <Link to="/admin-users" className={linkClass('/admin-users')}>
              Admin Users
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
