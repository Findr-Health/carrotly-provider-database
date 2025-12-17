import React from 'react';
import type { Service } from '../../types';

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export function ServiceCard({ service, onEdit, onDelete, onToggleActive }: ServiceCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md border-2 p-6 hover:shadow-lg transition ${service.active ? 'border-gray-200' : 'border-gray-300 opacity-60'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${service.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {service.active ? '✓ Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="relative group">
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button onClick={onEdit} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
              <span>✏️</span>
              <span>Edit Service</span>
            </button>
            <button onClick={onToggleActive} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
              <span>{service.active ? '⏸️' : '▶️'}</span>
              <span>{service.active ? 'Deactivate' : 'Activate'}</span>
            </button>
            <button onClick={onDelete} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
          {service.category}
        </span>
      </div>

      {service.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
      )}

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>⏱️</span>
            <span>Duration:</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{service.duration} min</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>💰</span>
            <span>Price:</span>
          </div>
          <span className="text-lg font-bold text-gray-900">${(service.price / 100).toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>📊</span>
            <span>Bookings (30d):</span>
          </div>
          <span className="text-sm font-semibold text-teal-600">{service.bookingsLast30Days}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={onEdit} className="flex-1 bg-teal-50 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-100 transition font-medium text-sm">
          Edit
        </button>
        <button onClick={() => alert('Analytics coming soon!')} className="flex-1 bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
          Analytics
        </button>
      </div>
    </div>
  );
}
