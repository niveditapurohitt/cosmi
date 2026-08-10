import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

const circleTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
})();

export default function ParticleCluster({
    dnaLength = 60,
    scrollStart = 0.08,
    scrollEnd = 0.24,
    center = [18, 0, -2],
    count = 140,
    spread = [9, 5, 4],
    threshold = 2.0,
    maxLines = 8000,
    color = '#88ccff',
    particleSize = 0.06,
    lineOpacity = 0.25,
    particleOpacity = 0.7,
}) {
    const groupRef = useRef();
    const scroll = useScroll();

    const particles = useMemo(() => {
        const arr = [];
        for (let i = 0; i < count; i++) {
            arr.push({
                base: new THREE.Vector3(
                    (Math.random() - 0.5) * spread[0],
                    (Math.random() - 0.5) * spread[1],
                    (Math.random() - 0.5) * spread[2]
                ),
                current: new THREE.Vector3(),
                phase: Math.random() * Math.PI * 2,
                speed: 1 + Math.random() * 1.5,
            });
        }
        return arr;
    }, [count, spread]);

    const positions = useMemo(() => new Float32Array(particles.length * 3), [particles]);
    const lines = useMemo(() => new Float32Array(maxLines * 6), [maxLines]);

    const geosPoints = useRef();
    const geosLines = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const offset = scroll.offset;

        const inWindow = offset >= scrollStart && offset <= scrollEnd;
        groupRef.current.visible = inWindow;
        if (!inWindow) return;

        const thresholdSq = threshold * threshold;
        const windowSize = 12;
        let lineCount = 0;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.current.x = p.base.x;
            p.current.y = p.base.y + Math.sin(t * p.speed + p.phase) * 0.3;
            p.current.z = p.base.z + Math.cos(t * p.speed + p.phase) * 0.3;
            positions[i * 3] = p.current.x;
            positions[i * 3 + 1] = p.current.y;
            positions[i * 3 + 2] = p.current.z;
        }

        for (let i = 0; i < particles.length; i++) {
            const maxJ = Math.min(particles.length, i + 1 + windowSize);
            for (let j = i + 1; j < maxJ; j++) {
                if (lineCount >= maxLines) break;
                if (particles[i].current.distanceToSquared(particles[j].current) < thresholdSq) {
                    lines[lineCount * 6] = particles[i].current.x;
                    lines[lineCount * 6 + 1] = particles[i].current.y;
                    lines[lineCount * 6 + 2] = particles[i].current.z;
                    lines[lineCount * 6 + 3] = particles[j].current.x;
                    lines[lineCount * 6 + 4] = particles[j].current.y;
                    lines[lineCount * 6 + 5] = particles[j].current.z;
                    lineCount++;
                }
            }
        }

        geosPoints.current.attributes.position.needsUpdate = true;
        geosLines.current.setDrawRange(0, lineCount * 2);
        geosLines.current.attributes.position.needsUpdate = true;

        const camX = offset * dnaLength - (dnaLength / 2);
        groupRef.current.position.x = camX + center[0];
        groupRef.current.position.y = center[1];
        groupRef.current.position.z = center[2];
    });

    return (
        <group ref={groupRef}>
            <points>
                <bufferGeometry ref={geosPoints}>
                    <bufferAttribute attach="attributes-position" count={particles.length} array={positions} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial map={circleTexture} size={particleSize} color="#ffffff" transparent opacity={particleOpacity} alphaTest={0.01} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>
            <lineSegments>
                <bufferGeometry ref={geosLines}>
                    <bufferAttribute attach="attributes-position" count={maxLines * 2} array={lines} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color={color} transparent opacity={lineOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </lineSegments>
        </group>
    );
}
