/**
 * Profile Page - User account and settings
 */

import React from 'react';
import './Profile.css';

function Profile() {
  // Mock user data - in production, this would come from auth context
  const user = {
    name: 'Guest User',
    email: 'guest@example.com',
    isLoggedIn: false,
  };

  const menuItems = [
    { id: 'history', label: 'Analysis History', icon: '📋', action: () => alert('Coming soon!') },
    { id: 'saved', label: 'Saved Documents', icon: '💾', action: () => alert('Coming soon!') },
    { id: 'insurance', label: 'Insurance Info', icon: '🏥', action: () => alert('Coming soon!') },
    { id: 'settings', label: 'Settings', icon: '⚙️', action: () => alert('Coming soon!') },
    { id: 'help', label: 'Help & Support', icon: '❓', action: () => alert('Coming soon!') },
    { id: 'feedback', label: 'Send Feedback', icon: '💬', action: () => alert('Coming soon!') },
  ];

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <h1>Profile</h1>
      </header>

      {/* User Card */}
      <div className="user-card">
        <div className="user-avatar">
          <span>👤</span>
        </div>
        <div className="user-info">
          {user.isLoggedIn ? (
            <>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </>
          ) : (
            <>
              <h2>Welcome to Findr Health</h2>
              <p>Sign in to save your analysis history</p>
            </>
          )}
        </div>
        {!user.isLoggedIn && (
          <button className="sign-in-btn" onClick={() => alert('Sign in coming soon!')}>
            Sign In
          </button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="profile-menu">
        {menuItems.map((item) => (
          <button key={item.id} className="menu-item" onClick={item.action}>
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            <span className="menu-arrow">›</span>
          </button>
        ))}
      </nav>

      {/* App Info */}
      <div className="app-info">
        <p className="app-version">Findr Health v1.0.0 (Beta)</p>
        <p className="app-legal">
          <a href="#privacy">Privacy Policy</a> • <a href="#terms">Terms of Service</a>
        </p>
      </div>

      {/* Beta Notice */}
      <div className="beta-notice">
        <span className="beta-badge">Beta</span>
        <p>You're using an early version of Findr Health. We'd love your feedback!</p>
      </div>
    </div>
  );
}

export default Profile;
