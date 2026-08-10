import React, { useEffect, useMemo, useRef } from 'react';
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

function sectionFade(offset, start, end, persist) {
    if (offset < start) return 0;
    if (persist) {
        const progress = (offset - start) / Math.max(0.01, end - start);
        return Math.min(1, progress / 0.15);
    }
    if (offset > end) return 0;
    const progress = (offset - start) / (end - start);
    let opacity = 1;
    if (progress < 0.15) opacity = progress / 0.15;
    else if (progress > 0.85) opacity = (1 - progress) / 0.15;
    return Math.max(0, Math.min(1, opacity));
}

export default function ScreenParticles({
    color = '#ff8c8c',
    count = 500,
    linkDistance = 2.0,
    scrollStart = 0.08,
    scrollEnd = 0.24,
    persist = false,
    particleSize = 0.12,
    lineOpacity = 0.5,
}) {
    const groupRef = useRef();
    const pointsGeo = useRef();
    const linesGeo = useRef();
    const pointsMat = useRef();
    const linesMat = useRef();
    const scroll = useScroll();
    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onMove = (e) => {
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    const home = useMemo(() => {
        const h = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) h[i] = Math.random() - 0.5;
        return h;
    }, [count]);

    const phases = useMemo(() => {
        const p = new Float32Array(count);
        const sp = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            p[i] = Math.random() * Math.PI * 2;
            sp[i] = 0.8 + Math.random() * 1.2;
        }
        return { phases: p, speeds: sp };
    }, [count]);

    const positions = useMemo(() => new Float32Array(count * 3), [count]);
    const MAX_LINES = 12000;
    const lines = useMemo(() => new Float32Array(MAX_LINES * 6), []);

    useFrame((state) => {
        const group = groupRef.current;
        if (!group) return;
        const offset = scroll.offset;
        const opacity = sectionFade(offset, scrollStart, scrollEnd, persist);
        group.visible = opacity > 0.01;
        if (!group.visible) return;

        const cam = state.camera;
        const fovRad = (cam.fov * Math.PI) / 180;
        const d = 16;
        const h = 2 * d * Math.tan(fovRad / 2);
        const w = h * (state.size.width / state.size.height);
        const depth = 1.5;

        group.position.set(cam.position.x, 0, cam.position.z - d);

        const t = state.clock.getElapsedTime();
        const threshSq = linkDistance * linkDistance;
        let lineCount = 0;

        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            positions[ix] = home[ix] * w;
            positions[ix + 1] = home[ix + 1] * h + Math.sin(t * phases.speeds[i] + phases.phases[i]) * 0.3;
            positions[ix + 2] = home[ix + 2] * depth + Math.cos(t * phases.speeds[i] + phases.phases[i]) * 0.3;
        }

        for (let i = 0; i < count; i++) {
            const ax = positions[i * 3];
            const ay = positions[i * 3 + 1];
            const az = positions[i * 3 + 2];
            for (let j = i + 1; j < count; j++) {
                if (lineCount >= MAX_LINES) break;
                const bx = positions[j * 3];
                const by = positions[j * 3 + 1];
                const bz = positions[j * 3 + 2];
                const dx = ax - bx;
                const dy = ay - by;
                const dz = az - bz;
                if (dx * dx + dy * dy + dz * dz < threshSq) {
                    const li = lineCount * 6;
                    lines[li] = ax; lines[li + 1] = ay; lines[li + 2] = az;
                    lines[li + 3] = bx; lines[li + 4] = by; lines[li + 5] = bz;
                    lineCount++;
                }
            }
        }

        pointsGeo.current.attributes.position.needsUpdate = true;
        linesGeo.current.setDrawRange(0, lineCount * 2);
        linesGeo.current.attributes.position.needsUpdate = true;

        pointsMat.current.opacity = opacity;
        linesMat.current.opacity = opacity * lineOpacity;
    });

    return (
        <group ref={groupRef}>
            <points>
                <bufferGeometry ref={pointsGeo}>
                    <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial
                    ref={pointsMat}
                    map={circleTexture}
                    size={particleSize}
                    color={color}
                    transparent
                    opacity={0}
                    alphaTest={0.01}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
            <lineSegments>
                <bufferGeometry ref={linesGeo}>
                    <bufferAttribute attach="attributes-position" count={MAX_LINES * 2} array={lines} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial
                    ref={linesMat}
                    color={color}
                    transparent
                    opacity={0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </lineSegments>
        </group>
    );
}
