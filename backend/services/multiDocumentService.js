/**
 * Multi-Document Analysis Service
 * P1 Feature: Correlate multiple documents (Bill + EOB) for the same visit
 * 
 * Key Features:
 * - Auto-correlate documents by date, provider, services
 * - Flag mismatches between bill and EOB amounts
 * - Side-by-side comparison view
 * - Combined action items
 */

/**
 * Correlate multiple analyzed documents
 * @param {Array} analyses - Array of individual document analyses
 * @returns {Object} Correlated analysis with mismatches and recommendations
 */
function correlateDocuments(analyses) {
  if (!analyses || analyses.length < 2) {
    return {
      correlated: false,
      reason: 'Need at least 2 documents to correlate',
      analyses: analyses
    };
  }

  // Separate by document type
  const bills = analyses.filter(a => a.documentType === 'BILL');
  const eobs = analyses.filter(a => a.documentType === 'EOB');

  // Try to find matching pairs
  const correlations = [];
  const mismatches = [];
  const warnings = [];

  for (const bill of bills) {
    for (const eob of eobs) {
      const match = attemptCorrelation(bill, eob);
      if (match.isMatch) {
        correlations.push({
          bill: bill,
          eob: eob,
          matchScore: match.score,
          matchFactors: match.factors
        });

        // Check for mismatches in the correlated pair
        const pairMismatches = findMismatches(bill, eob);
        mismatches.push(...pairMismatches);
      }
    }
  }

  // Generate combined insights
  const combinedInsights = generateCombinedInsights(correlations, mismatches);

  return {
    correlated: correlations.length > 0,
    correlationCount: correlations.length,
    correlations: correlations,
    mismatches: mismatches,
    warnings: warnings,
    insights: combinedInsights,
    summary: generateCorrelationSummary(correlations, mismatches),
    actionItems: generateCombinedActions(correlations, mismatches)
  };
}

/**
 * Attempt to correlate a bill with an EOB
 */
function attemptCorrelation(bill, eob) {
  const factors = [];
  let score = 0;

  // Factor 1: Service date match
  const billDate = bill.extraction?.serviceDate;
  const eobDate = eob.extraction?.serviceDate;
  if (billDate && eobDate) {
    const dateMatch = datesMatch(billDate, eobDate);
    factors.push({
      name: 'Service Date',
      billValue: billDate,
      eobValue: eobDate,
      match: dateMatch
    });
    if (dateMatch) score += 30;
  }

  // Factor 2: Provider name match
  const billProvider = bill.extraction?.provider?.name?.toLowerCase();
  const eobProvider = eob.extraction?.provider?.name?.toLowerCase();
  if (billProvider && eobProvider) {
    const providerMatch = stringSimilarity(billProvider, eobProvider) > 0.7;
    factors.push({
      name: 'Provider',
      billValue: bill.extraction?.provider?.name,
      eobValue: eob.extraction?.provider?.name,
      match: providerMatch
    });
    if (providerMatch) score += 25;
  }

  // Factor 3: Total amount similarity
  const billTotal = bill.extraction?.totals?.totalCharges || 0;
  const eobBilled = eob.extraction?.totals?.billed || 0;
  if (billTotal > 0 && eobBilled > 0) {
    const amountMatch = Math.abs(billTotal - eobBilled) < 10; // Within $10
    factors.push({
      name: 'Billed Amount',
      billValue: billTotal,
      eobValue: eobBilled,
      match: amountMatch,
      difference: Math.abs(billTotal - eobBilled)
    });
    if (amountMatch) score += 25;
  }

  // Factor 4: Patient name match
  const billPatient = bill.extraction?.patient?.name?.toLowerCase();
  const eobPatient = eob.extraction?.member?.name?.toLowerCase();
  if (billPatient && eobPatient) {
    const patientMatch = stringSimilarity(billPatient, eobPatient) > 0.8;
    factors.push({
      name: 'Patient Name',
      billValue: bill.extraction?.patient?.name,
      eobValue: eob.extraction?.member?.name,
      match: patientMatch
    });
    if (patientMatch) score += 20;
  }

  return {
    isMatch: score >= 50, // Need at least 50% match
    score: score,
    factors: factors
  };
}

/**
 * Find mismatches between correlated bill and EOB
 */
