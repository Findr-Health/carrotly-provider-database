/**
 * Healthcare Financial Risk Calculator
 * Findr Health - Clarity Platform
 * 
 * Calculates expected healthcare costs and compares insurance vs cash pay scenarios
 */

const riskData = require('../data/riskData.json');
const insuranceBenchmarks = require('../data/insuranceBenchmarks.json');

/**
 * Get age bracket for lookup tables
 */
function getAgeBracket(age) {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55-64';
}

/**
 * Get BMI category from BMI value
 */
function getBmiCategory(bmi) {
  if (bmi < 18.5) return 'under18_5';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  if (bmi < 35) return 'obese1';
  if (bmi < 40) return 'obese2';
  return 'obese3';
}

/**
 * Calculate base event probabilities for an individual
 */
function getBaseRates(age, sex) {
  const bracket = getAgeBracket(age);
  const sexKey = sex.toLowerCase() === 'female' ? 'female' : 'male';
  
  const rates = riskData.baseRates[sexKey][bracket];
  
  // Convert from per 1000 to probability
  const probabilities = {};
  for (const [event, rate] of Object.entries(rates)) {
    probabilities[event] = rate / 1000;
  }
  
  return probabilities;
}

/**
 * Calculate condition-adjusted risk multipliers
 */
function getConditionMultipliers(conditions) {
  const multipliers = {
    hospitalization: 1.0,
    cardiac: 1.0,
    cancer: 1.0,
    respiratory: 1.0,
    mentalHealth: 1.0
  };
  
  let totalAnnualCostAdd = 0;
  
  if (!conditions || conditions.length === 0) {
    return { multipliers, annualCostAdd: 0 };
  }
  
  for (const condition of conditions) {
    const conditionData = riskData.conditionTiers[condition.id];
    if (!conditionData) continue;
    
    const tierKey = `tier${condition.tier || 1}`;
    const tierData = conditionData[tierKey];
    if (!tierData) continue;
    
    // Apply relative risk multipliers (multiplicative for multiple conditions)
    if (tierData.hospitalizationRR) {
      multipliers.hospitalization *= tierData.hospitalizationRR;
    }
    if (tierData.cardiacRR) {
      multipliers.cardiac *= tierData.cardiacRR;
    }
    if (tierData.cancerRR) {
      multipliers.cancer *= tierData.cancerRR;
    }
    if (tierData.respiratoryRR) {
      multipliers.respiratory *= tierData.respiratoryRR;
    }
    if (tierData.mentalHealthRR) {
      multipliers.mentalHealth *= tierData.mentalHealthRR;
    }
    
    // Annual cost additions are additive
    totalAnnualCostAdd += tierData.annualCostAdd || 0;
  }
  
  return { multipliers, annualCostAdd: totalAnnualCostAdd };
}

/**
 * Calculate lifestyle risk multipliers
 */
function getLifestyleMultipliers(lifestyle) {
  const multipliers = {
    hospitalization: 1.0,
    cardiac: 1.0,
    cancer: 1.0,
    respiratory: 1.0,
    injury: 1.0
  };
  
  if (!lifestyle) return multipliers;
  
  // Smoking
  if (lifestyle.smoking && riskData.lifestyleFactors.smoking[lifestyle.smoking]) {
    const smokingData = riskData.lifestyleFactors.smoking[lifestyle.smoking];
    multipliers.hospitalization *= smokingData.hospitalizationRR || 1.0;
    multipliers.cardiac *= smokingData.cardiacRR || 1.0;
    multipliers.cancer *= smokingData.cancerRR || 1.0;
    multipliers.respiratory *= smokingData.respiratoryRR || 1.0;
  }
  
  // BMI
  if (lifestyle.bmi) {
    const bmiCategory = getBmiCategory(lifestyle.bmi);
    const bmiData = riskData.lifestyleFactors.bmi[bmiCategory];
    if (bmiData) {
      multipliers.hospitalization *= bmiData.hospitalizationRR || 1.0;
      multipliers.cardiac *= bmiData.cardiacRR || 1.0;
      multipliers.injury *= bmiData.injuryRR || 1.0;
    }
  }
  
  // Activity level
  if (lifestyle.activity && riskData.lifestyleFactors.activityLevel[lifestyle.activity]) {
    const activityData = riskData.lifestyleFactors.activityLevel[lifestyle.activity];
    multipliers.hospitalization *= activityData.hospitalizationRR || 1.0;
    multipliers.cardiac *= activityData.cardiacRR || 1.0;
    multipliers.injury *= activityData.injuryRR || 1.0;
  }
  
  // Alcohol
  if (lifestyle.alcohol && riskData.lifestyleFactors.alcoholUse[lifestyle.alcohol]) {
    const alcoholData = riskData.lifestyleFactors.alcoholUse[lifestyle.alcohol];
    multipliers.hospitalization *= alcoholData.hospitalizationRR || 1.0;
    multipliers.cardiac *= alcoholData.cardiacRR || 1.0;
    multipliers.injury *= alcoholData.injuryRR || 1.0;
  }
  
  return multipliers;
}

