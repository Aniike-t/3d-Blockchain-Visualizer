// --- App.jsx ---
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import BlockchainVisualizer from './components/BlockchainVisualizer.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import MempoolPanel from './components/MempoolPanel.jsx';
import './index.css';

const API_URL = 'http://127.0.0.1:5001/api';

function App() {
    // --- State (remains the same) ---
    const [chain, setChain] = useState([]); // Initial state is an empty array
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [mempool, setMempool] = useState([]);
    const [currentDifficulty, setCurrentDifficulty] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMining, setIsMining] = useState(false);
    const [isAddingTransaction, setIsAddingTransaction] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState(null);
    const [chainValidity, setChainValidity] = useState({ isValid: true, firstInvalidIndex: null });
    const containerRef = useRef();

    // --- Data Fetching and Actions (remain the same) ---
    const fetchData = useCallback(async (isReset = false) => {
        setIsLoading(true);
        setError(null);
        if (isReset) {
             setSelectedBlock(null);
        }
        try {
            const [chainResponse, mempoolResponse] = await Promise.all([
                axios.get(`${API_URL}/blockchain`),
                axios.get(`${API_URL}/mempool`)
            ]);

            console.log("Frontend: Fetched blockchain data:", chainResponse.data);
            console.log("Frontend: Fetched mempool data:", mempoolResponse.data);

            // Ensure fetchedChain is always an array, even if API returns null/undefined
            const fetchedChain = Array.isArray(chainResponse.data.chain) ? chainResponse.data.chain : [];
            setChain(fetchedChain);
            setCurrentDifficulty(chainResponse.data.current_difficulty);
            setMempool(Array.isArray(mempoolResponse.data.transactions) ? mempoolResponse.data.transactions : []);
            setChainValidity({ isValid: true, firstInvalidIndex: null });

        } catch (err) {
            console.error("Error fetching data:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to load data.";
            setError(`Data Loading Error: ${errorMsg}. Is the backend running?`);
            setChain([]); // Ensure chain is an empty array on error
            setMempool([]);
            setCurrentDifficulty(null);
            setChainValidity({ isValid: true, firstInvalidIndex: null });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddTransaction = async (transactionData) => {
         if (isAddingTransaction) return;
         setIsAddingTransaction(true);
         setError(null);
         console.log("Frontend: Sending transaction:", transactionData);
         try {
             const response = await axios.post(`${API_URL}/add_transaction`, transactionData);
             console.log("Frontend: Add transaction response:", response.data);
             // Refresh mempool state
             const mempoolResponse = await axios.get(`${API_URL}/mempool`);
             setMempool(Array.isArray(mempoolResponse.data.transactions) ? mempoolResponse.data.transactions : []);
         } catch (err) {
             console.error("Error adding transaction:", err);
             const errorMsg = err.response?.data?.message || err.message || "Failed to add transaction.";
             setError(`Transaction Error: ${errorMsg}`);
         } finally {
             setIsAddingTransaction(false);
         }
     };

    const handleMineBlock = async () => {
        if (isMining || mempool.length === 0) {
            if(mempool.length === 0) setError("Cannot mine: Mempool is empty.");
            return;
        };
        if (!chainValidity.isValid) {
            setError("Cannot mine: Chain is currently invalid!");
            return;
        }

       setIsMining(true);
       setError(null);
       setSelectedBlock(null);
       console.log("Frontend: Sending mine request (using mempool)...");

       try {
           const response = await axios.post(`${API_URL}/mine_block`);
           console.log("Frontend: Mine request successful", response.data);
           // Ensure response data leads to array state
           setChain(Array.isArray(response.data.chain) ? response.data.chain : []);
           setCurrentDifficulty(response.data.current_difficulty);
           setMempool([]);
           setSelectedBlock(null);
           setChainValidity({ isValid: true, firstInvalidIndex: null });

       } catch (err) {
           console.error("Error mining block:", err);
           const errorMsg = err.response?.data?.message || err.message || "Failed to mine block.";
           setError(`Mining Error: ${errorMsg}. Check backend logs.`);
           // Optionally reset chain on error, or rely on user action/refetch
           // setChain([]); // Example: Reset on error
       } finally {
           setIsMining(false);
       }
    };

    const triggerBackendValidation = useCallback(async (chainToValidate) => {
         // Ensure chainToValidate is always an array before sending
         const validChainPayload = Array.isArray(chainToValidate) ? chainToValidate : [];
         if (validChainPayload.length === 0) {
              setChainValidity({ isValid: true, firstInvalidIndex: null }); return;
         }

         console.log("Triggering backend validation...");
         setIsValidating(true); setError(null);
         try {
             const response = await axios.post(`${API_URL}/validate_chain_state`, { chain: validChainPayload });
             console.log("Backend Validation Response:", response.data);
             setChainValidity({
                  isValid: response.data.is_valid,
                  firstInvalidIndex: response.data.first_invalid_index
             });
         } catch (err) {
             console.error("Error during backend validation:", err);
             const errorMsg = err.response?.data?.message || err.message || "Failed to validate.";
             setError(`Validation API Error: ${errorMsg}`);
             setChainValidity({ isValid: false, firstInvalidIndex: 0 });
         } finally {
             setIsValidating(false);
         }
     }, []); // Ensure dependencies are correct if any external state is used inside

    const handleTriggerBackendValidate = () => {
         if (isLoading || isMining || isValidating || !Array.isArray(chain)) return; // Add array check here too
         setIsValidating(true);
         const delay = Math.floor(Math.random() * 1000) + 500;
         setTimeout(() => {
             triggerBackendValidation(chain); // Pass the current chain state
         }, delay);
    };

     const handleTamperData = useCallback((blockIndex, newData) => {
         if (blockIndex === 0) {
             setError("Genesis block data cannot be tampered with.");
             return;
         }
         if (typeof newData !== 'object' || newData === null) {
             console.error("Tamper attempt with non-object data:", newData);
             setError("Tampering failed: Data must be valid JSON.");
             return;
         }

         // Ensure chain is an array before proceeding
         if (!Array.isArray(chain)) {
            console.error("Tampering attempt when chain state is not an array.");
            setError("Internal state error. Cannot tamper data.");
            return;
         }

         console.log(`Tampering block ${blockIndex} with data:`, newData);
         const newChain = chain.map((block, index) => {
             if (index === blockIndex) {
                 return { ...block, data: newData };
             }
             return block;
         });
         setChain(newChain); // Update local state

         const updatedBlock = newChain.find(b => b.index === blockIndex) || null;
         setSelectedBlock(updatedBlock);

         console.log("--- Tamper/Fix Save ---");
         // ... (logging) ...

         // Trigger backend validation with the updated chain copy
         triggerBackendValidation(newChain);

     }, [chain, triggerBackendValidation, setSelectedBlock]); // Add setSelectedBlock to dependencies

     const handleResetChain = () => {
        console.log("Resetting chain and mempool from backend...");
        fetchData(true);
     };

     const handleBlockClick = (blockData) => {
        setSelectedBlock(blockData);
     };

    // --- *** UPDATED RENDER LOGIC *** ---
    console.log("App Render:", { isLoading, isMining, isAddingTransaction, isValidating, chainIsArray: Array.isArray(chain), chainLength: Array.isArray(chain) ? chain.length : 'N/A', mempoolSize: mempool.length, difficulty: currentDifficulty, error, chainValidity });

    // Conditions for rendering different states
    const isChainReady = !isLoading && Array.isArray(chain); // Check if loading is done AND chain is an array
    const canRenderVisualizer = isChainReady && chain.length > 0;
    const showEmptyMessage = isChainReady && chain.length === 0 && !error;
    const showLoadErrorMessage = !isLoading && error; // Error implies loading finished (successfully or not)

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="main-layout">
                <div className="left-panel">
                     <InfoPanel
                         blockData={selectedBlock}
                         onTamperSave={handleTamperData}
                         // Pass chain validity status for the warning message
                         isChainValid={chainValidity.isValid}
                         currentDifficulty={currentDifficulty}
                     />
                     <MempoolPanel transactions={mempool} />
                      {/* Only show transaction form if chain is ready and valid */}
                      {isChainReady && chainValidity.isValid && (
                         <TransactionForm
                            onAddTransaction={handleAddTransaction}
                            isAdding={isAddingTransaction}
                         />
                     )}
                </div>

                <div className="right-panel">
                    <div className="controls-panel">
                        <button
                            onClick={handleTriggerBackendValidate}
                            disabled={isLoading || isMining || isValidating || !isChainReady} // Disable if chain not ready
                        >
                            {isValidating ? 'Checking...' : 'Check Validity (BE)'}
                        </button>
                        <button onClick={handleResetChain} disabled={isLoading || isMining} title="Reload chain and mempool from backend">
                            Reset Chain (Fetch)
                        </button>
                         {/* Only show validity status if chain is ready */}
                         {isChainReady && (
                             <span className={`validation-status ${chainValidity.isValid ? 'valid' : 'invalid'}`}>
                                 {isValidating ? 'Checking...' : (chainValidity.isValid ? '✅ Valid' : `❌ Invalid (#${chainValidity.firstInvalidIndex})`)}
                             </span>
                         )}
                         <span className="difficulty-display">
                             Difficulty: {currentDifficulty ?? '...'}
                         </span>
                         <span className="mempool-display">
                             Mempool: {mempool.length} Tx
                         </span>
                    </div>

                    <div className="status-bar">
                        {isLoading && <div className="status-indicator loading">Loading Data...</div>}
                        {isMining && <div className="status-indicator mining">Mining Block...</div>}
                        {isAddingTransaction && <div className="status-indicator loading">Adding Transaction...</div>}
                        {showLoadErrorMessage && <div className="status-indicator error">{error}</div>} {/* Show error if loading failed */}
                    </div>

                    {/* Blockchain Visualizer Area */}
                    {canRenderVisualizer && ( // Use the refined condition
                        <div className="visualizer-container">
                            <BlockchainVisualizer
                                chain={chain} // chain is guaranteed to be an array here
                                onBlockClick={handleBlockClick}
                                selectedBlock={selectedBlock}
                                onMineGhostBlock={handleMineBlock}
                                isMining={isMining}
                                firstInvalidIndex={chainValidity.firstInvalidIndex}
                                mempoolSize={mempool.length}
                            />
                        </div>
                    )}
                    {showEmptyMessage && ( // Use the refined condition
                        <div className="status-indicator info">Blockchain is empty. Add transactions and mine the first block.</div>
                    )}
                     {/* Remove the specific error display here, it's covered by showLoadErrorMessage in status-bar */}
                     {/* {!isLoading && chain.length === 0 && error && ( ... )} */}

                     {/* Optional: Explicit Loading State visual placeholder */}
                     {isLoading && (
                         <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#abb2bf' }}>
                             Loading Blockchain...
                         </div>
                     )}
                </div> {/* End right-panel */}
            </div> {/* End main-layout */}
        </div>
    );
}

export default App;