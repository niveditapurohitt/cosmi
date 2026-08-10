import React, { useEffect, useRef } from 'react';

const LAYERS = [
    { alpha: 1.0, radiusMul: 1.0, core: 0.0, midStop: 0.75, midAlpha: 0.95 }, // foreground: sharp
    { alpha: 0.6, radiusMul: 2.4, core: 0.0, midStop: 0.45, midAlpha: 0.4 }, // middle: medium blur
    { alpha: 0.32, radiusMul: 4.5, core: 0.0, midStop: 0.25, midAlpha: 0.18 }, // background: heavy blur
];

const SPRITE_SIZE = 64;

function makeSprite(color, layer) {
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_SIZE;
    canvas.height = SPRITE_SIZE;
    const ctx = canvas.getContext('2d');
    const c = SPRITE_SIZE / 2;
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(layer.core, `rgba(${color}, ${layer.alpha})`);
    grad.addColorStop(layer.midStop, `rgba(${color}, ${layer.midAlpha})`);
    grad.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    return canvas;
}

export default function ParticleBg({ color = '136, 204, 255', count = 60, linkDistance = 130 }) {
    const canvasRef = useRef();
    const mouse = useRef({ x: -9999, y: -9999 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let raf;
        let w, h, dpr;
        let particles = [];
        let visible = true;

        const sprites = LAYERS.map((layer) => makeSprite(color, layer));

        const onMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };
        window.addEventListener('mousemove', onMove);

        const io = new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            if (!visible && raf) {
                cancelAnimationFrame(raf);
                raf = undefined;
            } else if (visible && !raf) {
                raf = requestAnimationFrame(tick);
            }
        });
        io.observe(canvas);

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 1);
            w = rect.width;
            h = rect.height;
            canvas.width = Math.max(1, Math.floor(w * dpr));
            canvas.height = Math.max(1, Math.floor(h * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;

            particles = [];
            for (let i = 0; i < count; i++) {
                const roll = Math.random();
                const layer = roll < 0.28 ? 0 : roll < 0.68 ? 1 : 2;
                const x0 = Math.random() * w;
                const y0 = Math.random() * h;
                particles.push({
                    x: x0,
                    y: y0,
                    homeX: x0,
                    homeY: y0,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    r: 1 + Math.random() * 2,
                    layer,
                });
            }
        };

        const tick = () => {
            if (!visible) {
                raf = requestAnimationFrame(tick);
                return;
            }

            ctx.clearRect(0, 0, w, h);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            }

            const rect = canvas.parentElement.getBoundingClientRect();
            const mx = mouse.current.x - rect.left;
            const my = mouse.current.y - rect.top;
            const over = mx >= -40 && my >= -40 && mx <= rect.width + 40 && my <= rect.height + 40;
            if (over) {
                const R = 120;
                for (const p of particles) {
                    const dx = p.x - mx;
                    const dy = p.y - my;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < R * R && d2 > 0.01) {
                        const d = Math.sqrt(d2);
                        const force = (1 - d / R) * 0.18;
                        p.vx += (dx / d) * force;
                        p.vy += (dy / d) * force;
                    }
                }
            }
            for (const p of particles) {
                p.vx += (p.homeX - p.x) * 0.015;
                p.vy += (p.homeY - p.y) * 0.015;
                p.vx *= 0.97;
                p.vy *= 0.97;
                const sp = Math.hypot(p.vx, p.vy);
                const maxS = 0.9;
                if (sp > maxS) {
                    p.vx = (p.vx / sp) * maxS;
                    p.vy = (p.vy / sp) * maxS;
                }
            }

            ctx.strokeStyle = `rgba(${color}, 0.12)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    if (dx * dx + dy * dy < linkDistance * linkDistance) {
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                    }
                }
            }
            ctx.stroke();

            for (const p of particles) {
                const lay = LAYERS[p.layer];
                const sprite = sprites[p.layer];
                const radius = p.r * lay.radiusMul;
                const size = radius * 2;
                ctx.drawImage(sprite, p.x - radius, p.y - radius, size, size);
            }

            raf = requestAnimationFrame(tick);
        };

        resize();
        raf = requestAnimationFrame(tick);
        window.addEventListener('resize', resize);

        return () => {
            cancelAnimationFrame(raf);
            io.disconnect();
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('resize', resize);
        };
    }, [color, count, linkDistance]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
}
