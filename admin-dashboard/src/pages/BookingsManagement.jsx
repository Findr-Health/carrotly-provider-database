import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [stats, setStats] = useState({ 
    total: 0, 
    pending: 0, 
    confirmed: 0, 
    completed: 0, 
    cancelled: 0,
    revenue: 0 
  });

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/admin/bookings${params}`);
      setBookings(response.data.bookings || response.data);
      
      // Fetch stats
      const statsResponse = await api.get('/admin/bookings/stats');
      setStats(statsResponse.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    const confirmMsg = status === 'cancelled' 
      ? 'Are you sure you want to cancel this booking? The customer will be notified.'
      : `Change booking status to ${status}?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/admin/bookings/${bookingId}/status`, { status });
      setBookings(bookings.map(b => 
        b._id === bookingId ? { ...b, status } : b
      ));
      fetchBookings(); // Refresh stats
    } catch (err) {
      alert('Failed to update booking: ' + err.message);
    }
  };

  const processRefund = async (bookingId) => {
    if (!window.confirm('Process full refund for this booking?')) return;

    try {
      await api.post(`/admin/bookings/${bookingId}/refund`);
      fetchBookings();
      alert('Refund processed successfully');
    } catch (err) {
      alert('Failed to process refund: ' + err.message);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800'
  };

  const paymentStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    authorized: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-purple-100 text-purple-800',
    failed: 'bg-red-100 text-red-800'
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          📅 Bookings Management
        </h1>
        <p className="text-gray-600 mt-1">View and manage all appointments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-gray-900">{stats.total || 0}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-yellow-600">{stats.pending || 0}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-blue-600">{stats.confirmed || 0}</div>
          <div className="text-sm text-gray-600">Confirmed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-green-600">{stats.completed || 0}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-red-600">{stats.cancelled || 0}</div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-green-600">${stats.revenue?.toLocaleString() || 0}</div>
          <div className="text-sm text-gray-600">Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-700 font-medium self-center mr-2">Filter:</span>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-2 block">📅</span>
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  {/* Confirmation Code */}
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium text-blue-600">
                      {booking.confirmationCode}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {booking.userId?.firstName} {booking.userId?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.userId?.email}
                    </div>
                  </td>

                  {/* Provider */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {booking.providerId?.practiceName || 'Unknown'}
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{booking.serviceName}</div>
                    <div className="text-xs text-gray-500">{booking.serviceDuration} min</div>
                  </td>

                  {/* Date/Time */}
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{formatDate(booking.appointmentDate)}</div>
                    <div className="text-sm text-gray-600">{formatTime(booking.appointmentDate)}</div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      ${booking.totalAmount?.toFixed(2) || booking.servicePrice?.toFixed(2)}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${paymentStatusColors[booking.paymentStatus] || 'bg-gray-100'}`}>
                      {booking.paymentStatus || 'pending'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Confirm
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'completed')}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          Complete
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(booking.status) && (
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      )}
                      {booking.paymentStatus === 'paid' && booking.status === 'cancelled' && (
                        <button
                          onClick={() => processRefund(booking._id)}
                          className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                        >
                          Refund
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Booking Details
                </h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Confirmation */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Confirmation Code</div>
                  <div className="text-2xl font-mono font-bold text-blue-600">
                    {selectedBooking.confirmationCode}
                  </div>
                </div>

                {/* Status & Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedBooking.status]}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Payment</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColors[selectedBooking.paymentStatus]}`}>
                      {selectedBooking.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Customer */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Customer</h3>
                  <div className="text-gray-700">
                    {selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{selectedBooking.userId?.email}</div>
                  <div className="text-sm text-gray-500">{selectedBooking.userId?.phone}</div>
                </div>

                {/* Provider */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Provider</h3>
                  <div className="text-gray-700">
                    {selectedBooking.providerId?.practiceName}
                  </div>
                </div>

                {/* Service */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Service</h3>
                  <div className="text-gray-700">{selectedBooking.serviceName}</div>
                  <div className="text-sm text-gray-500">
                    {selectedBooking.serviceDuration} minutes • ${selectedBooking.servicePrice}
                  </div>
                </div>

                {/* Appointment */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Appointment</h3>
                  <div className="text-gray-700">
                    {formatDate(selectedBooking.appointmentDate)} at {formatTime(selectedBooking.appointmentDate)}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Payment</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Service:</div>
                    <div className="text-right">${selectedBooking.servicePrice?.toFixed(2)}</div>
                    <div className="text-gray-600">Service Fee:</div>
                    <div className="text-right">${selectedBooking.serviceFee?.toFixed(2) || '0.00'}</div>
                    <div className="text-gray-900 font-medium">Total:</div>
                    <div className="text-right font-medium">${selectedBooking.totalAmount?.toFixed(2)}</div>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.userNotes && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Customer Notes</h3>
                    <div className="text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedBooking.userNotes}
                    </div>
                  </div>
                )}

                {/* Cancellation Info */}
                {selectedBooking.status === 'cancelled' && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-red-600 mb-2">Cancellation</h3>
                    <div className="text-sm text-gray-600">
                      Cancelled by: {selectedBooking.cancelledBy}
                    </div>
                    {selectedBooking.cancellationReason && (
                      <div className="text-sm text-gray-600">
                        Reason: {selectedBooking.cancellationReason}
                      </div>
                    )}
                    {selectedBooking.cancelledAt && (
                      <div className="text-sm text-gray-600">
                        Date: {new Date(selectedBooking.cancelledAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Stripe ID */}
                {selectedBooking.stripePaymentIntentId && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Stripe</h3>
                    <div className="text-xs font-mono text-gray-500 break-all">
                      {selectedBooking.stripePaymentIntentId}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
