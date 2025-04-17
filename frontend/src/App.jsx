// --- App.jsx (Using Backend Validation) ---
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
// No longer need js-sha256 or frontend validation helpers
// import { sha256 } from 'js-sha256';
import BlockchainVisualizer from './components/BlockchainVisualizer';
import InfoPanel from './components/InfoPanel';
import AddBlockForm from './components/AddBlockForm';
import './index.css';

const API_URL = 'http://127.0.0.1:5001/api';
// Removed CHAIN_DIFFICULTY constant
// Removed frontend calculate/validate functions


function App() {
    // State remains largely the same
    const [chain, setChain] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMining, setIsMining] = useState(false);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    // chainValidity now stores the result from the backend
    const [chainValidity, setChainValidity] = useState({ isValid: true, firstInvalidIndex: null });
    const [isValidating, setIsValidating] = useState(false); // State for validation API call
    const containerRef = useRef();

    // --- Function to Trigger Backend Validation ---
    const triggerBackendValidation = useCallback(async (chainToValidate) => {
        if (!chainToValidate || chainToValidate.length === 0) {
             console.log("Skipping backend validation for empty chain.");
             setChainValidity({ isValid: true, firstInvalidIndex: null }); // Empty chain is valid
             return;
        }
        console.log("Triggering backend validation for current chain state...");
        setIsValidating(true);
        setError(null); // Clear previous errors on new validation attempt
        try {
            // POST the entire current chain state to the new backend endpoint
            const response = await axios.post(`${API_URL}/validate_chain_state`, {
                chain: chainToValidate
            });
            console.log("Backend Validation Response:", response.data);
            // Update state based on backend response
            setChainValidity({
                 isValid: response.data.is_valid,
                 firstInvalidIndex: response.data.first_invalid_index
            });
        } catch (err) {
            console.error("Error during backend validation:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to validate chain state.";
            setError(`Validation API Error: ${errorMsg}`);
            // What should validity be on error? Assume invalid? Or keep previous state?
            // Let's assume invalid on API error for safety.
            setChainValidity({ isValid: false, firstInvalidIndex: 0 }); // Indicate failure
        } finally {
            setIsValidating(false);
        }
    }, []); // No dependencies needed


    const fetchChain = useCallback(async (isReset = false) => {
        setIsLoading(true);
        setError(null);
         if (isReset) {
             setSelectedBlock(null);
             setShowAddForm(false);
        }
        try {
            const response = await axios.get(`${API_URL}/blockchain`);
            console.log("Frontend: Fetched blockchain data:", response.data);
            // No need to store original timestamp separately anymore if backend handles strings
            const fetchedChain = response.data.chain || [];
            setChain(fetchedChain);
            // Assume fetched chain is valid initially
            setChainValidity({ isValid: true, firstInvalidIndex: null });
        } catch (err) {
            console.error("Error fetching blockchain:", err);
            setError(`Failed to load blockchain data: ${err.message}. Is the backend running correctly?`);
            setChain([]);
             setChainValidity({ isValid: true, firstInvalidIndex: null });
        } finally {
            setIsLoading(false);
        }
    }, []); // Removed validation dependency

    useEffect(() => {
        fetchChain();
    }, [fetchChain]);

    const handleBlockClick = (blockData) => { setSelectedBlock(blockData); setShowAddForm(false); };

    const handleMineGhostBlock = () => {
        if (isMining) return;
         if (!chainValidity.isValid) {
             setError("Cannot mine: Chain is currently invalid according to backend!");
             return;
         }
        setSelectedBlock(null); setShowAddForm(true);
    };

    const handleAddBlock = async (data) => {
        if (isMining) return;
         if (!chainValidity.isValid) {
             setError("Cannot mine: Chain is currently invalid according to backend!");
             return;
         }
       setIsMining(true); setError(null); setShowAddForm(false);
       console.log("Frontend: Sending mine request for data:", data);
       try {
           // Backend mines and returns the new *valid* chain
           const response = await axios.post(`${API_URL}/mine_block`, { data });
           console.log("Frontend: Mine request successful", response.data);
           const newValidChain = response.data.chain || [];
           setChain(newValidChain);
           setSelectedBlock(null);
           // The newly mined chain from backend is assumed valid
           setChainValidity({ isValid: true, firstInvalidIndex: null });
       } catch (err) {
           console.error("Error mining block:", err);
           const errorMsg = err.response?.data?.message || err.message || "Failed to mine block.";
           setError(`Mining Error: ${errorMsg}. Check backend logs.`);
           // Optionally refetch on error
           // fetchChain();
       } finally {
           setIsMining(false);
       }
    };

    // --- Renamed "Validate" button handler ---
    const handleTriggerBackendValidate = () => {
        // Call the function that hits the backend endpoint
        triggerBackendValidation(chain);
    };

    // --- Handler for Saving Tampered Data ---
    const handleTamperData = useCallback((blockIndex, newData) => {
        if (blockIndex === 0) { /* ... (keep genesis check) ... */ return; }

        console.log(`Tampering block ${blockIndex} with data: ${newData}`);
        // 1. Update local state immediately for visual feedback
        const newChain = chain.map((block, index) => {
            if (index === blockIndex) {
                // IMPORTANT: Return a new object, don't modify existing one in state directly
                return { ...block, data: newData };
            }
            return block;
        });
        setChain(newChain);
        // Keep the just-edited block selected
        // Find the block in the *new* array reference
        setSelectedBlock(newChain.find(b => b.index === blockIndex) || null);

        // 2. Trigger backend validation with the *new* chain state
        triggerBackendValidation(newChain);

    }, [chain, triggerBackendValidation]); // Dependencies

    // --- Handler for Resetting Tampered Chain ---
    const handleResetChain = () => {
        console.log("Resetting chain from backend...");
        fetchChain(true);
    };


    console.log("App Render:", { isLoading, isMining, isValidating, chainLength: chain.length, error, chainValidity });

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100vh', cursor: 'default', overflow: 'hidden' }}>
            <div className="controls-panel">
                {/* Button now triggers backend check */}
                <button
                  onClick={async () => {
                    // Simulate 2-4 seconds loading before actual validation
                    setIsValidating(true);
                    const delay = Math.floor(Math.random() * 2000) + 2000; // 2000-4000 ms
                    await new Promise(res => setTimeout(res, delay));
                    handleTriggerBackendValidate();
                  }}
                  disabled={isLoading || isMining || isValidating}
                >
                  {isValidating ? 'Checking...' : 'Check Validity (BE)'}
                </button>
                <button onClick={handleResetChain} disabled={isLoading || isMining} title="Discard local changes and reload from backend">
                  Reset Chain (Fetch)
                </button>
                {/* Display Frontend Validity Status (driven by backend result) */}
                 {chain.length > 0 && (
                     <span className={`validation-status ${chainValidity.isValid ? 'valid' : 'invalid'}`}>
                         {chainValidity.isValid ? '✅ Valid' : `❌ Invalid (from #${chainValidity.firstInvalidIndex})`}
                     </span>
                 )}
            </div>

            {/* Pass handler down */}
            <InfoPanel
                blockData={selectedBlock}
                onTamperSave={handleTamperData}
                 // Pass validity for UI feedback (e.g., disable mining button indirectly)
                isChainValid={chainValidity.isValid}
            />

            {showAddForm && !isMining && !isLoading && chainValidity.isValid && ( // Also check validity
                <AddBlockForm onAddBlock={handleAddBlock} isMining={isMining} />
            )}

            {/* Status Indicators */}
            {isLoading && <div className="status-indicator loading">Loading Chain...</div>}
            {isMining && <div className="status-indicator mining">Mining New Block...</div>}
            {isValidating && <div className="status-indicator loading">Validating Chain...</div>}
            {error && <div className="status-indicator error">{error}</div>}
            {/* Optional explicit invalid message */}
            {/* {!isLoading && !isMining && !isValidating && !chainValidity.isValid && chain.length > 0 && <div className="status-indicator error">Chain Invalid! Tampering detected from block #{chainValidity.firstInvalidIndex}. Reset or fix data.</div>} */}


            {!isLoading && chain.length > 0 && (
                <BlockchainVisualizer
                    chain={chain}
                    onBlockClick={handleBlockClick}
                    selectedBlock={selectedBlock}
                    onMineGhostBlock={handleMineGhostBlock}
                    isMining={isMining}
                    // Pass validation status down (sourced from backend)
                    firstInvalidIndex={chainValidity.firstInvalidIndex}
                />
            )}
            {!isLoading && chain.length === 0 && !error && (
                <div className="status-indicator info">No blocks found. Mine the first block or check backend.</div>
            )}
        </div>
    );
}

export default App;