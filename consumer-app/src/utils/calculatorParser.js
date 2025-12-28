/**
 * Parse Calculator JSON from AI Response
 * Extracts structured data wrapped in ```calculator_json``` tags
 */

/**
 * Extract calculator JSON from AI response
 * @param {string} content - The full AI response text
 * @returns {{ json: object|null, text: string }} - Parsed JSON and remaining text
 */
export function parseCalculatorResponse(content) {
  if (!content || typeof content !== 'string') {
    return { json: null, text: content || '' };
  }

  // Look for ```calculator_json ... ``` block
  const jsonRegex = /<calculator_json>\s*([\s\S]*?)<\/calculator_json>/;
  const match = content.match(jsonRegex);

  if (!match) {
    return { json: null, text: content };
  }

  try {
    const jsonString = match[1].trim();
    const json = JSON.parse(jsonString);
    
    // Validate it's a calculator assessment
    if (json.type !== 'calculator_assessment') {
      return { json: null, text: content };
    }

    // Remove the JSON block from the text
    const text = content.replace(jsonRegex, '').trim();

    return { json, text };
  } catch (error) {
    console.error('Failed to parse calculator JSON:', error);
    return { json: null, text: content };
  }
}

/**
 * Check if response contains calculator assessment
 * @param {string} content - The full AI response text
 * @returns {boolean}
 */
export function hasCalculatorAssessment(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  return content.includes('```calculator_json');
}

/**
 * Format message content for display
 * Handles both regular messages and calculator assessments
 * @param {string} content - The message content
 * @returns {{ type: 'text'|'calculator', data: any }}
 */
export function formatMessageContent(content) {
  const { json, text } = parseCalculatorResponse(content);
  
  if (json) {
    return {
      type: 'calculator',
      data: {
        assessment: json,
        summary: text
      }
    };
  }
  
  return {
    type: 'text',
    data: content
  };
}

export default {
  parseCalculatorResponse,
  hasCalculatorAssessment,
  formatMessageContent
};
