// --- GhostBlock.jsx (With Assembly Animation) ---
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// Speed control for the assembly animation (higher means faster)
const ASSEMBLY_SPEED = 0.8; // e.g., takes ~1 / 0.8 = 1.25 seconds to fully assemble

const GhostBlock = ({ position, onMine, isMining }) => {
  const groupRef = useRef(); // Ref for the group to adjust position
  const meshRef = useRef();
  const textRef = useRef(); // Ref for the text to adjust its position
  const [hovered, setHover] = useState(false);

  // Ref to track the animation progress (0 = not started, 1 = fully assembled)
  const animationProgress = useRef(isMining ? 0 : 1); // Start at 0 if initially mining, else 1

  // Reset animation when isMining status changes
  useEffect(() => {
    if (isMining) {
      // Start assembling from the bottom
      animationProgress.current = 0;
      if (meshRef.current) {
        // Instantly set scale/position for the start of mining animation
         meshRef.current.scale.y = 0;
         // Position the group so the base is on the ground plane
         // A unit cube's base is at y = -0.5. When scale.y=0, center is at y=0.
         // We want the eventual base at y=-0.5, so initial center y should be -0.5
         if(groupRef.current) groupRef.current.position.y = -0.5;
      }
       if (textRef.current) {
            // Initial text position slightly above the base
            textRef.current.position.y = 0.1;
       }

    } else {
      // Instantly set to fully assembled state when not mining
      animationProgress.current = 1;
       if (meshRef.current) {
           meshRef.current.scale.y = 1;
       }
       if (groupRef.current) {
            // Group position needs to be 0 for a centered unit cube
            groupRef.current.position.y = 0;
       }
       if (textRef.current) {
            // Reset text position relative to the full block
            textRef.current.position.y = 0; // Centered vertically relative to group
       }
    }
  }, [isMining]); // Dependency: run when mining status changes


  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current || !textRef.current) return; // Refs not ready

    const targetColor = new THREE.Color(isMining ? "#ffcc00" : "#ffffff");
    let targetOpacity = isMining ? 0.7 : (hovered ? 0.9 : 0.7);
    let targetEmissiveIntensity = isMining ? 0.6 : (hovered ? 0.4 : 0.2);
    const targetEmissiveColor = new THREE.Color(isMining ? "#ffaa00" : (hovered ? "#cccccc" : "#999999"));

    if (isMining) {
      // --- Assembly Animation ---
      if (animationProgress.current < 1) {
        animationProgress.current = Math.min(1, animationProgress.current + delta * ASSEMBLY_SPEED);
      }
      // Apply scale based on progress
      meshRef.current.scale.y = animationProgress.current;

      // Adjust group position so the base stays put while scaling up
      // Base is at y = -0.5. Top is at y = -0.5 + scale.y
      // Center is halfway: y_center = (-0.5 + (-0.5 + scale.y)) / 2 = -0.5 + scale.y / 2
      groupRef.current.position.y = -0.5 + (meshRef.current.scale.y / 2);

       // Keep Text positioned relative to the top of the growing block
       // Top surface Y relative to group center = scale.y / 2
       // Add a small offset (0.1) to place text above
       textRef.current.position.y = (meshRef.current.scale.y / 2) + 0.1;


      // --- Other Mining Visuals (Pulse, etc.) ---
      const pulseFactor = Math.sin(state.clock.elapsedTime * 6) * 0.03 + 1.0; // Subtle size pulse
      meshRef.current.scale.x = pulseFactor;
      meshRef.current.scale.z = pulseFactor;
      // Adjust opacity/emissive slightly for pulse effect
      targetOpacity = Math.sin(state.clock.elapsedTime * 5) * 0.1 + animationProgress.current * 0.6 + 0.1; // Fade in opacity
      targetEmissiveIntensity = Math.sin(state.clock.elapsedTime * 5) * 0.3 + 0.6;

    } else {
       // --- Standard Hover Effect (When Not Mining) ---
        const targetScale = hovered ? 1.15 : 1.0;
        // Lerp scale for hover effect (don't lerp Y scale, it's handled by useEffect/mining)
        meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, delta * 8);
        meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, delta * 8);
        // Ensure Y scale and group position are correct when not mining
        meshRef.current.scale.y = 1;
        groupRef.current.position.y = 0;
         textRef.current.position.y = 0.6; // Position above fully formed block
    }

    // --- Apply Material Properties ---
    meshRef.current.material.color.lerp(targetColor, delta * 10); // Faster color lerp
    meshRef.current.material.opacity = THREE.MathUtils.lerp(
        meshRef.current.material.opacity, targetOpacity, delta * 8
    );
    meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
        meshRef.current.material.emissiveIntensity, targetEmissiveIntensity, delta * 8
    );
     meshRef.current.material.emissive.lerp(targetEmissiveColor, delta * 8);

    // Wireframe depends only on mining state (instant change)
    meshRef.current.material.wireframe = !isMining;

  });

  const handleClick = (event) => {
    event.stopPropagation();
    if (!isMining) onMine();
  };

  const handlePointerOver = (event) => {
    event.stopPropagation();
    if (!isMining) {
      setHover(true);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (event) => {
    if (!isMining) {
      setHover(false);
      document.body.style.cursor = 'default'; // Use default cursor
    }
  };

  return (
    // Use groupRef for position adjustments during animation
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        // Set initial scale; useFrame will control it during animation
        scale={[1, animationProgress.current, 1]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          // Initial state set here, useFrame updates dynamically
          color={"#ffffff"} // Start white
          wireframe={!isMining}
          opacity={isMining ? 0 : 0.7} // Start transparent if mining
          transparent={true}
          metalness={0.1}
          roughness={0.5}
          emissive={"#999999"}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Text positioning is now relative to the group */}
      <Text
        ref={textRef}
        position={[0, 0.6, 0]} // Initial position (will be updated)
        fontSize={0.15}
        color={isMining ? "#FFA500" : "white"}
        anchorX="center"
        anchorY="middle" // Anchor text at its vertical middle
        outlineWidth={0.01}
        outlineColor="#333"
      >
        {isMining ? 'MINING...' : '+ Add New'}
      </Text>
    </group>
  );
};

export default GhostBlock;