/**
 * Calculate family history multipliers
 */
function getFamilyHistoryMultipliers(familyHistory) {
  const multipliers = {
    cardiac: 1.0,
    cancer: 1.0,
    hospitalization: 1.0
  };
  
  if (!familyHistory) return multipliers;
  
  if (familyHistory.cardiacEarly) {
    const data = riskData.familyHistory.cardiacEarly;
    multipliers.cardiac *= data.cardiacRR || 1.0;
    multipliers.hospitalization *= data.hospitalizationRR || 1.0;
  }
  
  if (familyHistory.cancer) {
    const data = riskData.familyHistory.cancer;
    multipliers.cancer *= data.cancerRR || 1.0;
    multipliers.hospitalization *= data.hospitalizationRR || 1.0;
  }
  
  return multipliers;
}

/**
 * Calculate adjusted event probabilities for an individual
 */
function calculateAdjustedProbabilities(baseRates, conditionMult, lifestyleMult, familyMult) {
  const adjusted = {};
  
  // Hospitalization
  adjusted.hospitalization = Math.min(0.95, baseRates.hospitalization * 
    conditionMult.hospitalization * 
    lifestyleMult.hospitalization * 
    familyMult.hospitalization);
  
  // ER Visit (partially correlated with hospitalization)
  adjusted.erVisit = Math.min(0.95, baseRates.erVisit * 
    Math.sqrt(conditionMult.hospitalization) * 
    lifestyleMult.hospitalization);
  
  // Major Surgery
  adjusted.majorSurgery = Math.min(0.95, baseRates.majorSurgery * 
    conditionMult.hospitalization);
  
  // Cancer
  adjusted.cancerDiagnosis = Math.min(0.95, baseRates.cancerDiagnosis * 
    (conditionMult.cancer || 1.0) * 
    (lifestyleMult.cancer || 1.0) * 
    (familyMult.cancer || 1.0));
  
  // Cardiac Event
  adjusted.cardiacEvent = Math.min(0.95, baseRates.cardiacEvent * 
    (conditionMult.cardiac || 1.0) * 
    (lifestyleMult.cardiac || 1.0) * 
    (familyMult.cardiac || 1.0));
  
  // Serious Injury
  adjusted.seriousInjury = Math.min(0.95, baseRates.seriousInjury * 
    (lifestyleMult.injury || 1.0));
  
  // Mental Health Crisis
  adjusted.mentalHealthCrisis = Math.min(0.95, (baseRates.mentalHealthCrisis || 0.01) * 
    (conditionMult.mentalHealth || 1.0));
  
  // Pregnancy (if applicable)
  if (baseRates.pregnancy) {
    adjusted.pregnancy = baseRates.pregnancy;
  }
  
  return adjusted;
}

/**
 * Convert annual probability to multi-year probability
 */
function annualToMultiYear(annualProb, years) {
  return 1 - Math.pow(1 - annualProb, years);
}

/**
 * Calculate expected costs for events
 */
