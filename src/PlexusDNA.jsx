import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

export default function PlexusDNA({ length = 80 }) {
    const groupRef = useRef();
    const scroll = useScroll();
    const radius = 3;
    const pointsPerStrand = 200;

    // Generate the complex Plexus Geometry
    const { backboneGeo, backboneLinesGeo, rungs, ambientGeo, ambientLinesGeo } = useMemo(() => {
        const s1Points = [];
        const s2Points = [];
        const allBackbonePoints = [];
        const rungData = [];

        // 1. Generate the Point Cloud for the DNA Backbone
        for (let i = 0; i <= pointsPerStrand; i++) {
            const x = (i / pointsPerStrand) * length - (length / 2);
            const angle = (i / pointsPerStrand) * Math.PI * 10;

            const base1 = new THREE.Vector3(x, Math.sin(angle) * radius, Math.cos(angle) * radius);
            const base2 = new THREE.Vector3(x, Math.sin(angle + Math.PI) * radius, Math.cos(angle + Math.PI) * radius);

            // Create a "cluster" of particles around the main backbone curve
            for (let j = 0; j < 4; j++) {
                const offset1 = new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);
                const offset2 = new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);

                const p1 = base1.clone().add(offset1);
                const p2 = base2.clone().add(offset2);

                s1Points.push(p1);
                s2Points.push(p2);
                allBackbonePoints.push(p1, p2);
            }

            // Add Cyan Rungs sporadically
            if (i % 6 === 0) {
                rungData.push({
                    position: [x, 0, 0],
                    rotation: [angle, 0, 0]
                });
            }
        }

        // 2. Generate Ambient Background Particles
        const ambientPoints = [];
        for (let i = 0; i < 400; i++) {
            ambientPoints.push(new THREE.Vector3(
                (Math.random() - 0.5) * length,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            ));
        }

        // 3. Algorithm to connect close points with lines (The Plexus Effect)
        const createPlexusLines = (pointsArray, distanceThreshold) => {
            const linePoints = [];
            for (let i = 0; i < pointsArray.length; i++) {
                for (let j = i + 1; j < pointsArray.length; j++) {
                    if (pointsArray[i].distanceTo(pointsArray[j]) < distanceThreshold) {
                        linePoints.push(pointsArray[i], pointsArray[j]);
                    }
                }
            }
            return new THREE.BufferGeometry().setFromPoints(linePoints);
        };

        return {
            backboneGeo: new THREE.BufferGeometry().setFromPoints(allBackbonePoints),
            backboneLinesGeo: createPlexusLines(allBackbonePoints, 1.8),
            ambientGeo: new THREE.BufferGeometry().setFromPoints(ambientPoints),
            ambientLinesGeo: createPlexusLines(ambientPoints, 3.5),
            rungs: rungData
        };
    }, [length]);

    // Handle Scroll Rotation
    useFrame(() => {
        if (!groupRef.current) return;

        // As the user scrolls (0 to 1), rotate the DNA heavily along the X-axis
        // The Math.PI * 8 determines how many full spins it does from start to finish
        const targetRotation = scroll.offset * Math.PI * 8;

        // Smooth the rotation
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation, 0.1);

        // Add a very slow passive spin even when not scrolling
        groupRef.current.rotation.x += 0.001;
    });

    return (
        <group ref={groupRef}>

            {/* --- DNA BACKBONE PLEXUS --- */}
            <points geometry={backboneGeo}>
                <pointsMaterial size={0.15} color="#ffffff" transparent opacity={0.8} />
            </points>
            <lineSegments geometry={backboneLinesGeo}>
                <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
            </lineSegments>

            {/* --- AMBIENT FLOATING PARTICLES --- */}
            <points geometry={ambientGeo}>
                <pointsMaterial size={0.1} color="#00ffff" transparent opacity={0.4} />
            </points>
            <lineSegments geometry={ambientLinesGeo}>
                <lineBasicMaterial color="#ffffff" transparent opacity={0.05} />
            </lineSegments>

            {/* --- GLOWING CYAN RUNGS --- */}
            {rungs.map((rung, i) => (
                <mesh key={`rung-${i}`} position={rung.position} rotation={rung.rotation}>
                    {/* Cylinder acts as the solid glowing bar in the middle */}
                    <cylinderGeometry args={[0.08, 0.08, radius * 2, 8]} />
                    {/* Tone-mapping disabled so the Bloom effect picks up the emissive color heavily */}
                    <meshBasicMaterial color="#00e5ff" toneMapped={false} />
                </mesh>
            ))}

        </group>
    );
}