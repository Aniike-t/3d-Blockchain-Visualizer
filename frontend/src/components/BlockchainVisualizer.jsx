// --- BlockchainVisualizer.jsx (Segmented Validity Visualization - Refined) ---
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import Block from './Block.jsx'; // Block.jsx now expects 'status' prop
import GhostBlock from './GhostBlock.jsx';

// CameraController remains the same
const CameraController = ({ targetPosition }) => {
    const { controls } = useThree();
    const currentTarget = useRef(new THREE.Vector3());
    // Initialize currentTarget correctly
    useEffect(() => {
        if (targetPosition && !isNaN(targetPosition.x)) {
            currentTarget.current.copy(targetPosition);
        } else {
            currentTarget.current.set(0, 0, 0); // Default if no target initially
        }
    }, [targetPosition]); // Depend on targetPosition

    useFrame((state, delta) => {
        // Ensure controls and target are valid before attempting lerp/update
        if (controls?.target && targetPosition && !isNaN(targetPosition.x)) {
            // Check if lerp is necessary to avoid unnecessary updates
            if (!currentTarget.current.equals(targetPosition)) {
                 const lerpFactor = Math.min(delta * 2.5, 1); // Slightly faster lerp maybe
                 currentTarget.current.lerp(targetPosition, lerpFactor);
                 controls.target.copy(currentTarget.current);
                 controls.update?.(); // Only call update if it exists
            }
        } else if (controls?.target && isNaN(currentTarget.current.x)) {
             // Safety net: If currentTarget somehow became NaN, reset
             currentTarget.current.set(0,0,0);
             controls.target.copy(currentTarget.current);
        }
    });
    return null;
};


const BLOCK_DISTANCE = 2.5;
const VALID_COLOR = "#abb2bf"; // Normal line color
const INVALID_COLOR = "#888888"; // Dim/broken line color
const VALID_HASH_COLOR = "#61afef"; // Blueish valid hash
const INVALID_HASH_COLOR = "#ff6666"; // Reddish invalid hash

const BlockchainVisualizer = ({
    chain,
    onBlockClick,
    selectedBlock,
    onMineGhostBlock,
    isMining,
    firstInvalidIndex,
    mempoolSize
}) => {
    const getBlockPosition = useCallback((index) => {
        return new THREE.Vector3(index * BLOCK_DISTANCE, 0, index * BLOCK_DISTANCE);
    }, []);

    const lastBlockIndex = chain.length > 0 ? chain.length - 1 : 0;
    const cameraTargetPosition = useMemo(() => getBlockPosition(lastBlockIndex), [chain.length, getBlockPosition]);

    // Memoize block positions for efficient access
    const blockPositions = useMemo(() => chain.map((_, index) => getBlockPosition(index)), [chain, getBlockPosition]);

    return (
        <Canvas shadows style={{ background: '#282c34' }}>
            {/* Camera, Controls, Controller, Lighting, Ground (Setup remains the same) */}
             <OrthographicCamera makeDefault zoom={50} position={[-20, 20, 20]} left={-window.innerWidth / 40} right={window.innerWidth / 40} top={window.innerHeight / 40} bottom={-window.innerHeight / 40} near={0.1} far={1000}/>
             <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} enableDamping={true} dampingFactor={0.1} target={cameraTargetPosition.toArray()} /* Initial target */ />
             <CameraController targetPosition={cameraTargetPosition} />
             <ambientLight intensity={0.7} />
             <directionalLight position={[15, 30, 10]} intensity={1.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-far={70} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25}/>
             <pointLight position={[-20, -10, -20]} intensity={0.4} />
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial opacity={0.4} /></mesh>

            {/* --- Render Blocks --- */}
            {chain.map((block) => {
                 // Determine the status of this block
                 let blockStatus = 'valid'; // Default to valid
                 if (firstInvalidIndex !== null) {
                     if (block.index === firstInvalidIndex) {
                         blockStatus = 'first-invalid'; // The specific block where validation failed
                     } else if (block.index > firstInvalidIndex) {
                         blockStatus = 'subsequent-invalid'; // Blocks after the first invalid one
                     }
                     // Blocks with index < firstInvalidIndex remain 'valid'
                 }

                 return (
                    <Block
                        key={block.hash || block.index}
                        position={blockPositions[block.index]?.toArray() || [0,0,0]} // Use memoized position
                        blockData={block}
                        onClick={onBlockClick}
                        isSelected={selectedBlock?.hash === block.hash}
                        // Pass the detailed status string instead of a boolean
                        status={blockStatus}
                    />
                 );
            })}

             {/* --- Render Connecting Lines & Hash Labels --- */}
             {chain.map((block, index) => {
                 if (index === 0) return null; // No line/label before genesis

                 const prevBlock = chain[index - 1];
                 const currentBlock = block;

                 // Position of the previous and current block
                 const pos1 = blockPositions[index - 1];
                 const pos2 = blockPositions[index];

                 if (!pos1 || !pos2) return null; // Skip if positions aren't calculated yet

                 // Determine if the link TO the current block is valid.
                 // The link is considered valid if the block it points *to* (currentBlock)
                 // is either 'valid' or the 'first-invalid'. A subsequent-invalid block
                 // means the link leading to it is broken.
                 // Simplified: The link is valid if the current block's index is LESS THAN the firstInvalidIndex.
                 const isLinkValid = firstInvalidIndex === null || currentBlock.index < firstInvalidIndex;

                 // Calculate midpoint for the hash label (positioned before currentBlock)
                 const midpoint = pos1.clone().lerp(pos2, 0.5);
                 midpoint.y += 0.3; // Offset slightly above the line

                 return (
                     <React.Fragment key={`link-${currentBlock.hash || index}`}>
                         {/* Line Segment */}
                         <Line
                             points={[pos1.toArray(), pos2.toArray()]}
                             // Use the calculated isLinkValid for line color
                             color={isLinkValid ? VALID_COLOR : INVALID_COLOR}
                             lineWidth={3}
                         />
                         {/* Hash Label (Represents previous_hash of current block) */}
                         <Text
                             position={midpoint.toArray()}
                             fontSize={0.12}
                             // Use the calculated isLinkValid for hash color
                             color={isLinkValid ? VALID_HASH_COLOR : INVALID_HASH_COLOR}
                             anchorX="center" anchorY="middle"
                             outlineWidth={0.005} outlineColor="#282c34"
                         >
                             {typeof currentBlock.previous_hash === 'string' ? `${currentBlock.previous_hash.substring(0, 6)}...` : 'N/A'}
                         </Text>
                     </React.Fragment>
                 );
             })}


            {/* Render Ghost Block (Only if overall chain is valid up to the last block) */}
            {/* Ghost block only appears if firstInvalidIndex is null (fully valid chain) */}
            {chain.length > 0 && firstInvalidIndex === null && (
                <GhostBlock
                    position={getBlockPosition(chain.length).toArray()}
                    onMine={onMineGhostBlock}
                    isMining={isMining}
                    mempoolSize={mempoolSize}
                />
            )}
        </Canvas>
    );
};

export default BlockchainVisualizer;