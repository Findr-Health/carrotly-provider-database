/**
 * Feedback Dashboard Page
 * Admin Dashboard - Findr Health
 * 
 * View and manage AI response feedback from users
 */

import React, { useState, useEffect } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://fearless-achievement-production.up.railway.app').replace(/\/api\/?$/, '');

function FeedbackDashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    rating: '',
    status: '',
    interactionType: '',
    page: 1
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchStats();
    fetchFeedback();
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/admin/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setTrends(data.trends || []);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', filters.page);
      params.append('limit', 20);
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.status) params.append('status', filters.status);
      if (filters.interactionType) params.append('interactionType', filters.interactionType);
      
      const response = await fetch(`${API_BASE_URL}/api/feedback/admin?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFeedback(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load feedback');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id, status, adminNotes = null) => {
    try {
      const body = { status };
      if (adminNotes) body.adminNotes = adminNotes;
      
      const response = await fetch(`${API_BASE_URL}/api/feedback/admin/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh list
        fetchFeedback();
        fetchStats();
        setSelectedFeedback(null);
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncate = (text, length = 100) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Clarity Feedback Dashboard</h1>
        <p style={styles.subtitle}>Monitor and improve AI response quality</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Feedback</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #10B981' }}>
            <div style={{ ...styles.statValue, color: '#10B981' }}>{stats.positive}</div>
            <div style={styles.statLabel}>Positive ({stats.positiveRate?.toFixed(0) || 0}%)</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
            <div style={{ ...styles.statValue, color: '#EF4444' }}>{stats.negative}</div>
            <div style={styles.statLabel}>Negative</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #F59E0B' }}>
            <div style={{ ...styles.statValue, color: '#F59E0B' }}>{stats.newCount}</div>
            <div style={styles.statLabel}>Pending Review</div>
          </div>
        </div>
      )}

      {/* Trend Chart (Simple) */}
      {trends.length > 0 && (
        <div style={styles.trendSection}>
          <h3 style={styles.sectionTitle}>30-Day Trend</h3>
          <div style={styles.trendChart}>
            {trends.slice(-14).map((day, i) => (
              <div key={day.date} style={styles.trendBar}>
                <div style={styles.barContainer}>
                  <div 
                    style={{
                      ...styles.barPositive,
                      height: `${Math.min((day.positive / Math.max(...trends.map(t => t.total))) * 100, 100)}%`
                    }}
                  />
                  <div 
                    style={{
                      ...styles.barNegative,
                      height: `${Math.min((day.negative / Math.max(...trends.map(t => t.total))) * 100, 100)}%`
                    }}
                  />
                </div>
                <div style={styles.barLabel}>{day.date.split('-')[2]}</div>
              </div>
            ))}
          </div>
          <div style={styles.trendLegend}>
            <span style={styles.legendItem}><span style={{...styles.legendDot, backgroundColor: '#10B981'}}></span> Positive</span>
            <span style={styles.legendItem}><span style={{...styles.legendDot, backgroundColor: '#EF4444'}}></span> Negative</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <select 
          style={styles.filterSelect}
          value={filters.rating}
          onChange={(e) => setFilters({ ...filters, rating: e.target.value, page: 1 })}
        >
          <option value="">All Ratings</option>
          <option value="positive">👍 Positive</option>
          <option value="negative">👎 Negative</option>
        </select>
        
        <select 
          style={styles.filterSelect}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All Status</option>
          <option value="new">🆕 New</option>
          <option value="reviewed">👁️ Reviewed</option>
          <option value="actioned">✅ Actioned</option>
          <option value="dismissed">❌ Dismissed</option>
        </select>
        
        <select 
          style={styles.filterSelect}
          value={filters.interactionType}
          onChange={(e) => setFilters({ ...filters, interactionType: e.target.value, page: 1 })}
        >
          <option value="">All Types</option>
          <option value="chat">💬 Chat</option>
          <option value="document_analysis">📄 Document</option>
          <option value="calculator">🧮 Calculator</option>
        </select>
        
        <button 
          style={styles.refreshButton}
          onClick={() => { fetchStats(); fetchFeedback(); }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Feedback Table */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : feedback.length === 0 ? (
          <div style={styles.empty}>No feedback found</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rating</th>
                <th style={styles.th}>User Prompt</th>
                <th style={styles.th}>AI Response</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((item) => (
                <tr 
                  key={item._id} 
                  style={{
                    ...styles.tr,
                    backgroundColor: item.rating === 'negative' ? '#FEF2F2' : 'transparent'
                  }}
                >
                  <td style={styles.td}>
                    <span style={styles.ratingBadge}>
                      {item.rating === 'positive' ? '👍' : '👎'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.cellText}>{truncate(item.userPrompt, 80)}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.cellText}>{truncate(item.aiResponse, 120)}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>
                      {item.interactionType === 'calculator' ? '🧮' : 
                       item.interactionType === 'document_analysis' ? '📄' : '💬'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: 
                        item.status === 'new' ? '#FEF3C7' :
                        item.status === 'reviewed' ? '#DBEAFE' :
                        item.status === 'actioned' ? '#D1FAE5' : '#F3F4F6'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.dateText}>{formatDate(item.createdAt)}</div>
                  </td>
                  <td style={styles.td}>
                    <button 
                      style={styles.viewButton}
                      onClick={() => setSelectedFeedback(item)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={styles.pagination}>
          <button 
            style={styles.pageButton}
            disabled={filters.page <= 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          >
            ← Previous
          </button>
          <span style={styles.pageInfo}>
            Page {filters.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <button 
            style={styles.pageButton}
            disabled={filters.page >= pagination.pages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFeedback && (
        <div style={styles.modalOverlay} onClick={() => setSelectedFeedback(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                Feedback Detail {selectedFeedback.rating === 'positive' ? '👍' : '👎'}
              </h2>
              <button 
                style={styles.closeButton}
                onClick={() => setSelectedFeedback(null)}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.modalSection}>
                <label style={styles.modalLabel}>User Prompt:</label>
                <div style={styles.modalContent}>
                  {selectedFeedback.userPrompt || 'N/A'}
                </div>
              </div>
              
              <div style={styles.modalSection}>
                <label style={styles.modalLabel}>AI Response:</label>
                <div style={styles.modalContentLarge}>
                  {selectedFeedback.aiResponse}
                </div>
              </div>
              
              <div style={styles.modalRow}>
                <div style={styles.modalSection}>
                  <label style={styles.modalLabel}>Type:</label>
                  <div>{selectedFeedback.interactionType}</div>
                </div>
                <div style={styles.modalSection}>
                  <label style={styles.modalLabel}>Date:</label>
                  <div>{formatDate(selectedFeedback.createdAt)}</div>
                </div>
                <div style={styles.modalSection}>
                  <label style={styles.modalLabel}>Session:</label>
                  <div style={styles.sessionId}>{selectedFeedback.sessionId}</div>
                </div>
              </div>
              
              <div style={styles.modalSection}>
                <label style={styles.modalLabel}>Admin Notes:</label>
                <textarea 
                  style={styles.notesInput}
                  placeholder="Add notes about this feedback..."
                  defaultValue={selectedFeedback.adminNotes || ''}
                  id="adminNotes"
                />
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <div style={styles.statusButtons}>
                <button 
                  style={{...styles.statusButton, backgroundColor: '#DBEAFE'}}
                  onClick={() => updateFeedbackStatus(
                    selectedFeedback._id, 
                    'reviewed',
                    document.getElementById('adminNotes').value
                  )}
                >
                  👁️ Mark Reviewed
                </button>
                <button 
                  style={{...styles.statusButton, backgroundColor: '#D1FAE5'}}
                  onClick={() => updateFeedbackStatus(
                    selectedFeedback._id, 
                    'actioned',
                    document.getElementById('adminNotes').value
                  )}
                >
                  ✅ Mark Actioned
                </button>
                <button 
                  style={{...styles.statusButton, backgroundColor: '#F3F4F6'}}
                  onClick={() => updateFeedbackStatus(
                    selectedFeedback._id, 
                    'dismissed',
                    document.getElementById('adminNotes').value
                  )}
                >
                  ❌ Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: 'Urbanist, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#111827',
    margin: 0
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#6B7280',
    marginTop: '4px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #17DDC0'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#111827'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginTop: '4px'
  },
  trendSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '16px'
  },
  trendChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    height: '100px'
  },
  trendBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  barContainer: {
    width: '100%',
    height: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: '2px'
  },
  barPositive: {
    backgroundColor: '#10B981',
    borderRadius: '2px 2px 0 0',
    minHeight: '2px'
  },
  barNegative: {
    backgroundColor: '#EF4444',
    borderRadius: '0 0 2px 2px',
    minHeight: '2px'
  },
  barLabel: {
    fontSize: '0.7rem',
    color: '#9CA3AF',
    marginTop: '4px'
  },
  trendLegend: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    justifyContent: 'center'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: '#6B7280'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer'
  },
  refreshButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#17DDC0',
    color: '#064E3B',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #E5E7EB'
  },
  tr: {
    borderBottom: '1px solid #E5E7EB',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '12px 16px',
    fontSize: '0.875rem',
    color: '#374151',
    verticalAlign: 'top'
  },
  cellText: {
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  ratingBadge: {
    fontSize: '1.25rem'
  },
  typeBadge: {
    fontSize: '1rem'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'capitalize'
  },
  dateText: {
    fontSize: '0.8rem',
    color: '#6B7280'
  },
  viewButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6B7280'
  },
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#EF4444'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#6B7280'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '16px'
  },
  pageButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  pageInfo: {
    fontSize: '0.875rem',
    color: '#6B7280'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB'
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: '#6B7280'
  },
  modalBody: {
    padding: '24px'
  },
  modalSection: {
    marginBottom: '16px'
  },
  modalRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '16px'
  },
  modalLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: '4px',
    display: 'block'
  },
  modalContent: {
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    fontSize: '0.9rem',
    lineHeight: 1.5
  },
  modalContentLarge: {
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    fontSize: '0.875rem',
    lineHeight: 1.6,
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap'
  },
  sessionId: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: '#6B7280'
  },
  notesInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB'
  },
  statusButtons: {
    display: 'flex',
    gap: '8px'
  },
  statusButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer'
  }
};

export default FeedbackDashboard;
