/**
 * CalculatorResults Component
 * Renders structured calculator assessment as polished UI
 */

import React from 'react';

function CalculatorResults({ data }) {
  if (!data || data.type !== 'calculator_assessment') {
    return null;
  }

  const { profile, costs, premiums, probabilities, recommendation, recommendedPlan, reasoning, keyFactors, catastrophicExamples } = data;

  // Risk level colors
  const getRiskColor = (percent) => {
    if (percent < 20) return '#10B981'; // green
    if (percent < 40) return '#F59E0B'; // yellow
    if (percent < 60) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Risk level badge
  const RiskBadge = ({ level }) => {
    const colors = {
      low: { bg: '#D1FAE5', text: '#065F46' },
      'low-moderate': { bg: '#FEF3C7', text: '#92400E' },
      moderate: { bg: '#FED7AA', text: '#9A3412' },
      'moderate-high': { bg: '#FECACA', text: '#991B1B' },
      high: { bg: '#FEE2E2', text: '#991B1B' }
    };
    const color = colors[level] || colors.moderate;
    
    return (
      <span style={{
        backgroundColor: color.bg,
        color: color.text,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase'
      }}>
        {level} Risk
      </span>
    );
  };

  // Progress bar for probabilities
  const ProbabilityBar = ({ label, percent, subLabel }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: getRiskColor(percent) }}>
          {percent}%
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#E5E7EB',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${Math.min(percent, 100)}%`,
          height: '100%',
          backgroundColor: getRiskColor(percent),
          borderRadius: '4px',
          transition: 'width 0.5s ease'
        }} />
      </div>
      {subLabel && (
        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{subLabel}</span>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h2 style={styles.title}>💊 Healthcare Risk Assessment</h2>
          <RiskBadge level={profile.riskLevel} />
        </div>
        <p style={styles.subtitle}>
          {profile.age}{profile.sex === 'female' ? 'F' : 'M'}, {profile.state} 
          {profile.income && ` • ${formatCurrency(profile.income)} income`}
        </p>
      </div>

      {/* Risk Probabilities */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Risk Probabilities</h3>
        <div style={styles.probabilityGrid}>
          <div style={styles.probabilityColumn}>
            <span style={styles.columnLabel}>1 Year</span>
            <ProbabilityBar 
              label="Major expense (>$5K)" 
              percent={probabilities.majorExpense1yr} 
            />
            <ProbabilityBar 
              label="Catastrophic (>$50K)" 
              percent={probabilities.catastrophic1yr} 
            />
          </div>
          <div style={styles.probabilityColumn}>
            <span style={styles.columnLabel}>3 Years</span>
            <ProbabilityBar 
              label="Major expense (>$5K)" 
              percent={probabilities.majorExpense3yr} 
            />
            <ProbabilityBar 
              label="Catastrophic (>$50K)" 
              percent={probabilities.catastrophic3yr} 
            />
          </div>
        </div>
      </div>

      {/* Cost Comparison Table */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Cost Comparison</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}></th>
              <th style={styles.th}>1 Year</th>
              <th style={styles.th}>3 Years</th>
            </tr>
          </thead>
          <tbody>
            <tr style={styles.trAlt}>
              <td style={styles.td}>Cash Pay (Expected)</td>
              <td style={styles.tdValue}>{formatCurrency(costs.year1.cashExpected)}</td>
              <td style={styles.tdValue}>{formatCurrency(costs.year3.cashExpected)}</td>
            </tr>
            <tr>
              <td style={styles.td}>Cash Pay (Worst Case)</td>
              <td style={{ ...styles.tdValue, color: '#EF4444' }}>{formatCurrency(costs.year1.cashWorstCase)}</td>
              <td style={{ ...styles.tdValue, color: '#EF4444' }}>{formatCurrency(costs.year3.cashWorstCase)}</td>
            </tr>
            <tr style={styles.trAlt}>
              <td style={styles.td}>Insurance (Expected)</td>
              <td style={styles.tdValue}>{formatCurrency(costs.year1.insuranceExpected)}</td>
              <td style={styles.tdValue}>{formatCurrency(costs.year3.insuranceExpected)}</td>
            </tr>
            <tr>
              <td style={styles.td}>Insurance (Max Out-of-Pocket)</td>
              <td style={{ ...styles.tdValue, color: '#10B981' }}>{formatCurrency(costs.year1.insuranceMax)}</td>
              <td style={{ ...styles.tdValue, color: '#10B981' }}>{formatCurrency(costs.year3.insuranceMax)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Premium Comparison */}
      {premiums && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Insurance Options</h3>
          <div style={styles.premiumGrid}>
            {['bronze', 'silver', 'gold'].map((tier) => {
              const plan = premiums[tier];
              if (!plan) return null;
              const isRecommended = recommendedPlan === tier;
              
              return (
                <div 
                  key={tier} 
                  style={{
                    ...styles.premiumCard,
                    borderColor: isRecommended ? '#17DDC0' : '#E5E7EB',
                    borderWidth: isRecommended ? '2px' : '1px'
                  }}
                >
                  {isRecommended && (
                    <div style={styles.recommendedBadge}>Recommended</div>
                  )}
                  <h4 style={styles.planName}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</h4>
                  
                  <div style={styles.premiumDetail}>
                    <span style={styles.premiumLabel}>Full Premium</span>
                    <span style={styles.premiumFull}>{formatCurrency(plan.full)}/mo</span>
                  </div>
                  
                  {plan.subsidy > 0 && (
                    <div style={styles.premiumDetail}>
                      <span style={styles.premiumLabel}>Tax Credit</span>
                      <span style={styles.premiumSubsidy}>-{formatCurrency(plan.subsidy)}/mo</span>
                    </div>
                  )}
                  
                  <div style={styles.premiumNet}>
                    <span style={styles.premiumLabel}>Your Cost</span>
                    <span style={styles.premiumNetValue}>{formatCurrency(plan.net)}/mo</span>
                  </div>
                  
                  <div style={styles.planDetails}>
                    <div style={styles.planDetailRow}>
                      <span>Deductible</span>
                      <span>{formatCurrency(plan.deductible)}</span>
                    </div>
                    <div style={styles.planDetailRow}>
                      <span>Max Out-of-Pocket</span>
                      <span>{formatCurrency(plan.oopMax)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Catastrophic Examples */}
      {catastrophicExamples && catastrophicExamples.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>What Catastrophic Looks Like</h3>
          <div style={styles.examplesGrid}>
            {catastrophicExamples.map((example, i) => (
              <div key={i} style={styles.exampleCard}>
                <span style={styles.exampleEvent}>{example.event}</span>
                <span style={styles.exampleCost}>${example.cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div style={{
        ...styles.section,
        backgroundColor: recommendation === 'insurance' ? '#ECFDF5' : '#FEF3C7',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={styles.recommendationHeader}>
          <span style={styles.recommendationIcon}>
            {recommendation === 'insurance' ? '✅' : '⚖️'}
          </span>
          <h3 style={styles.recommendationTitle}>
            {recommendation === 'insurance' 
              ? 'Recommendation: Get Insurance' 
              : recommendation === 'cash_pay'
              ? 'Recommendation: Cash Pay May Work'
              : 'Recommendation: Consider Both Options'}
          </h3>
        </div>
        <p style={styles.recommendationText}>{reasoning}</p>
        
        {keyFactors && keyFactors.length > 0 && (
          <ul style={styles.factorsList}>
            {keyFactors.map((factor, i) => (
              <li key={i} style={styles.factorItem}>✓ {factor}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Disclaimer */}
      <p style={styles.disclaimer}>
        This calculator uses population-level statistics and general pricing data. 
        Your actual costs and risks may vary. This is not insurance or medical advice—
        consider consulting a licensed insurance broker for major decisions.
      </p>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '100%',
    fontFamily: 'Urbanist, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  header: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #E5E7EB'
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111827',
    margin: 0
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#6B7280',
    margin: 0
  },
  section: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  probabilityGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  probabilityColumn: {
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px'
  },
  columnLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B7280',
    display: 'block',
    marginBottom: '12px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem'
  },
  th: {
    textAlign: 'right',
    padding: '8px 12px',
    fontWeight: 600,
    color: '#6B7280',
    borderBottom: '2px solid #E5E7EB'
  },
  td: {
    padding: '10px 12px',
    color: '#374151',
    borderBottom: '1px solid #F3F4F6'
  },
  tdValue: {
    padding: '10px 12px',
    textAlign: 'right',
    fontWeight: 600,
    color: '#111827',
    borderBottom: '1px solid #F3F4F6'
  },
  trAlt: {
    backgroundColor: '#F9FAFB'
  },
  premiumGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  premiumCard: {
    padding: '16px',
    borderRadius: '12px',
    borderStyle: 'solid',
    position: 'relative'
  },
  recommendedBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#17DDC0',
    color: '#064E3B',
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '10px',
    textTransform: 'uppercase'
  },
  planName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '12px',
    textAlign: 'center'
  },
  premiumDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  premiumLabel: {
    fontSize: '0.75rem',
    color: '#6B7280'
  },
  premiumFull: {
    fontSize: '0.875rem',
    color: '#9CA3AF',
    textDecoration: 'line-through'
  },
  premiumSubsidy: {
    fontSize: '0.875rem',
    color: '#10B981'
  },
  premiumNet: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #E5E7EB'
  },
  premiumNetValue: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#111827'
  },
  planDetails: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px dashed #E5E7EB'
  },
  planDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#6B7280',
    marginBottom: '4px'
  },
  examplesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  exampleCard: {
    backgroundColor: '#FEF2F2',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  exampleEvent: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#991B1B',
    marginBottom: '4px'
  },
  exampleCost: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#DC2626'
  },
  recommendationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  recommendationIcon: {
    fontSize: '1.25rem'
  },
  recommendationTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#065F46',
    margin: 0
  },
  recommendationText: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: '12px'
  },
  factorsList: {
    margin: 0,
    padding: 0,
    listStyle: 'none'
  },
  factorItem: {
    fontSize: '0.8rem',
    color: '#065F46',
    marginBottom: '4px'
  },
  disclaimer: {
    fontSize: '0.7rem',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: '16px',
    lineHeight: 1.4
  }
};

export default CalculatorResults;
