import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProviderList from './components/ProviderList';
import ProviderDetail from './components/ProviderDetail';
import UserList from './components/UserList';
import UserDetail from './components/UserDetail';
import InquiryQueue from './pages/InquiryQueue';
import PriceDatabase from './pages/PriceDatabase';

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

// Wrapper components for stateful views
function UsersPage() {
  const [selectedUser, setSelectedUser] = React.useState(null);
  
  if (selectedUser) {
    return (
      <UserDetail 
        user={selectedUser} 
        onBack={() => setSelectedUser(null)}
        onUpdate={(updated) => setSelectedUser(updated)}
      />
    );
  }
  
  return <UserList onSelectUser={setSelectedUser} />;
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
          <Route path="/users" element={<ProtectedRoute><Layout><UsersPage /></Layout></ProtectedRoute>} />
          <Route path="/inquiries" element={<ProtectedRoute><Layout><InquiryQueue /></Layout></ProtectedRoute>} />
          <Route path="/price-database" element={<ProtectedRoute><Layout><PriceDatabase /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
