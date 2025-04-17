// --- InfoPanel.jsx (Allow Data Editing) ---
import React, { useState, useEffect } from 'react';

const InfoPanel = ({ blockData, onTamperSave, isChainValid }) => {
    const [editableData, setEditableData] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Update editable data when the selected block changes
    useEffect(() => {
        if (blockData) {
            // Try to format nicely if it's JSON, otherwise use raw string
            try {
                 // Check if it's already an object/array (less likely from backend but possible)
                 if (typeof blockData.data !== 'string') {
                     setEditableData(JSON.stringify(blockData.data, null, 2));
                 } else if (blockData.data.trim().startsWith('{') || blockData.data.trim().startsWith('[')) {
                    // Format existing JSON string nicely
                     setEditableData(JSON.stringify(JSON.parse(blockData.data), null, 2));
                 } else {
                    // Use plain string data as is
                     setEditableData(blockData.data);
                 }
            } catch (e) {
                // Fallback for invalid JSON or other data types
                setEditableData(typeof blockData.data === 'string' ? blockData.data : JSON.stringify(blockData.data));
            }
            setIsEditing(false); // Reset editing state on block change
        } else {
             setEditableData(''); // Clear if no block selected
             setIsEditing(false);
        }
    }, [blockData]); // Dependency on selected block

    const handleDataChange = (event) => {
        setEditableData(event.target.value);
        // Optionally set isEditing to true implicitly on change
        if (!isEditing && blockData && blockData.index !== 0) { // Don't allow editing genesis
             setIsEditing(true);
        }
    };

    const handleSaveChanges = () => {
        if (!blockData || blockData.index === 0) return; // Should not happen if button disabled
        // Basic check: Is data actually changed? (optional)
        // if (editableData === blockData.data) return; // Or compare after formatting

        // Call the handler passed from App.jsx
        onTamperSave(blockData.index, editableData);
        setIsEditing(false); // Assume saved, disable button until next change?
    };

    // Helper to wrap long strings (hashes)
    const wrapText = (text = '', maxLength = 30) => {
        if (!text || text.length <= maxLength) return text;
        const parts = [];
        for (let i = 0; i < text.length; i += maxLength) {
            parts.push(text.substring(i, i + maxLength));
        }
        return parts.join('\n');
    }

    if (!blockData) {
        // Initial help text
        return (
            <div className="info-panel">
                <h2>Block Information</h2>
                <p>Click on a block to see its details.</p>
                <p>You can tamper with a block's data (except Genesis) to see how it breaks the chain!</p>
                <p>Use <span className="wireframe-text">+ Add New</span> to mine valid blocks.</p>
                <p>Use controls (top-right) to check validity or reset.</p>
            </div>
        );
    }

    const canEdit = blockData.index !== 0; // Cannot edit Genesis block

    return (
        <div className="info-panel">
             {/* Add warning if chain is invalid */}
             {!isChainValid && (
                 <div className="tamper-warning">
                     ⚠️ Chain Invalid! Further mining disabled until reset.
                 </div>
             )}

            <h2>Block #{blockData.index} Details {blockData.index === 0 ? "(Genesis)" : ""}</h2>
            <div className="info-item"><strong>Timestamp:</strong> <span>{blockData.timestamp}</span></div>

            {/* --- Data Field (Editable) --- */}
            <div className="info-item data">
                <strong>Data:</strong>
                <textarea
                    value={editableData}
                    onChange={handleDataChange}
                    rows={4} // Adjust rows as needed
                    readOnly={!canEdit} // Make Genesis read-only
                    disabled={!canEdit} // Disable for Genesis
                    aria-label="Block Data"
                    style={{ width: '95%', fontFamily: 'monospace', fontSize: '0.9em' }}
                />
                {/* Show save button only if editing is possible and data has potentially changed */}
                {canEdit && isEditing && (
                     <button onClick={handleSaveChanges} className="tamper-save-button">
                         Save Tampered Data
                     </button>
                 )}
                 {!canEdit && <small style={{display: 'block', marginTop: '5px'}}>(Genesis block data cannot be changed)</small>}
            </div>
            {/* --- End Data Field --- */}

            <div className="info-item"><strong>Nonce (PoW):</strong> <span>{blockData.nonce}</span></div>
            <div className="info-item hash"><strong>Prev Hash:</strong> <pre>{wrapText(blockData.previous_hash)}</pre></div>
            <div className="info-item hash"><strong>Hash:</strong> <pre>{wrapText(blockData.hash)}</pre></div>

        </div>
    );
};

export default InfoPanel;