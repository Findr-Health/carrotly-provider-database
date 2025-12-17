import React, { useState } from 'react';
import { ServiceCard } from '../components/services/ServiceCard';
import { AddServiceModal } from '../components/services/AddServiceModal';
import { EditServiceModal } from '../components/services/EditServiceModal';
import type { Service } from '../types';

const mockServices: Service[] = [
  { id: '1', name: 'Annual Physical Exam', category: 'Preventive', duration: 45, price: 15000, description: 'Comprehensive annual health checkup', active: true, bookingsLast30Days: 24 },
  { id: '2', name: 'Sick Visit', category: 'Acute Care', duration: 20, price: 10000, description: 'Evaluation and treatment for acute illness', active: true, bookingsLast30Days: 18 },
  { id: '3', name: 'Lab Work', category: 'Diagnostic', duration: 15, price: 5000, description: 'Blood draw and basic laboratory testing', active: true, bookingsLast30Days: 15 },
  { id: '4', name: 'Telehealth Consultation', category: 'Virtual', duration: 20, price: 7500, description: 'Virtual visit via video call', active: true, bookingsLast30Days: 12 },
];

const categories = ['All', 'Preventive', 'Acute Care', 'Chronic Care', 'Diagnostic', 'Virtual'];

export function Services({ onBack }: { onBack?: () => void }) {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddService = (newService: Omit<Service, 'id' | 'bookingsLast30Days'>) => {
    setServices([...services, { ...newService, id: String(Date.now()), bookingsLast30Days: 0 }]);
  };

  const handleEditService = (updatedService: Service) => {
    setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      setServices(services.filter(s => s.id !== serviceId));
    }
  };

  const handleToggleActive = (serviceId: string) => {
    setServices(services.map(s => s.id === serviceId ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <button onClick={onBack} className="text-gray-600 hover:text-gray-900 flex items-center space-x-1 mr-4">
                  <span>←</span>
                  <span>Back</span>
                </button>
              )}
            <img 
                src="/findr-logo.svg" 
                alt="Findr Health" 
                className="h-24 w-auto"
              />
              <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
            </div>   
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Your Services</h2>
              <p className="text-gray-600 mt-1">Manage your service offerings, prices, and availability</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition font-semibold shadow-md flex items-center space-x-2">
              <span>+</span>
              <span>Add New Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{services.length}</div>
              <div className="text-sm text-gray-600">Total Services</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{services.filter(s => s.active).length}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-2xl font-bold text-teal-600">{services.reduce((sum, s) => sum + s.bookingsLast30Days, 0)}</div>
              <div className="text-sm text-gray-600">Bookings (30 days)</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">${(services.reduce((sum, s) => sum + s.price, 0) / services.length / 100).toFixed(0)}</div>
              <div className="text-sm text-gray-600">Avg Price</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input type="text" placeholder="Search services..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => (
                <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${selectedCategory === category ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-3">Showing {filteredServices.length} of {services.length} services</div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600 mb-4">{searchQuery || selectedCategory !== 'All' ? 'Try adjusting your search or filters' : 'Get started by adding your first service'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
              <ServiceCard key={service.id} service={service} onEdit={() => setEditingService(service)} onDelete={() => handleDeleteService(service.id)} onToggleActive={() => handleToggleActive(service.id)} />
            ))}
          </div>
        )}
      </div>

      {showAddModal && <AddServiceModal onClose={() => setShowAddModal(false)} onSave={handleAddService} />}
      {editingService && <EditServiceModal service={editingService} onClose={() => setEditingService(null)} onSave={handleEditService} />}
    </div>
  );
}
