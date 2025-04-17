// --- BlockchainVisualizer.jsx (Reverted Controls to Default) ---
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Line, Text } from '@react-three/drei';
// Or PerspectiveCamera
// import { OrbitControls, PerspectiveCamera, Line, Text } from '@react-three/drei';
import * as THREE from 'three'; // Keep THREE import if needed elsewhere, though not strictly for default controls
import Block from './Block.jsx';
import GhostBlock from './GhostBlock.jsx';

const BLOCK_DISTANCE = 2.5;

// --- Camera Controller (Manages TARGET only - Keep as is) ---
const CameraController = ({ targetPosition }) => {
    const { controls } = useThree();
    const currentTarget = useRef(new THREE.Vector3());

    useEffect(() => {
        // Initialize target ref to avoid NaN issues if targetPosition is initially undefined
        if (targetPosition) {
             currentTarget.current.copy(targetPosition);
        } else {
             // Default to origin if targetPosition isn't ready yet
            currentTarget.current.set(0,0,0);
        }
    }, []); // Initialize on mount

     useEffect(() => {
       // Let useFrame handle lerping towards the updated targetPosition prop
     }, [targetPosition]);

    useFrame((state, delta) => {
        if (controls?.target && targetPosition) {
            // Check if targetPosition is valid before lerping
            if (!isNaN(targetPosition.x) && !isNaN(targetPosition.y) && !isNaN(targetPosition.z)) {
                const lerpFactor = Math.min(delta * 2, 1);
                currentTarget.current.lerp(targetPosition, lerpFactor);
                controls.target.copy(currentTarget.current);
                controls.update?.(); // Crucial for OrbitControls
            } else {
                console.warn("CameraController: Invalid targetPosition received", targetPosition);
            }
        }
    });
    return null;
};


const BlockchainVisualizer = ({ chain, onBlockClick, selectedBlock, onMineGhostBlock, isMining }) => {
    const getBlockPosition = useCallback((index) => {
        return new THREE.Vector3(index * BLOCK_DISTANCE, 0, index * BLOCK_DISTANCE);
    }, []);

    const lastBlockIndex = chain.length > 0 ? chain.length - 1 : 0;
    const cameraTargetPosition = useMemo(() => getBlockPosition(lastBlockIndex), [chain.length, getBlockPosition]);

    const linePoints = useMemo(() => chain.map((block, index) => getBlockPosition(index)), [chain, getBlockPosition]);

     const hashLabelPositions = useMemo(() => {
        const positions = [];
        for (let i = 1; i < chain.length; i++) {
            const pos1 = getBlockPosition(i - 1);
            const pos2 = getBlockPosition(i);
            const midpoint = pos1.clone().lerp(pos2, 0.5);
            midpoint.y += 0.3;
            positions.push({
                position: midpoint.toArray(),
                hash: chain[i].previous_hash,
                key: `hash-${chain[i].hash}`
            });
        }
        return positions;
     }, [chain, getBlockPosition]);

    return (
        <Canvas shadows style={{ background: '#282c34' }}>
            {/* --- Camera (Orthographic OR Perspective) --- */}
            <OrthographicCamera
                makeDefault
                zoom={50}
                position={[15, 20, 15]}
                left={-window.innerWidth / 40} right={window.innerWidth / 40}
                top={window.innerHeight / 40} bottom={-window.innerHeight / 40}
                near={0.1}
                far={1000}
            />
             {/* <PerspectiveCamera makeDefault position={[10, 15, 10]} fov={60} ... /> */}

            {/* --- Controls (Reverted to Default Behavior) --- */}
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                enableDamping={true}
                dampingFactor={0.1}
                // --- V V V --- REMOVED mouseButtons and touches PROPS --- V V V ---
                // mouseButtons={{ ... }} // REMOVED
                // touches={{ ... }}      // REMOVED
                // --- ^ ^ ^ --- REMOVED mouseButtons and touches PROPS --- ^ ^ ^ ---
            />
            {/* --- Camera Controller --- */}
            <CameraController targetPosition={cameraTargetPosition} />

            {/* --- Lighting, Ground, Blocks, Lines, Labels, GhostBlock (Keep as before) --- */}
            <ambientLight intensity={0.7} />
            <directionalLight
                position={[15, 30, 10]} intensity={1.8} castShadow
                 shadow-mapSize-width={1024} shadow-mapSize-height={1024}
                 shadow-camera-far={70} shadow-camera-left={-25} shadow-camera-right={25}
                 shadow-camera-top={25} shadow-camera-bottom={-25}
            />
             <pointLight position={[-20, -10, -20]} intensity={0.4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
                <planeGeometry args={[200, 200]} />
                <shadowMaterial opacity={0.4} />
            </mesh>
            {chain.map((block) => (
                <Block key={block.hash} position={getBlockPosition(block.index).toArray()} blockData={block} onClick={onBlockClick} isSelected={selectedBlock?.hash === block.hash} />
            ))}
             {linePoints.length > 1 && (<Line points={linePoints} color="#abb2bf" lineWidth={3} />)}
             {hashLabelPositions.map(({ position, hash, key }) => (
                 <Text key={key} position={position} fontSize={0.12} color="#61afef" anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#282c34">{hash.substring(0, 6)}...</Text>
             ))}
            {chain.length > 0 && (<GhostBlock position={getBlockPosition(chain.length).toArray()} onMine={onMineGhostBlock} isMining={isMining} />)}
        </Canvas>
    );
};

export default BlockchainVisualizer;