function findMismatches(bill, eob) {
  const mismatches = [];

  // Critical Mismatch 1: Bill amount vs EOB patient responsibility
  const billAmountDue = bill.extraction?.totals?.amountDue || 0;
  const eobPatientResp = eob.extraction?.totals?.patientResponsibility || 0;

  if (billAmountDue > 0 && eobPatientResp > 0) {
    const difference = billAmountDue - eobPatientResp;
    
    if (Math.abs(difference) > 1) { // More than $1 difference
      mismatches.push({
        type: 'AMOUNT_MISMATCH',
        severity: Math.abs(difference) > 100 ? 'HIGH' : 'MEDIUM',
        title: 'Bill doesn\'t match EOB',
        description: `Your bill shows you owe $${billAmountDue.toFixed(2)}, but your EOB says you should owe $${eobPatientResp.toFixed(2)}`,
        billValue: billAmountDue,
        eobValue: eobPatientResp,
        difference: difference,
        recommendation: difference > 0 
          ? `The bill is $${difference.toFixed(2)} MORE than your EOB says you owe. Do NOT pay the full bill amount until this is resolved.`
          : `The bill is $${Math.abs(difference).toFixed(2)} LESS than your EOB - this could be due to adjustments or credits.`,
        action: {
          priority: 1,
          action: 'Call billing to verify amount',
          detail: `Your bill shows $${billAmountDue.toFixed(2)} but your EOB says you owe $${eobPatientResp.toFixed(2)}. The EOB amount is usually correct.`,
          contactInfo: bill.extraction?.provider?.billingPhone || bill.extraction?.provider?.phone,
          scriptToUse: `Hi, I'm calling about account ${bill.extraction?.patient?.accountNumber || '[account number]'}. I received a bill for $${billAmountDue.toFixed(2)}, but my EOB from insurance shows I should owe $${eobPatientResp.toFixed(2)}. Can you help me understand why these amounts are different?`
        }
      });
    }
  }

  // Mismatch 2: Check if bill shows insurance wasn't applied
  const billInsurancePayments = bill.extraction?.totals?.insurancePayments || 0;
  const eobInsurancePaid = eob.extraction?.totals?.insurancePaid || 0;

  if (billInsurancePayments === 0 && eobInsurancePaid > 0) {
    mismatches.push({
      type: 'INSURANCE_NOT_APPLIED',
      severity: 'HIGH',
      title: 'Insurance payment not showing on bill',
      description: `Your EOB shows insurance paid $${eobInsurancePaid.toFixed(2)}, but your bill shows $0 insurance payments`,
      eobValue: eobInsurancePaid,
      billValue: billInsurancePayments,
      recommendation: 'Your bill may have been generated before insurance payment was posted. Do NOT pay full charges.',
      action: {
        priority: 1,
        action: 'Verify insurance payment was applied',
        detail: `Your insurance paid $${eobInsurancePaid.toFixed(2)} according to your EOB, but the bill doesn't show this credit yet.`,
        contactInfo: bill.extraction?.provider?.billingPhone,
        scriptToUse: `Hi, I'm calling about account ${bill.extraction?.patient?.accountNumber || '[account number]'}. I have an EOB showing my insurance paid $${eobInsurancePaid.toFixed(2)} on this claim, but my bill doesn't show any insurance payment. Can you verify the payment has been applied?`
      }
    });
  }

  // Mismatch 3: Line item count differences
  const billLineCount = bill.extraction?.lineItems?.length || 0;
  const eobLineCount = eob.extraction?.lineItems?.length || 0;

  if (billLineCount > 0 && eobLineCount > 0 && billLineCount !== eobLineCount) {
    mismatches.push({
      type: 'LINE_ITEM_COUNT_MISMATCH',
      severity: 'LOW',
      title: 'Different number of line items',
      description: `Bill has ${billLineCount} charges, EOB has ${eobLineCount} line items`,
      billValue: billLineCount,
      eobValue: eobLineCount,
      recommendation: 'This could be due to how charges are grouped. Check that all services are accounted for.'
    });
  }

  return mismatches;
}

/**
 * Generate combined insights from correlations
 */
function generateCombinedInsights(correlations, mismatches) {
  const insights = [];

  if (correlations.length > 0) {
    insights.push({
      type: 'SUCCESS',
      title: 'Documents matched',
      detail: `We found ${correlations.length} matching bill/EOB pair(s) for the same visit`
    });
  }

  if (mismatches.length === 0) {
    insights.push({
      type: 'SUCCESS',
      title: 'Amounts match',
      detail: 'Your bill matches what your EOB says you owe. This is a good sign!'
    });
  } else {
    const highSeverity = mismatches.filter(m => m.severity === 'HIGH');
    if (highSeverity.length > 0) {
      insights.push({
        type: 'WARNING',
        title: 'Important discrepancies found',
        detail: `Found ${highSeverity.length} issue(s) that need attention before paying`
      });
    }
  }

  return insights;
}

