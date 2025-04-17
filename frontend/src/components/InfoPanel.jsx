// --- InfoPanel.jsx (No changes from the previous feature-rich version) ---
import React from 'react';

const InfoPanel = ({ blockData }) => {
  const renderData = (data) => {
      // Only attempt parse if it looks like a JSON string
      if (typeof data === 'string' && data.trim().startsWith('{') && data.trim().endsWith('}')) {
          try {
             return JSON.stringify(JSON.parse(data), null, 2);
          } catch (e) {
             // Fallback if parsing fails
             return data;
          }
      }
      // Handle non-string or non-JSON string data
      if (typeof data !== 'string') {
        return JSON.stringify(data, null, 2);
      }
      return data; // Return original string if not JSON-like
  };

  if (!blockData) {
    return (
      <div className="info-panel">
        <h2>Block Information</h2>
        <p>Click on a block to see its details.</p>
        <p>Click the <span className="wireframe-text">+ Add New</span> block to mine.</p>
        <p>Use controls (top-right) to validate or reset view.</p>
        <p>Click & drag background to pan.</p>
      </div>
    );
  }

  const wrapText = (text = '', maxLength = 30) => { // Default empty string
    if (!text || text.length <= maxLength) return text;
    const parts = [];
    for (let i = 0; i < text.length; i += maxLength) {
        parts.push(text.substring(i, i + maxLength));
    }
    // Join with newline for <pre>, or could use <br /> if not in <pre>
    return parts.join('\n');
  }

  return (
    <div className="info-panel">
      <h2>Block #{blockData.index} Details</h2>
      <div className="info-item"><strong>Timestamp:</strong> <span>{blockData.timestamp}</span></div>
      <div className="info-item data"><strong>Data:</strong> <pre>{renderData(blockData.data)}</pre></div>
      <div className="info-item"><strong>Nonce (PoW):</strong> <span>{blockData.nonce}</span></div>
      <div className="info-item hash"><strong>Prev Hash:</strong> <pre>{wrapText(blockData.previous_hash)}</pre></div>
      <div className="info-item hash"><strong>Hash:</strong> <pre>{wrapText(blockData.hash)}</pre></div>
    </div>
  );
};

export default InfoPanel;