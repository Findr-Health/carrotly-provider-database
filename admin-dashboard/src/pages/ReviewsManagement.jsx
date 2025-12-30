import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, flagged
  const [selectedReview, setSelectedReview] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, flagged: 0 });

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/admin/reviews${params}`);
      setReviews(response.data.reviews || response.data);
      
      // Fetch stats
      const statsResponse = await api.get('/admin/reviews/stats');
      setStats(statsResponse.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId, status) => {
    try {
      await api.patch(`/admin/reviews/${reviewId}/status`, { status });
      setReviews(reviews.map(r => 
        r._id === reviewId ? { ...r, status } : r
      ));
      // Update stats
      fetchReviews();
    } catch (err) {
      alert('Failed to update review: ' + err.message);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setReviews(reviews.filter(r => r._id !== reviewId));
      setSelectedReview(null);
    } catch (err) {
      alert('Failed to delete review: ' + err.message);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    flagged: 'bg-red-100 text-red-800',
    removed: 'bg-gray-100 text-gray-800'
  };

  if (loading && reviews.length === 0) {
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
          ⭐ Reviews Management
        </h1>
        <p className="text-gray-600 mt-1">Moderate and manage user reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-gray-900">{stats.total || 0}</div>
          <div className="text-sm text-gray-600">Total Reviews</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-yellow-600">{stats.pending || 0}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-green-600">{stats.approved || 0}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-red-600">{stats.flagged || 0}</div>
          <div className="text-sm text-gray-600">Flagged</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-700 font-medium self-center mr-2">Filter:</span>
          {['all', 'pending', 'approved', 'flagged'].map((f) => (
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

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-2 block">📝</span>
            <p className="text-gray-500">No reviews found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-yellow-500 text-lg">{renderStars(review.rating)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[review.status]}`}>
                        {review.status}
                      </span>
                      {review.isVerifiedBooking && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>

                    {/* Provider */}
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Provider:</span>{' '}
                      {review.providerId?.practiceName || 'Unknown Provider'}
                    </div>

                    {/* User */}
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">By:</span>{' '}
                      {review.userId?.firstName} {review.userId?.lastName} ({review.userId?.email})
                    </div>

                    {/* Review Content */}
                    {review.title && (
                      <h4 className="font-medium text-gray-900">{review.title}</h4>
                    )}
                    {review.comment && (
                      <p className="text-gray-700 mt-1">{review.comment}</p>
                    )}

                    {/* Photos */}
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo.url || photo}
                            alt={`Review photo ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="text-xs text-gray-500 mt-2">
                      Submitted {new Date(review.createdAt).toLocaleDateString()} •{' '}
                      {review.helpfulCount || 0} found helpful
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {review.status !== 'approved' && (
                      <button
                        onClick={() => updateReviewStatus(review._id, 'approved')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        ✓ Approve
                      </button>
                    )}
                    {review.status !== 'flagged' && (
                      <button
                        onClick={() => updateReviewStatus(review._id, 'flagged')}
                        className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                      >
                        ⚠ Flag
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(review._id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