function calculateExpectedCosts(probabilities, years, useCashPricing = true) {
  const costKey = useCashPricing ? 'cash' : 'billed';
  const costs = riskData.eventCosts;
  
  let expectedTotal = 0;
  let percentile75Total = 0;
  let percentile90Total = 0;
  
  const eventCosts = {};
  
  for (const [event, annualProb] of Object.entries(probabilities)) {
    if (event === 'pregnancy') continue; // Handle separately
    
    const eventCostData = costs[event];
    if (!eventCostData) continue;
    
    const multiYearProb = annualToMultiYear(annualProb, years);
    
    const median = eventCostData[`${costKey}Median`] || 0;
    const p75 = eventCostData[`${costKey}75th`] || median * 1.5;
    const p90 = eventCostData[`${costKey}90th`] || median * 2.5;
    
    eventCosts[event] = {
      probability: multiYearProb,
      expectedCost: multiYearProb * median,
      p75Cost: multiYearProb * p75,
      p90Cost: multiYearProb * p90
    };
    
    expectedTotal += eventCosts[event].expectedCost;
    percentile75Total += eventCosts[event].p75Cost;
    percentile90Total += eventCosts[event].p90Cost;
  }
  
  return {
    byEvent: eventCosts,
    expected: expectedTotal,
    percentile75: percentile75Total,
    percentile90: percentile90Total
  };
}

/**
 * Calculate probability of major expense (>$5,000)
 */
function calculateMajorExpenseProbability(probabilities, years) {
  // Major expense likely from: hospitalization, surgery, cardiac, cancer, complicated pregnancy
  const majorEventProbs = [
    probabilities.hospitalization,
    probabilities.majorSurgery,
    probabilities.cardiacEvent,
    probabilities.cancerDiagnosis
  ].filter(p => p > 0);
  
  // Probability of at least one major event
  let probNone = 1;
  for (const annualProb of majorEventProbs) {
    const multiYearProb = annualToMultiYear(annualProb, years);
    probNone *= (1 - multiYearProb);
  }
  
  return 1 - probNone;
}

/**
 * Calculate probability of catastrophic expense (>$50,000)
 */
function calculateCatastrophicProbability(probabilities, years) {
  // Catastrophic from: cancer, cardiac, complicated surgery
  const catastrophicProbs = [
    probabilities.cancerDiagnosis * 0.7, // 70% of cancer costs are catastrophic
    probabilities.cardiacEvent * 0.5,    // 50% of cardiac events are catastrophic
    probabilities.majorSurgery * 0.15    // 15% of surgeries become catastrophic
  ].filter(p => p > 0);
  
  let probNone = 1;
  for (const annualProb of catastrophicProbs) {
    const multiYearProb = annualToMultiYear(annualProb, years);
    probNone *= (1 - multiYearProb);
  }
  
  return 1 - probNone;
}

/**
 * Calculate insurance scenario costs
 */
function calculateInsuranceScenario(expectedCosts, plan, years, familySize = 1) {
  const planData = insuranceBenchmarks.planTypes[plan];
  if (!planData) {
    return null;
  }
  
  // Calculate total premiums
  const premiumsPerYear = familySize === 1 
    ? (planData.premiums.individual?.['35-44'] || 500) * 12
    : (planData.premiums.family?.base || 1200) * 12;
  
  const totalPremiums = premiumsPerYear * years;
  
  // Calculate expected out-of-pocket
  const deductible = familySize === 1 
    ? planData.deductible.individual 
    : planData.deductible.family;
  
  const oopMax = familySize === 1 
    ? planData.oopMax.individual 
    : planData.oopMax.family;
  
  const coinsurance = planData.coinsurance || 0.2;
  
  // Expected OOP per year (simplified model)
  let expectedOopPerYear;
  const expectedPerYear = expectedCosts.expected / years;
  
  if (expectedPerYear <= deductible) {
    expectedOopPerYear = expectedPerYear;
  } else {
    const overDeductible = expectedPerYear - deductible;
    expectedOopPerYear = Math.min(
      deductible + (overDeductible * coinsurance),
      oopMax
    );
  }
  
  // Worst case is OOP max
  const worstCaseOop = oopMax * years;
  
  return {
    planName: planData.name,
    premiumsTotal: totalPremiums,
    premiumsPerYear: premiumsPerYear,
    expectedOopTotal: expectedOopPerYear * years,
    expectedTotal: totalPremiums + (expectedOopPerYear * years),
    worstCaseTotal: totalPremiums + worstCaseOop,
    maxExposure: totalPremiums + worstCaseOop,
    deductible: deductible,
    oopMax: oopMax
  };
}

/**
 * Calculate cash pay scenario
 */
