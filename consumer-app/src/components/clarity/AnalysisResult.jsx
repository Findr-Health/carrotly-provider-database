/**
 * AnalysisResult - Enhanced with P0 Improvements
 * 
 * P0 FEATURES:
 * 1. Confidence Scoring - Visual indicators when we're uncertain
 * 2. Math Validation - Shows calculation discrepancies
 * 3. Unknown Code Handling - Clearly marks unverified codes
 * 4. Tiered Output - Summary → Details → Deep Dive
 */

import React, { useState } from 'react';
import './AnalysisResult.css';

function AnalysisResult({ data, onNewAnalysis }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedSections, setExpandedSections] = useState({});
  const [showConfidenceDetails, setShowConfidenceDetails] = useState(false);

  const { analysis, extraction, confidence, validation } = data;
  
  if (!analysis) {
    return (
      <div className="analysis-error">
        <p>Unable to analyze this document. Please try a clearer image.</p>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // P0: Render confidence badge with level indicator
  const renderConfidenceBadge = () => {
    const level = confidence?.level || 'MODERATE';
    const score = confidence?.overall || 0.5;
    
    const levelConfig = {
      'HIGH': { label: 'High Confidence', color: 'high', icon: '✓' },
      'GOOD': { label: 'Good Confidence', color: 'good', icon: '✓' },
      'MODERATE': { label: 'Moderate Confidence', color: 'moderate', icon: '~' },
      'LOW': { label: 'Limited Confidence', color: 'low', icon: '!' }
    };
    
    const config = levelConfig[level] || levelConfig['MODERATE'];
    
    return (
      <div className="confidence-container">
        <button 
          className={`confidence-badge ${config.color}`}
          onClick={() => setShowConfidenceDetails(!showConfidenceDetails)}
          title="Click for details"
        >
          <span className="confidence-icon">{config.icon}</span>
          <span className="confidence-label">{config.label}</span>
          <span className="confidence-score">{Math.round(score * 100)}%</span>
        </button>
        
        {showConfidenceDetails && (
          <div className="confidence-details">
            <h4>Analysis Confidence Breakdown</h4>
            {confidence?.factors?.map((factor, idx) => (
              <div key={idx} className="confidence-factor">
                <span className="factor-name">{factor.name}</span>
                <div className="factor-bar">
                  <div 
                    className="factor-fill" 
                    style={{ width: `${factor.score * 100}%` }}
                  />
                </div>
                <span className="factor-score">{Math.round(factor.score * 100)}%</span>
              </div>
            ))}
            
            {confidence?.warnings?.length > 0 && (
              <div className="confidence-warnings">
                <h5>⚠️ Notes</h5>
                {confidence.warnings.map((warning, idx) => (
                  <p key={idx} className="warning-item">{warning.message}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // P0: Render validation alerts
  const renderValidationAlerts = () => {
    const alerts = [];
    
    // Math validation issues
    if (validation?.math && !validation.math.valid) {
      validation.math.issues.forEach((issue, idx) => {
        alerts.push({
          type: issue.severity === 'HIGH' ? 'warning' : 'info',
          title: 'Math Check',
          message: issue.message,
          suggestion: issue.suggestion
        });
      });
    }
    
    // Unknown codes
    if (validation?.codes?.summary?.unknownCodes > 0) {
      alerts.push({
        type: 'info',
        title: 'Unverified Codes',
        message: `${validation.codes.summary.unknownCodes} code(s) are not in our verified database. Explanations for these are based on document descriptions.`,
        suggestion: 'The explanations may not be 100% accurate for these codes.'
      });
    }
    
    if (alerts.length === 0) return null;
    
    return (
      <div className="validation-alerts">
        {alerts.map((alert, idx) => (
          <div key={idx} className={`validation-alert ${alert.type}`}>
            <span className="alert-icon">
              {alert.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <div className="alert-content">
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
              {alert.suggestion && (
                <p className="alert-suggestion">{alert.suggestion}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Get tiered data
  const tier1 = analysis.tier1_summary || analysis.summary || {};
  const tier2 = analysis.tier2_details || {};
  const tier3 = analysis.tier3_deepDive || {};

  return (
    <div className="analysis-result">
      {/* P0: Confidence Badge */}
      {renderConfidenceBadge()}
      
      {/* Summary Card - Tier 1 (Always Visible) */}
      <div className="result-summary-card">
        <div className="summary-header">
          <h3>{tier1.headline || analysis.summary?.headline || 'Document Analysis Complete'}</h3>
        </div>
        
        {tier1.amountDue && (
          <div className="amount-due-highlight">
            <span className="amount-label">Amount You Owe</span>
            <span className="amount-value">{tier1.amountDue}</span>
          </div>
        )}

        {tier1.quickAnswer && (
          <p className="quick-answer">{tier1.quickAnswer}</p>
        )}

        {tier1.keyTakeaway && (
          <div className="key-takeaway">
            <span className="takeaway-icon">💡</span>
            <p>{tier1.keyTakeaway}</p>
          </div>
        )}

        {/* Alert count badge */}
        {tier1.alertCount > 0 && (
          <div className="alert-badge">
            <span className="alert-count">{tier1.alertCount}</span>
            <span className="alert-text">item(s) to review</span>
          </div>
        )}
      </div>

      {/* P0: Validation Alerts */}
      {renderValidationAlerts()}

      {/* Tab Navigation - P0: Tiered Output */}
      <div className="result-tabs">
        <button 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button 
          className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          What To Do
        </button>
        <button 
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="tab-panel summary-panel">
            {/* Reassurance Message */}
            {analysis.reassurance && (
              <div className="reassurance-message">
                <p>{analysis.reassurance}</p>
              </div>
            )}

            {/* What This Is */}
            {(tier2.whatThisIs || analysis.explanation?.whatThisIs) && (
              <div className="explanation-section">
                <h4>What This Document Is</h4>
                <p>{tier2.whatThisIs || analysis.explanation?.whatThisIs}</p>
              </div>
            )}

            {/* What Happened */}
            {(tier2.whatHappened || analysis.explanation?.whatHappened) && (
              <div className="explanation-section">
                <h4>What Happened</h4>
                <p>{tier2.whatHappened || analysis.explanation?.whatHappened}</p>
              </div>
            )}

            {/* Financial Summary */}
            {(tier2.financialSummary || analysis.explanation?.financialSummary) && (
              <div className="explanation-section">
                <h4>The Money Part</h4>
                <p>{tier2.financialSummary || analysis.explanation?.financialSummary}</p>
              </div>
            )}

            {/* P0: Unknown Codes Warning */}
            {tier2.unknownCodes?.length > 0 && (
              <div className="unknown-codes-section">
                <h4>
                  <span className="section-icon">⚠️</span>
                  Codes We're Less Certain About
                </h4>
                <p className="section-note">
                  These codes aren't in our verified database. Explanations are based on document descriptions.
                </p>
                {tier2.unknownCodes.map((code, idx) => (
                  <div key={idx} className="unknown-code-item">
                    <span className="code-badge unverified">{code.code}</span>
                    <span className="code-desc">{code.description}</span>
                    <p className="code-inference">{code.inferredMeaning}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Observations */}
            {(tier2.observations || analysis.observations)?.length > 0 && (
              <div className="observations-section">
                <h4>Things to Note</h4>
                {(tier2.observations || analysis.observations).map((obs, idx) => (
                  <div key={idx} className={`observation-item ${obs.type?.toLowerCase()}`}>
                    <span className="observation-icon">
                      {obs.type === 'ACTION_NEEDED' ? '⚠️' : obs.type === 'REVIEW' ? '🔍' : 'ℹ️'}
                    </span>
                    <div className="observation-content">
                      <strong>{obs.title}</strong>
                      <p>{obs.detail}</p>
                      {obs.confidence && obs.confidence < 0.7 && (
                        <span className="low-confidence-note">
                          (Less certain about this)
                        </span>
                      )}
                      {obs.suggestedAction && (
                        <p className="suggested-action">→ {obs.suggestedAction}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="tab-panel actions-panel">
            {/* Priority Action Items */}
            {(tier2.topActions || analysis.actionItems)?.length > 0 && (
              <div className="action-items-section">
                <h4>Your Next Steps</h4>
                {(analysis.actionItems || tier2.topActions)
                  .sort((a, b) => (a.priority || 99) - (b.priority || 99))
                  .map((item, idx) => (
                    <div key={idx} className="action-item">
                      <div className="action-number">{idx + 1}</div>
                      <div className="action-content">
                        <h5>{item.action}</h5>
                        <p>{item.detail}</p>
                        
                        {item.contactInfo && (
                          <a href={`tel:${item.contactInfo}`} className="action-contact">
                            📞 {item.contactInfo}
                          </a>
                        )}
                        
                        {item.scriptToUse && (
                          <div className="action-script">
                            <span className="script-label">What to say:</span>
                            <p className="script-text">"{item.scriptToUse}"</p>
                            <button 
                              className="copy-script-btn"
                              onClick={() => {
                                navigator.clipboard.writeText(item.scriptToUse);
                                alert('Script copied!');
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        )}
                        
                        {item.deadline && (
                          <p className="action-deadline">⏰ {item.deadline}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Questions to Ask */}
            {analysis.questionsToAsk?.length > 0 && (
              <div className="questions-section">
                <h4>Questions to Ask</h4>
                {analysis.questionsToAsk.map((q, idx) => (
                  <div key={idx} className="question-item">
                    <div className="question-header">
                      <span className="question-who">Ask: {q.askWho}</span>
                      {q.phone && (
                        <a href={`tel:${q.phone}`} className="question-phone">
                          📞 {q.phone}
                        </a>
                      )}
                    </div>
                    <p className="question-text">"{q.question}"</p>
                    {q.whyAsk && (
                      <p className="question-why">Why: {q.whyAsk}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No actions available */}
            {(!analysis.actionItems || analysis.actionItems.length === 0) && 
             (!analysis.questionsToAsk || analysis.questionsToAsk.length === 0) && (
              <div className="no-actions">
                <p>No specific actions needed right now. This document appears to be informational.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="tab-panel details-panel">
            {/* P0: Math Validation Details */}
            {validation?.math?.checks?.length > 0 && (
              <div className="math-validation-section">
                <h4>
                  <span onClick={() => toggleSection('math')} className="section-toggle">
                    Math Verification {expandedSections.math ? '−' : '+'}
                  </span>
                </h4>
                {expandedSections.math && (
                  <div className="math-checks">
                    {validation.math.checks.map((check, idx) => (
                      <div key={idx} className={`math-check ${check.passed ? 'passed' : 'failed'}`}>
                        <span className="check-icon">{check.passed ? '✓' : '!'}</span>
                        <div className="check-details">
                          <strong>{check.name}</strong>
                          {check.formula && <p className="check-formula">{check.formula}</p>}
                          <p>Calculated: ${check.calculated?.toFixed(2)} | Stated: ${check.stated?.toFixed(2)}</p>
                          {!check.passed && (
                            <p className="check-difference">Difference: ${check.difference?.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Line Item Explanations with confidence */}
            {analysis.lineItemExplanations?.length > 0 && (
              <div className="line-items-section">
                <h4>Charges Explained</h4>
                {analysis.lineItemExplanations.map((item, idx) => (
                  <div key={idx} className="line-item">
                    <div className="line-item-header" onClick={() => toggleSection(`item-${idx}`)}>
                      <div className="line-item-left">
                        {item.code && (
                          <span className={`code-badge ${item.isVerified === false ? 'unverified' : 'verified'}`}>
                            {item.code}
                          </span>
                        )}
                        <span className="line-item-desc">{item.description}</span>
                      </div>
                      <div className="line-item-right">
                        <span className="line-item-amount">
                          {item.patientPays !== undefined && item.patientPays !== item.amount 
                            ? `You pay: $${item.patientPays?.toFixed(2) || '0.00'}`
                            : `$${item.amount?.toFixed(2) || '0.00'}`
                          }
                        </span>
                        <span className="expand-icon">{expandedSections[`item-${idx}`] ? '−' : '+'}</span>
                      </div>
                    </div>
                    {expandedSections[`item-${idx}`] && (
                      <div className="line-item-detail">
                        <p className="plain-language">{item.plainLanguage}</p>
                        
                        {/* P0: Show confidence for this item */}
                        {item.confidence && item.confidence < 0.8 && (
                          <p className="item-confidence-note">
                            <span className="confidence-indicator">
                              {item.confidence < 0.5 ? '⚠️' : 'ℹ️'}
                            </span>
                            {item.isVerified === false 
                              ? 'This code is not in our database - explanation based on document description'
                              : 'We\'re less certain about this explanation'
                            }
                          </p>
                        )}
                        
                        {item.notes && <p className="item-notes">{item.notes}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Glossary */}
            {analysis.glossary?.length > 0 && (
              <div className="glossary-section">
                <h4>
                  <span onClick={() => toggleSection('glossary')} className="section-toggle">
                    Terms Explained {expandedSections.glossary ? '−' : '+'}
                  </span>
                </h4>
                {expandedSections.glossary && (
                  <dl className="glossary-list">
                    {analysis.glossary.map((item, idx) => (
                      <div key={idx} className="glossary-item">
                        <dt>{item.term}</dt>
                        <dd>{item.definition}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}

            {/* Raw Data (for power users) */}
            {tier3.rawExtraction && (
              <div className="raw-data-section">
                <h4>
                  <span onClick={() => toggleSection('raw')} className="section-toggle">
                    Raw Extracted Data {expandedSections.raw ? '−' : '+'}
                  </span>
                </h4>
                {expandedSections.raw && (
                  <pre className="raw-data">
                    {JSON.stringify(tier3.rawExtraction, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="result-footer">
        <button className="footer-btn secondary" onClick={onNewAnalysis}>
          Analyze Another Document
        </button>
        <button 
          className="footer-btn primary"
          onClick={() => {
            alert('Save/share functionality coming soon!');
          }}
        >
          Save This Analysis
        </button>
      </div>

      {/* Disclaimer */}
      <p className="result-disclaimer">
        {confidence?.level === 'LOW' || confidence?.level === 'MODERATE' 
          ? '⚠️ This analysis has some uncertainties. Please verify important details with your provider or insurer.'
          : 'This analysis is for informational purposes only. Always verify information with your healthcare provider or insurance company.'
        }
      </p>
    </div>
  );
}

export default AnalysisResult;
