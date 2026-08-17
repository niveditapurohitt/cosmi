import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

const smoothstep = (a, b, x) => {
    const u = THREE.MathUtils.clamp((x - a) / Math.max(0.0001, b - a), 0, 1);
    return u * u * (3 - 2 * u);
};

const circleTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
})();

export default function ActiveDNA({ length = 100, breaks = [] }) {
    const groupRef = useRef();
    const scroll = useScroll();
    const currentScale = useRef(1);
    const blurScale = useRef(0);

    const radius = 3.5;
    const twists = Math.max(1, Math.round(length / 10));
    const pointsPerStrand = Math.round(length * 3);
    const maxLinesPerStrand = Math.max(3000, pointsPerStrand * 30);

    const { strand1Particles, strand2Particles, s1Colors, s2Colors } = useMemo(() => {
        const s1 = []; const s2 = [];
        const c1 = []; const c2 = [];

        for (let i = 0; i <= pointsPerStrand; i++) {
            const progress = i / pointsPerStrand;
            const x = progress * length - (length / 2);
            const angle = progress * Math.PI * 2 * twists;

            const hue1 = progress * 0.7;
            const hue2 = 0.5 + progress * 0.5;
            const color1 = new THREE.Color().setHSL(hue1, 1.0, 0.55);
            const color2 = new THREE.Color().setHSL(hue2, 1.0, 0.55);

            const p1 = new THREE.Vector3(x, Math.sin(angle) * radius, Math.cos(angle) * radius);
            const p2 = new THREE.Vector3(x, Math.sin(angle + Math.PI) * radius, Math.cos(angle + Math.PI) * radius);

            for (let j = 0; j < 3; j++) {
                const getOffset = () => (Math.random() - 0.5) * 1.0;
                s1.push({ base: new THREE.Vector3(p1.x + getOffset(), p1.y + getOffset(), p1.z + getOffset()), current: new THREE.Vector3(), phase: Math.random() * Math.PI * 2, speed: 1 + Math.random() * 1.5 });
                s2.push({ base: new THREE.Vector3(p2.x + getOffset(), p2.y + getOffset(), p2.z + getOffset()), current: new THREE.Vector3(), phase: Math.random() * Math.PI * 2, speed: 1 + Math.random() * 1.5 });
                c1.push(color1.r, color1.g, color1.b);
                c2.push(color2.r, color2.g, color2.b);
            }
        }
        return {
            strand1Particles: s1, strand2Particles: s2,
            s1Colors: new Float32Array(c1), s2Colors: new Float32Array(c2)
        };
    }, [length, radius, twists]);

    const s1Positions = useMemo(() => new Float32Array(strand1Particles.length * 3), [strand1Particles]);
    const s2Positions = useMemo(() => new Float32Array(strand2Particles.length * 3), [strand2Particles]);
    const s1Lines = useMemo(() => new Float32Array(maxLinesPerStrand * 6), []);
    const s2Lines = useMemo(() => new Float32Array(maxLinesPerStrand * 6), []);

    const geoS1Points = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(s1Positions, 3));
        return g;
    }, [s1Positions]);
    const geoS2Points = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(s2Positions, 3));
        return g;
    }, [s2Positions]);
    const geoS1Lines = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(s1Lines, 3));
        return g;
    }, [s1Lines]);
    const geoS2Lines = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(s2Lines, 3));
        return g;
    }, [s2Lines]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const offset = scroll ? scroll.offset : 0;
        const blurTarget = smoothstep(0.08, 0.14, offset) * (1 - smoothstep(0.22, 0.29, offset));
        blurScale.current = THREE.MathUtils.lerp(blurScale.current, blurTarget, 0.08);

        const updateStrand = (particles, positionsArray, linesArray, pointsGeo, linesGeo) => {
            let lineCount = 0; const thresholdSq = 1.5 * 1.5;

            const windowSize = 25;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.current.x = p.base.x;
                p.current.y = p.base.y + Math.sin(t * p.speed + p.phase) * 0.3;
                p.current.z = p.base.z + Math.cos(t * p.speed + p.phase) * 0.3;

                positionsArray[i * 3] = p.current.x; positionsArray[i * 3 + 1] = p.current.y; positionsArray[i * 3 + 2] = p.current.z;
            }

            for (let i = 0; i < particles.length; i++) {
                const maxJ = Math.min(particles.length, i + 1 + windowSize);
                const ax = particles[i].current.x;
                const ay = particles[i].current.y;
                const az = particles[i].current.z;
                for (let j = i + 1; j < maxJ; j++) {
                    if (lineCount >= maxLinesPerStrand) break;
                    const b = particles[j].current;
                    const dx = ax - b.x;
                    const dy = ay - b.y;
                    const dz = az - b.z;
                    if (dx * dx + dy * dy + dz * dz < thresholdSq) {
                        linesArray[lineCount * 6] = ax; linesArray[lineCount * 6 + 1] = ay; linesArray[lineCount * 6 + 2] = az;
                        linesArray[lineCount * 6 + 3] = b.x; linesArray[lineCount * 6 + 4] = b.y; linesArray[lineCount * 6 + 5] = b.z;
                        lineCount++;
                    }
                }
            }

            pointsGeo.attributes.position.needsUpdate = true;
            linesGeo.setDrawRange(0, lineCount * 2);
            linesGeo.attributes.position.needsUpdate = true;
        };

        updateStrand(strand1Particles, s1Positions, s1Lines, geoS1Points, geoS1Lines);
        updateStrand(strand2Particles, s2Positions, s2Lines, geoS2Points, geoS2Lines);

        if (groupRef.current && scroll) {
            const targetRotation = scroll.offset * Math.PI * 10;
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation, 0.15);

            const offset = scroll.offset;
            let targetScale = 1;
            for (const b of breaks) {
                if (offset >= b.start && offset <= b.end) {
                    const p = (offset - b.start) / (b.end - b.start);
                    if (p < 0.3) targetScale = 1 - p / 0.3;
                    else if (p > 0.7) targetScale = (p - 0.7) / 0.3;
                    else targetScale = 0;
                    break;
                }
            }
            currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, 0.08);
            groupRef.current.scale.setScalar(currentScale.current);
        }

        if (groupRef.current) {
            groupRef.current.traverse((o) => {
                if (!o.material) return;
                if (o.userData.baseOp === undefined) o.userData.baseOp = o.material.opacity;
                if (o.userData.baseSize === undefined && o.material.size !== undefined) o.userData.baseSize = o.material.size;

                if (o.material.size !== undefined && o.userData.baseSize !== undefined) {
                    o.material.size = o.userData.baseSize * (1 + blurScale.current * 0.75);
                }

                const blurOpacity = o.material.size !== undefined
                    ? (0.7 + blurScale.current * 0.3)
                    : (0.45 + blurScale.current * 0.35);
                o.material.opacity = o.userData.baseOp * blurOpacity;
            });
        }
    });

    return (
        <group ref={groupRef}>
            <points geometry={geoS1Points}>
                <pointsMaterial map={circleTexture} size={0.1} color="#ffffff" transparent opacity={0.9} alphaTest={0.01} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>
            <points geometry={geoS1Points}>
                <pointsMaterial map={circleTexture} size={0.5} color="#4488ff" transparent opacity={0.28} alphaTest={0.01} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>
            <lineSegments geometry={geoS1Lines}>
                <lineBasicMaterial color="#4488ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
            </lineSegments>

            <points geometry={geoS2Points}>
                <pointsMaterial map={circleTexture} size={0.1} color="#ffffff" transparent opacity={0.9} alphaTest={0.01} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>
            <points geometry={geoS2Points}>
                <pointsMaterial map={circleTexture} size={0.5} color="#ff4488" transparent opacity={0.28} alphaTest={0.01} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>
            <lineSegments geometry={geoS2Lines}>
                <lineBasicMaterial color="#ff4488" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
            </lineSegments>
        </group>
    );
}
