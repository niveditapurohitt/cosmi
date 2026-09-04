import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

// Generate a perfect circle texture to fix the "boxy" WebGL issue
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

export default function Galaxy({ length = 150, isMobile = false }) {
    const pointsRef = useRef();
    const materialRef = useRef();
    const scroll = useScroll();
    const starCount = 1500;
    const pointerWorld = useMemo(() => new THREE.Vector3(), []);
    const rayDirection = useMemo(() => new THREE.Vector3(), []);

    const { positions, basePositions, sizes, opacities } = useMemo(() => {
        const pos = new Float32Array(starCount * 3);
        const base = new Float32Array(starCount * 3);
        const siz = new Float32Array(starCount);
        const opac = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() - 0.5) * length * 3;
            const y = (Math.random() - 0.5) * 60;
            const z = (Math.random() - 0.5) * 80 - 20;

            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
            base[i * 3] = x;
            base[i * 3 + 1] = y;
            base[i * 3 + 2] = z;

            siz[i] = Math.random() * 0.03 + 0.006;
            opac[i] = Math.random() * 0.5 + 0.1;
        }
        return { positions: pos, basePositions: base, sizes: siz, opacities: opac };
    }, [length]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const g = pointsRef.current;
        g.rotation.x = state.clock.getElapsedTime() * 0.002;
        if (scroll) {
            if (isMobile) {
                // Keep the star field centered around the vertically traveling camera.
                g.position.y = state.camera.position.y;
            } else {
                g.position.x = scroll.offset * length * 0.15;
                g.position.y = 0;
            }
        }

        const camera = state.camera;
        pointerWorld.set(state.pointer.x, state.pointer.y, 0).unproject(camera);
        rayDirection.copy(pointerWorld).sub(camera.position).normalize();
        const depth = -20 - camera.position.z;
        pointerWorld.copy(camera.position).addScaledVector(rayDirection, depth / rayDirection.z);

        const time = state.clock.getElapsedTime();
        for (let i = 0; i < starCount; i++) {
            const index = i * 3;
            const dx = basePositions[index] + g.position.x - pointerWorld.x;
            const dy = basePositions[index + 1] + g.position.y - pointerWorld.y;
            const distance = Math.hypot(dx, dy);
            const influence = Math.max(0, 1 - distance / 9);
            const strength = influence * influence;
            const angle = Math.atan2(dy, dx) + strength * 0.95;
            const radius = distance + strength * 3.2;
            const wave = Math.sin(distance * 1.7 - time * 3.4) * strength * 1.25;
            const targetWorldX = pointerWorld.x + Math.cos(angle) * radius;
            const targetWorldY = pointerWorld.y + Math.sin(angle) * radius + wave;
            const targetX = targetWorldX - g.position.x;
            const targetY = targetWorldY - g.position.y;
            const targetZ = basePositions[index + 2] + Math.cos(distance * 1.35 - time * 2.6) * strength * 2.2;
            const settle = 1 - Math.exp(-delta * 9);
            positions[index] += (targetX - positions[index]) * settle;
            positions[index + 1] += (targetY - positions[index + 1]) * settle;
            positions[index + 2] += (targetZ - positions[index + 2]) * settle;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        if (materialRef.current) {
            // Keep the star field fully visible for the entire session.
            materialRef.current.opacity = 1;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={starCount} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={starCount} array={sizes} itemSize={1} />
                {/* We use an extra attribute for alpha to make some stars fainter than others */}
                <bufferAttribute attach="attributes-alpha" count={starCount} array={opacities} itemSize={1} />
            </bufferGeometry>
            <pointsMaterial
                ref={materialRef}
                map={circleTexture} // Applies the round texture
                color="#ffffff"
                size={isMobile ? 1.35 : 1}
                transparent
                opacity={1}
                alphaTest={0.01}
                sizeAttenuation={true}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}
