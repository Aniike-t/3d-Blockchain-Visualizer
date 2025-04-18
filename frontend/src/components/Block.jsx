// --- Block.jsx (Explicit Default Reset) ---
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// Receive 'status' prop: 'valid', 'first-invalid', 'subsequent-invalid'
const Block = ({ position, blockData, onClick, isSelected, status }) => {
    const meshRef = useRef();
    const [hovered, setHover] = useState(false);
    const [targetScale, setTargetScale] = useState(1);

    // --- Logging ---
    console.log(`Block #${blockData?.index} - Received Status: ${status}`);
    // --------------------

    // Determine colors, interaction, and text color based on status
    // *** Explicitly set defaults here before the conditional logic ***
    let baseColor = '#98c379'; // Default valid green
    let emissiveBaseColor = '#60a050';
    let allowInteraction = true;
    let cursorStyle = 'pointer';
    let textColor = 'white';

    // Apply styles based on status
    if (status === 'valid') {
        if (blockData.index === 0) {
            baseColor = '#61dafb'; // Cyan for Genesis
            emissiveBaseColor = '#30a0c0';
            console.log(`Block #${blockData?.index} - Applying Genesis Style`);
        } else {
            // Keep defaults for non-genesis valid
            console.log(`Block #${blockData?.index} - Applying Valid Style (Non-Genesis)`);
        }
    } else if (status === 'first-invalid') {
        baseColor = '#e06c75'; // Bright Red
        emissiveBaseColor = '#a04040';
        allowInteraction = true; // Maybe allow click
        cursorStyle = 'help';
        textColor = '#ffdddd';
        console.log(`Block #${blockData?.index} - Applying First Invalid Style`);
    } else if (status === 'subsequent-invalid') {
        baseColor = '#ab5b62'; // Dim Red
        emissiveBaseColor = '#703030';
        allowInteraction = false;
        cursorStyle = 'not-allowed';
        textColor = '#ffcccc';
        console.log(`Block #${blockData?.index} - Applying Subsequent Invalid Style`);
    } else {
         // Handle unexpected status, maybe default to a warning color
         console.warn(`Block #${blockData?.index} - Unknown status received: ${status}. Applying default valid style.`);
         // Keep default valid styles in case of unknown status
    }

    // Update target scale based on interaction allowance and state
    useEffect(() => {
        setTargetScale(allowInteraction && isSelected ? 1.2 : (allowInteraction && hovered ? 1.1 : 1));
    }, [isSelected, hovered, allowInteraction]);

    // Frame loop for smooth transitions and applying colors
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8);
            const targetEmissiveIntensity = allowInteraction && isSelected ? 0.8 : (allowInteraction && hovered ? 0.4 : 0);
            meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
                meshRef.current.material.emissiveIntensity,
                targetEmissiveIntensity,
                delta * 8
            );
            // Ensure color is set every frame based on the calculated baseColor
            meshRef.current.material.color.set(baseColor);
            meshRef.current.material.emissive.set(emissiveBaseColor);
        }
    });

    // Event Handlers
    const handleClick = (event) => {
        event.stopPropagation();
        onClick(blockData);
    };
    const handlePointerOver = (event) => {
        event.stopPropagation();
        if (allowInteraction) setHover(true);
        document.body.style.cursor = cursorStyle;
    };
    const handlePointerOut = (event) => {
        if (allowInteraction) setHover(false);
        document.body.style.cursor = 'default';
    };

    return (
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
                    // Set initial color, but useFrame overrides
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
                color={textColor}
                anchorX="center" anchorY="middle"
                outlineWidth={0.01} outlineColor="black"
            >
                #{blockData.index}
            </Text>
        </group>
    );
};

export default Block;