function calculateCashScenario(member, years) {
  const baseRates = getBaseRates(member.age, member.sex);
  const { multipliers: conditionMult, annualCostAdd } = getConditionMultipliers(member.conditions);
  const lifestyleMult = getLifestyleMultipliers(member.lifestyle);
  const familyMult = getFamilyHistoryMultipliers(member.familyHistory);
  
  const adjustedProbs = calculateAdjustedProbabilities(baseRates, conditionMult, lifestyleMult, familyMult);
  const eventCosts = calculateExpectedCosts(adjustedProbs, years, true); // true = cash pricing
  
  // Add chronic condition costs
  const chronicCosts = annualCostAdd * years;
  
  // Add routine care
  const ageBracket = getAgeBracket(member.age);
  const routineCare = (riskData.routineCare[ageBracket]?.cashAnnual || 1500) * years;
  
  // Add planned events
  let plannedCosts = 0;
  if (member.plannedEvents) {
    if (member.plannedEvents.pregnancy) {
      plannedCosts += riskData.eventCosts.pregnancyRoutine.cashMedian;
    }
    if (member.plannedEvents.surgery) {
      plannedCosts += member.plannedEvents.surgeryEstimate || 15000;
    }
  }
  
  const totalExpected = eventCosts.expected + chronicCosts + routineCare + plannedCosts;
  
  // Calculate worst case (90th percentile of events + chronic + routine)
  const worstCase = eventCosts.percentile90 + chronicCosts + routineCare + plannedCosts;
  
  return {
    eventCosts: eventCosts.expected,
    chronicCosts: chronicCosts,
    routineCare: routineCare,
    plannedCosts: plannedCosts,
    expectedTotal: totalExpected,
    percentile75Total: eventCosts.percentile75 + chronicCosts + routineCare + plannedCosts,
    percentile90Total: worstCase,
    majorExpenseProb: calculateMajorExpenseProbability(adjustedProbs, years),
    catastrophicProb: calculateCatastrophicProbability(adjustedProbs, years),
    adjustedProbabilities: adjustedProbs
  };
}

/**
 * Calculate full risk assessment for an individual
 */
function calculateIndividualRisk(member) {
  const results = {
    member: {
      age: member.age,
      sex: member.sex,
      relationship: member.relationship || 'self'
    },
    oneYear: {},
    threeYear: {}
  };
  
  // Calculate for 1 year
  const cash1Year = calculateCashScenario(member, 1);
  results.oneYear.cashPay = cash1Year;
  results.oneYear.insurance = {
    bronze: calculateInsuranceScenario(cash1Year, 'bronze', 1),
    silver: calculateInsuranceScenario(cash1Year, 'silver', 1),
    gold: calculateInsuranceScenario(cash1Year, 'gold', 1)
  };
  
  // Calculate for 3 years
  const cash3Year = calculateCashScenario(member, 3);
  results.threeYear.cashPay = cash3Year;
  results.threeYear.insurance = {
    bronze: calculateInsuranceScenario(cash3Year, 'bronze', 3),
    silver: calculateInsuranceScenario(cash3Year, 'silver', 3),
    gold: calculateInsuranceScenario(cash3Year, 'gold', 3)
  };
  
  return results;
}

/**
 * Calculate family aggregate risk
 */
