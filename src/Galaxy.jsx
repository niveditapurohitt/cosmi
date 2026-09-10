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
    const starCount = 2400;
    const hoverFrame = useRef(0);
    const pointerWorld = useMemo(() => new THREE.Vector3(), []);
    const rayDirection = useMemo(() => new THREE.Vector3(), []);

    const { positions, basePositions, colors, sizes, opacities } = useMemo(() => {
        const pos = new Float32Array(starCount * 3);
        const base = new Float32Array(starCount * 3);
        const colorArray = new Float32Array(starCount * 3);
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
            colorArray[i * 3] = 1;
            colorArray[i * 3 + 1] = 1;
            colorArray[i * 3 + 2] = 1;
            siz[i] = Math.random() * 0.03 + 0.006;
            opac[i] = Math.random() * 0.5 + 0.1;
        }
        return { positions: pos, basePositions: base, colors: colorArray, sizes: siz, opacities: opac };
    }, [length]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const g = pointsRef.current;
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
        hoverFrame.current += 1;
        pointerWorld.set(state.pointer.x, state.pointer.y, 0).unproject(camera);
        rayDirection.copy(pointerWorld).sub(camera.position).normalize();
        if (hoverFrame.current % 2 === 0 && Math.abs(rayDirection.z) > 0.0001) {
            const hoverRadius = 3.6;
            const time = state.clock.getElapsedTime();

            for (let i = 0; i < starCount; i++) {
                const index = i * 3;
                // Project the cursor onto each star's depth so distant stars react too.
                const depth = basePositions[index + 2] - camera.position.z;
                const cursorX = camera.position.x + rayDirection.x * (depth / rayDirection.z);
                const cursorY = camera.position.y + rayDirection.y * (depth / rayDirection.z);
                const dx = basePositions[index] + g.position.x - cursorX;
                const dy = basePositions[index + 1] + g.position.y - cursorY;
                const distanceSq = dx * dx + dy * dy;
                if (distanceSq > hoverRadius * hoverRadius) {
                    positions[index] = basePositions[index];
                    positions[index + 1] = basePositions[index + 1];
                    colors[index] = 1;
                    colors[index + 1] = 1;
                    colors[index + 2] = 1;
                    continue;
                }
                const distance = Math.sqrt(distanceSq);
                const influence = Math.max(0, 1 - distance / hoverRadius);
                const falloff = influence * influence;
                const brightness = 1 + falloff * 1.5;
                colors[index] = brightness;
                colors[index + 1] = brightness;
                colors[index + 2] = brightness;
                const wave = Math.sin(distance * 4.2 - time * 2.8) * falloff * 1.15;
                const angle = Math.atan2(dy, dx) + falloff * 0.8 + Math.sin(time * 2.2 - distance * 3) * falloff * 0.25;
                const warpedDistance = Math.max(0, distance + falloff * 1.2 + wave);
                positions[index] = basePositions[index] + Math.cos(angle) * warpedDistance - g.position.x;
                positions[index + 1] = basePositions[index + 1] + Math.sin(angle) * warpedDistance - g.position.y;
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
            pointsRef.current.geometry.attributes.color.needsUpdate = true;
        }

        if (materialRef.current) {
            // Keep the star field fully visible for the entire session.
            materialRef.current.opacity = 1;
        }
    });

    return (
        <>
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={starCount} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={starCount} array={colors} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={starCount} array={sizes} itemSize={1} />
                {/* We use an extra attribute for alpha to make some stars fainter than others */}
                <bufferAttribute attach="attributes-alpha" count={starCount} array={opacities} itemSize={1} />
            </bufferGeometry>
            <pointsMaterial
                ref={materialRef}
                map={circleTexture} // Applies the round texture
                color="#ffffff"
                vertexColors
                size={isMobile ? 0.25 : 0.2}
                transparent
                opacity={1}
                alphaTest={0.01}
                sizeAttenuation={true}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
        </>
    );
}
