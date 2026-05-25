'use strict';

const pdfParse = require('pdf-parse');

async function extractText(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF parse error:', err.message);
    // Return empty string rather than crashing
    return '';
  }
}

module.exports = { extractText };