function calculateFamilyRisk(members) {
  const familyResults = {
    memberCount: members.length,
    members: [],
    oneYear: {
      totalExpected: 0,
      totalPercentile75: 0,
      totalPercentile90: 0,
      majorExpenseProb: 0,
      catastrophicProb: 0
    },
    threeYear: {
      totalExpected: 0,
      totalPercentile75: 0,
      totalPercentile90: 0,
      majorExpenseProb: 0,
      catastrophicProb: 0
    }
  };
  
  // Calculate probability that at least one member has major/catastrophic expense
  let probNoMajor1Year = 1;
  let probNoCatastrophic1Year = 1;
  let probNoMajor3Year = 1;
  let probNoCatastrophic3Year = 1;
  
  for (const member of members) {
    const memberResult = calculateIndividualRisk(member);
    familyResults.members.push(memberResult);
    
    // Sum expected costs
    familyResults.oneYear.totalExpected += memberResult.oneYear.cashPay.expectedTotal;
    familyResults.oneYear.totalPercentile75 += memberResult.oneYear.cashPay.percentile75Total;
    familyResults.oneYear.totalPercentile90 += memberResult.oneYear.cashPay.percentile90Total;
    
    familyResults.threeYear.totalExpected += memberResult.threeYear.cashPay.expectedTotal;
    familyResults.threeYear.totalPercentile75 += memberResult.threeYear.cashPay.percentile75Total;
    familyResults.threeYear.totalPercentile90 += memberResult.threeYear.cashPay.percentile90Total;
    
    // Calculate combined probabilities
    probNoMajor1Year *= (1 - memberResult.oneYear.cashPay.majorExpenseProb);
    probNoCatastrophic1Year *= (1 - memberResult.oneYear.cashPay.catastrophicProb);
    probNoMajor3Year *= (1 - memberResult.threeYear.cashPay.majorExpenseProb);
    probNoCatastrophic3Year *= (1 - memberResult.threeYear.cashPay.catastrophicProb);
  }
  
  familyResults.oneYear.majorExpenseProb = 1 - probNoMajor1Year;
  familyResults.oneYear.catastrophicProb = 1 - probNoCatastrophic1Year;
  familyResults.threeYear.majorExpenseProb = 1 - probNoMajor3Year;
  familyResults.threeYear.catastrophicProb = 1 - probNoCatastrophic3Year;
  
  // Calculate family insurance scenarios
  const familySize = members.length;
  familyResults.oneYear.insurance = {
    bronze: calculateInsuranceScenario({ expected: familyResults.oneYear.totalExpected }, 'bronze', 1, familySize),
    silver: calculateInsuranceScenario({ expected: familyResults.oneYear.totalExpected }, 'silver', 1, familySize),
    gold: calculateInsuranceScenario({ expected: familyResults.oneYear.totalExpected }, 'gold', 1, familySize)
  };
  
  familyResults.threeYear.insurance = {
    bronze: calculateInsuranceScenario({ expected: familyResults.threeYear.totalExpected }, 'bronze', 3, familySize),
    silver: calculateInsuranceScenario({ expected: familyResults.threeYear.totalExpected }, 'silver', 3, familySize),
    gold: calculateInsuranceScenario({ expected: familyResults.threeYear.totalExpected }, 'gold', 3, familySize)
  };
  
  return familyResults;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage
 */
function formatPercent(decimal) {
  return `${Math.round(decimal * 100)}%`;
}

/**
 * Generate human-readable output
 */
function generateReport(calculationResult, isFamily = false) {
  let report = '';
  
  if (isFamily) {
    report += `**Family Summary (${calculationResult.memberCount} members)**\n\n`;
    
    // Individual summaries
    for (const member of calculationResult.members) {
      const m = member.member;
      report += `**${m.relationship.charAt(0).toUpperCase() + m.relationship.slice(1)}, Age ${m.age}**\n`;
      report += `3-Year Expected: ${formatCurrency(member.threeYear.cashPay.expectedTotal)}\n`;
      report += `P(Major Expense): ${formatPercent(member.threeYear.cashPay.majorExpenseProb)}\n\n`;
    }
    
    // Family totals
    report += `---\n\n`;
    report += `**Combined Family Costs**\n\n`;
    report += `|                     | 1 YEAR | 3 YEARS |\n`;
    report += `|---------------------|--------|--------|\n`;
    report += `| Expected costs      | ${formatCurrency(calculationResult.oneYear.totalExpected)} | ${formatCurrency(calculationResult.threeYear.totalExpected)} |\n`;
    report += `| If moderate events  | ${formatCurrency(calculationResult.oneYear.totalPercentile75)} | ${formatCurrency(calculationResult.threeYear.totalPercentile75)} |\n`;
    report += `| If high-cost events | ${formatCurrency(calculationResult.oneYear.totalPercentile90)} | ${formatCurrency(calculationResult.threeYear.totalPercentile90)} |\n`;
    report += `| P(any major >$5K)   | ${formatPercent(calculationResult.oneYear.majorExpenseProb)} | ${formatPercent(calculationResult.threeYear.majorExpenseProb)} |\n`;
    report += `| P(catastrophic >$50K)| ${formatPercent(calculationResult.oneYear.catastrophicProb)} | ${formatPercent(calculationResult.threeYear.catastrophicProb)} |\n`;
    
  } else {
    const member = calculationResult;
    report += `**Individual Risk Assessment**\n\n`;
    
    report += `|                     | 1 YEAR | 3 YEARS |\n`;
    report += `|---------------------|--------|--------|\n`;
    report += `| Expected costs      | ${formatCurrency(member.oneYear.cashPay.expectedTotal)} | ${formatCurrency(member.threeYear.cashPay.expectedTotal)} |\n`;
    report += `| If moderate events  | ${formatCurrency(member.oneYear.cashPay.percentile75Total)} | ${formatCurrency(member.threeYear.cashPay.percentile75Total)} |\n`;
    report += `| If high-cost events | ${formatCurrency(member.oneYear.cashPay.percentile90Total)} | ${formatCurrency(member.threeYear.cashPay.percentile90Total)} |\n`;
    report += `| P(major >$5K)       | ${formatPercent(member.oneYear.cashPay.majorExpenseProb)} | ${formatPercent(member.threeYear.cashPay.majorExpenseProb)} |\n`;
    report += `| P(catastrophic >$50K)| ${formatPercent(member.oneYear.cashPay.catastrophicProb)} | ${formatPercent(member.threeYear.cashPay.catastrophicProb)} |\n`;
  }
  
  // Comparison table
  const data = isFamily ? calculationResult : calculationResult;
  const ins1 = data.oneYear.insurance.silver;
  const ins3 = data.threeYear.insurance.silver;
  const cash1 = isFamily ? data.oneYear.totalExpected : data.oneYear.cashPay.expectedTotal;
  const cash3 = isFamily ? data.threeYear.totalExpected : data.threeYear.cashPay.expectedTotal;
  
  report += `\n**Insurance vs Cash Pay Comparison**\n\n`;
  
  report += `*1-Year Outlook*\n`;
  report += `|                  | Insurance (Silver) | Cash Pay |\n`;
  report += `|------------------|-------------------|----------|\n`;
  report += `| Premiums         | ${formatCurrency(ins1.premiumsTotal)} | $0 |\n`;
  report += `| Expected OOP     | ${formatCurrency(ins1.expectedOopTotal)} | ${formatCurrency(cash1)} |\n`;
  report += `| **Expected Total** | **${formatCurrency(ins1.expectedTotal)}** | **${formatCurrency(cash1)}** |\n`;
  report += `| Worst case       | ${formatCurrency(ins1.maxExposure)} | ${formatCurrency(isFamily ? data.oneYear.totalPercentile90 : data.oneYear.cashPay.percentile90Total)} |\n`;
  
  const savings1 = ins1.expectedTotal - cash1;
  report += `| Difference       | | ${savings1 > 0 ? '+' : ''}${formatCurrency(Math.abs(savings1))} ${savings1 > 0 ? 'savings' : 'more'} |\n`;
  
  report += `\n*3-Year Outlook*\n`;
  report += `|                  | Insurance (Silver) | Cash Pay |\n`;
  report += `|------------------|-------------------|----------|\n`;
  report += `| Premiums         | ${formatCurrency(ins3.premiumsTotal)} | $0 |\n`;
  report += `| Expected OOP     | ${formatCurrency(ins3.expectedOopTotal)} | ${formatCurrency(cash3)} |\n`;
  report += `| **Expected Total** | **${formatCurrency(ins3.expectedTotal)}** | **${formatCurrency(cash3)}** |\n`;
  report += `| Worst case       | ${formatCurrency(ins3.maxExposure)} | ${formatCurrency(isFamily ? data.threeYear.totalPercentile90 : data.threeYear.cashPay.percentile90Total)} |\n`;
  
  const savings3 = ins3.expectedTotal - cash3;
  report += `| Difference       | | ${savings3 > 0 ? '+' : ''}${formatCurrency(Math.abs(savings3))} ${savings3 > 0 ? 'savings' : 'more'} |\n`;
  
  // Break-even analysis
  report += `\n**Break-Even Analysis**\n\n`;
  report += `• 1-Year: Insurance breaks even if costs exceed ${formatCurrency(ins1.premiumsTotal)}\n`;
  report += `• 3-Year: Insurance breaks even if costs exceed ${formatCurrency(ins3.premiumsTotal)}\n`;
  
  return report;
}

module.exports = {
  calculateIndividualRisk,
  calculateFamilyRisk,
  generateReport,
  getAgeBracket,
  getBmiCategory,
  formatCurrency,
  formatPercent
};
