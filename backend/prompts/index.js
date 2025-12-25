/**
 * Findr Health - Clarity System Prompts
 * 
 * Exports all system prompts for the Clarity platform.
 */

const { costNavigatorPrompt, buildCostNavigatorPrompt } = require('./costNavigator');
const { documentAnalysisPrompt, buildDocumentAnalysisPrompt } = require('./documentAnalysis');

module.exports = {
  // Cost Navigator (chat)
  costNavigatorPrompt,
  buildCostNavigatorPrompt,
  
  // Document Analysis
  documentAnalysisPrompt,
  buildDocumentAnalysisPrompt
};
