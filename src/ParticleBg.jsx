import React, { useEffect, useRef } from 'react';

const LAYERS = [
    { alpha: 1.0, radiusMul: 1.0, core: 0.0, midStop: 0.75, midAlpha: 0.95 }, // foreground: sharp
    { alpha: 0.6, radiusMul: 2.4, core: 0.0, midStop: 0.45, midAlpha: 0.4 }, // middle: medium blur
    { alpha: 0.32, radiusMul: 4.5, core: 0.0, midStop: 0.25, midAlpha: 0.18 }, // background: heavy blur
];

const SPRITE_SIZE = 64;

const smooth = (a, b, x) => {
    const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
};

function makeSprite(color, layer, boost = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_SIZE;
    canvas.height = SPRITE_SIZE;
    const ctx = canvas.getContext('2d');
    const c = SPRITE_SIZE / 2;
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(layer.core, `rgba(${color}, ${Math.min(1, layer.alpha * boost)})`);
    grad.addColorStop(layer.midStop, `rgba(${color}, ${Math.min(1, layer.midAlpha * boost)})`);
    grad.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    return canvas;
}

export default function ParticleBg({ color = '136, 204, 255', count = 60, linkDistance = 130, progressRef = null, opacity = 1 }) {
    const canvasRef = useRef();
    const mouse = useRef({ x: -9999, y: -9999 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let raf;
        let w, h, dpr;
        let particles = [];
        let visible = true;
        const cachedRect = { left: 0, top: 0, width: 0, height: 0 };

        const sprites = LAYERS.map((layer) => makeSprite(color, layer));
        const hotSprites = LAYERS.map((layer) => makeSprite(color, layer, 1.8));

        const activeCount = () => (window.innerWidth < 700 ? Math.max(30, Math.floor(count * 0.5)) : count);

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
            cachedRect.left = rect.left;
            cachedRect.top = rect.top;
            cachedRect.width = rect.width;
            cachedRect.height = rect.height;
            canvas.width = Math.max(1, Math.floor(w * dpr));
            canvas.height = Math.max(1, Math.floor(h * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;

            particles = [];
            const n = activeCount();
            for (let i = 0; i < n; i++) {
                const roll = Math.random();
                const layer = roll < 0.28 ? 0 : roll < 0.68 ? 1 : 2;
                const x0 = Math.random() * w;
                const y0 = Math.random() * h;
                particles.push({
                    x: x0,
                    y: y0,
                    homeX: x0,
                    homeY: y0,
                    tx: x0,
                    ty: y0,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    r: 1 + Math.random() * 2,
                    layer,
                    hot: false,
                });
            }
        };

        let linkPath = null;
        let tickCount = 0;

        const tick = () => {
            if (!visible) {
                raf = requestAnimationFrame(tick);
                return;
            }

            const prog = progressRef ? progressRef.current || 0 : 0;
            const wSpread = 1 - smooth(0.12, 0.45, prog);
            const wDense = smooth(0.55, 0.88, prog);
            const wConnect = Math.max(0, 1 - wSpread - wDense);
            const k = 1 + 0.5 * wSpread - 0.34 * wDense;
            const linkD = linkDistance * (1 + 0.3 * wConnect - 0.12 * wDense);
            const cx = w / 2;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            const mx = mouse.current.x - cachedRect.left;
            const my = mouse.current.y - cachedRect.top;
            const over = mx >= -40 && my >= -40 && mx <= cachedRect.width + 40 && my <= cachedRect.height + 40;

            for (const p of particles) {
                const dxc = p.homeX - cx;
                const dyc = p.homeY - cy;
                p.tx = cx + dxc * k;
                p.ty = cy + dyc * k;

                if (over) {
                    const dx = p.x - mx;
                    const dy = p.y - my;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < 130 * 130 && d2 > 0.01) {
                        const d = Math.sqrt(d2);
                        const force = (1 - d / 130) * 0.16;
                        p.vx += (dx / d) * force;
                        p.vy += (dy / d) * force;
                        p.hot = d < 110;
                    }
                }
                p.vx += (p.tx - p.x) * 0.02;
                p.vy += (p.ty - p.y) * 0.02;
                p.vx *= 0.96;
                p.vy *= 0.96;
                const sp = Math.hypot(p.vx, p.vy);
                const maxS = 0.9;
                if (sp > maxS) {
                    p.vx = (p.vx / sp) * maxS;
                    p.vy = (p.vy / sp) * maxS;
                }
                p.x += p.vx;
                p.y += p.vy;
            }

            const lineAlpha = 0.1 + 0.08 * wConnect + (over ? 0.04 : 0);
            tickCount += 1;
            // Rebuild the O(n^2) link path only every other frame; re-stroke the cached path otherwise
            if (tickCount % 2 === 1 || !linkPath) {
                linkPath = new Path2D();
                for (let i = 0; i < particles.length; i++) {
                    const a = particles[i];
                    for (let j = i + 1; j < particles.length; j++) {
                        const b = particles[j];
                        const dx = a.x - b.x;
                        const dy = a.y - b.y;
                        if (dx * dx + dy * dy < linkD * linkD) {
                            linkPath.moveTo(a.x, a.y);
                            linkPath.lineTo(b.x, b.y);
                        }
                    }
                }
            }
            ctx.strokeStyle = `rgba(${color}, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke(linkPath);

            for (const p of particles) {
                const lay = LAYERS[p.layer];
                const sprite = p.hot ? hotSprites[p.layer] : sprites[p.layer];
                const radius = p.r * lay.radiusMul * (p.hot ? 1.35 : 1);
                const size = radius * 2;
                ctx.drawImage(sprite, p.x - radius, p.y - radius, size, size);
            }

            for (const p of particles) p.hot = false;

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
    }, [color, count, linkDistance, progressRef]);

        return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 0,
                opacity,
            }}
        />
    );
}
