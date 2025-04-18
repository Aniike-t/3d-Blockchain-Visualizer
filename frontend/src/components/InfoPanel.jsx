// --- InfoPanel.jsx (Handle Transaction List & Difficulty) ---
import React, { useState, useEffect } from 'react';

const InfoPanel = ({ blockData, onTamperSave, isChainValid, currentDifficulty }) => {
    const [editableData, setEditableData] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Update editable data when the selected block changes
    useEffect(() => {
        if (blockData) {
            // Always format the 'data' field (now a list) as JSON string
            try {
                setEditableData(JSON.stringify(blockData.data, null, 2)); // Pretty-print JSON
            } catch (e) {
                // Fallback if data isn't valid JSON for some reason (shouldn't happen)
                setEditableData(String(blockData.data));
            }
            setIsEditing(false); // Reset editing state on block change
        } else {
             setEditableData(''); // Clear if no block selected
             setIsEditing(false);
        }
    }, [blockData]); // Dependency on selected block

    const handleDataChange = (event) => {
        setEditableData(event.target.value);
        // Enable save button if not genesis and editing has started
        if (!isEditing && blockData && blockData.index !== 0) {
             setIsEditing(true);
        }
    };

    const handleSaveChanges = () => {
        if (!blockData || blockData.index === 0) return;

        let parsedData;
        try {
            // Try to parse back to ensure it's valid JSON before sending
            parsedData = JSON.parse(editableData);
            // We actually need to send the raw string for backend validation flexibility,
            // but parsing confirms it's valid JSON structure locally.
            // OR, you could send the parsed object if backend expects it.
            // Let's send the potentially modified *string* for now.
            // Backend validation will recalculate hash based on this string content.
        } catch (e) {
            alert("Invalid JSON format in data field. Please correct before saving.");
            return; // Don't save invalid JSON
        }

        // Call the handler passed from App.jsx with the raw (potentially tampered) string
        // The backend will handle hashing based on the received data structure.
        // Crucially, the backend MUST parse this string back into the list/object
        // when calculating the hash during validation or mining if it expects structure.
        // *Correction*: Let's send the parsed object to be less ambiguous, assuming backend handles it.
        onTamperSave(blockData.index, parsedData); // Pass the parsed object/array
        setIsEditing(false);
    };


    // Helper to wrap long strings (hashes)
    const wrapText = (text = '', maxLength = 30) => {
        if (!text || typeof text !== 'string' || text.length <= maxLength) return text;
        const parts = [];
        for (let i = 0; i < text.length; i += maxLength) {
            parts.push(text.substring(i, i + maxLength));
        }
        return parts.join('\n');
    }

    if (!blockData) {
        return (
            <div className="info-panel">
                <h2>Block Information</h2>
                <p>Click on a block to see its details.</p>
                <p>Add transactions using the form below.</p>
                <p>Click <span className="wireframe-text">+ Mine Pending</span> on the ghost block to mine.</p>
                <p>Use controls (top-right) to check validity or reset.</p>
                 {/* Display current difficulty globally */}
                 <p><strong>Current Mining Difficulty:</strong> {currentDifficulty || 'Loading...'}</p>
            </div>
        );
    }

    const canEdit = blockData.index !== 0; // Cannot edit Genesis block
    const targetPrefix = '0'.repeat(blockData.difficulty); // Show PoW target

    return (
        <div className="info-panel">
             {!isChainValid && (
                 <div className="tamper-warning">
                     ⚠️ Chain Invalid! Mining disabled until reset.
                 </div>
             )}

            <h2>Block #{blockData.index} Details {blockData.index === 0 ? "(Genesis)" : ""}</h2>
            <div className="info-item"><strong>Timestamp:</strong> <span>{blockData.timestamp}</span></div>
            <div className="info-item"><strong>Difficulty:</strong> <span>{blockData.difficulty} (Target: {targetPrefix}...)</span></div>

            {/* --- Data Field (Editable JSON) --- */}
            <div className="info-item data">
                <strong>Data (Transactions):</strong>
                <textarea
                    value={editableData}
                    onChange={handleDataChange}
                    rows={6} // Increase rows for JSON list
                    readOnly={!canEdit}
                    disabled={!canEdit}
                    aria-label="Block Data (JSON)"
                    style={{ width: '95%', fontFamily: 'monospace', fontSize: '0.9em', whiteSpace: 'pre' }}
                />
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

             {/* Display current network difficulty */}
            <hr style={{margin: '15px 0'}} />
             <p><strong>Current Network Difficulty:</strong> {currentDifficulty || 'Loading...'}</p>

        </div>
    );
};

export default InfoPanel;