import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, Scroll, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import ActiveDNA from './ActiveDNA';
import Galaxy from './Galaxy';
import ParticleBg from './ParticleBg';

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function makeCardTexture(title, subtitle, accent, items = null) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 356;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 356);

  const x = 4;
  const y = 4;
  const w = 504;
  const h = 348;
  const r = 20;

  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  path();
  const bg = ctx.createLinearGradient(0, 0, 0, 356);
  if (items) {
    bg.addColorStop(0, 'rgba(10, 14, 20, 1)');
    bg.addColorStop(1, 'rgba(10, 14, 20, 1)');
  } else {
    bg.addColorStop(0, 'rgba(13, 20, 34, 0.6)');
    bg.addColorStop(1, 'rgba(5, 8, 15, 0.7)');
  }
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.save();
  path();
  ctx.clip();
  const net = [];
  const randN = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 46; i++) net.push({ x: randN(14, 498), y: randN(14, 342) });
  ctx.strokeStyle = `rgba(${accent}, 0.18)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < net.length; i++) {
    for (let j = i + 1; j < net.length; j++) {
      const dx = net[i].x - net[j].x;
      const dy = net[i].y - net[j].y;
      if (dx * dx + dy * dy < 12100) {
        ctx.beginPath();
        ctx.moveTo(net[i].x, net[i].y);
        ctx.lineTo(net[j].x, net[j].y);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = `rgba(${accent}, 0.6)`;
  for (let i = 0; i < net.length; i++) {
    ctx.beginPath();
    ctx.arc(net[i].x, net[i].y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = `rgba(${accent}, 0.35)`;
  ctx.lineWidth = 2;
  ctx.stroke();

  path();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillRect(x, y, w, 3);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (items) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.font = '500 16px "Fredoka"';
    ctx.fillText('C O S M I   C H A M E L E O N', 256, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = '500 32px "Fredoka"';
    ctx.fillText(title.toUpperCase(), 256, 66);

    ctx.fillStyle = `rgba(${accent}, 0.9)`;
    ctx.font = '500 16px "Fredoka"';
    ctx.fillText(subtitle.toUpperCase(), 256, 94);

    const colX = [28, 258];
    const rowY = [112, 206];
    const cw = 226;
    const ch = 90;
    const cr = 10;

    const miniPath = (px, py) => {
      ctx.beginPath();
      ctx.moveTo(px + cr, py);
      ctx.arcTo(px + cw, py, px + cw, py + ch, cr);
      ctx.arcTo(px + cw, py + ch, px, py + ch, cr);
      ctx.arcTo(px, py + ch, px, py, cr);
      ctx.arcTo(px, py, px + cw, py, cr);
      ctx.closePath();
    };

    for (let i = 0; i < Math.min(items.length, 4); i++) {
      const cx = colX[i % 2];
      const cy = rowY[Math.floor(i / 2)];
      const it = items[i];

      miniPath(cx, cy);
      ctx.fillStyle = 'rgba(8, 12, 22, 0.55)';
      ctx.fill();
      ctx.strokeStyle = `rgba(${accent}, 0.3)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 15px "Fredoka"';
      ctx.fillText(it.title.toUpperCase(), cx + 14, cy + 12);

      ctx.fillStyle = `rgba(${accent}, 0.8)`;
      ctx.fillRect(cx + 14, cy + 32, 26, 2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
      ctx.font = '400 11px "Fredoka"';
      const tlines = wrapText(ctx, it.text, cw - 28);
      tlines.slice(0, 3).forEach((line, j) => {
        ctx.fillText(line, cx + 14, cy + 42 + j * 14);
      });

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }

    ctx.fillStyle = `rgba(${accent}, 0.65)`;
    ctx.font = '500 13px "Fredoka"';
    ctx.fillText('CLICK TO CLOSE', 256, 338);
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.font = '500 22px "Fredoka"';
    ctx.fillText('C O S M I   C H A M E L E O N', 256, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = '500 58px "Fredoka"';
    ctx.fillText(title.toUpperCase(), 256, 152);

    ctx.fillStyle = `rgba(${accent}, 0.9)`;
    ctx.font = '500 34px "Fredoka"';
    ctx.fillText(subtitle.toUpperCase(), 256, 222);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeOptionTexture(title, text, accent, hover) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 640, 200);

  const rectL = 150;
  const rectT = 20;
  const rectW = 480;
  const rectH = 160;
  const rectR = 18;

  const rectPath = () => {
    ctx.beginPath();
    ctx.moveTo(rectL + rectR, rectT);
    ctx.arcTo(rectL + rectW, rectT, rectL + rectW, rectT + rectH, rectR);
    ctx.arcTo(rectL + rectW, rectT + rectH, rectL, rectT + rectH, rectR);
    ctx.arcTo(rectL, rectT + rectH, rectL, rectT, rectR);
    ctx.arcTo(rectL, rectT, rectL + rectW, rectT, rectR);
    ctx.closePath();
  };

  // galaxy background (the starfield behind the card)
  const bg = ctx.createLinearGradient(0, 0, 0, 200);
  bg.addColorStop(0, 'rgba(20, 23, 46, 1)');
  bg.addColorStop(0.5, 'rgba(9, 12, 26, 1)');
  bg.addColorStop(1, 'rgba(4, 6, 12, 1)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 640, 200);

  // soft glowing star (matches the round additive star look of the 3D galaxy field)
  const softStar = (sx, sy, sr, color) => {
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  };

  // galaxy stars: soft round points with the same brightness/size range as the 3D starfield
  for (let i = 0; i < 130; i++) {
    const bright = Math.random();
    const sr = 0.7 + bright * 2.0;
    const alpha = 0.08 + bright * 0.5;
    softStar(Math.random() * 640, Math.random() * 200, sr, `rgba(255,255,255,${alpha})`);
  }
  // a few larger faint accent-tinted glows, like the brighter stars of the galaxy
  for (let i = 0; i < 10; i++) {
    softStar(Math.random() * 640, Math.random() * 200, 2.5 + Math.random() * 1.8, `rgba(${accent}, 0.35)`);
  }

  // beam origin point (source of the release energy streaming into the panel)
  const scx = 70;
  const scy = 100;
  const sr = hover ? 34 : 28;

  // release beams: energy streaming from the origin into the rectangle
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cone = ctx.createLinearGradient(scx, 0, rectL, 0);
  cone.addColorStop(0, `rgba(${accent}, ${hover ? 0.55 : 0.38})`);
  cone.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(scx, scy - sr * 0.4);
  ctx.lineTo(rectL, rectT + 12);
  ctx.lineTo(rectL, rectT + rectH - 12);
  ctx.lineTo(scx, scy + sr * 0.4);
  ctx.closePath();
  ctx.fill();

  const rays = [-0.34, -0.17, 0, 0.17, 0.34];
  for (const ry of rays) {
    const g = ctx.createLinearGradient(scx, scy, rectL + rectW, scy + ry * rectH);
    g.addColorStop(0, `rgba(${accent}, ${hover ? 0.75 : 0.5})`);
    g.addColorStop(0.5, `rgba(${accent}, 0.12)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(scx + sr * 0.6, scy + ry * sr * 0.5);
    ctx.lineTo(rectL + rectW, scy + ry * rectH);
    ctx.stroke();
  }
  ctx.restore();

  // the released rectangle panel
  const glass = ctx.createLinearGradient(0, rectT, 0, rectT + rectH);
  glass.addColorStop(0, `rgba(16, 20, 40, ${hover ? 0.92 : 0.82})`);
  glass.addColorStop(1, 'rgba(6, 9, 20, 0.9)');
  rectPath();
  ctx.fillStyle = glass;
  ctx.fill();

  // energy entering the rectangle from the star
  ctx.save();
  rectPath();
  ctx.clip();
  const innerG = ctx.createLinearGradient(rectL, 0, rectL + 150, 0);
  innerG.addColorStop(0, `rgba(${accent}, ${hover ? 0.3 : 0.18})`);
  innerG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = innerG;
  ctx.fillRect(rectL, rectT, 150, rectH);

  const edgeG = ctx.createLinearGradient(0, rectT, 0, rectT + rectH);
  edgeG.addColorStop(0, `rgba(${accent}, 0.95)`);
  edgeG.addColorStop(0.5, `rgba(${accent}, 0.55)`);
  edgeG.addColorStop(1, `rgba(${accent}, 0.8)`);
  ctx.fillStyle = edgeG;
  ctx.fillRect(rectL, rectT + 14, 4, rectH - 28);
  ctx.restore();

  const bGrad = ctx.createLinearGradient(rectL, 0, rectL + rectW, 0);
  bGrad.addColorStop(0, `rgba(${accent}, ${hover ? 1 : 0.9})`);
  bGrad.addColorStop(0.35, `rgba(${accent}, 0.55)`);
  bGrad.addColorStop(1, `rgba(${accent}, 0.2)`);
  ctx.strokeStyle = bGrad;
  ctx.lineWidth = hover ? 2.5 : 2;
  rectPath();
  ctx.stroke();

  // info inside the rectangle
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let size = 33;
  ctx.font = `500 ${size}px "Fredoka"`;
  const maxW = rectW - 92;
  while (ctx.measureText(title).width > maxW && size > 19) {
    size -= 1;
    ctx.font = `500 ${size}px "Fredoka"`;
  }
  const titleY = hover ? 72 : 100;
  ctx.save();
  ctx.shadowColor = `rgba(${accent}, 0.85)`;
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, rectL + 24, titleY);
  ctx.restore();

  // details revealed on hover
  if (hover && text) {
    ctx.fillStyle = `rgba(${accent}, 0.9)`;
    ctx.fillRect(rectL + 24, 102, 46, 3);
    ctx.font = '400 18px "Fredoka"';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const lines = wrapText(ctx, text, maxW);
    lines.slice(0, 2).forEach((line, j) => {
      ctx.fillText(line, rectL + 24, 120 + j * 24);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function CameraTracker({ length, journey }) {
  const scroll = useScroll();
  const journeyScrollRef = useRef(null);
  const scrollerRef = useRef(null);
    useFrame((state, delta) => {
      const x = scroll.offset * length - (length / 2);
    if (journey) {
      if (scrollerRef.current === null) scrollerRef.current = scroll.el || null;
      if (journeyScrollRef.current === null && scrollerRef.current) {
        journeyScrollRef.current = scrollerRef.current.scrollLeft;
      }
      if (scrollerRef.current) scrollerRef.current.scrollLeft = journeyScrollRef.current || 0;
      const cam = state.camera.position;
      if (cam.x < JOURNEY_CAM_ARRIVE) {
        cam.x = Math.min(cam.x + JOURNEY_WALK_SPEED * delta, JOURNEY_CAM_X);
      } else {
        cam.x = THREE.MathUtils.lerp(cam.x, JOURNEY_CAM_X, 1 - Math.exp(-delta * 2.2));
      }
      cam.z = THREE.MathUtils.lerp(cam.z, 0, 1 - Math.exp(-delta * 6));
      cam.y = THREE.MathUtils.lerp(cam.y, 0, 1 - Math.exp(-delta * 3.5));
      state.camera.lookAt(JOURNEY_END_X, JOURNEY_CAM_LOOK_Y, 0);
    } else {
      journeyScrollRef.current = null;
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, x, 0.05);
      const zOffset = Math.sin(scroll.offset * Math.PI) * 4;
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 18 - zOffset, 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, 0.05);
      state.camera.lookAt(x, 0, 0);
    }
  });
  return null;
}

function AnimateWords({ children }) {
  const ref = useRef();
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setOn(true);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={on ? 'image-placeholder-inner anim-words anim' : 'image-placeholder-inner anim-words'}>
      {children}
    </div>
  );
}

function MouseGlow() {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    let mx = -1000, my = -1000;
    let x = -1000, y = -1000;
    let lastMove = -Infinity;
    let running = false;

    const loop = () => {
      if (performance.now() - lastMove > 250) {
        el.style.opacity = '0';
        running = false;
        return;
      }
      el.style.opacity = '1';
      x += (mx - x) * 0.2;
      y += (my - y) * 0.2;
      el.style.transform = `translate3d(${x - 160}px, ${y - 160}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      loop();
    };
    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      lastMove = performance.now();
      start();
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="mouse-glow" />;
}

function ScrollSection({ children, scrollStart, scrollEnd, persist = false, style = {} }) {
  const ref = useRef();
  const scroll = useScroll();

  useFrame(() => {
    if (!ref.current) return;
    const offset = scroll.offset;
    if (offset >= scrollStart) {
      if (persist) {
        const progress = (offset - scrollStart) / Math.max(0.01, scrollEnd - scrollStart);
        const fadeIn = Math.min(1, progress / 0.15);
        ref.current.style.opacity = fadeIn;
      } else if (offset <= scrollEnd) {
        const progress = (offset - scrollStart) / (scrollEnd - scrollStart);
        let opacity = 1;
        if (progress < 0.15) opacity = progress / 0.15;
        else if (progress > 0.85) opacity = (1 - progress) / 0.15;
        ref.current.style.opacity = Math.max(0, Math.min(1, opacity));
      } else {
        ref.current.style.opacity = 0;
      }
    } else {
      ref.current.style.opacity = 0;
    }
  });

  return (
    <div ref={ref} style={{ ...style, opacity: 0 }}>
      {children}
    </div>
  );
}

const glowTex = (() => {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  g.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

function useCardTexture(title, subtitle, accent, items) {
  const [tex, setTex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      setTex(makeCardTexture(title, subtitle, accent, items));
    };
    Promise.all([
      document.fonts.load('500 22px "Fredoka"'),
      document.fonts.load('500 58px "Fredoka"'),
      document.fonts.load('500 34px "Fredoka"'),
      document.fonts.load('500 32px "Fredoka"'),
      document.fonts.load('500 16px "Fredoka"'),
      document.fonts.load('500 15px "Fredoka"'),
      document.fonts.load('400 11px "Fredoka"'),
      document.fonts.load('500 13px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [title, subtitle, accent, items]);

  return tex;
}

function useOptionTextures(items, accent) {
  const [texs, setTexs] = useState({ normal: [], hover: [] });

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      setTexs({
        normal: items.map((it) => makeOptionTexture(it.title, it.text, accent, false)),
        hover: items.map((it) => makeOptionTexture(it.title, it.text, accent, true)),
      });
    };
    Promise.all([
      document.fonts.load('500 33px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [items, accent]);

  return texs;
}

function OrbitingCard({ title, subtitle, color, items, stairIndex, totalCards, journey, onSelect }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const glowRef = useRef();
  const optionsRef = useRef([]);
  const optionGlowRef = useRef([]);
  const optionHoverRef = useRef([]);
  const scroll = useScroll();
  const hoverRef = useRef(false);
  const angleRef = useRef(0);
  const scaleRef = useRef(0.0001);
  const posXRef = useRef(0);
  const posYZRef = useRef({ y: 0, z: 0 });
  const rotYRef = useRef(0);
  const glowOpacityRef = useRef(0);
  const journeyTRef = useRef(0);

  const worldX = -15 + stairIndex * 10 + 2.5;
  const orbitRadius = 4.5;
  const entryStart = 0.24;
  const entryDur = 0.07;
  const flyIn = 6;
  const JOURNEY_CARD_SCALE = 1.3;
  const OPTION_ROW = 2.2;
  const OPTION_COL = 6.2;
  const OPTION_SIZE = [5.6, 1.75];

  const normalTex = useCardTexture(title, subtitle, color, null);
  const optionTexs = useOptionTextures(items, color);
  const cardColor = 'rgb(' + color + ')';

  const isJourneying = journey !== null;
  const isJourneyTarget = isJourneying && journey.card === stairIndex;

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;

    if (isJourneying) {
      if (isJourneyTarget) {
        groupRef.current.visible = true;
        meshRef.current.visible = false;
        posXRef.current = THREE.MathUtils.lerp(posXRef.current, JOURNEY_END_X, 0.055);
        posYZRef.current.y = THREE.MathUtils.lerp(posYZRef.current.y, 0, 0.055);
        posYZRef.current.z = THREE.MathUtils.lerp(posYZRef.current.z, 0, 0.055);
        rotYRef.current = THREE.MathUtils.lerp(rotYRef.current, -Math.PI / 2, 0.055);
        groupRef.current.position.set(posXRef.current, posYZRef.current.y, posYZRef.current.z);
        groupRef.current.rotation.set(0, rotYRef.current, 0);
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
        scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, JOURNEY_CARD_SCALE, 0.06);
        groupRef.current.scale.setScalar(Math.max(0.0001, scaleRef.current));

        if (normalTex && meshRef.current.material.map !== normalTex) {
          meshRef.current.material.map = normalTex;
          meshRef.current.material.needsUpdate = true;
        }
        meshRef.current.material.opacity = THREE.MathUtils.lerp(meshRef.current.material.opacity, 1, 0.08);

        if (glowRef.current) {
          glowOpacityRef.current = THREE.MathUtils.lerp(glowOpacityRef.current, 0, 0.15);
          glowRef.current.material.opacity = 0;
        }

        journeyTRef.current += delta;
        const optIn = THREE.MathUtils.clamp((journeyTRef.current - 3.5) / 1.5, 0, 1);
        for (let i = 0; i < optionsRef.current.length; i++) {
          const m = optionsRef.current[i];
          m.material.opacity = optIn;
          const hover = !!optionHoverRef.current[i];
          const tex = hover ? optionTexs.hover[i] : optionTexs.normal[i];
          if (tex && m.material.map !== tex) {
            m.material.map = tex;
            m.material.needsUpdate = true;
          }
          const ts = hover ? 1.09 : 1;
          m.scale.x = THREE.MathUtils.lerp(m.scale.x, ts, 0.15);
          m.scale.y = THREE.MathUtils.lerp(m.scale.y, ts, 0.15);
          if (optionGlowRef.current[i]) {
            const g = optionGlowRef.current[i].material;
            g.opacity = hover ? 0.75 * optIn : THREE.MathUtils.lerp(g.opacity, 0, 0.15);
          }
        }
      } else {
        hoverRef.current = false;
        groupRef.current.visible = false;
      }
      return;
    }

    groupRef.current.visible = true;
    meshRef.current.visible = true;
    journeyTRef.current = 0;
    meshRef.current.position.set(0, 0, 0);
    for (let i = 0; i < optionsRef.current.length; i++) {
      optionsRef.current[i].material.opacity = 0;
      optionsRef.current[i].scale.set(1, 1, 1);
      if (optionTexs.normal[i]) {
        optionsRef.current[i].material.map = optionTexs.normal[i];
        optionsRef.current[i].material.needsUpdate = true;
      }
      if (optionGlowRef.current[i]) optionGlowRef.current[i].material.opacity = 0;
      optionHoverRef.current[i] = false;
    }
    if (!hoverRef.current && !optionHoverRef.current.some(Boolean)) {
      document.body.style.cursor = 'auto';
    }

    const offset = scroll.offset;
    const entryT = THREE.MathUtils.clamp((offset - entryStart) / entryDur, 0, 1);
    if (entryT <= 0) {
      groupRef.current.visible = false;
      return;
    }

    const eased = 1 - Math.pow(1 - entryT, 3);

    const dnaRotation = offset * Math.PI * 10;
    const helixAngle = (stairIndex / totalCards) * Math.PI * 2;
    const visualAngle = helixAngle - dnaRotation;

    let angleDiff = visualAngle - angleRef.current;
    angleDiff = ((angleDiff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    angleRef.current += angleDiff * 0.16;
    const angle = angleRef.current;

    const orbitY = Math.sin(angle) * orbitRadius;
    const orbitZ = Math.cos(angle) * orbitRadius * 0.6;

    posXRef.current = THREE.MathUtils.lerp(posXRef.current, worldX, 0.1);
    posYZRef.current.y = THREE.MathUtils.lerp(posYZRef.current.y, orbitY, 0.1);
    posYZRef.current.z = THREE.MathUtils.lerp(posYZRef.current.z, orbitZ, 0.1);
    rotYRef.current = THREE.MathUtils.lerp(rotYRef.current, 0, 0.1);

    groupRef.current.position.x = posXRef.current + (1 - eased) * flyIn;
    groupRef.current.position.y = posYZRef.current.y;
    groupRef.current.position.z = posYZRef.current.z;
    groupRef.current.rotation.set(0, rotYRef.current, 0);

    meshRef.current.rotation.x = -angle;

    const facing = Math.cos(angle);
    const baseScale = 0.7 + (facing * 0.5 + 0.5) * 0.5;
    const targetScale = baseScale * (hoverRef.current ? 1.1 : 1);
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.12);
    groupRef.current.scale.setScalar(Math.max(0.0001, scaleRef.current));

    if (normalTex && meshRef.current.material.map !== normalTex) {
      meshRef.current.material.map = normalTex;
      meshRef.current.material.needsUpdate = true;
    }

    meshRef.current.material.opacity = eased;

    if (glowRef.current) {
      const targetGlow = hoverRef.current ? 0.7 : 0;
      glowOpacityRef.current = THREE.MathUtils.lerp(glowOpacityRef.current, targetGlow, 0.15);
      glowRef.current.material.opacity = glowOpacityRef.current * eased;
    }
  });

  return (
    <group ref={groupRef}>
      {normalTex && (
        <mesh
          ref={meshRef}
          onPointerOver={(e) => { e.stopPropagation(); if (!isJourneying) { hoverRef.current = true; document.body.style.cursor = 'pointer'; } }}
          onPointerOut={() => { hoverRef.current = false; if (!optionHoverRef.current.some(Boolean)) document.body.style.cursor = 'auto'; }}
          onClick={(e) => { e.stopPropagation(); if (!isJourneying) onSelect(); }}
        >
          <planeGeometry args={[3.8, 2.65]} />
          <meshBasicMaterial map={normalTex} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          <mesh position={[0, 0, -0.08]} scale={[1.3, 1.3, 1]} raycast={() => null}>
            <planeGeometry args={[3.8, 2.65]} />
            <meshBasicMaterial map={glowTex} color={cardColor} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </mesh>
      )}
      {optionTexs.normal.length > 0 && (
        <group position={[0, ((Math.ceil(items.length / 2) - 1) * OPTION_ROW) / 2 + 0.7, 0]}>
          {items.map((it, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const lastRowAlone = items.length % 2 === 1 && row === Math.floor(items.length / 2);
            const gridX = lastRowAlone ? 0 : (col === 0 ? -OPTION_COL / 2 : OPTION_COL / 2);
            return (
              <mesh
                key={i}
                ref={(el) => { if (el) optionsRef.current[i] = el; }}
                position={[gridX, -row * OPTION_ROW, 0]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  if (isJourneying) {
                    optionHoverRef.current[i] = true;
                    document.body.style.cursor = 'pointer';
                  }
                }}
                onPointerOut={() => {
                  optionHoverRef.current[i] = false;
                  if (!optionHoverRef.current.some(Boolean)) document.body.style.cursor = 'auto';
                }}
              >
                <planeGeometry args={OPTION_SIZE} />
                <meshBasicMaterial map={optionTexs.normal[i]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
                <mesh
                  position={[0, 0, -0.05]}
                  scale={[1.14, 1.5, 1]}
                  raycast={() => null}
                  ref={(el) => { if (el) optionGlowRef.current[i] = el; }}
                >
                  <planeGeometry args={OPTION_SIZE} />
                  <meshBasicMaterial map={glowTex} color={cardColor} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
                </mesh>
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}

const TOTAL_PAGES = 6;
const DNA_LENGTH = 60;
const CAMERA_RANGE = 66;
const DNA_OFFSET = -6;

const JOURNEY_END_X = 55;
const JOURNEY_CAM_X = 30;
const JOURNEY_CAM_LOOK_Y = 0.7;
const JOURNEY_WALK_SPEED = 8;
const JOURNEY_CAM_ARRIVE = 26;

const sphereData = [
  {
    title: "Our Expertise", subtitle: "Innovation", color: "255, 140, 60", stairIndex: 0,
    items: [
      { title: "Website Development", text: "Modern, blazing-fast sites built to convert." },
      { title: "Lead Generation", text: "Targeted pipelines that keep your funnel full." },
      { title: "Social Media Marketing", text: "Content engineered to build reach and trust." },
      { title: "App Development", text: "Mobile experiences your users will love." },
    ],
  },
  {
    title: "Proprietary", subtitle: "Products", color: "255, 68, 136", stairIndex: 1,
    items: [
      { title: "AI Agents For Workflow Automations", text: "Autonomous agents that remove busywork." },
      { title: "CRM Dashboards", text: "Your entire pipeline, one clear view." },
      { title: "Billing Software", text: "Payments, invoices and subscriptions made simple." },
      { title: "Intelligent Chatbots", text: "AI support that answers instantly, 24/7." },
    ],
  },
  {
    title: "Why Cosmi", subtitle: "Chameleon", color: "170, 90, 255", stairIndex: 2,
    items: [
      { title: "Strategies Built For You", text: "No templates — every plan is custom." },
      { title: "Data Driven Decisions", text: "We let the numbers guide the way." },
      { title: "Creative Innovation", text: "Fresh ideas engineered to stand out." },
      { title: "Reliability", text: "A partner you can count on, always." },
    ],
  },
  {
    title: "Marketing", subtitle: "Insights", color: "126, 255, 90", stairIndex: 3,
    items: [
      { title: "The Rise Of AI In Ads", text: "How machine learning is reshaping spend." },
      { title: "Viral Scaling Strategy", text: "Playbooks to turn reach into revenue." },
      { title: "Short Form Video Mastery", text: "Reels and shorts that actually convert." },
      { title: "Data Driven Storytelling", text: "Narratives built on real performance data." },
      { title: "Platform Algorithm Evolution", text: "Staying ahead as the algorithms shift." },
    ],
  },
];

export default function App() {
  const [journey, setJourney] = useState(null);
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#020204', position: 'relative' }}>
      <Canvas camera={{ position: [-(CAMERA_RANGE / 2), 0, 18], fov: 45 }} dpr={[1, 1.25]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />
        <directionalLight position={[-10, -5, -10]} intensity={0.3} />

          <ScrollControls pages={TOTAL_PAGES} horizontal damping={0.15} enabled={!journey} style={{ zIndex: 3 }}>
            <Galaxy length={DNA_LENGTH * 1.5} />
            <group position={[DNA_OFFSET, 0, 0]}>
              <ActiveDNA length={DNA_LENGTH} breaks={[
                { start: 0.1, end: 0.25 }
              ]} />
            </group>
            <CameraTracker length={CAMERA_RANGE} journey={journey} />

            {sphereData.map((s, i) => (
              <OrbitingCard key={i} title={s.title} subtitle={s.subtitle} color={s.color} items={s.items} stairIndex={s.stairIndex} totalCards={4} journey={journey} onSelect={() => setJourney({ card: i })} />
            ))}

            <Scroll html style={{ width: '100vw', height: '100vh' }}>

              {/* 1. TITLE */}
              <ScrollSection
                scrollStart={0}
                scrollEnd={0.14}
                style={{
                  position: 'absolute',
                  top: '38vh',
                  left: '0vw',
                  width: '100vw',
                  textAlign: 'center',
                  color: 'white',
                  zIndex: 10,
                }}
              >
                <h1 className="hero-title">Cosmi Chameleon</h1>
                <div className="hero-subtitle-line" />
              </ScrollSection>

              {/* 2. ADAPT TRANSFORM DOMINATE (DNA breaks) */}
              <ScrollSection
                scrollStart={0.08}
                scrollEnd={0.24}
                style={{
                  position: 'absolute',
                  top: '0vh',
                  left: '80vw',
                  width: '100vw',
                  height: '100vh',
                  textAlign: 'center',
                  color: 'white',
                }}
              >
                <div className="image-section image-section-adapt image-section-full">
                  <div className="image-placeholder">
                    <ParticleBg color="255, 140, 140" count={360} linkDistance={95} />
                    <AnimateWords>
                      <span className="image-label">Adapt</span>
                      <span className="image-label">Transform</span>
                      <span className="image-label">Dominate</span>
                      <p className="image-caption">Where evolution meets innovation</p>
                    </AnimateWords>
                  </div>
                </div>
              </ScrollSection>

              <ScrollSection
                scrollStart={0.8}
                scrollEnd={1.0}
                persist
                style={{
                  position: 'absolute',
                  top: '0vh',
                  left: '500vw',
                  width: '100vw',
                  height: '100vh',
                  textAlign: 'center',
                  color: 'white',
                }}
              >
                <div className="image-section image-section-launch image-section-full">
                  <div className="image-placeholder image-placeholder-3">
                    <ParticleBg color="0, 229, 255" count={360} linkDistance={95} />
                    <AnimateWords>
                      <span className="image-label">Launch</span>
                      <span className="image-label">Your</span>
                      <span className="image-label">Evolution</span>
                      <p className="image-caption">The future starts here</p>
                    </AnimateWords>
                  </div>
                </div>
              </ScrollSection>

            </Scroll>
          </ScrollControls>
      </Canvas>
      {journey && (
        <button className="journey-back" onClick={() => setJourney(null)}>Back</button>
      )}
      <MouseGlow />
    </div>
  );
}