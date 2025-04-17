// --- App.jsx (Modified for Free Camera) ---
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
// No longer need THREE directly here unless for other purposes
// import * as THREE from 'three';
import BlockchainVisualizer from './components/BlockchainVisualizer';
import InfoPanel from './components/InfoPanel';
import AddBlockForm from './components/AddBlockForm';
import './index.css';

const API_URL = 'http://127.0.0.1:5001/api';
// Removed PAN constants

function App() {
    const [chain, setChain] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMining, setIsMining] = useState(false);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);

    // --- Removed Panning State ---
    // const [isPanning, setIsPanning] = useState(false);
    // const [manualPanOffset, setManualPanOffset] = useState(new THREE.Vector3(0, 0, 0));
    // const panStartRef = useRef({ x: 0, y: 0 });
    const containerRef = useRef(); // Keep ref for potential future use or styling target

    const fetchChain = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setValidationResult(null);
        try {
            const response = await axios.get(`${API_URL}/blockchain`);
            console.log("Frontend: Fetched blockchain data:", response.data);
            setChain(response.data.chain || []);
            setSelectedBlock(null);
            setShowAddForm(false);
        } catch (err) {
            console.error("Error fetching blockchain:", err);
            setError(`Failed to load blockchain data: ${err.message}. Is the backend running correctly?`);
            setChain([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChain();
    }, [fetchChain]);

    const handleBlockClick = (blockData) => {
        setSelectedBlock(blockData);
        setShowAddForm(false);
    };

    const handleMineGhostBlock = () => {
        if (isMining) return;
        setSelectedBlock(null);
        setShowAddForm(true);
        setValidationResult(null);
    };

    const handleAddBlock = async (data) => {
       if (isMining) return;
       setIsMining(true);
       setError(null);
       setShowAddForm(false);
       setValidationResult(null);
       console.log("Frontend: Sending mine request for data:", data);
       try {
           const response = await axios.post(`${API_URL}/mine_block`, { data });
           console.log("Frontend: Mine request successful", response.data);
           setChain(response.data.chain);
           setSelectedBlock(null);
           // Camera target will update automatically via CameraController
       } catch (err) {
           console.error("Error mining block:", err);
           const errorMsg = err.response?.data?.message || err.message || "Failed to mine block.";
           setError(`Mining Error: ${errorMsg}. Check backend logs.`);
       } finally {
           setIsMining(false);
       }
    };

    const handleValidateChain = async () => {
        if (isValidating || isMining) return;
        setIsValidating(true);
        setError(null);
        setValidationResult(null);
        console.log("Frontend: Sending validation request");
        try {
            const response = await axios.get(`${API_URL}/validate`);
            console.log("Frontend: Validation response", response.data);
            setValidationResult(response.data.is_valid);
        } catch (err) {
            console.error("Error validating chain:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to validate chain.";
            setError(`Validation Error: ${errorMsg}`);
            setValidationResult(false);
        } finally {
            setIsValidating(false);
        }
    };

    // --- Removed Panning Handlers & Reset View ---
    // const handleResetView = () => { ... };
    // const handlePointerDown = useCallback((event) => { ... }, []);
    // const handlePointerMove = useCallback((event) => { ... }, [isPanning]);
    // const handlePointerUpOrLeave = useCallback((event) => { ... }, [isPanning]);

    console.log("App Render:", { isLoading, isMining, chainLength: chain.length, error, validationResult });

    return (
        // Removed panning listeners from this div
        <div
            ref={containerRef}
            style={{ width: '100vw', height: '100vh', cursor: 'default', overflow: 'hidden' }} // Default cursor
        >
            <div className="controls-panel">
                 {/* Removed Reset View button */}
                 <button onClick={handleValidateChain} disabled={isMining || isValidating}>
                     {isValidating ? 'Validating...' : 'Validate Chain'}
                 </button>
                 {validationResult !== null && (
                     <span className={`validation-status ${validationResult ? 'valid' : 'invalid'}`}>
                         {validationResult ? '✅ Chain Valid' : '❌ Chain Invalid!'}
                     </span>
                 )}
            </div>

            <InfoPanel blockData={selectedBlock} />

            {showAddForm && !isMining && (
                <AddBlockForm onAddBlock={handleAddBlock} isMining={isMining} />
            )}

            {isLoading && <div className="status-indicator loading">Loading Chain...</div>}
            {isMining && <div className="status-indicator mining">Mining New Block (Proof-of-Work)...</div>}
            {error && <div className="status-indicator error">{error}</div>}

            {!isLoading && chain.length > 0 && (
                <BlockchainVisualizer
                    chain={chain}
                    onBlockClick={handleBlockClick}
                    selectedBlock={selectedBlock}
                    onMineGhostBlock={handleMineGhostBlock}
                    // Removed manualPanOffset prop
                    isMining={isMining}
                />
            )}
            {!isLoading && chain.length === 0 && !error && (
                <div className="status-indicator info">No blocks found. Mine the first block or check backend.</div>
            )}
        </div>
    );
}

export default App;