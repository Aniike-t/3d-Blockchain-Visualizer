// --- Block.jsx (No changes from the previous feature-rich version) ---
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

const Block = ({ position, blockData, onClick, isSelected }) => {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);

  // Use state for target scale to handle selection/hover priority
  const [targetScale, setTargetScale] = useState(1);

  useEffect(() => {
      setTargetScale(isSelected ? 1.2 : (hovered ? 1.1 : 1));
  }, [isSelected, hovered]);


  useFrame((state, delta) => {
    if (meshRef.current) {
      // Lerp scale smoothly
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8); // Faster lerp

       // Lerp emissive intensity smoothly based on selection/hover
       const targetEmissiveIntensity = isSelected ? 0.8 : (hovered ? 0.4 : 0);
       meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
           meshRef.current.material.emissiveIntensity,
           targetEmissiveIntensity,
           delta * 8
       );
    }
  });

  const handleClick = (event) => {
    event.stopPropagation(); // Prevent triggering canvas/background events
    onClick(blockData);
  };

  const handlePointerOver = (event) => {
      event.stopPropagation();
      setHover(true);
      document.body.style.cursor = 'pointer'; // Indicate clickable
  };

  const handlePointerOut = (event) => {
      setHover(false);
       document.body.style.cursor = 'grab'; // Revert to default grab cursor
  };

  const blockColor = blockData.index === 0 ? '#61dafb' : '#98c379'; // Genesis vs Normal
  const emissiveColor = blockData.index === 0 ? '#30a0c0' : '#60a050'; // Darker shade for emission

  return (
    // Group takes the position, mesh is centered within the group
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={blockColor}
          metalness={0.3}
          roughness={0.6}
          emissive={emissiveColor} // Base emissive color
          emissiveIntensity={0} // Initial intensity, controlled by useFrame
        />
      </mesh>
       {/* Display Block Index */}
       <Text
         position={[0, 0.7, 0]} // Position above the block
         fontSize={0.15}
         color="white"
         anchorX="center"
         anchorY="middle"
         outlineWidth={0.01}
         outlineColor="black"
       >
         #{blockData.index}
       </Text>
    </group>
  );
};

export default Block;