/**
 * Generate summary of correlation results
 */
function generateCorrelationSummary(correlations, mismatches) {
  if (correlations.length === 0) {
    return {
      headline: 'Documents could not be matched',
      detail: 'We couldn\'t find a clear connection between these documents. They may be for different visits.',
      status: 'INCONCLUSIVE'
    };
  }

  if (mismatches.length === 0) {
    return {
      headline: '✓ Bill matches your EOB',
      detail: 'Great news! The amount on your bill matches what your insurance says you owe.',
      status: 'MATCH'
    };
  }

  const criticalMismatches = mismatches.filter(m => m.severity === 'HIGH');
  if (criticalMismatches.length > 0) {
    return {
      headline: '⚠️ Bill and EOB don\'t match',
      detail: `Found ${criticalMismatches.length} important discrepancy(ies). Review before paying.`,
      status: 'MISMATCH'
    };
  }

  return {
    headline: 'Minor differences found',
    detail: 'Your documents have some small differences that are probably not a concern.',
    status: 'MINOR_DIFFERENCES'
  };
}

/**
 * Generate combined action items from correlation analysis
 */
function generateCombinedActions(correlations, mismatches) {
  const actions = [];

  // Add mismatch-specific actions
  mismatches.forEach(mismatch => {
    if (mismatch.action) {
      actions.push(mismatch.action);
    }
  });

  // If no mismatches, add standard confirmation action
  if (mismatches.length === 0 && correlations.length > 0) {
    const bill = correlations[0]?.bill;
    const eob = correlations[0]?.eob;
    
    actions.push({
      priority: 1,
      action: 'You can pay this bill',
      detail: 'The amount matches your EOB, so you can proceed with payment.',
      contactInfo: bill?.extraction?.provider?.billingPhone
    });
  }

  // Sort by priority
  return actions.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

/**
 * Helper: Check if two dates match (allowing for format variations)
 */
function datesMatch(date1, date2) {
  if (!date1 || !date2) return false;
  
  // Normalize dates
  const normalize = (d) => {
    const parsed = new Date(d);
    if (!isNaN(parsed)) {
      return parsed.toISOString().split('T')[0];
    }
    return d.replace(/[^\d]/g, '');
  };

  return normalize(date1) === normalize(date2);
}

/**
 * Helper: Simple string similarity (Jaccard-like)
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().split(/\s+/);
  const s2 = str2.toLowerCase().split(/\s+/);
  
  const intersection = s1.filter(word => s2.includes(word));
  const union = [...new Set([...s1, ...s2])];
  
  return intersection.length / union.length;
}

/**
 * Create comparison view data for UI
 */
function createComparisonView(correlation) {
  const { bill, eob } = correlation;

  return {
    serviceDate: {
      label: 'Service Date',
      bill: bill.extraction?.serviceDate,
      eob: eob.extraction?.serviceDate,
      match: datesMatch(bill.extraction?.serviceDate, eob.extraction?.serviceDate)
    },
    provider: {
      label: 'Provider',
      bill: bill.extraction?.provider?.name,
      eob: eob.extraction?.provider?.name,
      match: stringSimilarity(
        bill.extraction?.provider?.name || '',
        eob.extraction?.provider?.name || ''
      ) > 0.7
    },
    totalCharged: {
      label: 'Total Charged',
      bill: bill.extraction?.totals?.totalCharges,
      eob: eob.extraction?.totals?.billed,
      match: Math.abs(
        (bill.extraction?.totals?.totalCharges || 0) - 
        (eob.extraction?.totals?.billed || 0)
      ) < 10
    },
    insurancePaid: {
      label: 'Insurance Paid',
      bill: bill.extraction?.totals?.insurancePayments,
      eob: eob.extraction?.totals?.insurancePaid,
      match: null // N/A - different timing
    },
    youOwe: {
      label: 'You Owe',
      bill: bill.extraction?.totals?.amountDue,
      eob: eob.extraction?.totals?.patientResponsibility,
      match: Math.abs(
        (bill.extraction?.totals?.amountDue || 0) - 
        (eob.extraction?.totals?.patientResponsibility || 0)
      ) < 2,
      critical: true // This is the most important comparison
    }
  };
}

module.exports = {
  correlateDocuments,
  attemptCorrelation,
  findMismatches,
  createComparisonView,
  generateCombinedActions
};
