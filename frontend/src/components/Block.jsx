// --- Block.jsx (Change Color Based on Validity) ---
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// Added isChainValid prop
const Block = ({ position, blockData, onClick, isSelected, isChainValid }) => {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);
  const [targetScale, setTargetScale] = useState(1);

  // Determine base color based on validity AND genesis status
  const baseColor = isChainValid
      ? (blockData.index === 0 ? '#61dafb' : '#98c379') // Normal valid colors
      : '#e06c75'; // Invalid color (reddish)

   // Determine emissive color based on validity
   const emissiveBaseColor = isChainValid
        ? (blockData.index === 0 ? '#30a0c0' : '#60a050')
        : '#a04040'; // Darker red emissive for invalid


  useEffect(() => {
      // Hover/selection only affects scale if block is valid
      setTargetScale(isChainValid && isSelected ? 1.2 : (isChainValid && hovered ? 1.1 : 1));
  }, [isSelected, hovered, isChainValid]);


  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8);

       // Lerp emissive intensity smoothly based on selection/hover (only if valid)
       const targetEmissiveIntensity = isChainValid && isSelected ? 0.8 : (isChainValid && hovered ? 0.4 : 0);
       meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
           meshRef.current.material.emissiveIntensity,
           targetEmissiveIntensity,
           delta * 8
       );

        // Update color instantly if validity changes (could lerp too)
        meshRef.current.material.color.set(baseColor);
        meshRef.current.material.emissive.set(emissiveBaseColor);
    }
  });

  const handleClick = (event) => {
    event.stopPropagation();
     // Allow clicking even if invalid, to see details
    onClick(blockData);
  };

  const handlePointerOver = (event) => {
      event.stopPropagation();
      // Only hover effect if valid
       if (isChainValid) {
            setHover(true);
            document.body.style.cursor = 'pointer';
       } else {
            document.body.style.cursor = 'not-allowed'; // Indicate invalid
       }
  };

  const handlePointerOut = (event) => {
       if (isChainValid) {
           setHover(false);
       }
       // Revert cursor regardless
       document.body.style.cursor = 'default'; // Use default, not grab
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow // Keep shadows even if invalid
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        {/* Material color/emissive set dynamically in useFrame */}
        <meshStandardMaterial
          // Initial colors set here, but overridden by useFrame
          color={baseColor}
          metalness={0.3}
          roughness={0.6}
          emissive={emissiveBaseColor}
          emissiveIntensity={0}
        />
      </mesh>
       <Text
         position={[0, 0.9, 0]}
         fontSize={0.50}
         color={isChainValid ? "white" : "#ffdddd"} // Dim text if invalid
         anchorX="center" anchorY="middle"
         outlineWidth={0.01} outlineColor="black"
       >
         #{blockData.index}
       </Text>
    </group>
  );
};

export default Block;