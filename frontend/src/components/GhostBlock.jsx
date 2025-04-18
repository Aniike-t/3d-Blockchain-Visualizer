// --- GhostBlock.jsx (Updated Text & Interaction) ---
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

const ASSEMBLY_SPEED = 0.8;

// Added mempoolSize prop
const GhostBlock = ({ position, onMine, isMining, mempoolSize }) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const textRef = useRef();
  const [hovered, setHover] = useState(false);
  const animationProgress = useRef(isMining ? 0 : 1);

  // Determine if mining is possible (mempool has items)
  const canMine = mempoolSize > 0;
  const hoverText = canMine ? '+ Mine Pending Tx' : 'Mempool Empty';
  const miningText = 'MINING...';

  // Reset animation based on mining status
   useEffect(() => {
    // ... (animation reset logic remains the same as before) ...
      if (isMining) {
          animationProgress.current = 0;
          if (meshRef.current) { meshRef.current.scale.y = 0; }
          if (groupRef.current) { groupRef.current.position.y = -0.5; }
          if (textRef.current) { textRef.current.position.y = 0.1; }
      } else {
          animationProgress.current = 1;
          if (meshRef.current) { meshRef.current.scale.y = 1; }
          if (groupRef.current) { groupRef.current.position.y = 0; }
          if (textRef.current) { textRef.current.position.y = 0; } // Centered relative to group
      }
   }, [isMining]);


  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current || !textRef.current) return;

    // --- Visual states ---
    const isIdleAndEmpty = !isMining && !canMine;
    const isIdleAndReady = !isMining && canMine;

    let targetColor = new THREE.Color("#ffffff"); // Default idle/ready
    let targetOpacity = 0.7;
    let targetEmissiveIntensity = 0.2;
    let targetEmissiveColor = new THREE.Color("#999999");
    let targetWireframe = true;
    let targetScaleX = 1.0;
    let targetScaleZ = 1.0;

    if (isMining) {
        // --- Mining Animation ---
        targetColor = new THREE.Color("#ffcc00");
        targetEmissiveColor = new THREE.Color("#ffaa00");
        targetWireframe = false; // Solid during mining

        if (animationProgress.current < 1) {
             animationProgress.current = Math.min(1, animationProgress.current + delta * ASSEMBLY_SPEED);
        }
        meshRef.current.scale.y = animationProgress.current;
        groupRef.current.position.y = -0.5 + (meshRef.current.scale.y / 2);
        textRef.current.position.y = (meshRef.current.scale.y / 2) + 0.1;

        const pulseFactor = Math.sin(state.clock.elapsedTime * 6) * 0.03 + 1.0;
        targetScaleX = pulseFactor;
        targetScaleZ = pulseFactor;
        targetOpacity = Math.sin(state.clock.elapsedTime * 5) * 0.1 + animationProgress.current * 0.6 + 0.1;
        targetEmissiveIntensity = Math.sin(state.clock.elapsedTime * 5) * 0.3 + 0.6;

    } else if (isIdleAndReady) {
        // --- Standard Hover Effect (When Ready to Mine) ---
        targetWireframe = !hovered; // Become solid on hover when ready
        targetOpacity = hovered ? 0.9 : 0.7;
        targetEmissiveIntensity = hovered ? 0.4 : 0.2;
        targetEmissiveColor = hovered ? new THREE.Color("#cccccc") : new THREE.Color("#999999");
        const scaleHover = hovered ? 1.15 : 1.0;
        targetScaleX = scaleHover;
        targetScaleZ = scaleHover;
         // Ensure correct scale/position when not mining
         meshRef.current.scale.y = 1;
         groupRef.current.position.y = 0;
         textRef.current.position.y = 0.6; // Above full block

    } else { // isIdleAndEmpty
        // --- Dimmed/Inactive State (When Mempool Empty) ---
        targetColor = new THREE.Color("#aaaaaa");
        targetOpacity = 0.4;
        targetEmissiveIntensity = 0.1;
        targetEmissiveColor = new THREE.Color("#666666");
        targetWireframe = true; // Always wireframe when inactive
        // Ensure correct scale/position
        meshRef.current.scale.y = 1;
        groupRef.current.position.y = 0;
        textRef.current.position.y = 0.6;
    }

    // --- Apply Lerped Properties ---
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScaleX, delta * 8);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScaleZ, delta * 8);
    meshRef.current.material.color.lerp(targetColor, delta * 10);
    meshRef.current.material.opacity = THREE.MathUtils.lerp(meshRef.current.material.opacity, targetOpacity, delta * 8);
    meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(meshRef.current.material.emissiveIntensity, targetEmissiveIntensity, delta * 8);
    meshRef.current.material.emissive.lerp(targetEmissiveColor, delta * 8);
    meshRef.current.material.wireframe = targetWireframe; // Can be instant or lerped if preferred
  });

  const handleClick = (event) => {
    event.stopPropagation();
    // Only allow mining if not already mining AND mempool has transactions
    if (!isMining && canMine) {
        onMine();
    }
  };

  const handlePointerOver = (event) => {
    event.stopPropagation();
    if (!isMining) { // Hover effect applies if ready or empty
        setHover(true);
        document.body.style.cursor = canMine ? 'pointer' : 'not-allowed';
    }
  };

  const handlePointerOut = (event) => {
    if (!isMining) {
        setHover(false);
        document.body.style.cursor = 'default';
    }
  };

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={[1, animationProgress.current, 1]} // Initial Y scale set by progress
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={"#ffffff"}
          wireframe={!isMining}
          opacity={isMining ? 0 : (canMine ? 0.7 : 0.4)}
          transparent={true}
          metalness={0.1}
          roughness={0.5}
          emissive={"#999999"}
          emissiveIntensity={0.2}
        />
      </mesh>
      <Text
        ref={textRef}
        position={[0, 0.6, 0]}
        fontSize={0.15}
        color={isMining ? "#FFA500" : (canMine ? "white" : "#bbbbbb")}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#333"
      >
        {isMining ? miningText : hoverText}
      </Text>
    </group>
  );
};

export default GhostBlock;