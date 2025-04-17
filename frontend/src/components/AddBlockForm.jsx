// --- AddBlockForm.jsx (No changes from the previous feature-rich version) ---
import React, { useState } from 'react';

const AddBlockForm = ({ onAddBlock, isMining }) => {
  const [blockData, setBlockData] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!blockData.trim() || isMining) return;
    onAddBlock(blockData);
    // Clear input after initiating mining
    setBlockData('');
  };

  return (
    <form className="add-block-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={blockData}
        onChange={(e) => setBlockData(e.target.value)}
        placeholder="Enter block data (string)"
        disabled={isMining}
        required
        aria-label="Block Data Input"
      />
      <button type="submit" disabled={isMining || !blockData.trim()}>
        {isMining ? 'Mining...' : 'Mine & Add Block'}
      </button>
       {isMining && <span className="spinner" aria-hidden="true"></span>}
    </form>
  );
};

export default AddBlockForm;