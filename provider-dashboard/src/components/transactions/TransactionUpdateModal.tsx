import React, { useState, useMemo } from 'react';
import type { Appointment, Adjustment } from '../../types';
import { Button } from '../common/Button';

interface TransactionUpdateModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onSave: (adjustments: Adjustment[], reason: string, status: string) => void;
}

// Quick-add service options
const QUICK_SERVICES = [
  { name: 'Strep Test', price: 25 },
  { name: 'Flu Test', price: 30 },
  { name: 'COVID-19 Test', price: 35 },
  { name: 'Rapid COVID Test', price: 40 },
  { name: 'Basic Lab Work', price: 50 },
  { name: 'Blood Pressure Check', price: 15 },
  { name: 'Urinalysis', price: 40 },
  { name: 'EKG/ECG', price: 100 },
];

export function TransactionUpdateModal({
  appointment,
  isOpen,
  onClose,
  onSave,
}: TransactionUpdateModalProps) {
  const [addedServices, setAddedServices] = useState<Adjustment[]>([]);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'completed' | 'no_show' | 'partial'>('completed');
  const [showCustomService, setShowCustomService] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const originalAmount = appointment.amount / 100;
  const additionalAmount = addedServices.reduce((sum, service) => sum + service.price, 0);
  const newTotal = originalAmount + additionalAmount;
  const maxAllowed = originalAmount * 1.15;
  const withinLimit = newTotal <= maxAllowed;
  const increasePercent = ((newTotal - originalAmount) / originalAmount * 100).toFixed(1);

  const addQuickService = (service: { name: string; price: number }) => {
    if (newTotal + service.price > maxAllowed) {
      alert(`Adding this service would exceed the 15% limit ($${maxAllowed.toFixed(2)})`);
      return;
    }
    setAddedServices([...addedServices, { name: service.name, price: service.price }]);
  };

  const addCustomService = () => {
    if (!customName.trim() || !customPrice) {
      alert('Please enter both service name and price');
      return;
    }
    const price = parseFloat(customPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (newTotal + price > maxAllowed) {
      alert(`Adding this service would exceed the 15% limit ($${maxAllowed.toFixed(2)})`);
      return;
    }
    setAddedServices([...addedServices, { name: customName, price }]);
    setCustomName('');
    setCustomPrice('');
    setShowCustomService(false);
  };

  const removeService = (index: number) => {
    setAddedServices(addedServices.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (addedServices.length > 0 && !reason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }
    if (!withinLimit) {
      alert('Adjustment exceeds 15% limit');
      return;
    }
    onSave(addedServices, reason, status);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {appointment.patientId.firstName[0]}{appointment.patientId.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {appointment.patientId.firstName} {appointment.patientId.lastName}
              </h2>
              <p className="text-sm text-gray-600">
                {new Date(appointment.scheduledFor).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Original Service */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Original Service</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{appointment.serviceId.name}</p>
                  <p className="text-sm text-gray-600">
                    {appointment.serviceId.duration} min • ${originalAmount.toFixed(2)}
                  </p>
                </div>
                <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded">
                  {appointment.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Quick-Add Services */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Add Additional Services</h3>
            <div className="grid grid-cols-4 gap-3">
              {QUICK_SERVICES.map((service) => {
                const wouldExceed = newTotal + service.price > maxAllowed;
                return (
                  <button
                    key={service.name}
                    onClick={() => addQuickService(service)}
                    disabled={wouldExceed}
                    className={`p-3 border-2 rounded-lg text-sm transition ${
                      wouldExceed
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-teal-500 hover:bg-teal-50'
                    }`}
                  >
                    <div className="font-medium">{service.name}</div>
                    <div className="text-xs text-gray-600 mt-1">+${service.price}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowCustomService(!showCustomService)}
              className="mt-3 text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              + Add Custom Service
            </button>

            {/* Custom Service Input */}
            {showCustomService && (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Additional Consultation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCustomService(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={addCustomService}>
                    Add Service
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Added Services List */}
          {addedServices.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Added Services</h3>
              <div className="space-y-2">
                {addedServices.map((service, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">{service.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-teal-700">+${service.price.toFixed(2)}</span>
                      <button
                        onClick={() => removeService(idx)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adjustment Reason */}
          {addedServices.length > 0 && (
            <div>
              <label className="block font-semibold text-gray-900 mb-2">
                Reason for Adjustment <span className="text-red-600">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain why additional services were needed (patient will see this)..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          )}

          {/* Total Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Original Amount:</span>
                <span>${originalAmount.toFixed(2)}</span>
              </div>

              {addedServices.length > 0 && (
                <>
                  <div className="flex justify-between text-teal-600">
                    <span>Additional Services:</span>
                    <span>+${additionalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                    <span>New Total:</span>
                    <span className={!withinLimit ? 'text-red-600' : ''}>
                      ${newTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 text-right">
                    Increase: {increasePercent}% (max 15%)
                  </div>

                  {!withinLimit && (
                    <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <span className="text-red-600 font-bold mr-2">⚠️</span>
                        <div>
                          <p className="text-sm font-semibold text-red-800">
                            Adjustment exceeds 15% limit
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            Maximum allowed: ${maxAllowed.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
            <div className="space-y-2">
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={status === 'completed'}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mr-3"
                />
                <span>✅ Mark as Completed</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="status"
                  value="no_show"
                  checked={status === 'no_show'}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mr-3"
                />
                <span>🔴 Mark as No-Show (charge 100%)</span>
              </label>
            </div>
          </div>

          {/* Patient Notification Preview */}
          {addedServices.length > 0 && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-2xl mr-3">📧</span>
                <div>
                  <p className="font-semibold text-teal-900">Patient will receive notification:</p>
                  <p className="text-sm text-teal-800 mt-1 italic">
                    "Your provider added {addedServices.length} service(s) to your visit on{' '}
                    {new Date(appointment.scheduledFor).toLocaleDateString()}. 
                    New total: ${newTotal.toFixed(2)}. Reason: {reason || '(pending)'}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!withinLimit || (addedServices.length > 0 && !reason.trim())}
            className="flex-1"
          >
            Save & Notify Patient
          </Button>
        </div>
      </div>
    </div>
  );
}
