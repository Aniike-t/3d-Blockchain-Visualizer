// --- GhostBlock.jsx (No changes from the previous feature-rich version) ---
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

const GhostBlock = ({ position, onMine, isMining }) => {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);
  const time = useRef(0);

  useFrame((state, delta) => {
    time.current += delta;
    if (meshRef.current) {
      const baseScale = 1.0;
      let targetScaleVec = new THREE.Vector3(baseScale, baseScale, baseScale);
      let targetOpacity = 0.7;
      let targetEmissiveIntensity = 0.2;
      let targetColor = new THREE.Color("#ffffff"); // Default white wireframe

      if (isMining) {
        const pulse = Math.sin(time.current * 6) * 0.05 + 1.0; // Subtle pulse
        targetScaleVec.set(pulse, pulse, pulse);
        targetOpacity = Math.sin(time.current * 6) * 0.1 + 0.7; // Pulse opacity
        targetEmissiveIntensity = Math.sin(time.current * 6) * 0.3 + 0.6; // Pulse emissive
        targetColor = new THREE.Color("#ffcc00"); // Mining color (yellowish)
      } else if (hovered) {
        targetScaleVec.set(1.15, 1.15, 1.15);
        targetOpacity = 0.9;
        targetEmissiveIntensity = 0.4;
      }

      // Lerp scale, opacity, emissive intensity
      meshRef.current.scale.lerp(targetScaleVec, delta * 8);
      meshRef.current.material.opacity = THREE.MathUtils.lerp(
          meshRef.current.material.opacity, targetOpacity, delta * 8
      );
       meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
           meshRef.current.material.emissiveIntensity, targetEmissiveIntensity, delta * 8
       );
      // Lerp color (optional, more subtle)
      // meshRef.current.material.color.lerp(targetColor, delta * 8);

       // Set wireframe based on mining state instantly
       meshRef.current.material.wireframe = !isMining;
        meshRef.current.material.color = targetColor; // Set color directly for mining state change

    }
  });

  const handleClick = (event) => {
    event.stopPropagation();
    if (!isMining) {
        onMine();
    }
  };

   const handlePointerOver = (event) => {
      event.stopPropagation();
       if (!isMining) { // Only hover effect if not mining
            setHover(true);
             document.body.style.cursor = 'pointer';
       }
  };

  const handlePointerOut = (event) => {
      if (!isMining) {
          setHover(false);
           document.body.style.cursor = 'grab';
      }
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        // No shadow casting/receiving for ghost? Optional.
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
        //   color managed in useFrame
          wireframe={!isMining} // Start as wireframe if not mining
          opacity={0.7} // Initial opacity
          transparent={true}
          metalness={0.1}
          roughness={0.5}
          emissive={isMining ? "#ffaa00" : "#999999"} // Base emissive
          emissiveIntensity={0.2} // Initial intensity
        />
      </mesh>
       <Text
         position={[0, 0, 0.6]} // Position slightly in front
         rotation={[0, 0, 0]} // No rotation needed if camera is isometric fixed
         fontSize={0.15}
         color={isMining ? "#FFA500" : "white"}
         anchorX="center"
         anchorY="middle"
         outlineWidth={0.01}
         outlineColor="#333"
       >
         {isMining ? 'MINING...' : '+ Add New'}
       </Text>
    </group>
  );
};

export default GhostBlock;