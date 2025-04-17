// --- BlockchainVisualizer.jsx (Pass Validity Down) ---
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import Block from './Block.jsx';
import GhostBlock from './GhostBlock.jsx';
// CameraController remains the same (targeting latest block)

const BLOCK_DISTANCE = 2.5;

// --- Camera Controller (Manages TARGET only - Keep as is) ---
const CameraController = ({ targetPosition }) => {
    const { controls } = useThree();
    const currentTarget = useRef(new THREE.Vector3());
    useEffect(() => { if (targetPosition) { currentTarget.current.copy(targetPosition); } else { currentTarget.current.set(0,0,0); }}, []);
    useFrame((state, delta) => {
        if (controls?.target && targetPosition && !isNaN(targetPosition.x)) {
            const lerpFactor = Math.min(delta * 2, 1);
            currentTarget.current.lerp(targetPosition, lerpFactor);
            controls.target.copy(currentTarget.current);
            controls.update?.();
        }
    });
    return null;
};


// Added firstInvalidIndex prop
const BlockchainVisualizer = ({
    chain,
    onBlockClick,
    selectedBlock,
    onMineGhostBlock,
    isMining,
    firstInvalidIndex // <<<--- ADDED PROP
}) => {
    const getBlockPosition = useCallback((index) => {
        return new THREE.Vector3(index * BLOCK_DISTANCE, 0, index * BLOCK_DISTANCE);
    }, []);

    const lastBlockIndex = chain.length > 0 ? chain.length - 1 : 0;
    const cameraTargetPosition = useMemo(() => getBlockPosition(lastBlockIndex), [chain.length, getBlockPosition]);
    const linePoints = useMemo(() => chain.map((block, index) => getBlockPosition(index)), [chain, getBlockPosition]);
    const hashLabelPositions = useMemo(() => { /* ... (no change) ... */
        const positions = [];
        for (let i = 1; i < chain.length; i++) {
            const pos1 = getBlockPosition(i - 1); const pos2 = getBlockPosition(i);
            const midpoint = pos1.clone().lerp(pos2, 0.5); midpoint.y += 0.3;
            positions.push({ position: midpoint.toArray(), hash: chain[i].previous_hash, key: `hash-${chain[i].hash}` });
        } return positions;
    }, [chain, getBlockPosition]);

    return (
        <Canvas shadows style={{ background: '#282c34' }}>
            {/* Camera, Controls, Controller, Lighting, Ground (no change) */}
            <OrthographicCamera makeDefault zoom={5} position={[-40, 20, 20]} left={-window.innerWidth / 40} right={window.innerWidth / 40} top={window.innerHeight / 40} bottom={-window.innerHeight / 40} near={0.1} far={1000}/>
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} enableDamping={true} dampingFactor={0.1} />
            <CameraController targetPosition={cameraTargetPosition} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[15, 30, 10]} intensity={1.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-far={70} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25}/>
            <pointLight position={[-20, -10, -20]} intensity={0.4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial opacity={0.4} /></mesh>

            {/* --- Render Blocks (Pass Validity) --- */}
            {chain.map((block) => {
                 // Determine if this block is valid based on the first invalid index
                 const isBlockValid = firstInvalidIndex === null || block.index < firstInvalidIndex;
                 return (
                    <Block
                        key={block.hash}
                        position={getBlockPosition(block.index).toArray()}
                        blockData={block}
                        onClick={onBlockClick}
                        isSelected={selectedBlock?.hash === block.hash}
                        isChainValid={isBlockValid} // <<<--- PASS VALIDITY STATUS
                    />
                 );
            })}

             {/* Render Connecting Lines (Maybe change color if invalid?) */}
             {linePoints.length > 1 && (
                <Line
                    points={linePoints}
                    // Change color based on overall chain validity? Or per-segment?
                    color={firstInvalidIndex === null ? "#abb2bf" : "#888888"} // Dim if chain broken
                    lineWidth={3}
                />
             )}

             {/* Render Hash Labels (Maybe change color if invalid?) */}
             {hashLabelPositions.map(({ position, hash, key }, index) => {
                 // Label before block `index + 1`. Is block `index + 1` valid?
                  const isNextBlockValid = firstInvalidIndex === null || (index + 1) < firstInvalidIndex;
                 return (
                     <Text
                        key={key} position={position} fontSize={0.12}
                        color={isNextBlockValid ? "#61afef" : "#ff6666"} // Red if link leads to invalid block
                        anchorX="center" anchorY="middle"
                        outlineWidth={0.005} outlineColor="#282c34"
                    > {hash.substring(0, 6)}...</Text>
                 );
             })}

            {/* Render Ghost Block (Only if chain is valid) */}
            {/* Don't show ghost block if chain is broken */}
            {chain.length > 0 && firstInvalidIndex === null && (
                <GhostBlock
                    position={getBlockPosition(chain.length).toArray()}
                    onMine={onMineGhostBlock}
                    isMining={isMining}
                />
            )}
        </Canvas>
    );
};

export default BlockchainVisualizer;