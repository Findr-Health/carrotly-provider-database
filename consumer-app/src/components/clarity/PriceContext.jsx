/**
 * PriceContext Component
 * P1 Feature: Geographic pricing comparison
 * Shows how charges compare to regional averages
 */

import React, { useState } from 'react';
import './PriceContext.css';

function PriceContext({ priceData, zipCode, onRequestZipCode }) {
  const [showAllItems, setShowAllItems] = useState(false);
  const [inputZip, setInputZip] = useState('');

  // If no price data yet, show ZIP input
  if (!priceData || !priceData.available) {
    return (
      <div className="price-context request-zip">
        <div className="zip-prompt">
          <span className="prompt-icon">📍</span>
          <div className="prompt-content">
            <h4>Want to see how these prices compare to your area?</h4>
            <p>Enter your ZIP code to compare charges to regional averages.</p>
          </div>
        </div>
        <div className="zip-input-group">
          <input
            type="text"
            placeholder="Enter ZIP code"
            maxLength={5}
            value={inputZip}
            onChange={(e) => setInputZip(e.target.value.replace(/\D/g, ''))}
          />
          <button 
            onClick={() => onRequestZipCode && onRequestZipCode(inputZip)}
            disabled={inputZip.length !== 5}
          >
            Compare Prices
          </button>
        </div>
      </div>
    );
  }

  const { summary, lineItems, insights, facilityType, region } = priceData;

  // Filter items with comparison data
  const itemsWithData = lineItems.filter(item => item.comparison !== null);
  const displayItems = showAllItems ? itemsWithData : itemsWithData.slice(0, 3);

  // Rating color mapping
  const getRatingColor = (rating) => {
    const colors = {
      'LOW': 'green',
      'TYPICAL': 'green',
      'ABOVE_AVERAGE': 'yellow',
      'HIGH': 'orange',
      'VERY_HIGH': 'red'
    };
    return colors[rating] || 'gray';
  };

  return (
    <div className="price-context">
      {/* Summary Header */}
      <div className={`price-summary ${summary.overallRating.toLowerCase().replace('_', '-')}`}>
        <div className="summary-header">
          <span className="summary-icon">
            {summary.overallRating === 'REASONABLE' ? '✓' :
             summary.overallRating === 'REVIEW_RECOMMENDED' ? '⚠️' : '📊'}
          </span>
          <div className="summary-content">
            <h3>Price Comparison for {region.replace('_', ' ')}</h3>
            <p>{summary.message}</p>
          </div>
        </div>

        {/* Overall stats */}
        <div className="price-stats">
          <div className="stat">
            <span className="stat-label">Your Total</span>
            <span className="stat-value">${summary.totalCharge?.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Regional Median</span>
            <span className="stat-value">${summary.totalRegionalMedian?.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">% of Median</span>
            <span className={`stat-value ${summary.percentOfMedian > 150 ? 'high' : summary.percentOfMedian < 80 ? 'low' : ''}`}>
              {summary.percentOfMedian}%
            </span>
          </div>
        </div>

        {/* Potential savings */}
        {summary.potentialSavings > 50 && (
          <div className="savings-callout">
            <span className="savings-icon">💰</span>
            <span>Potential savings opportunity: up to ${summary.potentialSavings.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="price-insights">
          {insights.map((insight, idx) => (
            <div key={idx} className={`insight ${insight.type.toLowerCase()}`}>
              <span className="insight-icon">
                {insight.type === 'CONTEXT' ? '🏥' :
                 insight.type === 'WARNING' ? '⚠️' :
                 insight.type === 'SAVINGS' ? '💡' : '✓'}
              </span>
              <div>
                <strong>{insight.title}</strong>
                <p>{insight.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Line Item Breakdown */}
      <div className="price-breakdown">
        <h4>Charge-by-Charge Comparison</h4>
        
        {displayItems.map((item, idx) => (
          <div key={idx} className="price-item">
            <div className="item-header">
              <div className="item-info">
                <span className="item-code">{item.code}</span>
                <span className="item-desc">{item.description}</span>
              </div>
              <span className={`rating-badge ${getRatingColor(item.comparison?.rating)}`}>
                {item.comparison?.rating?.replace('_', ' ')}
              </span>
            </div>
            
            <div className="price-bar-container">
              <div className="price-labels">
                <span className="label-low">${item.comparison?.regionalRange?.low}</span>
                <span className="label-median">Median: ${item.comparison?.regionalMedian}</span>
                <span className="label-high">${item.comparison?.regionalRange?.high}</span>
              </div>
              <div className="price-bar">
                <div className="bar-range"></div>
                <div 
                  className={`bar-marker ${getRatingColor(item.comparison?.rating)}`}
                  style={{
                    left: `${Math.min(100, Math.max(0, 
                      ((item.charge - item.comparison?.regionalRange?.low) / 
                       (item.comparison?.regionalRange?.high - item.comparison?.regionalRange?.low)) * 100
                    ))}%`
                  }}
                >
                  <span className="marker-value">${item.charge}</span>
                </div>
              </div>
            </div>
            
            <p className="item-explanation">{item.comparison?.explanation}</p>
          </div>
        ))}

        {itemsWithData.length > 3 && (
          <button 
            className="show-more-btn"
            onClick={() => setShowAllItems(!showAllItems)}
          >
            {showAllItems ? 'Show Less' : `Show ${itemsWithData.length - 3} More Items`}
          </button>
        )}

        {/* Items without data */}
        {lineItems.filter(i => i.comparison === null).length > 0 && (
          <p className="no-data-note">
            {lineItems.filter(i => i.comparison === null).length} item(s) could not be compared 
            (no regional data available for these codes)
          </p>
        )}
      </div>

      {/* Facility Type Context */}
      <div className="facility-context">
        <span className="facility-icon">🏥</span>
        <div>
          <strong>Facility Type: {facilityType.replace('_', ' ')}</strong>
          <p>Prices vary significantly by facility type. Hospital-based services typically cost 2-3x more than freestanding facilities.</p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="price-disclaimer">
        {priceData.disclaimer}
      </p>
    </div>
  );
}

export default PriceContext;
