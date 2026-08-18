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

function splitTitleLines(title) {
  const words = String(title || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [String(title || '')];
  if (words.length === 2) return words;
  const firstCount = Math.ceil(words.length / 2);
  return [words.slice(0, firstCount).join(' '), words.slice(firstCount).join(' ')];
}

function resolveAccent(accent, index = 0) {
  if (Array.isArray(accent)) return accent[index % accent.length];
  return accent;
}

const glitchScanTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 16, 256);
  for (let y = 0; y < 256; y++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, y, 16, Math.max(1, 2 + Math.random() * 10));
    y += 2 + Math.random() * 8;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  return tex;
})();

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
  const r = 30;

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
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 34px "Fredoka"';
    ctx.fillText(title.toUpperCase(), 256, 66);

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

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }

    ctx.fillStyle = `rgba(${accent}, 0.65)`;
    ctx.font = '500 13px "Fredoka"';
    ctx.fillText('CLICK TO CLOSE', 256, 338);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 64px "Fredoka"';
    ctx.fillText(title.toUpperCase(), 256, 152);
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

  // subtle accent border
  ctx.strokeStyle = `rgba(${accent}, ${hover ? 0.62 : 0.42})`;
  ctx.lineWidth = 1.5;
  const r = 28;
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
  const titleY = hover ? 68 : 96;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 24, titleY);
  ctx.restore();

  // details revealed on hover
  if (hover && text) {
    ctx.fillStyle = `rgba(${accent}, 0.9)`;
    ctx.fillRect(24, 100, 46, 3);
    ctx.font = '400 18px "Fredoka"';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const lines = wrapText(ctx, text, maxW);
    lines.slice(0, 2).forEach((line, j) => {
      ctx.fillText(line, 24, 118 + j * 24);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeCardStyleTexture(title, text, accent, hover) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 356;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 356);

  const x = 4;
  const y = 4;
  const w = 504;
  const h = 348;
  const r = 30;

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
  bg.addColorStop(0, 'rgba(18, 26, 42, 0.96)');
  bg.addColorStop(0.55, 'rgba(11, 16, 27, 0.98)');
  bg.addColorStop(1, 'rgba(5, 7, 12, 0.98)');
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.save();
  path();
  ctx.clip();
  const sheen = ctx.createLinearGradient(24, 0, 488, 356);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
  sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(0.72, `rgba(${accent}, 0.05)`);
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

ctx.strokeStyle = `rgba(${accent}, ${hover ? 0.75 : 0.46})`;
  ctx.lineWidth = 2.25;
  ctx.stroke();

  path();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = `rgba(${accent}, ${hover ? 0.96 : 0.82})`;
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.fillRect(x + 18, y + 10, w - 36, 1);
  ctx.fillStyle = `rgba(${accent}, ${hover ? 0.22 : 0.14})`;
  ctx.fillRect(x, y + h - 4, w, 4);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeCardShellTexture(accent, hover) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 356;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 356);

  const x = 4;
  const y = 4;
  const w = 504;
  const h = 348;
  const r = 30;

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
  bg.addColorStop(0, 'rgba(18, 26, 42, 0.96)');
  bg.addColorStop(0.55, 'rgba(11, 16, 27, 0.98)');
  bg.addColorStop(1, 'rgba(5, 7, 12, 0.98)');
  ctx.fillStyle = bg;
  ctx.fill();

ctx.save();
  path();
  ctx.clip();
  const sheen = ctx.createLinearGradient(24, 0, 488, 356);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
  sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(0.72, `rgba(${accent}, 0.05)`);
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = `rgba(${accent}, ${hover ? 0.75 : 0.46})`;
  ctx.lineWidth = 2.25;
  ctx.stroke();

  path();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = `rgba(${accent}, ${hover ? 0.96 : 0.82})`;
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.fillRect(x + 18, y + 10, w - 36, 1);
  ctx.fillStyle = `rgba(${accent}, ${hover ? 0.22 : 0.14})`;
  ctx.fillRect(x, y + h - 4, w, 4);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const cardShellTexCache = new Map();

function useCardShellTextures(accent) {
  const [texs, setTexs] = useState({ normal: null, hover: null });

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      let entry = cardShellTexCache.get(accent);
      if (!entry) {
        entry = {
          normal: makeCardShellTexture(accent, false),
          hover: makeCardShellTexture(accent, true),
        };
        cardShellTexCache.set(accent, entry);
      }
      setTexs(entry);
    };
    Promise.all([
      document.fonts.load('500 16px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [accent]);

  return texs;
}

function useFloatingTitleTextures(title, subtitle, accent) {
  const [texs, setTexs] = useState({ normal: null, hover: null });

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      setTexs({
        normal: makeCardFloatingTextTexture(title, subtitle, accent, false),
        hover: makeCardFloatingTextTexture(title, subtitle, accent, true),
      });
    };
    Promise.all([
      document.fonts.load('500 48px "Fredoka"'),
      document.fonts.load('400 18px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [title, subtitle, accent]);

  return texs;
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
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, k);
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

function LaunchEvolutionStage({ scrollStart, scrollEnd }) {
  const scroll = useScroll();
  const particlesRef = useRef();
  const copyRef = useRef();

  useFrame(() => {
    const offset = scroll.offset;
    const progress = THREE.MathUtils.clamp((offset - scrollStart) / Math.max(0.0001, scrollEnd - scrollStart), 0, 1);
    const titleFade = smoothstep(0.08, 0.42, progress);
    const titleSlide = (1 - smoothstep(0.08, 0.42, progress)) * 44;
    const titleShift = (1 - smoothstep(0.12, 0.42, progress)) * 26;
    const particleFade = smoothstep(0.70, 0.90, offset);
    if (particlesRef.current) {
      particlesRef.current.style.opacity = particleFade.toFixed(3);
    }
    if (copyRef.current) {
      copyRef.current.style.opacity = titleFade.toFixed(3);
      copyRef.current.style.transform = `translate3d(${titleShift.toFixed(2)}px, ${titleSlide.toFixed(2)}px, 0)`;
    }
  });

  return (
    <div className="launch-stage">
      <div ref={particlesRef} className="launch-particles">
        <ParticleBg color="0, 229, 255" count={360} linkDistance={95} />
      </div>
      <div ref={copyRef} className="launch-copy-shell">
        <div className="launch-title-stack">
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
        </div>
      </div>
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
        if (offset <= scrollStart) {
          ref.current.style.opacity = 1;
        } else {
          const progress = (offset - scrollStart) / Math.max(0.01, scrollEnd - scrollStart);
          const fadeIn = Math.min(1, progress / 0.15);
          ref.current.style.opacity = fadeIn;
        }
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

function HeroLogoSection() {
  const ref = useRef();
  const scroll = useScroll();

  useFrame(() => {
    if (!ref.current) return;
    const offset = scroll.offset;
    const fade = 1 - THREE.MathUtils.clamp(smoothstep(0.03, 0.16, offset), 0, 1);
    ref.current.style.opacity = fade.toFixed(3);
  });

  return (
    <div
      ref={ref}
      className="hero-logo-section"
      style={{ opacity: 1 }}
    >
      <img className="hero-logo" src="/hero-logo.png" alt="Cosmichameleon" />
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
      const ty = (1 - smoothstep(0.1, 0.3, t)) * 30;
      b1.current.style.opacity = op.toFixed(3);
      b1.current.style.transform = `translateY(${ty.toFixed(2)}px)`;
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

const cardStyleTexCache = new WeakMap();
const cardTextTexCache = new WeakMap();
const cardTextBoostTexCache = new WeakMap();

function useCardStyleTextures(items, accent) {
  const [texs, setTexs] = useState({ normal: [], hover: [] });
  const accentKey = Array.isArray(accent) ? accent.join('|') : accent;

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      let byAccent = cardStyleTexCache.get(items);
      if (!byAccent) {
        byAccent = new Map();
        cardStyleTexCache.set(items, byAccent);
      }
      let entry = byAccent.get(accentKey);
      if (!entry) {
        const accentResolver = Array.isArray(accent) ? accent : null;
        entry = {
          normal: items.map((it, i) => makeCardStyleTexture(it.title, it.text, resolveAccent(accentResolver || accent, i), false)),
          hover: items.map((it, i) => makeCardStyleTexture(it.title, it.text, resolveAccent(accentResolver || accent, i), true)),
        };
        byAccent.set(accentKey, entry);
      }
      setTexs(entry);
    };
    Promise.all([
      document.fonts.load('500 16px "Fredoka"'),
      document.fonts.load('400 20px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [items, accentKey]);

  return texs;
}

function makeCardFloatingTextTexture(title, text, accent, hover, boost = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 576;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 576, 420);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const glow = ctx.createRadialGradient(288, 110, 0, 288, 110, 190);
  glow.addColorStop(0, `rgba(${accent}, ${hover ? 0.18 : 0.1})`);
  glow.addColorStop(0.55, `rgba(${accent}, ${hover ? 0.08 : 0.04})`);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 576, 420);

  ctx.fillStyle = `rgba(${accent}, ${hover ? 0.92 : 0.82})`;
  ctx.fillRect(194, 56, 188, 2);

  const titleLines = splitTitleLines(title);
  let size = boost ? 56 : 46;
  ctx.font = `500 ${size}px "Fredoka"`;
  const titleMaxWidth = boost ? 500 : 470;
  while (titleLines.some((line) => ctx.measureText(line).width > titleMaxWidth) && size > (boost ? 24 : 20)) {
    size -= 1;
    ctx.font = `500 ${size}px "Fredoka"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff';
  const titleStartY = boost ? 132 : 130;
  const titleGap = boost ? 60 : 46;
  titleLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 288, titleStartY + i * titleGap));
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function useCardFloatingTextTextures(items, accent, boost = false) {
  const [texs, setTexs] = useState({ normal: [], hover: [] });
  const accentKey = Array.isArray(accent) ? accent.join('|') : accent;

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      const cache = boost ? cardTextBoostTexCache : cardTextTexCache;
      let byAccent = cache.get(items);
      if (!byAccent) {
        byAccent = new Map();
        cache.set(items, byAccent);
      }
      let entry = byAccent.get(accentKey);
      if (!entry) {
        const accentResolver = Array.isArray(accent) ? accent : null;
        entry = {
          normal: items.map((it, i) => makeCardFloatingTextTexture(it.title, it.text, resolveAccent(accentResolver || accent, i), false, boost)),
          hover: items.map((it, i) => makeCardFloatingTextTexture(it.title, it.text, resolveAccent(accentResolver || accent, i), true, boost)),
        };
        byAccent.set(accentKey, entry);
      }
      setTexs(entry);
    };
    Promise.all([
      document.fonts.load(`${boost ? 56 : 46}px "Fredoka"`),
      document.fonts.load('400 18px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [items, accentKey, boost]);

  return texs;
}

function makeHeroTitleTexture(title, subtitle, accent, boost = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 640, 420);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const glow = ctx.createRadialGradient(320, 110, 0, 320, 110, 220);
  glow.addColorStop(0, `rgba(${accent}, 0.18)`);
  glow.addColorStop(0.55, `rgba(${accent}, 0.08)`);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 640, 420);

  ctx.fillStyle = `rgba(${accent}, 0.88)`;
  ctx.fillRect(228, 58, 184, 2);

  const titleLines = splitTitleLines(title);
  let size = boost ? 68 : 58;
  ctx.font = `500 ${size}px "Fredoka"`;
  const titleMaxWidth = boost ? 560 : 520;
  while (titleLines.some((line) => ctx.measureText(line).width > titleMaxWidth) && size > (boost ? 30 : 24)) {
    size -= 1;
    ctx.font = `500 ${size}px "Fredoka"`;
  }

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff';
  const titleStartY = boost ? 138 : 132;
  const titleGap = boost ? 66 : 50;
  titleLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 320, titleStartY + i * titleGap));
  ctx.restore();

  let subSize = boost ? 38 : 30;
  ctx.font = `500 ${subSize}px "Fredoka"`;
  while (ctx.measureText(subtitle).width > (boost ? 560 : 520) && subSize > (boost ? 16 : 14)) {
    subSize -= 1;
    ctx.font = `500 ${subSize}px "Fredoka"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = `rgba(${accent}, 0.95)`;
  ctx.fillText(subtitle, 320, boost ? 244 : 226);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function useHeroTitleTexture(title, subtitle, accent, boost = false) {
  const [tex, setTex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      setTex(makeHeroTitleTexture(title, subtitle, accent, boost));
    };
    Promise.all([
      document.fonts.load(`500 ${boost ? 68 : 64}px "Fredoka"`),
      document.fonts.load(`500 ${boost ? 38 : 34}px "Fredoka"`),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [title, subtitle, accent, boost]);

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
  ctx.fillText('Cosmichameleon', 500, 1255);

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
  ctx.fillText('Cosmichameleon', 500, 1170);

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

function makeGlitchInfoTexture(title, subtitle, accent, items = []) {
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
  for (let i = 0; i < 60; i++) pts.push({ x: randN(24, 976), y: randN(24, 1276) });
  ctx.save();
  ctx.strokeStyle = `rgba(${accent}, 0.14)`;
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
  ctx.fillText(String(subtitle || 'Cosmichameleon').toUpperCase(), 500, 120);

  ctx.font = '600 64px "Fredoka"';
  const maxW = 840;
  let t = title || 'Cosmichameleon';
  let ts = 64;
  ctx.font = `600 ${ts}px "Fredoka"`;
  while (ctx.measureText(t).width > maxW && ts > 30) {
    ts -= 2;
    ctx.font = `600 ${ts}px "Fredoka"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(t, 500, 250);
  ctx.restore();

  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillRect(400, 330, 200, 4);

  const list = Array.isArray(items) && items.length ? items : [];
  if (list.length) {
    const y0 = 460;
    const rowH = 92;
    list.slice(0, 6).forEach((it, i) => {
      const y = y0 + i * rowH;
      const grad = ctx.createLinearGradient(70, y - 30, 930, y + 30);
      grad.addColorStop(0, 'rgba(16, 22, 32, 0.9)');
      grad.addColorStop(1, 'rgba(7, 11, 18, 0.9)');
      ctx.fillStyle = grad;
      roundRect(ctx, 70, y - 30, 860, 60, 14);
      ctx.fill();
      ctx.strokeStyle = `rgba(${accent}, 0.22)`;
      ctx.lineWidth = 1;
      roundRect(ctx, 70, y - 30, 860, 60, 14);
      ctx.stroke();
      ctx.fillStyle = `rgba(${accent}, 0.95)`;
      ctx.beginPath();
      ctx.arc(110, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.font = '500 34px "Fredoka"';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(it.title || ''), 140, y - 12);
      ctx.font = '400 22px "Fredoka"';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      const tl = wrapText(ctx, it.text || '', 820).slice(0, 1);
      tl.forEach((ln, j) => ctx.fillText(ln, 140, y + 16 + j * 28));
      ctx.textAlign = 'center';
    });
  } else {
    ctx.font = '400 40px "Fredoka"';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(String(subtitle || title || ''), 500, 620);
  }

  ctx.strokeStyle = `rgba(${accent}, 0.3)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(200, 1190);
  ctx.lineTo(800, 1190);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '500 26px "Fredoka"';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('Cosmichameleon', 500, 1245);

  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const glitchInfoCache = new WeakMap();
const glitchInfoArrayCache = new WeakMap();

function useGlitchInfoTextures(items, accents) {
  const [texs, setTexs] = useState([]);
  const accentKey = Array.isArray(accents) ? accents.join('|') : accents;

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      let byAccent = glitchInfoArrayCache.get(items);
      if (!byAccent) {
        byAccent = new Map();
        glitchInfoArrayCache.set(items, byAccent);
      }
      let entry = byAccent.get(accentKey);
      if (!entry) {
        entry = items.map((it, i) =>
          makeGlitchInfoTexture(it.title, String(it.tag || ''), resolveAccent(accents, i), [])
        );
        byAccent.set(accentKey, entry);
      }
      setTexs(entry);
    };
    Promise.all([
      document.fonts.load('600 64px "Fredoka"'),
      document.fonts.load('500 34px "Fredoka"'),
      document.fonts.load('400 22px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [items, accentKey]);

  return texs;
}

function useGlitchInfoTexture(title, subtitle, accent, items = []) {
  const [tex, setTex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      let entry = glitchInfoCache.get(items);
      if (!entry || entry.title !== title || entry.subtitle !== subtitle || entry.accent !== accent) {
        entry = { title, subtitle, accent, tex: makeGlitchInfoTexture(title, subtitle, accent, items) };
        glitchInfoCache.set(items, entry);
      }
      setTex(entry.tex);
    };
    Promise.all([
      document.fonts.load('600 64px "Fredoka"'),
      document.fonts.load('500 34px "Fredoka"'),
      document.fonts.load('400 22px "Fredoka"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [title, subtitle, accent, items]);

  return tex;
}

function OrbitingCard({ title, subtitle, color, items, stairIndex, totalCards, journey, view, kind = 'default', onSelect, selectedIndex, onOptionClick, onSubClick }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const mainFaceRef = useRef();
  const mainTitleRef = useRef();
const mainTitleBackRef = useRef();
  const wrapRef = useRef();
  const optionsRef = useRef([]);
  const optionBodyRefs = useRef([]);
  const optionFaceRefs = useRef([]);
const optionTextRefs = useRef([]);
  const optionHoverRef = useRef([]);
  const subRefs = useRef([]);
  const subBodyRefs = useRef([]);
  const subFaceRefs = useRef([]);
  const subTitleBackRefs = useRef([]);
const subTextRefs = useRef([]);
  const subHoverRef = useRef([]);
  const selectedRef = useRef(null);
const scroll = useScroll();
  const hoverRef = useRef(false);
  const angleRef = useRef(0);
  const scaleRef = useRef(0.0001);
  const posXRef = useRef(0);
  const posYZRef = useRef({ y: 0, z: 0 });
  const rotYRef = useRef(0);
  const nearVideoRef = useRef(true);
  const [nearVideo, setNearVideo] = React.useState(true);
  const isServiceTitleBoost = true;

const worldX = view === 'default'
    ? -25 + stairIndex * 10
    : -22 + stairIndex * 10;
  const orbitRadius = 4.2;
  const entryStart = -0.12;
  const entryDur = 0.07;
  const flyIn = 6;
  const JOURNEY_CARD_SCALE = 1.1;
  const OPTION_ROW = 3.7;
  const OPTION_COL = 10.5;
  const OPTION_SIZE = [3.5, 2.5];
  const OPTION_CARD_DEPTH = 0.24;
  const SUB_CARD_SIZE = [3.5, 2.5];
  const SUB_CARD_SCALE = 1;
  const SUB_CARD_STEP = 10;
  const SUB_CARD_OFFSET = 14;
  const SUB_CARD_DEPTH = 0.24;
const SUB_ORBIT_RADIUS = 4.2;
  const cardsClickable = true;
  const VIDEO_NEAR_RANGE = 18;
  const serviceItemAccents = React.useMemo(
    () => (kind === 'service' ? items.map((_, i) => SERVICE_ITEM_COLORS[i % SERVICE_ITEM_COLORS.length]) : null),
    [kind, items]
  );

  const mainFaceTexs = useCardShellTextures(color);
  const mainTitleTex = useHeroTitleTexture(title, subtitle, color, true);
  const shuffledVideos = React.useMemo(
    () => seededShuffle(`${view}|${kind}`, CARD_VIDEO_SOURCES),
    [view, kind]
  );
  const slotBase = stairIndex % CARD_VIDEO_SOURCES.length;
  const videoAt = (i) => shuffledVideos[(slotBase + i) % shuffledVideos.length];
  const mainVideoSrc = videoAt(0);
const optionTexs = useOptionTextures(items, color);
  const optionVideoSrcs = React.useMemo(
    () => items.map((_, i) => videoAt(i + 1)),
    [items, shuffledVideos, slotBase]
  );
  const cardTexs = useCardStyleTextures(items, serviceItemAccents || color);
  const serviceTitleBoost = true;
  const cardTextTexs = useCardFloatingTextTextures(items, serviceItemAccents || color, true);
  const subVideoSrcs = React.useMemo(
    () => items.map((_, i) => videoAt(i + 1)),
    [items, shuffledVideos, slotBase]
  );
  const revealTex = useGlitchInfoTexture(title, subtitle, kind === 'default' ? color : serviceItemAccents?.[0] || color, items);

  const [revealed, setRevealed] = React.useState(false);
  const revealedRef = useRef(false);
  const glitchRef = useRef(0);
  const glitchDirRef = useRef(1);
  const glitchActiveRef = useRef(false);
  const revealRef = useRef();
  const ghostRRef = useRef();
  const ghostBRef = useRef();
  const ghostScanRef = useRef();

  const subRevealTexs = useGlitchInfoTextures(items, serviceItemAccents || color);
  const subRevealedRefs = useRef([]);
  const subRevealRefs = useRef([]);
  const subGlitchRefs = useRef([]);
  const subGlitchActiveRefs = useRef([]);
  const subGhostRRefs = useRef([]);
  const subGhostBRefs = useRef([]);
  const subGhostScanRefs = useRef([]);

  const toggleRevealed = () => {
    if (isJourneying) return;
    setRevealed((prev) => {
      const next = !prev;
      revealedRef.current = next;
      glitchDirRef.current = next ? 1 : -1;
      glitchRef.current = 0;
      glitchActiveRef.current = true;
      return next;
    });
  };

  const toggleSubRevealed = (i) => {
    if (isJourneying) return;
    const next = !subRevealedRefs.current[i];
    subRevealedRefs.current[i] = next;
    subGlitchRefs.current[i] = 0;
    subGlitchActiveRefs.current[i] = true;
  };

  useEffect(() => {
    selectedRef.current = selectedIndex;
    for (let i = 0; i < optionHoverRef.current.length; i++) optionHoverRef.current[i] = false;
    document.body.style.cursor = 'auto';
  }, [selectedIndex]);

  useEffect(() => {
    if (!items.length) return;
    subRevealedRefs.current = items.map((_, i) => !!subRevealedRefs.current[i]);
    subRevealRefs.current = items.map((_, i) => subRevealRefs.current[i] || null);
    subGlitchRefs.current = items.map((_, i) => subGlitchRefs.current[i] || 0);
    subGlitchActiveRefs.current = items.map((_, i) => subGlitchActiveRefs.current[i] || false);
  }, [items]);

  useEffect(() => {
    hoverRef.current = false;
    for (let i = 0; i < subHoverRef.current.length; i++) subHoverRef.current[i] = false;
    document.body.style.cursor = 'auto';
  }, [view]);

  const isJourneying = journey !== null;
  const isJourneyTarget = isJourneying && journey.card === stairIndex;
  const isServicesMode = view === 'services' && stairIndex === 0;
  const mirrorSign = stairIndex >= 2 ? -1 : 1;
const mainVideoActive = !isServicesMode && !isJourneying && !revealed && nearVideo;
  const subVideosActive = isServicesMode && !isJourneying && nearVideo;
  const optionVideosActive = isJourneyTarget && nearVideo;

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;

    const nearNow = Math.abs(state.camera.position.x - worldX) < VIDEO_NEAR_RANGE || isJourneying;
    if (nearNow !== nearVideoRef.current) {
      nearVideoRef.current = nearNow;
      setNearVideo(nearNow);
    }

    if (isJourneying) {
      for (let i = 0; i < subRefs.current.length; i++) {
        if (subRefs.current[i]) subRefs.current[i].visible = false;
        if (subBodyRefs.current[i]) subBodyRefs.current[i].visible = false;
        if (subFaceRefs.current[i]) subFaceRefs.current[i].visible = false;
        if (subTitleBackRefs.current[i]) subTitleBackRefs.current[i].visible = false;
if (subTextRefs.current[i]) subTextRefs.current[i].visible = false;
      }
      if (isJourneyTarget) {
        groupRef.current.visible = true;
        meshRef.current.visible = false;
        posXRef.current = THREE.MathUtils.lerp(posXRef.current, JOURNEY_END_X, 0.055);
        posYZRef.current.y = THREE.MathUtils.lerp(posYZRef.current.y, 0, 0.055);
        posYZRef.current.z = THREE.MathUtils.lerp(posYZRef.current.z, 0, 0.055);
        const turnSign = stairIndex >= 2 ? 1 : -1;
        rotYRef.current = THREE.MathUtils.lerp(rotYRef.current, turnSign * Math.PI / 2, 0.055);
        groupRef.current.position.set(posXRef.current, posYZRef.current.y, posYZRef.current.z);
        groupRef.current.rotation.set(0, rotYRef.current, 0);
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
        scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, JOURNEY_CARD_SCALE, 0.06);
        groupRef.current.scale.setScalar(Math.max(0.0001, scaleRef.current));
        meshRef.current.material.opacity = THREE.MathUtils.lerp(meshRef.current.material.opacity, 1, 0.08);

        const optIn = THREE.MathUtils.clamp((state.camera.position.x - 18) / 8, 0, 1);
        const sel = selectedRef.current;
        if (sel !== null) {
          const cam = state.camera;
          for (let i = 0; i < optionsRef.current.length; i++) {
            const g = optionsRef.current[i];
            const body = optionBodyRefs.current[i];
            const face = optionFaceRefs.current[i];
const t = optionTextRefs.current[i];
            const hover = !!optionHoverRef.current[i];
            const tex = hover ? cardTexs.hover[i] : cardTexs.normal[i];
            if (g) {
              g.visible = true;
            }
            if (i === sel) {
              if (body) body.visible = true;
              if (face) face.visible = true;
              if (t) t.visible = true;
              const col = i % 2;
              const row = Math.floor(i / 2);
              const lastRowAlone = items.length % 2 === 1 && row === Math.floor(items.length / 2);
              const thumbX = lastRowAlone ? 0 : (col === 0 ? THUMB_NDC_X : -THUMB_NDC_X);
              _ndcVec.set(thumbX, THUMB_NDC_Y, 0.5).unproject(cam);
              _dirVec.copy(_ndcVec).sub(cam.position).normalize();
              _tVec.copy(cam.position).addScaledVector(_dirVec, THUMB_DEPTH);
              const local = wrapRef.current ? wrapRef.current.worldToLocal(_ndcVec.copy(_tVec)) : _ndcVec;
              g.position.x = THREE.MathUtils.lerp(g.position.x, local.x, 0.09);
              g.position.y = THREE.MathUtils.lerp(g.position.y, local.y, 0.09);
              g.position.z = THREE.MathUtils.lerp(g.position.z, local.z, 0.09);
              g.scale.x = THREE.MathUtils.lerp(g.scale.x, mirrorSign * THUMB_SCALE, 0.09);
              g.scale.y = THREE.MathUtils.lerp(g.scale.y, THUMB_SCALE, 0.09);
              g.scale.z = THREE.MathUtils.lerp(g.scale.z, THUMB_SCALE, 0.09);
              if (body) {
                body.material.opacity = THREE.MathUtils.lerp(body.material.opacity, 0.82, 0.09);
              }
              if (face && tex && face.material.map !== tex) {
                face.material.map = tex;
                face.material.needsUpdate = true;
              }
              if (face) {
                face.material.opacity = THREE.MathUtils.lerp(face.material.opacity, 0.8, 0.09);
              }
              if (t) {
                const textTex = hover ? cardTextTexs.hover[i] : cardTextTexs.normal[i];
                if (textTex && t.material.map !== textTex) {
                  t.material.map = textTex;
                  t.material.needsUpdate = true;
                }
                t.material.opacity = THREE.MathUtils.lerp(t.material.opacity, 1, 0.09);
                t.material.depthTest = false;
                const textScale = hover ? 1.04 : 1;
                t.scale.x = THREE.MathUtils.lerp(t.scale.x, textScale, 0.09);
                t.scale.y = THREE.MathUtils.lerp(t.scale.y, textScale, 0.09);
t.scale.z = THREE.MathUtils.lerp(t.scale.z, textScale, 0.09);
              }
            } else {
              if (body) body.material.opacity = THREE.MathUtils.lerp(body.material.opacity, 0, 0.12);
              if (face && tex && face.material.map !== tex) {
                face.material.map = tex;
                face.material.needsUpdate = true;
              }
              if (face) {
                face.material.opacity = THREE.MathUtils.lerp(face.material.opacity, 0, 0.12);
              }
if (t) {
                t.material.opacity = THREE.MathUtils.lerp(t.material.opacity, 0, 0.12);
              }
              if (g.scale.x < 0.0001) g.visible = false;
            }
          }
        } else {
          for (let i = 0; i < optionsRef.current.length; i++) {
            const g = optionsRef.current[i];
            const body = optionBodyRefs.current[i];
            const face = optionFaceRefs.current[i];
const t = optionTextRefs.current[i];
            if (!g) continue;
            g.visible = true;
            if (body) body.visible = true;
            if (face) face.visible = true;
            if (t) t.visible = true;
            const hover = !!optionHoverRef.current[i];
            const tex = hover ? cardTexs.hover[i] : cardTexs.normal[i];
            if (face && tex && face.material.map !== tex) {
              face.material.map = tex;
              face.material.needsUpdate = true;
            }
            const ts = hover ? 1.16 : 1;
            g.scale.x = THREE.MathUtils.lerp(g.scale.x, mirrorSign * ts, 0.15);
            g.scale.y = THREE.MathUtils.lerp(g.scale.y, ts, 0.15);
            g.scale.z = THREE.MathUtils.lerp(g.scale.z, ts, 0.15);
            const col = i % 2;
            const row = Math.floor(i / 2);
            const lastRowAlone = items.length % 2 === 1 && row === Math.floor(items.length / 2);
            const baseX = lastRowAlone ? 0 : (col === 0 ? -OPTION_COL / 2 : OPTION_COL / 2);
            const baseY = -row * OPTION_ROW;
            g.position.x = THREE.MathUtils.lerp(g.position.x, baseX, 0.09);
            g.position.y = THREE.MathUtils.lerp(g.position.y, baseY, 0.09);
            g.position.z = THREE.MathUtils.lerp(g.position.z, 0, 0.09);
            if (body) {
              body.material.opacity = THREE.MathUtils.lerp(body.material.opacity, optIn * 0.78, 0.1);
            }
            if (face) {
              face.material.opacity = THREE.MathUtils.lerp(face.material.opacity, optIn * 0.82, 0.1);
            }
            if (t) {
              const textTex = hover ? cardTextTexs.hover[i] : cardTextTexs.normal[i];
              if (textTex && t.material.map !== textTex) {
                t.material.map = textTex;
                t.material.needsUpdate = true;
              }
              t.material.opacity = THREE.MathUtils.lerp(t.material.opacity, optIn, 0.1);
              t.material.depthTest = false;
              const textScale = hover ? 1.04 : 1;
              t.scale.x = THREE.MathUtils.lerp(t.scale.x, textScale, 0.1);
              t.scale.y = THREE.MathUtils.lerp(t.scale.y, textScale, 0.1);
t.scale.z = THREE.MathUtils.lerp(t.scale.z, textScale, 0.1);
            }
          }
        }
      } else {
        hoverRef.current = false;
        groupRef.current.visible = false;
        for (let i = 0; i < subRefs.current.length; i++) {
          if (subRefs.current[i]) subRefs.current[i].visible = false;
          if (subBodyRefs.current[i]) subBodyRefs.current[i].visible = false;
          if (subFaceRefs.current[i]) subFaceRefs.current[i].visible = false;
if (subTextRefs.current[i]) subTextRefs.current[i].visible = false;
        }
      }
      return;
    }

    groupRef.current.visible = true;
    meshRef.current.visible = true;
    meshRef.current.position.set(0, 0, 0);
    for (let i = 0; i < optionsRef.current.length; i++) {
      if (optionsRef.current[i]) optionsRef.current[i].visible = false;
      if (optionBodyRefs.current[i]) optionBodyRefs.current[i].visible = false;
      if (optionFaceRefs.current[i]) optionFaceRefs.current[i].visible = false;
if (optionTextRefs.current[i]) optionTextRefs.current[i].visible = false;
      if (optionsRef.current[i]) optionsRef.current[i].scale.set(1, 1, 1);
      optionHoverRef.current[i] = false;
    }
    for (let i = 0; i < subTextRefs.current.length; i++) {
      if (subTextRefs.current[i]) subTextRefs.current[i].visible = false;
    }
    for (let i = 0; i < subRefs.current.length; i++) {
if (subBodyRefs.current[i]) subBodyRefs.current[i].visible = false;
      if (subFaceRefs.current[i]) subFaceRefs.current[i].visible = false;
    }
    if (!hoverRef.current && !optionHoverRef.current.some(Boolean)) {
      document.body.style.cursor = 'auto';
    }

    const isActive = view === 'services'
      ? kind === 'service'
      : view === 'products'
        ? kind !== 'service'
        : kind === 'default';
    if (!isActive) {
      groupRef.current.visible = false;
      return;
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
    const orbitZ = Math.abs(Math.cos(angle)) * orbitRadius * 0.9;

    posXRef.current = THREE.MathUtils.lerp(posXRef.current, worldX, 0.1);
    rotYRef.current = THREE.MathUtils.lerp(rotYRef.current, 0, 0.1);

    if (isServicesMode) {
      posYZRef.current.y = THREE.MathUtils.lerp(posYZRef.current.y, 0, 0.1);
      posYZRef.current.z = THREE.MathUtils.lerp(posYZRef.current.z, 0, 0.1);
      groupRef.current.position.x = posXRef.current + (1 - eased) * flyIn;
      groupRef.current.position.y = posYZRef.current.y;
      groupRef.current.position.z = posYZRef.current.z;
      groupRef.current.rotation.set(0, rotYRef.current, 0);
      groupRef.current.scale.setScalar(1);
      meshRef.current.visible = false;

      for (let i = 0; i < subRefs.current.length; i++) {
        const g = subRefs.current[i];
        const body = subBodyRefs.current[i];
        const face = subFaceRefs.current[i];
const t = subTextRefs.current[i];
        if (!g) continue;
        const itemColor = serviceItemAccents ? serviceItemAccents[i] : color;
        g.visible = true;
        if (body) body.visible = true;
        if (face) face.visible = true;
        if (subTitleBackRefs.current[i]) subTitleBackRefs.current[i].visible = serviceTitleBoost;
        if (t) t.visible = true;
        const hover = !!subHoverRef.current[i];
        const tex = hover ? cardTexs.hover[i] : cardTexs.normal[i];
        if (face && tex && face.material.map !== tex) {
          face.material.map = tex;
          face.material.needsUpdate = true;
        }
        const count = subRefs.current.length;
        const phase = (i / count) * Math.PI * 2;
        const subVisual = phase - dnaRotation;
        const centeredIndex = i - (count - 1) / 2;
        const subLocalX = (count > 1 ? centeredIndex * SUB_CARD_STEP : 0) + SUB_CARD_OFFSET;
        g.position.x = THREE.MathUtils.lerp(g.position.x, subLocalX, 0.09);
        g.position.y = THREE.MathUtils.lerp(g.position.y, Math.sin(subVisual) * SUB_ORBIT_RADIUS, 0.09);
        g.position.z = THREE.MathUtils.lerp(g.position.z, Math.cos(subVisual) * SUB_ORBIT_RADIUS * 0.9, 0.09);
        const rotTarget = -subVisual;
        let rDiff = rotTarget - g.rotation.x;
        rDiff = ((rDiff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        g.rotation.x += rDiff * 0.09;
        const subFacing = Math.cos(subVisual);
        const subBase = 0.7 + (subFacing * 0.5 + 0.5) * 0.5;
        const subTarget = subBase * (hover ? 1.1 : 1) * SUB_CARD_SCALE;
        g.scale.x = THREE.MathUtils.lerp(g.scale.x, subTarget, 0.12);
        g.scale.y = THREE.MathUtils.lerp(g.scale.y, subTarget, 0.12);
        g.scale.z = THREE.MathUtils.lerp(g.scale.z, subTarget, 0.12);

        if (body) {
          body.material.color.set(`rgb(${itemColor})`);
          body.material.emissive.set(`rgb(${itemColor})`);
          body.material.opacity = eased * (hover ? 0.94 : 0.88);
        }
        if (face) {
          face.material.opacity = eased;
        }

        if (t) {
          const textTex = hover ? cardTextTexs.hover[i] : cardTextTexs.normal[i];
          if (textTex && t.material.map !== textTex) {
            t.material.map = textTex;
            t.material.needsUpdate = true;
          }
          t.material.opacity = eased;
          t.material.depthTest = false;
          const textScale = hover ? (serviceTitleBoost ? 1.12 : 1.04) : (serviceTitleBoost ? 1.06 : 1);
          t.scale.x = THREE.MathUtils.lerp(t.scale.x, textScale, 0.12);
          t.scale.y = THREE.MathUtils.lerp(t.scale.y, textScale, 0.12);
t.scale.z = THREE.MathUtils.lerp(t.scale.z, textScale, 0.12);
        }
      }
    } else {
      posYZRef.current.y = THREE.MathUtils.lerp(posYZRef.current.y, orbitY, 0.1);
      posYZRef.current.z = THREE.MathUtils.lerp(posYZRef.current.z, orbitZ, 0.1);
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
      if (mainFaceRef.current) mainFaceRef.current.visible = !revealedRef.current;
 if (mainTitleBackRef.current) mainTitleBackRef.current.visible = !revealedRef.current;
      if (mainTitleRef.current) mainTitleRef.current.visible = !revealedRef.current;
      if (mainFaceTexs.normal && mainFaceRef.current && mainFaceRef.current.material.map !== mainFaceTexs.normal) {
        mainFaceRef.current.material.map = mainFaceTexs.normal;
        mainFaceRef.current.material.needsUpdate = true;
      }
      if (mainTitleTex && mainTitleRef.current && mainTitleRef.current.material.map !== mainTitleTex) {
        mainTitleRef.current.material.map = mainTitleTex;
        mainTitleRef.current.material.needsUpdate = true;
      }
      if (mainTitleTex && mainTitleBackRef.current && mainTitleBackRef.current.material.map !== mainTitleTex) {
        mainTitleBackRef.current.material.map = mainTitleTex;
        mainTitleBackRef.current.material.needsUpdate = true;
      }
      meshRef.current.material.opacity = THREE.MathUtils.lerp(meshRef.current.material.opacity, eased * 0.94, 0.1);
      if (mainFaceRef.current) {
        mainFaceRef.current.material.opacity = THREE.MathUtils.lerp(mainFaceRef.current.material.opacity, eased, 0.1);
      }
      if (mainTitleBackRef.current) {
        mainTitleBackRef.current.material.opacity = THREE.MathUtils.lerp(mainTitleBackRef.current.material.opacity, eased * 0.42, 0.1);
      }
      if (mainTitleRef.current) {
mainTitleRef.current.material.opacity = THREE.MathUtils.lerp(mainTitleRef.current.material.opacity, eased, 0.1);
      }
    }

    if (glitchActiveRef.current) {
      glitchRef.current = Math.min(1, glitchRef.current + delta / 0.85);
      if (glitchRef.current >= 1) {
        glitchActiveRef.current = false;
        glitchRef.current = 0;
      }
    }

    const gt = glitchRef.current;
    const glitchIntensity = gt > 0
      ? (glitchDirRef.current > 0 ? Math.sin(gt * Math.PI) : Math.sin(gt * Math.PI))
      : 0;

    if (revealRef.current) {
      const want = revealedRef.current ? 1 : 0;
      const flicker = glitchIntensity > 0 ? (Math.random() > 0.35 ? 1 : 0) : 1;
      revealRef.current.material.opacity = THREE.MathUtils.lerp(
        revealRef.current.material.opacity,
        want * flicker,
        glitchIntensity > 0 ? 0.9 : 0.12
      );
      revealRef.current.visible = revealRef.current.material.opacity > 0.01;
      if (glitchIntensity > 0) {
        revealRef.current.position.x = (Math.random() - 0.5) * 0.12 * glitchIntensity;
        revealRef.current.position.y = (Math.random() - 0.5) * 0.1 * glitchIntensity;
      } else {
        revealRef.current.position.x = THREE.MathUtils.lerp(revealRef.current.position.x, 0, 0.1);
        revealRef.current.position.y = THREE.MathUtils.lerp(revealRef.current.position.y, 0, 0.1);
      }
    }

    if (ghostRRef.current && ghostBRef.current && ghostScanRef.current) {
      const on = glitchIntensity > 0.02;
      ghostRRef.current.visible = on;
      ghostBRef.current.visible = on;
      ghostScanRef.current.visible = on;
      if (on) {
        const jx = (Math.random() - 0.5) * 0.2 * glitchIntensity;
        ghostRRef.current.position.x = jx;
        ghostBRef.current.position.x = -jx;
        ghostRRef.current.material.opacity = 0.5 * glitchIntensity * (Math.random() > 0.4 ? 1 : 0.2);
        ghostBRef.current.material.opacity = 0.5 * glitchIntensity * (Math.random() > 0.4 ? 1 : 0.2);
        ghostScanRef.current.material.opacity = 0.35 * glitchIntensity;
        ghostScanRef.current.material.map.offset.y = (Math.random() * 2 - 1) * glitchIntensity * 2;
      } else {
        ghostRRef.current.material.opacity = 0;
        ghostBRef.current.material.opacity = 0;
        ghostScanRef.current.material.opacity = 0;
        ghostRRef.current.position.x = 0;
        ghostBRef.current.position.x = 0;
      }
    }

    for (let i = 0; i < subRefs.current.length; i++) {
      const sg = subRefs.current[i];
      if (!sg) continue;
      if (subGlitchActiveRefs.current[i]) {
        subGlitchRefs.current[i] = Math.min(1, subGlitchRefs.current[i] + delta / 0.85);
        if (subGlitchRefs.current[i] >= 1) {
          subGlitchActiveRefs.current[i] = false;
          subGlitchRefs.current[i] = 0;
        }
      }
      const sgt = subGlitchRefs.current[i];
      const si = sgt > 0 ? Math.sin(sgt * Math.PI) : 0;
      const sReveal = subRevealedRefs.current[i];
      const sTex = subRevealTexs[i];

      if (si > 0 && sg) {
        sg.position.x += (Math.random() - 0.5) * 0.16 * si;
        sg.position.y += (Math.random() - 0.5) * 0.12 * si;
        sg.rotation.z += (Math.random() - 0.5) * 0.06 * si;
      }

      const sR = subGhostRRefs.current[i];
      const sB = subGhostBRefs.current[i];
      const sS = subGhostScanRefs.current[i];
      if (sR && sB && sS) {
        const on = si > 0.02;
        sR.visible = on;
        sB.visible = on;
        sS.visible = on;
        if (on) {
          const jx = (Math.random() - 0.5) * 0.2 * si;
          sR.position.x = jx;
          sB.position.x = -jx;
          sR.material.opacity = 0.5 * si * (Math.random() > 0.4 ? 1 : 0.2);
          sB.material.opacity = 0.5 * si * (Math.random() > 0.4 ? 1 : 0.2);
          sS.material.opacity = 0.35 * si;
          sS.material.map.offset.y = (Math.random() * 2 - 1) * si * 2;
        } else {
          sR.material.opacity = 0;
          sB.material.opacity = 0;
          sS.material.opacity = 0;
          sR.position.x = 0;
          sB.position.x = 0;
        }
      }

      const sRevealMesh = subRevealRefs.current[i];
      if (sRevealMesh && sTex) {
        const want = sReveal ? 1 : 0;
        const flicker = si > 0 ? (Math.random() > 0.35 ? 1 : 0) : 1;
        sRevealMesh.material.opacity = THREE.MathUtils.lerp(
          sRevealMesh.material.opacity,
          want * flicker,
          si > 0 ? 0.9 : 0.12
        );
        sRevealMesh.visible = sRevealMesh.material.opacity > 0.01;
        if (si > 0) {
          sRevealMesh.position.x = (Math.random() - 0.5) * 0.12 * si;
          sRevealMesh.position.y = (Math.random() - 0.5) * 0.1 * si;
        } else {
          sRevealMesh.position.x = THREE.MathUtils.lerp(sRevealMesh.position.x, 0, 0.1);
          sRevealMesh.position.y = THREE.MathUtils.lerp(sRevealMesh.position.y, 0, 0.1);
        }
      }

      const sFace = subFaceRefs.current[i];
      if (sFace) sFace.visible = !sReveal;
      const sT = subTextRefs.current[i];
      if (sT) sT.visible = !sReveal;
      const sTB = subTitleBackRefs.current[i];
      if (sTB) sTB.visible = !sReveal;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          if (!cardsClickable) return;
          e.stopPropagation();
          if (!isJourneying) {
            hoverRef.current = true;
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          if (!cardsClickable) return;
          hoverRef.current = false;
          if (!optionHoverRef.current.some(Boolean)) document.body.style.cursor = 'auto';
        }}
onClick={(e) => {
          if (!cardsClickable) return;
          e.stopPropagation();
          if (!isJourneying) toggleRevealed();
        }}
      >
        <boxGeometry args={[SUB_CARD_SIZE[0], SUB_CARD_SIZE[1], SUB_CARD_DEPTH]} />
        <meshStandardMaterial
          color={`rgb(10, 14, 20)`}
          transparent
          opacity={0}
          roughness={0.34}
          metalness={0.08}
          emissive={`rgb(${color})`}
          emissiveIntensity={0.07}
          depthWrite={false}
        />
        <CardVideoPlane src={mainVideoSrc} size={SUB_CARD_SIZE} opacity={0.55} overlay={0.35} z={SUB_CARD_DEPTH / 2 + 0.02} renderOrder={10} active={mainVideoActive} />
        <mesh
          ref={mainFaceRef}
          position={[0, 0, SUB_CARD_DEPTH / 2 + 0.01]}
          renderOrder={1}
        >
          <planeGeometry args={SUB_CARD_SIZE} />
          <meshBasicMaterial map={mainFaceTexs.normal} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
        {mainTitleTex && (
          <mesh
            ref={mainTitleRef}
            position={[0, 0.06, SUB_CARD_DEPTH / 2 + 0.32]}
            renderOrder={3}
          >
            <planeGeometry args={[SUB_CARD_SIZE[0] * 1.0, SUB_CARD_SIZE[1] * 0.74]} />
            <meshBasicMaterial map={mainTitleTex} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} depthTest={false} toneMapped={false} />
          </mesh>
        )}
        <mesh
          ref={ghostRRef}
          position={[0, 0, SUB_CARD_DEPTH / 2 + 0.045]}
          renderOrder={12}
          visible={false}
        >
          <planeGeometry args={SUB_CARD_SIZE} />
          <meshBasicMaterial map={null} color="#ff2244" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh
          ref={ghostBRef}
          position={[0, 0, SUB_CARD_DEPTH / 2 + 0.045]}
          renderOrder={12}
          visible={false}
        >
          <planeGeometry args={SUB_CARD_SIZE} />
          <meshBasicMaterial map={null} color="#2288ff" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh
          ref={ghostScanRef}
          position={[0, 0, SUB_CARD_DEPTH / 2 + 0.05]}
          renderOrder={13}
          visible={false}
        >
          <planeGeometry args={SUB_CARD_SIZE} />
          <meshBasicMaterial map={glitchScanTexture} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        {revealTex && (
          <mesh
            ref={(el) => { if (el) revealRef.current = el; }}
            position={[0, 0, SUB_CARD_DEPTH / 2 + 0.04]}
            renderOrder={11}
            visible={false}
          >
            <planeGeometry args={SUB_CARD_SIZE} />
            <meshBasicMaterial map={revealTex} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
      </mesh>
      {optionTexs.normal.length > 0 && (
        <group ref={wrapRef} position={[0, ((Math.ceil(items.length / 2) - 1) * OPTION_ROW) / 2 + 0.7, 0]}>
          {items.map((it, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const lastRowAlone = items.length % 2 === 1 && row === Math.floor(items.length / 2);
            const gridX = lastRowAlone ? 0 : (col === 0 ? -OPTION_COL / 2 : OPTION_COL / 2);
            return (
              <group
                key={i}
                ref={(el) => { if (el) optionsRef.current[i] = el; }}
                position={[gridX, -row * OPTION_ROW, 0]}
                onPointerOver={(e) => {
                  if (!cardsClickable) return;
                  e.stopPropagation();
                  if (isJourneying) {
                    optionHoverRef.current[i] = true;
                    document.body.style.cursor = 'pointer';
                  }
                }}
                onPointerOut={() => {
                  if (!cardsClickable) return;
                  optionHoverRef.current[i] = false;
                  if (!optionHoverRef.current.some(Boolean)) document.body.style.cursor = 'auto';
                }}
                onClick={(e) => {
                  if (!cardsClickable) return;
                  e.stopPropagation();
                  if (isJourneying) onOptionClick(i);
                }}
              >
                <mesh
                  ref={(el) => { if (el) optionBodyRefs.current[i] = el; }}
                  renderOrder={0}
                >
                  <boxGeometry args={[OPTION_SIZE[0], OPTION_SIZE[1], OPTION_CARD_DEPTH]} />
                  <meshStandardMaterial
                    color={`rgb(10, 14, 20)`}
                    transparent
                    opacity={0}
                    roughness={0.38}
                    metalness={0.08}
                    emissive={`rgb(${color})`}
                    emissiveIntensity={0.06}
                    depthWrite={false}
                  />
                </mesh>
                <CardVideoPlane src={optionVideoSrcs[i]} size={OPTION_SIZE} opacity={0.55} overlay={0.35} z={OPTION_CARD_DEPTH / 2 + 0.02} renderOrder={10} active={optionVideosActive} />
                <mesh
                  ref={(el) => { if (el) optionFaceRefs.current[i] = el; }}
                  position={[0, 0, OPTION_CARD_DEPTH / 2 + 0.01]}
                  renderOrder={1}
                >
                  <planeGeometry args={OPTION_SIZE} />
                  <meshBasicMaterial map={optionTexs.normal[i]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
                </mesh>
                {cardTextTexs.normal[i] && (
                <mesh
                  ref={(el) => { if (el) optionTextRefs.current[i] = el; }}
                  position={[0, 0.04, OPTION_CARD_DEPTH / 2 + 0.24]}
                  renderOrder={3}
                >
                  <planeGeometry args={[OPTION_SIZE[0] * 0.88, OPTION_SIZE[1] * 0.64]} />
                  <meshBasicMaterial map={cardTextTexs.normal[i]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} depthTest={false} toneMapped={false} />
                </mesh>
                )}
              </group>
            );
          })}
        </group>
      )}

      {stairIndex === 0 && optionTexs.normal.length > 0 && (
      <group>
          {items.map((it, i) => (
              <group
                key={`sub-${i}`}
                ref={(el) => { if (el) subRefs.current[i] = el; }}
                visible={false}
                onPointerOver={(e) => {
                  if (!cardsClickable) return;
                  e.stopPropagation();
                  if (view === 'services' && !isJourneying) {
                    subHoverRef.current[i] = true;
                    document.body.style.cursor = 'pointer';
                  }
                }}
                onPointerOut={() => {
                  if (!cardsClickable) return;
                  subHoverRef.current[i] = false;
                  if (!subHoverRef.current.some(Boolean)) document.body.style.cursor = 'auto';
                }}
                onClick={(e) => {
                  if (!cardsClickable) return;
                  e.stopPropagation();
                  if (view === 'services' && !isJourneying) toggleSubRevealed(i);
                }}
            >
              <mesh
                ref={(el) => { if (el) subBodyRefs.current[i] = el; }}
                renderOrder={0}
              >
                <boxGeometry args={[SUB_CARD_SIZE[0], SUB_CARD_SIZE[1], SUB_CARD_DEPTH]} />
                <meshStandardMaterial
                  color={`rgb(${serviceItemAccents ? serviceItemAccents[i] : color})`}
                  transparent
                  opacity={0}
                  roughness={0.35}
                  metalness={0.08}
                  emissive={`rgb(${serviceItemAccents ? serviceItemAccents[i] : color})`}
                  emissiveIntensity={0.08}
                  depthWrite={false}
                />
              </mesh>
              <CardVideoPlane src={subVideoSrcs[i]} size={SUB_CARD_SIZE} opacity={0.55} overlay={0.35} z={SUB_CARD_DEPTH / 2 + 0.02} renderOrder={10} active={subVideosActive} />
              <mesh
                ref={(el) => { if (el) subFaceRefs.current[i] = el; }}
                position={[0, 0, SUB_CARD_DEPTH / 2 + 0.01]}
                renderOrder={1}
              >
                <planeGeometry args={SUB_CARD_SIZE} />
                <meshBasicMaterial map={cardTexs.normal[i]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
              </mesh>
              {cardTextTexs.normal[i] && (
                <mesh
                  ref={(el) => { if (el) subTextRefs.current[i] = el; }}
                  position={[0, 0.07, SUB_CARD_DEPTH / 2 + 0.34]}
                  renderOrder={4}
                >
                  <planeGeometry args={[SUB_CARD_SIZE[0] * 1.08, SUB_CARD_SIZE[1] * 0.76]} />
                  <meshBasicMaterial map={cardTextTexs.normal[i]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} depthTest={false} toneMapped={false} />
                </mesh>
              )}
              <mesh
                ref={(el) => { if (el) subGhostRRefs.current[i] = el; }}
                position={[0, 0, SUB_CARD_DEPTH / 2 + 0.045]}
                renderOrder={12}
                visible={false}
              >
                <planeGeometry args={SUB_CARD_SIZE} />
                <meshBasicMaterial color="#ff2244" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} toneMapped={false} />
              </mesh>
              <mesh
                ref={(el) => { if (el) subGhostBRefs.current[i] = el; }}
                position={[0, 0, SUB_CARD_DEPTH / 2 + 0.045]}
                renderOrder={12}
                visible={false}
              >
                <planeGeometry args={SUB_CARD_SIZE} />
                <meshBasicMaterial color="#2288ff" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} toneMapped={false} />
              </mesh>
              <mesh
                ref={(el) => { if (el) subGhostScanRefs.current[i] = el; }}
                position={[0, 0, SUB_CARD_DEPTH / 2 + 0.05]}
                renderOrder={13}
                visible={false}
              >
                <planeGeometry args={SUB_CARD_SIZE} />
                <meshBasicMaterial map={glitchScanTexture} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} toneMapped={false} />
              </mesh>
              {subRevealTexs[i] && (
                <mesh
                  ref={(el) => { if (el) subRevealRefs.current[i] = el; }}
                  position={[0, 0, SUB_CARD_DEPTH / 2 + 0.04]}
                  renderOrder={11}
                  visible={false}
                >
                  <planeGeometry args={SUB_CARD_SIZE} />
                  <meshBasicMaterial map={subRevealTexs[i]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

function DetailPanel({ item, category, color, follow = false }) {
  const tex = useDetailTexture(item, category, color);
  const ref = useRef();
  const appearRef = useRef(0);

  useFrame((state, delta) => {
    if (!ref.current || !tex) return;
    appearRef.current = Math.min(1, appearRef.current + delta * 3.2);
    const tx = follow ? state.camera.position.x + 14 : JOURNEY_END_X;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, tx, 1 - Math.exp(-delta * 4));
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, JOURNEY_CAM_LOOK_Y, 1 - Math.exp(-delta * 4));
    ref.current.material.opacity = appearRef.current;
    ref.current.scale.setScalar(0.9 + 0.1 * appearRef.current);
  });

  return (
    <mesh ref={ref} position={[follow ? 0 : JOURNEY_END_X, JOURNEY_CAM_LOOK_Y + 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={DETAIL_SIZE} />
      <meshBasicMaterial map={tex} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

const TOTAL_PAGES = 6;
const DNA_LENGTH = 90;
const CAMERA_RANGE = 100;
const DNA_OFFSET = -9;
const DNA_JOURNEY_SHIFT = 20;

const JOURNEY_END_X = 80;
const JOURNEY_CAM_X = 48;
const JOURNEY_CAM_LOOK_Y = 0.7;
const JOURNEY_WALK_SPEED = 26;
const JOURNEY_CAM_ARRIVE = 42;
const JOURNEY_LEFT_START = -60;

const THUMB_NDC_X = -0.75;
const THUMB_NDC_Y = 0.87;
const THUMB_SCALE = 0.5;
const THUMB_DEPTH = 34;
const DETAIL_SIZE = [11, 13];

const _tVec = new THREE.Vector3();
const _dirVec = new THREE.Vector3();
const _ndcVec = new THREE.Vector3();

const CARD_VIDEO_SOURCES = [
  '/Woblo/discover-your-patronus-active-theory.video.Discover_Your_Patronus_Case_Study_20(1).Woblo.mp4',
  '/Woblo/e-c-h-o-active-theory.video.EchoCaseStudy.Woblo.mp4',
  '/Woblo/kandinsky-active-theory.video.Kandinsky_2000Kbps_720p.Woblo.mp4',
  '/Woblo/million-piece-mission-active-theory.video.Million_Piece_Mission_1.Woblo.mp4',
  '/Woblo/paper-planes-active-theory.video.paperplanes_1.Woblo.mp4',
  '/Woblo/prometheus-active-theory.video.prometheus_20(720p).Woblo.mp4',
  '/Woblo/racer-active-theory.video.racer.Woblo.mp4',
  '/Woblo/secret-sky-active-theory.video.secret_sky_2021_recap_20(1080p)_1.Woblo.mp4',
  '/Woblo/sustainable-horizons-active-theory.video.sustainable_1_1.Woblo.mp4',
  '/Woblo/welcome-to-hogwarts-active-theory.video.video.Woblo.mp4',
];

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(seed, arr) {
  let s = hashString(String(seed));
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

const VIDEO_TEX_MAX_W = 384;
const VIDEO_TEX_PULL_EVERY_FRAMES = 2;

const sharedVideoTextureCache = new Map();
const activeVideoEntries = new Set();
let videoPullRAF = null;
let videoPullAccum = 0;

function pullActiveVideoFrames() {
  videoPullAccum += 1;
  if (videoPullAccum >= VIDEO_TEX_PULL_EVERY_FRAMES) {
    videoPullAccum = 0;
    for (const entry of activeVideoEntries) {
      const v = entry.video;
      if (v && v.readyState >= 2 && !v.paused) {
        entry.ctx.drawImage(v, 0, 0, entry.canvas.width, entry.canvas.height);
        entry.texture.needsUpdate = true;
      }
    }
  }
  videoPullRAF = requestAnimationFrame(pullActiveVideoFrames);
}

function startVideoPull() {
  if (videoPullRAF === null) {
    videoPullRAF = requestAnimationFrame(pullActiveVideoFrames);
  }
}

function stopVideoPull() {
  if (videoPullRAF !== null) {
    cancelAnimationFrame(videoPullRAF);
    videoPullRAF = null;
  }
}

function useSharedVideoTexture(src, active = true) {
  const [texture, setTexture] = useState(() => sharedVideoTextureCache.get(src)?.texture || null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!src) {
      setTexture(null);
      return undefined;
    }

    const encodedSrc = encodeURI(src);
    let entry = sharedVideoTextureCache.get(src);
    if (!entry) {
      const video = document.createElement('video');
      video.src = encodedSrc;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.preload = 'meta';
      video.style.position = 'absolute';
      video.style.left = '-9999px';
      video.style.top = '0';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      document.body.appendChild(video);

      const canvas = document.createElement('canvas');
      canvas.width = VIDEO_TEX_MAX_W;
      canvas.height = 216;
      const ctx = canvas.getContext('2d');

      const canvasTexture = new THREE.CanvasTexture(canvas);
      canvasTexture.colorSpace = THREE.SRGBColorSpace;
      canvasTexture.minFilter = THREE.LinearFilter;
      canvasTexture.magFilter = THREE.LinearFilter;
      canvasTexture.generateMipmaps = false;
      entry = { video, canvas, ctx, texture: canvasTexture, activeCount: 0 };
      entry.fitCanvas = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const aspect = video.videoWidth / video.videoHeight;
          const w = VIDEO_TEX_MAX_W;
          const h = Math.max(1, Math.round(w / aspect));
          canvas.width = w;
          canvas.height = h;
          canvasTexture.needsUpdate = true;
        }
      };
      sharedVideoTextureCache.set(src, entry);
    }
    entry.activeCount += 1;

    const drawFrame = () => {
      if (!activeRef.current) return;
      entry.ctx.drawImage(entry.video, 0, 0, entry.canvas.width, entry.canvas.height);
      entry.texture.needsUpdate = true;
    };
    const tryPlay = () => {
      if (!activeRef.current) return;
      const playResult = entry.video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {});
      }
    };
const syncActive = () => {
      if (activeRef.current) {
        tryPlay();
      } else {
        entry.video.pause();
      }
    };
    syncActive();

    entry.video.addEventListener('canplay', syncActive);
    entry.video.addEventListener('loadeddata', () => { entry.fitCanvas(); drawFrame(); syncActive(); });
    entry.video.addEventListener('playing', syncActive);
    entry.video.addEventListener('ended', syncActive);
entry.__onPlaying = () => {
        entry.fitCanvas();
        entry.ctx.drawImage(entry.video, 0, 0, entry.canvas.width, entry.canvas.height);
        entry.texture.needsUpdate = true;
      };
    entry.video.load();

    const resumeOnGesture = () => {
      if (activeRef.current) { tryPlay(); drawFrame(); }
      window.removeEventListener('pointerdown', resumeOnGesture);
      window.removeEventListener('touchstart', resumeOnGesture);
    };
    window.addEventListener('pointerdown', resumeOnGesture, { once: true });
    window.addEventListener('touchstart', resumeOnGesture, { once: true });

    setTexture(entry.texture);

    return () => {
      entry.activeCount -= 1;
      if (entry.activeCount <= 0) {
        entry.video.pause();
        entry.video.removeAttribute('src');
        entry.video.load();
      }
      entry.video.removeEventListener('canplay', syncActive);
      entry.video.removeEventListener('loadeddata', syncActive);
      entry.video.removeEventListener('playing', syncActive);
      entry.video.removeEventListener('ended', syncActive);
      entry.video.removeEventListener('playing', entry.__onPlaying);
      activeVideoEntries.delete(entry);
      if (activeVideoEntries.size === 0) stopVideoPull();
      window.removeEventListener('pointerdown', resumeOnGesture);
      window.removeEventListener('touchstart', resumeOnGesture);
    };
  }, [src]);

  useEffect(() => {
    if (!src) return undefined;
    const entry = sharedVideoTextureCache.get(src);
    if (!entry) return undefined;
    if (active) {
      activeVideoEntries.add(entry);
      startVideoPull();
      entry.fitCanvas();
      if (entry.video.readyState >= 2) {
        entry.ctx.drawImage(entry.video, 0, 0, entry.canvas.width, entry.canvas.height);
        entry.texture.needsUpdate = true;
      }
      const playResult = entry.video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {});
      }
      entry.video.addEventListener('playing', entry.__onPlaying);
    } else {
      entry.video.pause();
      entry.video.removeEventListener('playing', entry.__onPlaying);
      activeVideoEntries.delete(entry);
      if (activeVideoEntries.size === 0) stopVideoPull();
    }
    return undefined;
  }, [src, active]);

  return texture;
}

function CardVideoPlane({ src, size, opacity = 0.32, z = 0.006, renderOrder = 1, overlay = 0, active = true }) {
  const texture = useSharedVideoTexture(src, active);
  if (!texture) return null;

  return (
    <group>
      <mesh position={[0, 0, z]} renderOrder={renderOrder}>
        <planeGeometry args={size} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {overlay > 0 && (
        <mesh position={[0, 0, z + 0.002]} renderOrder={renderOrder + 1}>
          <planeGeometry args={size} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={overlay}
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

const sphereData = [
  {
    title: "Our Expertise", subtitle: "Innovation", color: "56, 189, 248", stairIndex: 0,
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
    title: "Why", subtitle: "Cosmichameleon", color: "170, 90, 255", stairIndex: 2,
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

const SERVICE_ITEM_COLORS = [
  '56, 189, 248',
  '255, 92, 138',
  '124, 92, 255',
  '255, 184, 77',
  '72, 231, 182',
  '255, 106, 214',
  '126, 255, 90',
];

function DNAHelix({ journey, mouseYRef, view }) {
  const ref = useRef();
  const fadeRef = useRef(1);
  const scroll = useScroll();

  useFrame((state, delta) => {
    if (!ref.current) return;
    const target = journey ? DNA_OFFSET + DNA_JOURNEY_SHIFT : DNA_OFFSET;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, target, 1 - Math.exp(-delta * 2.2));

    const offset = scroll?.offset || 0;
    let sectionOpacity = 1;
    if (view === 'default' && offset >= 0.06 && offset < 0.12) {
      sectionOpacity = 1 - smoothstep(0.06, 0.12, offset);
    } else if (view === 'default' && offset >= 0.12 && offset <= 0.24) {
      sectionOpacity = 0;
    } else if (view === 'default' && offset > 0.24 && offset <= 0.32) {
      sectionOpacity = smoothstep(0.24, 0.32, offset);
    }

    let opacity = 1;
    if (journey) {
      const py = mouseYRef.current || 0;
      const hoverReveal = THREE.MathUtils.clamp((Math.abs(py) - 0.5) / 0.35, 0, 1);
      const walkBase = THREE.MathUtils.clamp((JOURNEY_CAM_X - state.camera.position.x) / 12, 0, 1);
      opacity = THREE.MathUtils.clamp(Math.max(walkBase, hoverReveal), 0, 1);
    }
    fadeRef.current = THREE.MathUtils.lerp(fadeRef.current, opacity * sectionOpacity, 1 - Math.exp(-delta * 6));

    ref.current.traverse((o) => {
      if (o.material) {
        if (o.userData.baseOp === undefined) o.userData.baseOp = o.material.opacity;
        o.material.opacity = o.userData.baseOp * fadeRef.current;
      }
    });
  });

  return (
    <group ref={ref} position={[DNA_OFFSET, 0, 0]}>
      <ActiveDNA length={DNA_LENGTH} />
    </group>
  );
}

export default function App() {
  const [journey, setJourney] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [activeView, setActiveView] = useState('default');
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

  const defaultCards = [
    { title: '', subtitle: '', color: '56, 189, 248', kind: 'default', items: [] },
    { title: '', subtitle: '', color: '255, 68, 136', kind: 'default', items: [] },
    { title: '', subtitle: '', color: '170, 90, 255', kind: 'default', items: [] },
    { title: '', subtitle: '', color: '126, 255, 90', kind: 'default', items: [] },
    { title: '', subtitle: '', color: '255, 196, 87', kind: 'default', items: [] },
    { title: sphereData[2].title, subtitle: sphereData[2].subtitle, color: sphereData[2].color, kind: 'default', items: [] },
    { title: sphereData[3].title, subtitle: sphereData[3].subtitle, color: sphereData[3].color, kind: 'default', items: [] },
  ].map((card, i) => ({ ...card, stairIndex: i }));

  const productCardColors = ['0, 229, 255', '255, 92, 138', '124, 92, 255', '255, 184, 77'];
  const productCards = sphereData[1].items.map((item, i) => ({
    title: item.title,
    subtitle: 'Products',
    color: productCardColors[i % productCardColors.length],
    kind: 'product',
    items: [],
    stairIndex: i,
  }));

  const serviceCards = [
    {
      title: sphereData[0].title,
      subtitle: sphereData[0].subtitle,
      color: sphereData[0].color,
      kind: 'service',
      items: sphereData[0].items,
      stairIndex: 0,
    },
  ];

  const sceneCards = activeView === 'services'
    ? serviceCards
    : activeView === 'products'
      ? productCards
      : defaultCards;

  const totalSceneCards = sceneCards.length;
  return (
    <div className="app-shell">
      <div className="scene-ambient" aria-hidden="true" />
      <div className="scene-vignette" aria-hidden="true" />
      <div className="scene-canvas-wrap">
        <Canvas
          camera={{ position: [-(CAMERA_RANGE / 2), 0, 18], fov: 45 }}
          dpr={[1, 1.25]}
          gl={{ antialias: true, alpha: true }}
          style={{ position: 'relative', zIndex: 1, background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 10]} intensity={0.8} />
          <directionalLight position={[-10, -5, -10]} intensity={0.3} />

          <ScrollControls pages={TOTAL_PAGES} horizontal damping={0.15} enabled={!journey} style={{ zIndex: 3 }}>
<Galaxy length={DNA_LENGTH * 1.5} />
            <DNAHelix journey={journey} mouseYRef={mouseYRef} view={activeView} />
            {sceneCards.map((card, i) => (
                <OrbitingCard
                  key={`${activeView}-${card.kind}-${i}`}
                  title={card.title}
                  subtitle={card.subtitle}
                  color={card.color}
                  items={card.items}
                  stairIndex={card.stairIndex}
                  totalCards={totalSceneCards}
                  journey={journey}
                  view={activeView}
                  kind={card.kind}
                  onSelect={() => setJourney({ card: i })}
                  selectedIndex={selectedOption && selectedOption.card === i ? selectedOption.option : null}
                  onOptionClick={(opt) => { suppressDocClickRef.current = true; setSelectedOption((prev) => (prev ? null : { card: i, option: opt })); }}
                  onSubClick={(opt) => { suppressDocClickRef.current = true; setSelectedOption((prev) => (prev ? null : { card: 0, option: opt })); }}
/>
              ))}

              {selectedOption && sphereData[selectedOption.card] && (
                <DetailPanel
                  key={selectedOption.card + '-' + selectedOption.option}
                  item={sphereData[selectedOption.card].items[selectedOption.option]}
                  category={sphereData[selectedOption.card].title}
                  color={sphereData[selectedOption.card].color}
                  follow={!journey}
                />
              )}
            <CameraTracker length={CAMERA_RANGE} journey={journey} mouseXRef={mouseXRef} mouseYRef={mouseYRef} />

            <Scroll html style={{ width: '100vw', height: '100vh', pointerEvents: journey ? 'none' : 'auto' }}>

              <HeroLogoSection />

              {/* 2. ADAPT TRANSFORM DOMINATE (DNA breaks) */}
              {activeView === 'default' && (
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
                          { word: 'Adapt', desc: 'We watch the market closely, read the signals early, and shift before the wave even begins to move.' },
                          { word: 'Transform', desc: 'We rebuild your presence into something sharper, faster, more engaging, and built to win.' },
                          { word: 'Dominate', desc: 'Consistent systems and creative edge put you ahead of the competition and keep you there.' },
                        ]}
                      />
                    </div>
                  </div>
                </ScrollSection>
              )}

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
                    <LaunchEvolutionStage scrollStart={0.8} scrollEnd={1.0} />
                  </div>
                </div>
              </ScrollSection>

            </Scroll>
          </ScrollControls>
        </Canvas>
      </div>
      <div className="hero-brand" aria-label="Cosmichameleon">
        <img className="hero-logo" src="/hero-logo.png" alt="Cosmichameleon" />
        <div className="hero-subtitle-line" />
      </div>
      {journey && (
        <button className="journey-back" onClick={() => { setSelectedOption(null); setJourney(null); }}>Back</button>
      )}
      <div className="view-switcher">
        <button
          className={`view-btn ${activeView === 'default' ? 'active' : ''}`}
          onClick={() => { setSelectedOption(null); setJourney(null); setActiveView('default'); }}
        >
          CosmiChameleon
        </button>
        <button
          className={`view-btn ${activeView === 'services' ? 'active' : ''}`}
          onClick={() => { setSelectedOption(null); setJourney(null); setActiveView('services'); }}
        >
          Our Services
        </button>
        <button
          className={`view-btn ${activeView === 'products' ? 'active' : ''}`}
          onClick={() => { setSelectedOption(null); setJourney(null); setActiveView('products'); }}
        >
          Our Products
        </button>
      </div>
    </div>
  );
}


