/**
 * Prompts Index
 * Findr Health - Clarity Platform
 * 
 * Exports all system prompts
 */

const { 
  clarityPrompt, 
  costNavigatorPrompt, 
  buildClarityPrompt, 
  buildCostNavigatorPrompt 
} = require('./costNavigator');

const { 
  documentAnalysisPrompt, 
  buildDocumentAnalysisPrompt 
} = require('./documentAnalysis');

const { 
  calculatorPrompt, 
  buildCalculatorPrompt,
  conditionMapping,
  mapCondition,
  determineTier,
  a1cToTier,
  bpToTier
} = require('./calculatorPrompt');

module.exports = {
  // Cost Navigator / Clarity Chat
  clarityPrompt,
  costNavigatorPrompt,
  buildClarityPrompt,
  buildCostNavigatorPrompt,
  
  // Document Analysis
  documentAnalysisPrompt,
  buildDocumentAnalysisPrompt,
  
  // Financial Risk Calculator
  calculatorPrompt,
  buildCalculatorPrompt,
  conditionMapping,
  mapCondition,
  determineTier,
  a1cToTier,
  bpToTier
};
