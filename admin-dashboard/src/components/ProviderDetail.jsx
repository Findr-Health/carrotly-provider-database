import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providersAPI, servicesAPI } from '../utils/api';
import axios from 'axios';

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    try {
      await Promise.all([loadProvider(), loadServices(), loadPhotos()]);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const loadProvider = async () => {
    const { data } = await providersAPI.getById(id);
    setProvider(data.provider);
  };

  const loadServices = async () => {
    const { data } = await servicesAPI.getByProvider(id);
    setServices(data.services || []);
  };

  const loadPhotos = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(
        `https://fearless-achievement-production.up.railway.app/api/admin/providers/${id}/photos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Photos loaded:', data.photos?.length || 0);
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Photo error:', error);
      setPhotos([]);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await providersAPI.updateStatus(id, newStatus);
      setProvider({ ...provider, status: newStatus });
      alert('Status updated!');
    } catch {
      alert('Failed to update status');
    }
  };

  const formatPrice = (cents) => {
    if (!cents) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!provider) return <div className="text-center py-12">Provider not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <button onClick={() => navigate('/providers')} className="text-teal-600 hover:text-teal-700 mb-2 flex items-center gap-1">
            ← Back
          </button>
          <h1 className="text-3xl font-bold">{provider.practice_name}</h1>
          <p className="text-gray-600">{provider.provider_types.join(', ')}</p>
        </div>
        <div className="flex gap-2">
          {provider.status !== 'approved' && (
            <button onClick={() => updateStatus('approved')} className="px-4 py-2 bg-green-500 text-white rounded-xl">Approve</button>
          )}
          {provider.status !== 'rejected' && (
            <button onClick={() => updateStatus('rejected')} className="px-4 py-2 bg-red-500 text-white rounded-xl">Reject</button>
          )}
        </div>
      </div>

      {photos.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Photos ({photos.length})</h2>
          <div className="grid grid-cols-3 gap-4">
            {photos.map((photo, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden border-2 hover:border-teal-400">
                <img src={photo.cloudinary_url} alt={`Photo ${i+1}`} className="w-full h-48 object-cover" />
                {photo.is_primary && (
                  <div className="absolute top-2 left-2 bg-teal-500 text-white px-2 py-1 rounded text-xs">Primary</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Contact</h2>
          <dl className="space-y-3">
            <div><dt className="text-sm text-gray-600">Phone</dt><dd className="font-medium">{provider.phone}</dd></div>
            <div><dt className="text-sm text-gray-600">Email</dt><dd className="font-medium">{provider.email}</dd></div>
            <div><dt className="text-sm text-gray-600">Website</dt><dd className="text-teal-600">{provider.website || 'N/A'}</dd></div>
          </dl>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Location</h2>
          <dl className="space-y-3">
            <div><dt className="text-sm text-gray-600">Address</dt><dd>{provider.street_address}</dd></div>
            <div><dt className="text-sm text-gray-600">City</dt><dd>{provider.city}, {provider.state} {provider.zip_code}</dd></div>
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Services ({services.length})</h2>
        {services.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No services</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {services.map(s => (
              <div key={s.id} className="border rounded-xl p-4 hover:border-teal-300">
                <h3 className="font-semibold">{s.service_name}</h3>
                <p className="text-sm text-gray-600 mt-2">{s.description}</p>
                <div className="flex justify-between mt-3 pt-3 border-t">
                  <span className="text-xl font-bold text-teal-600">{formatPrice(s.price_cents)}</span>
                  <span className="text-sm text-gray-500">{s.duration_minutes} min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
