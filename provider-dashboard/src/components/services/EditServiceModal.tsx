import React, { useState } from 'react';
import type { Service } from '../../types';

interface EditServiceModalProps {
  service: Service;
  onClose: () => void;
  onSave: (service: Service) => void;
}

const categories = [
  "Acute Care", "Assessment", "Chiropractic", "Chronic Care", "Coaching",
  "Compounding", "Consultation", "Cosmetic", "Diagnostic", "Emergency",
  "Evaluation", "Facials", "Group", "Holistic", "IV Therapy", "Immunizations",
  "Injectables", "Labs", "Laser", "Massage", "Mindfulness", "Minor Procedures",
  "Nutrition", "Personal Training", "Physical Therapy", "Pilates", "Preventive",
  "Psychiatry", "Rapid Tests", "Restorative", "Screenings", "Testing", "Therapy",
  "Urgent Care", "Vaccinations", "Virtual", "Wellness", "Yoga"
];

export function EditServiceModal({ service, onClose, onSave }: EditServiceModalProps) {
  const [formData, setFormData] = useState({
    name: service.name,
    category: service.category,
    duration: service.duration,
    price: service.price / 100,
    description: service.description || '',
    active: service.active
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Service name is required';
    if (formData.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than $0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({ ...service, ...formData, price: Math.round(formData.price * 100) });
      onClose();
    }
  };

  const originalPrice = service.price / 100;
  const priceChange = formData.price - originalPrice;
  const priceChangePercent = originalPrice > 0 ? ((priceChange / originalPrice) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Service</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Service Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Annual Physical Exam"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (minutes) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                min="1"
                step="5"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.duration ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.duration && <p className="text-red-600 text-sm mt-1">{errors.duration}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
              
              {priceChange !== 0 && (
                <p className={`text-sm mt-1 font-medium ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent}%)
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what's included in this service..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">{formData.description.length} characters</p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Service is active and available for booking
            </label>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Service Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Bookings (30 days)</p>
                <p className="text-2xl font-bold text-teal-600">{service.bookingsLast30Days}</p>
              </div>
              <div>
                <p className="text-gray-600">Revenue (30 days)</p>
                <p className="text-2xl font-bold text-green-600">
                  ${((service.bookingsLast30Days * service.price) / 100).toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
