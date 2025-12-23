/**
 * Clarity API Service
 * Handles communication with the Findr Health backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-railway-backend.up.railway.app';

/**
 * Analyze a healthcare document
 * @param {File} file - The document file to analyze
 * @param {string} question - User's question or preset key
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeDocument(file, question = null) {
  const formData = new FormData();
  formData.append('document', file);
  
  if (question) {
    formData.append('question', question);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Analysis API error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to analyze document. Please check your connection and try again.'
    };
  }
}

/**
 * Classify a document (quick check if it's healthcare-related)
 * @param {File} file - The document file
 * @returns {Promise<Object>} Classification result
 */
export async function classifyDocument(file) {
  const formData = new FormData();
  formData.append('document', file);

  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/classify`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Classification API error:', error);
    return {
      success: false,
      isHealthcare: true, // Assume healthcare on error, let full analysis handle it
      error: error.message
    };
  }
}

/**
 * Get available preset questions
 * @returns {Promise<Object>} Presets data
 */
export async function getPresets() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/presets`);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Presets API error:', error);
    // Return default presets on error
    return {
      success: true,
      presets: [
        { key: 'what_does_this_mean', label: 'What does this document mean?' },
        { key: 'what_do_i_owe', label: 'What do I owe?' },
        { key: 'is_price_correct', label: 'Does this price look correct?' },
        { key: 'explain_this', label: 'Explain this to me' }
      ]
    };
  }
}

/**
 * Get suggested providers based on analysis
 * @param {string} analysisId - ID of the analysis
 * @param {string} category - Category of providers to suggest
 * @param {Object} location - User's location
 * @returns {Promise<Object>} Provider suggestions
 */
export async function getSuggestedProviders(analysisId, category, location = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/suggest-providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analysisId, category, location }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Provider suggestions API error:', error);
    return {
      success: false,
      providers: [],
      error: error.message
    };
  }
}

/**
 * Check API health
 * @returns {Promise<boolean>} True if API is healthy
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/health`);
    const data = await response.json();
    return data.success && data.status === 'operational';
  } catch (error) {
    return false;
  }
}

/**
 * P1: Analyze multiple documents and correlate them
 * @param {File[]} files - Array of document files
 * @param {string} zipCode - Optional ZIP code for pricing context
 * @returns {Promise<Object>} Combined analysis with correlations
 */
export async function analyzeMultipleDocuments(files, zipCode = null) {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('documents', file);
  });
  
  if (zipCode) {
    formData.append('zipCode', zipCode);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/analyze-multiple`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Multi-document API error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to analyze documents. Please try again.'
    };
  }
}

/**
 * P1: Get regional price context for an extraction
 * @param {Object} extraction - Document extraction data
 * @param {string} zipCode - 5-digit ZIP code
 * @returns {Promise<Object>} Price comparison data
 */
export async function getPriceContext(extraction, zipCode) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/price-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ extraction, zipCode }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Price check API error:', error);
    return {
      success: false,
      priceContext: { available: false },
      error: error.message
    };
  }
}

/**
 * P1: Correlate previously analyzed documents
 * @param {Object[]} analyses - Array of analysis results
 * @returns {Promise<Object>} Correlation results
 */
export async function correlateDocuments(analyses) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/correlate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analyses }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Correlation API error:', error);
    return {
      success: false,
      correlated: false,
      error: error.message
    };
  }
}

/**
 * Request expert consultation
 * @param {Object} requestData - Consultation request data
 * @returns {Promise<Object>} Request confirmation
 */
export async function requestExpertConsult(requestData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/expert-consult-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Expert consult API error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to submit request. Please try again.'
    };
  }
}

/**
 * Get expert consultation service info
 * @returns {Promise<Object>} Expert service information
 */
export async function getExpertInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/expert-info`);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Expert info API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  analyzeDocument,
  classifyDocument,
  getPresets,
  getSuggestedProviders,
  checkHealth,
  // P1 Features
  analyzeMultipleDocuments,
  getPriceContext,
  correlateDocuments,
  requestExpertConsult,
  getExpertInfo

  /**
 * Analyze a text-only question (no document)
 * @param {string} question - User's question
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeQuestion(question) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, textOnly: true }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Question API error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to process question. Please try again.'
    };
  }
}
};
