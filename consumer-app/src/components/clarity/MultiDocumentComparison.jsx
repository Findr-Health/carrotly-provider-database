/**
 * MultiDocumentComparison Component
 * P1 Feature: Side-by-side comparison of Bill vs EOB
 * Shows matches, mismatches, and combined action items
 */

import React, { useState } from 'react';
import './MultiDocumentComparison.css';

function MultiDocumentComparison({ correlation, onActionClick }) {
  const [expandedMismatch, setExpandedMismatch] = useState(null);

  if (!correlation || !correlation.correlated) {
    return null;
  }

  const { correlations, mismatches, summary, actionItems, insights } = correlation;
  const comparison = correlations[0] ? createComparisonRows(correlations[0]) : [];

  function createComparisonRows(pair) {
    const { bill, eob } = pair;
    
    return [
      {
        label: 'Service Date',
        bill: bill.extraction?.serviceDate || '—',
        eob: eob.extraction?.serviceDate || '—',
        match: true
      },
      {
        label: 'Provider',
        bill: bill.extraction?.provider?.name || '—',
        eob: eob.extraction?.provider?.name || '—',
        match: true
      },
      {
        label: 'Total Charged',
        bill: formatMoney(bill.extraction?.totals?.totalCharges),
        eob: formatMoney(eob.extraction?.totals?.billed),
        match: Math.abs(
          (bill.extraction?.totals?.totalCharges || 0) - 
          (eob.extraction?.totals?.billed || 0)
        ) < 10
      },
      {
        label: 'Insurance Paid',
        bill: formatMoney(bill.extraction?.totals?.insurancePayments) || 'Not shown',
        eob: formatMoney(eob.extraction?.totals?.insurancePaid),
        match: null // Different timing, can't compare
      },
      {
        label: 'You Owe',
        bill: formatMoney(bill.extraction?.totals?.amountDue),
        eob: formatMoney(eob.extraction?.totals?.patientResponsibility),
        match: Math.abs(
          (bill.extraction?.totals?.amountDue || 0) - 
          (eob.extraction?.totals?.patientResponsibility || 0)
        ) < 2,
        critical: true
      }
    ];
  }

  function formatMoney(amount) {
    if (amount === null || amount === undefined) return '—';
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return amount;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  return (
    <div className="multi-doc-comparison">
      {/* Summary Header */}
      <div className={`comparison-summary ${summary.status.toLowerCase()}`}>
        <span className="summary-icon">
          {summary.status === 'MATCH' ? '✓' : 
           summary.status === 'MISMATCH' ? '⚠️' : '🔍'}
        </span>
        <div className="summary-text">
          <h3>{summary.headline}</h3>
          <p>{summary.detail}</p>
        </div>
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="comparison-insights">
          {insights.map((insight, idx) => (
            <div key={idx} className={`insight ${insight.type.toLowerCase()}`}>
              <span className="insight-icon">
                {insight.type === 'SUCCESS' ? '✓' : 
                 insight.type === 'WARNING' ? '⚠️' : 'ℹ️'}
              </span>
              <span>{insight.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* Side-by-Side Comparison Table */}
      <div className="comparison-table">
        <div className="table-header">
          <div className="col-label"></div>
          <div className="col-bill">Your Bill</div>
          <div className="col-eob">Insurance EOB</div>
          <div className="col-status"></div>
        </div>
        
        {comparison.map((row, idx) => (
          <div 
            key={idx} 
            className={`table-row ${row.critical ? 'critical' : ''} ${row.match === false ? 'mismatch' : ''}`}
          >
            <div className="col-label">{row.label}</div>
            <div className="col-bill">{row.bill}</div>
            <div className="col-eob">{row.eob}</div>
            <div className="col-status">
              {row.match === true && <span className="status-match">✓</span>}
              {row.match === false && <span className="status-mismatch">!</span>}
              {row.match === null && <span className="status-na">—</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Mismatches Detail */}
      {mismatches && mismatches.length > 0 && (
        <div className="mismatches-section">
          <h4>Issues Found</h4>
          {mismatches.map((mismatch, idx) => (
            <div 
              key={idx} 
              className={`mismatch-card ${mismatch.severity.toLowerCase()}`}
              onClick={() => setExpandedMismatch(expandedMismatch === idx ? null : idx)}
            >
              <div className="mismatch-header">
                <span className="mismatch-icon">
                  {mismatch.severity === 'HIGH' ? '🚨' : '⚠️'}
                </span>
                <div className="mismatch-title">
                  <h5>{mismatch.title}</h5>
                  <span className={`severity-badge ${mismatch.severity.toLowerCase()}`}>
                    {mismatch.severity}
                  </span>
                </div>
                <span className="expand-icon">{expandedMismatch === idx ? '−' : '+'}</span>
              </div>
              
              <p className="mismatch-description">{mismatch.description}</p>
              
              {expandedMismatch === idx && (
                <div className="mismatch-details">
                  <div className="mismatch-values">
                    <div className="value-item">
                      <span className="value-label">Bill says:</span>
                      <span className="value-amount">{formatMoney(mismatch.billValue)}</span>
                    </div>
                    <div className="value-item">
                      <span className="value-label">EOB says:</span>
                      <span className="value-amount">{formatMoney(mismatch.eobValue)}</span>
                    </div>
                    <div className="value-item difference">
                      <span className="value-label">Difference:</span>
                      <span className="value-amount">{formatMoney(mismatch.difference)}</span>
                    </div>
                  </div>
                  
                  <div className="mismatch-recommendation">
                    <strong>What this means:</strong>
                    <p>{mismatch.recommendation}</p>
                  </div>
                  
                  {mismatch.action && (
                    <div className="mismatch-action">
                      <strong>What to do:</strong>
                      <p>{mismatch.action.detail}</p>
                      {mismatch.action.contactInfo && (
                        <a 
                          href={`tel:${mismatch.action.contactInfo}`} 
                          className="action-phone"
                        >
                          📞 {mismatch.action.contactInfo}
                        </a>
                      )}
                      {mismatch.action.scriptToUse && (
                        <div className="action-script">
                          <span className="script-label">What to say:</span>
                          <p>"{mismatch.action.scriptToUse}"</p>
                          <button 
                            className="copy-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(mismatch.action.scriptToUse);
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Combined Action Items */}
      {actionItems && actionItems.length > 0 && (
        <div className="combined-actions">
          <h4>Recommended Actions</h4>
          {actionItems.map((action, idx) => (
            <div key={idx} className="action-item">
              <span className="action-number">{idx + 1}</span>
              <div className="action-content">
                <h5>{action.action}</h5>
                <p>{action.detail}</p>
                {action.contactInfo && (
                  <a href={`tel:${action.contactInfo}`} className="action-contact">
                    📞 {action.contactInfo}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No mismatches - good news! */}
      {(!mismatches || mismatches.length === 0) && summary.status === 'MATCH' && (
        <div className="all-good-message">
          <span className="good-icon">🎉</span>
          <h4>Everything checks out!</h4>
          <p>Your bill matches what your insurance says you owe. You can proceed with payment.</p>
        </div>
      )}
    </div>
  );
}

export default MultiDocumentComparison;
