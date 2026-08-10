import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

export default function PlexusDNA({ length = 100, points = 120 }) {
    const groupRef = useRef();
    const radius = 3;

    // Calculate perfect coordinates for the strands and the rungs
    const { strand1, strand2, rungs, nodes } = useMemo(() => {
        const s1 = [];
        const s2 = [];
        const r = [];
        const n = [];

        for (let i = 0; i <= points; i++) {
            const x = (i / points) * length - (length / 2);

            // Controls the twist. Adjust the multiplier (e.g., 8) to twist more or less.
            const angle = (i / points) * Math.PI * 8;

            const y1 = Math.sin(angle) * radius;
            const z1 = Math.cos(angle) * radius;

            const y2 = Math.sin(angle + Math.PI) * radius;
            const z2 = Math.cos(angle + Math.PI) * radius;

            const p1 = new THREE.Vector3(x, y1, z1);
            const p2 = new THREE.Vector3(x, y2, z2);

            s1.push(p1);
            s2.push(p2);

            // Only create a connecting rung every few points so it doesn't look cluttered
            if (i % 3 === 0) {
                r.push([p1, p2]);
            }

            // Store node positions to render the boundary particles
            n.push(p1, p2);
        }
        return { strand1: s1, strand2: s2, rungs: r, nodes: n };
    }, [length, points]);

    // Gentle passive rotation
    useFrame(() => {
        if (groupRef.current) groupRef.current.rotation.x += 0.002;
    });

    return (
        <group ref={groupRef}>
            {/* 1. The Boundaries (Continuous outer lines) */}
            <Line points={strand1} color="#ffffff" lineWidth={1} transparent opacity={0.3} />
            <Line points={strand2} color="#ffffff" lineWidth={1} transparent opacity={0.3} />

            {/* 2. The Rungs (Perfect point A to point B connections) */}
            {rungs.map((rung, i) => (
                <Line
                    key={`rung-${i}`}
                    points={rung}
                    color="#00e5ff" // Cyan color from your reference
                    lineWidth={2}
                    transparent
                    opacity={0.8}
                />
            ))}

            {/* 3. The Nodes (Small glowing particles on the boundaries) */}
            {nodes.map((pos, i) => (
                <mesh key={`node-${i}`} position={pos}>
                    {/* Tiny spheres acting as connection joints */}
                    <sphereGeometry args={[0.08, 8, 8]} />
                    {/* Using meshBasicMaterial so they look like unlit glowing points */}
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
            ))}
        </group>
    );
}