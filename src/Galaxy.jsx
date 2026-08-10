import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

function windowFade(o, os, oe, is, ie) {
    if (o <= os) return 1;
    if (o < oe) return 1 - (o - os) / (oe - os);
    if (o <= is) return 0;
    if (o < ie) return (o - is) / (ie - is);
    return 1;
}

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

export default function Galaxy({ length = 150 }) {
    const pointsRef = useRef();
    const geometryRef = useRef();
    const materialRef = useRef();
    const currentOpacity = useRef(1);
    const scroll = useScroll();
    const mouse = useRef({ x: 0, y: 0 });
    const starCount = 1500;

    useEffect(() => {
        const onMove = (e) => {
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    const { positions, home, sizes, opacities } = useMemo(() => {
        const pos = new Float32Array(starCount * 3);
        const hom = new Float32Array(starCount * 3);
        const siz = new Float32Array(starCount);
        const opac = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() - 0.5) * length * 3;
            const y = (Math.random() - 0.5) * 60;
            const z = (Math.random() - 0.5) * 80 - 20;

            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
            hom[i * 3] = x;
            hom[i * 3 + 1] = y;
            hom[i * 3 + 2] = z;

            siz[i] = Math.random() * 0.1 + 0.02;
            opac[i] = Math.random() * 0.5 + 0.1;
        }
        return { positions: pos, home: hom, sizes: siz, opacities: opac };
    }, [length]);

    const offsets = useRef(new Float32Array(starCount)).current;
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const hitPoint = useMemo(() => new THREE.Vector3(), []);
    const worldTarget = useMemo(() => new THREE.Vector3(), []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const g = pointsRef.current;
        g.rotation.x = state.clock.getElapsedTime() * 0.002;
        if (scroll) g.position.x = scroll.offset * length * 0.15;

        if (scroll && materialRef.current) {
            const offset = scroll.offset;
            const adaptFade = windowFade(offset, 0.08, 0.13, 0.2, 0.25);
            const launchFade = offset <= 0.78 ? 1 : Math.max(0, 1 - (offset - 0.78) / 0.06);
            const target = Math.min(adaptFade, launchFade);
            currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, target, 0.08);
            materialRef.current.opacity = currentOpacity.current;
        }

        const ndc = new THREE.Vector2(mouse.current.x, mouse.current.y);
        raycaster.setFromCamera(ndc, state.camera);

        const localOrigin = hitPoint.copy(raycaster.ray.origin);
        g.worldToLocal(localOrigin);
        const dirPoint = worldTarget.copy(raycaster.ray.origin).add(raycaster.ray.direction);
        g.worldToLocal(dirPoint);
        const localDir = dirPoint.sub(localOrigin).normalize();

        const R = 3;
        const maxOffset = 3;

        for (let i = 0; i < starCount; i++) {
            const hx = home[i * 3];
            const hy = home[i * 3 + 1];
            const hz = home[i * 3 + 2];

            let target = 0;
            let nx = 0;
            let ny = 0;
            if (Math.abs(localDir.z) > 1e-6) {
                const t = (hz - localOrigin.z) / localDir.z;
                if (t > 0) {
                    const mx = localOrigin.x + localDir.x * t;
                    const my = localOrigin.y + localDir.y * t;
                    const dx = hx - mx;
                    const dy = hy - my;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < R * R) {
                        const d = Math.sqrt(d2) || 1;
                        const off = (1 - d / R) * maxOffset;
                        target = off;
                        nx = dx / d;
                        ny = dy / d;
                    }
                }
            }

            offsets[i] += (target - offsets[i]) * 0.15;
            positions[i * 3] = hx + nx * offsets[i];
            positions[i * 3 + 1] = hy + ny * offsets[i];
        }
        geometryRef.current.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute attach="attributes-position" count={starCount} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={starCount} array={sizes} itemSize={1} />
                {/* We use an extra attribute for alpha to make some stars fainter than others */}
                <bufferAttribute attach="attributes-alpha" count={starCount} array={opacities} itemSize={1} />
            </bufferGeometry>
            <pointsMaterial
                ref={materialRef}
                map={circleTexture} // Applies the round texture
                color="#ffffff"
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
