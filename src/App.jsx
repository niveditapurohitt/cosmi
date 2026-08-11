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

  // particle constellation like the DNA cards (transparent background)
  const randN = (a, b) => a + Math.random() * (b - a);
  const pts = [];
  for (let i = 0; i < 22; i++) pts.push({ x: randN(12, 628), y: randN(12, 188) });
  ctx.save();
  ctx.strokeStyle = `rgba(${accent}, ${hover ? 0.32 : 0.2})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      if (dx * dx + dy * dy < 12100) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = `rgba(${accent}, ${hover ? 0.9 : 0.6})`;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // subtle accent border
  ctx.strokeStyle = `rgba(${accent}, ${hover ? 0.55 : 0.4})`;
  ctx.lineWidth = 1.5;
  const r = 18;
  const rrect = () => {
    ctx.beginPath();
    ctx.moveTo(20 + r, 20);
    ctx.arcTo(620, 20, 620, 180, r);
    ctx.arcTo(620, 180, 20, 180, r);
    ctx.arcTo(20, 180, 20, 20, r);
    ctx.arcTo(20, 20, 620, 20, r);
    ctx.closePath();
  };
  rrect();
  ctx.stroke();

  // title
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let size = 38;
  ctx.font = `500 ${size}px "Fredoka"`;
  const maxW = 600 - 60;
  while (ctx.measureText(title).width > maxW && size > 20) {
    size -= 1;
    ctx.font = `500 ${size}px "Fredoka"`;
  }
  const titleY = hover ? 70 : 100;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 24, titleY);
  ctx.restore();

  // details revealed on hover
  if (hover && text) {
    ctx.fillStyle = `rgba(${accent}, 0.9)`;
    ctx.fillRect(24, 100, 46, 3);
    ctx.font = '400 18px "Fredoka"';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const lines = wrapText(ctx, text, maxW);
    lines.slice(0, 2).forEach((line, j) => {
      ctx.fillText(line, 24, 118 + j * 24);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function CameraTracker({ length, journey, mouseXRef, mouseYRef }) {
  const scroll = useScroll();
  const journeyScrollRef = useRef(null);
  const scrollerRef = useRef(null);
  const journeyStartSnappedRef = useRef(false);

    useFrame((state, delta) => {
      const x = scroll.offset * length - (length / 2);
      const k = 1 - Math.exp(-delta * 5);
      const py = mouseYRef.current;
      const px = mouseXRef.current;
    if (journey) {
      if (scrollerRef.current === null) scrollerRef.current = scroll.el || null;
      if (journeyScrollRef.current === null && scrollerRef.current) {
        journeyScrollRef.current = scrollerRef.current.scrollLeft;
      }
      if (scrollerRef.current) scrollerRef.current.scrollLeft = journeyScrollRef.current || 0;
      const cam = state.camera.position;
      if (journey.card >= 2 && !journeyStartSnappedRef.current) {
        journeyStartSnappedRef.current = true;
        cam.set(JOURNEY_LEFT_START, 0, 0);
      }
      if (cam.x < JOURNEY_CAM_ARRIVE) {
        cam.x = Math.min(cam.x + JOURNEY_WALK_SPEED * delta, JOURNEY_CAM_X);
      } else {
        cam.x = THREE.MathUtils.lerp(cam.x, JOURNEY_CAM_X, 1 - Math.exp(-delta * 2.2));
      }
      cam.z = THREE.MathUtils.lerp(cam.z, 0, 1 - Math.exp(-delta * 6));
      cam.y = THREE.MathUtils.lerp(cam.y, -py * 1.2, 1 - Math.exp(-delta * 3.5));
      state.camera.lookAt(JOURNEY_END_X + px * 0.6, JOURNEY_CAM_LOOK_Y - py * 1.0, 0);
    } else {
      journeyStartSnappedRef.current = false;
      journeyScrollRef.current = null;
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, x, 0.05);
      const zOffset = Math.sin(scroll.offset * Math.PI) * 4;
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 18 - zOffset, 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, -py * 1.35, k);
      state.camera.lookAt(x + px * 1.5, -py * 0.8, 0);
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

function smoothstep(a, b, x) {
  const u = THREE.MathUtils.clamp((x - a) / Math.max(0.0001, b - a), 0, 1);
  return u * u * (3 - 2 * u);
}

function AdaptStage({ scrollStart, scrollEnd, progressRef, blocks }) {
  const scroll = useScroll();
  const stageRef = useRef();
  const lineRef = useRef();
  const captionRef = useRef();
  const blockRefs = [useRef(), useRef(), useRef()];

  useFrame(() => {
    if (!stageRef.current) return;
    const t = THREE.MathUtils.clamp((scroll.offset - scrollStart) / Math.max(0.0001, scrollEnd - scrollStart), 0, 1);
    if (progressRef) progressRef.current = t;

    const [b0, b1, b2] = blockRefs;

    if (b0.current) {
      const op = 1 - smoothstep(0.55, 0.78, t);
      const ty = smoothstep(0, 0.3, t) * 30;
      b0.current.style.opacity = op.toFixed(3);
      b0.current.style.transform = `translateY(${ty.toFixed(2)}px)`;
    }
    if (b1.current) {
      const op = smoothstep(0.1, 0.28, t) * (1 - smoothstep(0.8, 0.95, t));
      const sc = 0.82 + 0.2 * smoothstep(0.1, 0.32, t);
      b1.current.style.opacity = op.toFixed(3);
      b1.current.style.transform = `scale(${sc.toFixed(4)})`;
    }
    if (b2.current) {
      const op = smoothstep(0.42, 0.58, t);
      const ty = (1 - smoothstep(0.42, 0.66, t)) * 36;
      b2.current.style.opacity = op.toFixed(3);
      b2.current.style.transform = `translateY(${ty.toFixed(2)}px)`;
    }
    if (lineRef.current) {
      lineRef.current.style.height = `${(12 + 76 * t).toFixed(2)}%`;
    }
    if (captionRef.current) {
      captionRef.current.style.opacity = smoothstep(0.7, 0.88, t).toFixed(3);
    }
  });

  return (
    <div className="adapt-stage" ref={stageRef}>
      <span className="adapt-line" ref={lineRef} />
      <div className="adapt-blocks">
        {blocks.map((b, i) => (
          <div className="image-block" key={b.word} ref={blockRefs[i]} style={{ opacity: 0 }}>
            <span className="image-index">{b.num}</span>
            <div className="image-block-main">
              <span className="image-label">{b.word}</span>
              <p className="image-desc">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="image-caption-wrap" ref={captionRef} style={{ opacity: 0 }}>
        <span className="image-caption-rule" />
        <p className="image-caption">Where evolution meets innovation</p>
        <span className="image-caption-arrow">↓</span>
      </div>
    </div>
  );
}

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

const optionTexCache = new WeakMap();

function useOptionTextures(items, accent) {
  const [texs, setTexs] = useState({ normal: [], hover: [] });

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      let entry = optionTexCache.get(items);
      if (!entry) {
        entry = {
          normal: items.map((it) => makeOptionTexture(it.title, it.text, accent, false)),
          hover: items.map((it) => makeOptionTexture(it.title, it.text, accent, true)),
        };
        optionTexCache.set(items, entry);
      }
      setTexs(entry);
    };
    Promise.all([
      document.fonts.load('500 33px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [items, accent]);

  return texs;
}

function useOptionTexture(item, accent, hover) {
  const [tex, setTex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      setTex(makeOptionTexture(item.title, item.text, accent, hover));
    };
    Promise.all([
      document.fonts.load('500 33px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [item, accent, hover]);

  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeSectionsTexture(item, category, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1300;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1000, 1300);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const bg = ctx.createLinearGradient(0, 0, 0, 1300);
  bg.addColorStop(0, 'rgba(10, 14, 20, 1)');
  bg.addColorStop(1, 'rgba(4, 6, 11, 1)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1000, 1300);

  ctx.save();
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(40 + 22, 40);
    ctx.arcTo(960, 40, 960, 1260, 22);
    ctx.arcTo(960, 1260, 40, 1260, 22);
    ctx.arcTo(40, 1260, 40, 40, 22);
    ctx.arcTo(40, 40, 960, 40, 22);
    ctx.closePath();
  };
  path();
  ctx.clip();

  const randN = (a, b) => a + Math.random() * (b - a);
  const pts = [];
  for (let i = 0; i < 90; i++) pts.push({ x: randN(24, 976), y: randN(24, 1276) });
  ctx.save();
  ctx.strokeStyle = `rgba(${accent}, 0.16)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      if (dx * dx + dy * dy < 16900) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = `rgba(${accent}, 0.5)`;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = `rgba(${accent}, 0.45)`;
  ctx.lineWidth = 1.5;
  path();
  ctx.stroke();

  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillRect(40, 40, 920, 3);

  ctx.font = '500 28px "Fredoka"';
  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillText(String(category || '').toUpperCase(), 500, 100);

  ctx.font = '500 58px "Fredoka"';
  const maxW = 840;
  let title = item.title || '';
  let ts = 58;
  ctx.font = `500 ${ts}px "Fredoka"`;
  while (ctx.measureText(title).width > maxW && ts > 32) {
    ts -= 2;
    ctx.font = `500 ${ts}px "Fredoka"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 500, 205);
  ctx.restore();

  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillRect(400, 265, 200, 4);

  const cards = item.sections || [];
  const cardY0 = 330;
  const cardH = 262;
  const cardGap = 20;
  cards.forEach((sec, i) => {
    const cy = cardY0 + i * (cardH + cardGap);

    const cardGrad = ctx.createLinearGradient(0, cy, 0, cy + cardH);
    cardGrad.addColorStop(0, 'rgba(18, 24, 34, 0.96)');
    cardGrad.addColorStop(1, 'rgba(8, 12, 18, 0.96)');
    ctx.fillStyle = cardGrad;
    roundRect(ctx, 70, cy, 860, cardH, 18);
    ctx.fill();
    ctx.strokeStyle = `rgba(${accent}, 0.25)`;
    ctx.lineWidth = 1;
    roundRect(ctx, 70, cy, 860, cardH, 18);
    ctx.stroke();

    const vx = 92;
    const vy = cy + 26;
    const vw = 340;
    const vh = 210;
    const vGrad = ctx.createLinearGradient(vx, vy, vx, vy + vh);
    vGrad.addColorStop(0, 'rgba(32, 42, 58, 1)');
    vGrad.addColorStop(1, 'rgba(12, 18, 28, 1)');
    ctx.fillStyle = vGrad;
    roundRect(ctx, vx, vy, vw, vh, 12);
    ctx.fill();
    ctx.strokeStyle = `rgba(${accent}, 0.4)`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, vx, vy, vw, vh, 12);
    ctx.stroke();

    ctx.font = '600 18px "Inter"';
    ctx.fillStyle = `rgba(${accent}, 0.9)`;
    ctx.fillText('VIDEO', vx + vw / 2, vy + 28);

    const pcx = vx + vw / 2;
    const pcy = vy + vh / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(pcx, pcy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${accent}, 0.95)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pcx, pcy, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(pcx - 11, pcy - 16);
    ctx.lineTo(pcx + 15, pcy);
    ctx.lineTo(pcx - 11, pcy + 16);
    ctx.closePath();
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = '500 20px "Inter"';
    ctx.fillStyle = `rgba(${accent}, 0.9)`;
    ctx.fillText(String(sec.tag || sec.label).toUpperCase(), 458, cy + 48);

    ctx.font = '500 40px "Fredoka"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sec.label, 458, cy + 106);

    ctx.font = '400 23px "Fredoka"';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    const dl = wrapText(ctx, sec.text || '', 440);
    dl.slice(0, 2).forEach((line, j) => ctx.fillText(line, 458, cy + 168 + j * 34));
    ctx.textAlign = 'center';
  });

  ctx.strokeStyle = `rgba(${accent}, 0.3)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(200, 1200);
  ctx.lineTo(800, 1200);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '500 26px "Fredoka"';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('Cosmi Chameleon', 500, 1255);

  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeDetailTexture(item, category, accent) {
  if (item.sections && item.sections.length) return makeSectionsTexture(item, category, accent);
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1300;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1000, 1300);

  const bg = ctx.createLinearGradient(0, 0, 0, 1300);
  bg.addColorStop(0, 'rgba(10, 14, 20, 1)');
  bg.addColorStop(1, 'rgba(4, 6, 11, 1)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1000, 1300);

  ctx.save();
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(40 + 22, 40);
    ctx.arcTo(960, 40, 960, 1260, 22);
    ctx.arcTo(960, 1260, 40, 1260, 22);
    ctx.arcTo(40, 1260, 40, 40, 22);
    ctx.arcTo(40, 40, 960, 40, 22);
    ctx.closePath();
  };
  path();
  ctx.clip();

  const randN = (a, b) => a + Math.random() * (b - a);
  const pts = [];
  for (let i = 0; i < 90; i++) pts.push({ x: randN(24, 976), y: randN(24, 1276) });
  ctx.save();
  ctx.strokeStyle = `rgba(${accent}, 0.16)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      if (dx * dx + dy * dy < 16900) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = `rgba(${accent}, 0.5)`;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  ctx.strokeStyle = `rgba(${accent}, 0.45)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40 + 22, 40);
  ctx.arcTo(960, 40, 960, 1260, 22);
  ctx.arcTo(960, 1260, 40, 1260, 22);
  ctx.arcTo(40, 1260, 40, 40, 22);
  ctx.arcTo(40, 40, 960, 40, 22);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillRect(40, 40, 920, 3);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 30px "Fredoka"';
  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillText(String(category || '').toUpperCase(), 500, 170);

  let size = 72;
  ctx.font = `500 ${size}px "Fredoka"`;
  const maxW = 840;
  while (ctx.measureText(item.title).width > maxW && size > 30) {
    size -= 2;
    ctx.font = `500 ${size}px "Fredoka"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(item.title, 500, 340);
  ctx.restore();

  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillRect(400, 440, 200, 4);

  ctx.font = '400 44px "Fredoka"';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const lines = wrapText(ctx, item.text || '', 760);
  lines.slice(0, 4).forEach((line, j) => {
    ctx.fillText(line, 500, 590 + j * 70);
  });

  ctx.strokeStyle = `rgba(${accent}, 0.3)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(200, 1100);
  ctx.lineTo(800, 1100);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '500 28px "Fredoka"';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('Cosmi Chameleon', 500, 1170);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function useDetailTexture(item, category, accent) {
  const [tex, setTex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      setTex(makeDetailTexture(item, category, accent));
    };
    Promise.all([
      document.fonts.load('500 72px "Fredoka"'),
      document.fonts.load('400 44px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [item, category, accent]);

  return tex;
}

function OrbitingCard({ title, subtitle, color, items, stairIndex, totalCards, journey, onSelect, selectedIndex, onOptionClick }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const wrapRef = useRef();
  const optionsRef = useRef([]);
  const optionHoverRef = useRef([]);
  const selectedRef = useRef(null);
  const scroll = useScroll();
  const hoverRef = useRef(false);
  const angleRef = useRef(0);
  const scaleRef = useRef(0.0001);
  const posXRef = useRef(0);
  const posYZRef = useRef({ y: 0, z: 0 });
  const rotYRef = useRef(0);

  const worldX = -15 + stairIndex * 10 + 2.5;
  const orbitRadius = 4.5;
  const entryStart = 0.24;
  const entryDur = 0.07;
  const flyIn = 6;
  const JOURNEY_CARD_SCALE = 1.3;
  const OPTION_ROW = 3.3;
  const OPTION_COL = 9.3;
  const OPTION_SIZE = [8.4, 2.63];

  const normalTex = useCardTexture(title, subtitle, color, null);
  const optionTexs = useOptionTextures(items, color);

  useEffect(() => {
    selectedRef.current = selectedIndex;
    for (let i = 0; i < optionHoverRef.current.length; i++) optionHoverRef.current[i] = false;
    document.body.style.cursor = 'auto';
  }, [selectedIndex]);

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
        const turnSign = stairIndex >= 2 ? 1 : -1;
        const mirrorSign = stairIndex >= 2 ? -1 : 1;
        rotYRef.current = THREE.MathUtils.lerp(rotYRef.current, turnSign * Math.PI / 2, 0.055);
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

        const optIn = THREE.MathUtils.clamp((state.camera.position.x - 18) / 8, 0, 1);
        const sel = selectedRef.current;
        if (sel !== null) {
          const cam = state.camera;
          for (let i = 0; i < optionsRef.current.length; i++) {
            const m = optionsRef.current[i];
            const hover = !!optionHoverRef.current[i];
            const tex = hover ? optionTexs.hover[i] : optionTexs.normal[i];
            if (tex && m.material.map !== tex) {
              m.material.map = tex;
              m.material.needsUpdate = true;
            }
            if (i === sel) {
              m.visible = true;
              const col = i % 2;
              const row = Math.floor(i / 2);
              const lastRowAlone = items.length % 2 === 1 && row === Math.floor(items.length / 2);
              const thumbX = lastRowAlone ? 0 : (col === 0 ? THUMB_NDC_X : -THUMB_NDC_X);
              _ndcVec.set(thumbX, THUMB_NDC_Y, 0.5).unproject(cam);
              _dirVec.copy(_ndcVec).sub(cam.position).normalize();
              _tVec.copy(cam.position).addScaledVector(_dirVec, THUMB_DEPTH);
              const local = wrapRef.current ? wrapRef.current.worldToLocal(_ndcVec.copy(_tVec)) : _ndcVec;
              m.position.x = THREE.MathUtils.lerp(m.position.x, local.x, 0.09);
              m.position.y = THREE.MathUtils.lerp(m.position.y, local.y, 0.09);
              m.position.z = THREE.MathUtils.lerp(m.position.z, local.z, 0.09);
              m.scale.x = THREE.MathUtils.lerp(m.scale.x, mirrorSign * THUMB_SCALE, 0.09);
              m.scale.y = THREE.MathUtils.lerp(m.scale.y, THUMB_SCALE, 0.09);
              m.material.opacity = THREE.MathUtils.lerp(m.material.opacity, 1, 0.09);
            } else {
              m.material.opacity = THREE.MathUtils.lerp(m.material.opacity, 0, 0.12);
              if (m.material.opacity < 0.03) m.visible = false;
            }
          }
        } else {
          for (let i = 0; i < optionsRef.current.length; i++) {
            const m = optionsRef.current[i];
            m.visible = true;
            m.material.opacity = optIn;
            const hover = !!optionHoverRef.current[i];
            const tex = hover ? optionTexs.hover[i] : optionTexs.normal[i];
            if (tex && m.material.map !== tex) {
              m.material.map = tex;
              m.material.needsUpdate = true;
            }
            const ts = hover ? 1.16 : 1;
            m.scale.x = THREE.MathUtils.lerp(m.scale.x, mirrorSign * ts, 0.15);
            m.scale.y = THREE.MathUtils.lerp(m.scale.y, ts, 0.15);
            const col = i % 2;
            const row = Math.floor(i / 2);
            const lastRowAlone = items.length % 2 === 1 && row === Math.floor(items.length / 2);
            const baseX = lastRowAlone ? 0 : (col === 0 ? -OPTION_COL / 2 : OPTION_COL / 2);
            const baseY = -row * OPTION_ROW;
            m.position.x = THREE.MathUtils.lerp(m.position.x, baseX, 0.09);
            m.position.y = THREE.MathUtils.lerp(m.position.y, baseY, 0.09);
            m.position.z = THREE.MathUtils.lerp(m.position.z, 0, 0.09);
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
    meshRef.current.position.set(0, 0, 0);
    for (let i = 0; i < optionsRef.current.length; i++) {
      optionsRef.current[i].material.opacity = 0;
      optionsRef.current[i].scale.set(1, 1, 1);
      if (optionTexs.normal[i]) {
        optionsRef.current[i].material.map = optionTexs.normal[i];
        optionsRef.current[i].material.needsUpdate = true;
      }
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
        </mesh>
      )}
      {optionTexs.normal.length > 0 && (
        <group ref={wrapRef} position={[0, ((Math.ceil(items.length / 2) - 1) * OPTION_ROW) / 2 + 0.7, 0]}>
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (isJourneying) onOptionClick(i);
                }}
              >
                <planeGeometry args={OPTION_SIZE} />
                <meshBasicMaterial map={optionTexs.normal[i]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}

function DetailPanel({ item, category, color }) {
  const tex = useDetailTexture(item, category, color);
  const ref = useRef();
  const appearRef = useRef(0);

  useFrame((state, delta) => {
    if (!ref.current || !tex) return;
    appearRef.current = Math.min(1, appearRef.current + delta * 3.2);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, JOURNEY_CAM_LOOK_Y, 1 - Math.exp(-delta * 4));
    ref.current.material.opacity = appearRef.current;
    ref.current.scale.setScalar(0.9 + 0.1 * appearRef.current);
  });

  return (
    <mesh ref={ref} position={[JOURNEY_END_X, JOURNEY_CAM_LOOK_Y + 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={DETAIL_SIZE} />
      <meshBasicMaterial map={tex} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

const TOTAL_PAGES = 6;
const DNA_LENGTH = 60;
const CAMERA_RANGE = 66;
const DNA_OFFSET = -6;
const DNA_JOURNEY_SHIFT = 14;

const JOURNEY_END_X = 55;
const JOURNEY_CAM_X = 30;
const JOURNEY_CAM_LOOK_Y = 0.7;
const JOURNEY_WALK_SPEED = 16;
const JOURNEY_CAM_ARRIVE = 26;
const JOURNEY_LEFT_START = -34;

const THUMB_NDC_X = -0.75;
const THUMB_NDC_Y = 0.87;
const THUMB_SCALE = 0.62;
const THUMB_DEPTH = 25;
const DETAIL_SIZE = [10, 13];

const _tVec = new THREE.Vector3();
const _dirVec = new THREE.Vector3();
const _ndcVec = new THREE.Vector3();

const sphereData = [
  {
    title: "Our Expertise", subtitle: "Innovation", color: "255, 140, 60", stairIndex: 0,
    items: [
      { title: "Website Development", text: "Modern, blazing-fast sites built to convert.", sections: [
        { label: "Static Websites", tag: "STATIC", text: "Fast, brochure-style pages that present your brand with clean, dependable structure.", video: "static.mp4" },
        { label: "Dynamic Websites", tag: "DYNAMIC", text: "Content-driven builds with CMS power, live updates and real user interaction.", video: "dynamic.mp4" },
        { label: "E-commerce Websites", tag: "E-COMMERCE", text: "Complete storefronts with secure checkout, product flows and conversion focus.", video: "ecommerce.mp4" },
      ] },
      { title: "Lead Generation", text: "Targeted pipelines that keep your funnel full." },
      { title: "Digital Marketing / SEO", text: "Search and social strategies engineered to grow reach." },
      { title: "Custom Software Development", text: "Tailored systems built around how your business works." },
      { title: "E-commerce Solutions", text: "Storefronts and flows designed to turn visitors into buyers." },
      { title: "Gen AI and ML Solutions", text: "Intelligent models that automate, predict, and scale." },
      { title: "Ads Management", text: "Paid campaigns tuned for maximum return on every spend." },
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

function DNAHelix({ journey, mouseYRef }) {
  const ref = useRef();
  const fadeRef = useRef(1);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const target = journey ? DNA_OFFSET + DNA_JOURNEY_SHIFT : DNA_OFFSET;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, target, 1 - Math.exp(-delta * 2.2));

    let opacity = 1;
    if (journey) {
      const py = mouseYRef.current || 0;
      const hoverReveal = THREE.MathUtils.clamp((Math.abs(py) - 0.5) / 0.35, 0, 1);
      const walkBase = THREE.MathUtils.clamp((JOURNEY_CAM_X - state.camera.position.x) / 12, 0, 1);
      opacity = THREE.MathUtils.clamp(Math.max(walkBase, hoverReveal), 0, 1);
    }
    fadeRef.current = THREE.MathUtils.lerp(fadeRef.current, opacity, 1 - Math.exp(-delta * 6));

    ref.current.traverse((o) => {
      if (o.material) {
        if (o.userData.baseOp === undefined) o.userData.baseOp = o.material.opacity;
        o.material.opacity = o.userData.baseOp * fadeRef.current;
      }
    });
  });

  return (
    <group ref={ref} position={[DNA_OFFSET, 0, 0]}>
      <ActiveDNA length={DNA_LENGTH} breaks={[
        { start: 0.1, end: 0.25 }
      ]} />
    </group>
  );
}

export default function App() {
  const [journey, setJourney] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const adaptProgressRef = useRef(0);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const suppressDocClickRef = useRef(false);

  useEffect(() => {
    if (!journey) setSelectedOption(null);
  }, [journey]);

  useEffect(() => {
    if (!selectedOption) return;
    const onDocClick = () => {
      if (suppressDocClickRef.current) {
        suppressDocClickRef.current = false;
        return;
      }
      setSelectedOption(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [selectedOption]);

  useEffect(() => {
    const onMove = (e) => {
      mouseXRef.current = (e.clientX / window.innerWidth) * 2 - 1;
      mouseYRef.current = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onLeave = () => {
      mouseXRef.current = 0;
      mouseYRef.current = 0;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#020204', position: 'relative' }}>
      <Canvas camera={{ position: [-(CAMERA_RANGE / 2), 0, 18], fov: 45 }} dpr={[1, 1.25]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />
        <directionalLight position={[-10, -5, -10]} intensity={0.3} />

          <ScrollControls pages={TOTAL_PAGES} horizontal damping={0.15} enabled={!journey} style={{ zIndex: 3 }}>
            <Galaxy length={DNA_LENGTH * 1.5} />
            <DNAHelix journey={journey} mouseYRef={mouseYRef} />
            <CameraTracker length={CAMERA_RANGE} journey={journey} mouseXRef={mouseXRef} mouseYRef={mouseYRef} />

            {sphereData.map((s, i) => (
              <OrbitingCard key={i} title={s.title} subtitle={s.subtitle} color={s.color} items={s.items} stairIndex={s.stairIndex} totalCards={4} journey={journey} onSelect={() => setJourney({ card: i })} selectedIndex={selectedOption && selectedOption.card === i ? selectedOption.option : null} onOptionClick={(opt) => { suppressDocClickRef.current = true; setSelectedOption((prev) => (prev ? null : { card: i, option: opt })); }} />
            ))}

            {selectedOption && sphereData[selectedOption.card] && (
              <DetailPanel
                key={selectedOption.card + '-' + selectedOption.option}
                item={sphereData[selectedOption.card].items[selectedOption.option]}
                category={sphereData[selectedOption.card].title}
                color={sphereData[selectedOption.card].color}
              />
            )}

            <Scroll html style={{ width: '100vw', height: '100vh', pointerEvents: journey ? 'none' : 'auto' }}>

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
                    <ParticleBg color="255, 140, 140" count={360} linkDistance={95} progressRef={adaptProgressRef} />
                    <AdaptStage
                      scrollStart={0.08}
                      scrollEnd={0.24}
                      progressRef={adaptProgressRef}
                      blocks={[
                        { num: '01', word: 'Adapt', desc: 'We watch the market closely, read the signals early, and shift before the wave even begins to move.' },
                        { num: '02', word: 'Transform', desc: 'We rebuild your presence into something sharper, faster, more engaging, and built to win.' },
                        { num: '03', word: 'Dominate', desc: 'Consistent systems and creative edge put you ahead of the competition and keep you there.' },
                      ]}
                    />
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
                      <div className="image-block">
                        <span className="image-label">Launch</span>
                      </div>
                      <div className="image-block">
                        <span className="image-label">Your</span>
                      </div>
                      <div className="image-block">
                        <span className="image-label">Evolution</span>
                      </div>
                      <p className="image-caption">The future starts here</p>
                    </AnimateWords>
                  </div>
                </div>
              </ScrollSection>

            </Scroll>
          </ScrollControls>
      </Canvas>
      {journey && (
        <button className="journey-back" onClick={() => { setSelectedOption(null); setJourney(null); }}>Back</button>
      )}
    </div>
  );
}