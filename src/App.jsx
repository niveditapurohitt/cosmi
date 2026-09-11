import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, Scroll, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import ActiveDNA from './ActiveDNA';
import Galaxy from './Galaxy';

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
    ctx.arc(net[i].x, net[i].y, 0.9, 0, Math.PI * 2);
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
  let size = 42;
  ctx.font = `600 ${size}px "Fredoka"`;
  const maxW = 600 - 60;
  while (ctx.measureText(title).width > maxW && size > 22) {
    size -= 1;
    ctx.font = `600 ${size}px "Fredoka"`;
  }
  const titleY = hover ? 56 : 96;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '1px';
  ctx.fillText(title, 24, titleY);
  ctx.restore();

  // details revealed on hover
  if (hover && text) {
    ctx.fillStyle = `rgba(${accent}, 0.95)`;
    ctx.fillRect(24, 88, 54, 3);
    ctx.font = '400 21px "Inter"';
    ctx.letterSpacing = '0.4px';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const lines = wrapText(ctx, text, maxW);
    lines.slice(0, 3).forEach((line, j) => {
      ctx.fillText(line, 24, 112 + j * 28);
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
      document.fonts.load(`600 ${boost ? 64 : 52}px "Fredoka"`),
      document.fonts.load('400 18px "Inter"'),
      document.fonts.ready,
    ]).then(draw).catch(draw);
    return () => { cancelled = true; };
  }, [title, subtitle, accent]);

  return texs;
}

function ScrollElBridge({ scrollElRef }) {
  const scroll = useScroll();
  scrollElRef.current = scroll.el || null;
  return null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile;
}

function CameraTracker({ length, journey, mouseXRef, mouseYRef, isMobile }) {
  const scroll = useScroll();
  const mobileRange = length * 0.68;
  const journeyScrollRef = useRef(null);
  const scrollerRef = useRef(null);
  const journeyMotionRef = useRef(null);

    useFrame((state, delta) => {
      const cameraLength = isMobile ? mobileRange : length;
      const x = scroll.offset * cameraLength - (cameraLength / 2);
      const k = 1 - Math.exp(-delta * 5);
      const py = mouseYRef.current;
      const px = mouseXRef.current;
    if (journey) {
      if (scrollerRef.current === null) scrollerRef.current = scroll.el || null;
      if (journeyScrollRef.current === null && scrollerRef.current) {
        journeyScrollRef.current = isMobile
          ? scrollerRef.current.scrollTop
          : scrollerRef.current.scrollLeft;
      }
      if (scrollerRef.current) {
        if (isMobile) scrollerRef.current.scrollTop = journeyScrollRef.current || 0;
        else scrollerRef.current.scrollLeft = journeyScrollRef.current || 0;
      }
      if (!journeyMotionRef.current) {
        journeyMotionRef.current = {
          startZ: state.camera.position.z,
          targetZ: -18,
          elapsed: 0,
        };
      }
      const motion = journeyMotionRef.current;
      motion.elapsed = Math.min(motion.elapsed + delta, 1.65);
      const progress = motion.elapsed / 1.65;
      const eased = 1 - Math.pow(1 - progress, 3);
      state.camera.position.z = THREE.MathUtils.lerp(motion.startZ, motion.targetZ, eased);
      // Preserve the current framing while the user moves straight through.
      state.camera.lookAt(state.camera.position.x, isMobile ? state.camera.position.y : 0, -100);
    } else {
      journeyMotionRef.current = null;
      journeyScrollRef.current = null;
      if (isMobile) {
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, 0.12);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, -x, 0.05);
      } else {
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, x, 0.05);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, k);
      }
      const zOffset = Math.sin(scroll.offset * Math.PI) * 4;
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 18 - zOffset, 0.05);
      state.camera.lookAt(isMobile ? 0 : x, isMobile ? -x : 0, 0);
    }
  });
  return null;
}

function AboutUsOverlay({ onClose }) {
  const [entered, setEntered] = useState(false);
  const [counters, setCounters] = useState([0, 0, 0, 0]);
  const countersRef = useRef([0, 0, 0, 0]);
  const startedRef = useRef(false);

  const stats = [
    { value: 150, suffix: '+', label: 'Projects Delivered' },
    { value: 98, suffix: '%', label: 'Client Retention' },
    { value: 12, suffix: '+', label: 'Countries Served' },
    { value: 50, suffix: '+', label: 'Team Members' },
  ];

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!entered) return;
    const delay = setTimeout(() => { startedRef.current = true; }, 600);
    const id = setInterval(() => {
      if (!startedRef.current) return;
      let anyChanged = false;
      const next = countersRef.current.map((cur, i) => {
        if (cur >= stats[i].value) return cur;
        anyChanged = true;
        return Math.min(stats[i].value, cur + Math.max(1, Math.ceil(stats[i].value * 0.05)));
      });
      if (anyChanged) {
        countersRef.current = next;
        setCounters([...next]);
      }
    }, 35);
    return () => { clearTimeout(delay); clearInterval(id); };
  }, [entered]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      className={`about-overlay ${entered ? 'about-overlay-entered' : ''}`}
      onClick={onClose}
    >
      <button className="about-close" onClick={onClose}>&times;</button>
      <div
        className={`about-glass-panel about-panel-animated ${entered ? 'about-panel-entered' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="about-scan-line about-scan-animated" />
        <div className="about-grid-bg" />

        <div className="about-label">Who We Are</div>
        <h2 className="about-title">
          We craft <span className="about-highlight">digital experiences</span> that move people.
        </h2>

        <div className="about-text-blocks">
          <div className={`about-text-block ${entered ? 'about-text-entered' : ''}`} style={{ transitionDelay: '0.3s' }}>
            <p>
              CosmiChameleon is a next-generation digital agency at the intersection of strategy,
              design, and cutting-edge technology. We partner with ambitious brands to build
              products that don't just work — they captivate, convert, and scale.
            </p>
          </div>
          <div className={`about-text-block ${entered ? 'about-text-entered' : ''}`} style={{ transitionDelay: '0.5s' }}>
            <p>
              Our team spans 12+ countries, united by a shared obsession with craft. From AI-driven
              platforms to immersive web experiences, we turn complex challenges into elegant
              solutions. Every project is a chance to push boundaries, every pixel a deliberate choice.
            </p>
          </div>
          <div className={`about-text-block ${entered ? 'about-text-entered' : ''}`} style={{ transitionDelay: '0.7s' }}>
            <p>
              We don't follow the future — we build it. Whether it's a startup MVP or an enterprise
              transformation, CosmiChameleon brings the same relentless energy and technical precision
              to every engagement.
            </p>
          </div>
        </div>

        <div className="about-divider" />

        <div className="about-values">
          <div className={`about-value-item ${entered ? 'about-value-entered' : ''}`} style={{ transitionDelay: '0.8s' }}>
            <span className="about-value-icon">&#9670;</span>
            <div>
              <h4>Innovation First</h4>
              <p>We challenge convention and explore uncharted territory with every project.</p>
            </div>
          </div>
          <div className={`about-value-item ${entered ? 'about-value-entered' : ''}`} style={{ transitionDelay: '0.95s' }}>
            <span className="about-value-icon">&#9670;</span>
            <div>
              <h4>Relentless Quality</h4>
              <p>Every line of code, every design choice — held to the highest standard.</p>
            </div>
          </div>
          <div className={`about-value-item ${entered ? 'about-value-entered' : ''}`} style={{ transitionDelay: '1.1s' }}>
            <span className="about-value-icon">&#9670;</span>
            <div>
              <h4>Global Reach</h4>
              <p>12+ countries, one unified vision — building without borders.</p>
            </div>
          </div>
        </div>

        <div className="about-stats">
          {stats.map((stat, i) => (
            <div key={i} className={`about-stat-item ${entered ? 'about-stat-entered' : ''}`} style={{ transitionDelay: `${1.2 + i * 0.1}s` }}>
              <span className="about-stat-value">{counters[i]}{stat.suffix}</span>
              <span className="about-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

function WhatsAppForm({ onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `Hi, I'm ${name} (${email}).\n\n${message}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/916376064290?text=${encoded}`, '_blank');
    onClose();
  };

  return createPortal(
    <div className="whatsapp-overlay" onClick={onClose}>
      <div className="whatsapp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="whatsapp-close" onClick={onClose}>&times;</button>
        <h3 className="whatsapp-heading">Send us a message on WhatsApp</h3>
        <form onSubmit={handleSubmit} className="whatsapp-form">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="whatsapp-input"
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="whatsapp-input"
          />
          <textarea
            placeholder="Your Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="whatsapp-textarea"
          />
          <button type="submit" className="whatsapp-submit">Open WhatsApp</button>
        </form>
      </div>
    </div>,
    document.body
  );
}

function AboutUsScrollStage({ isMobile = false }) {
  const cardRef = useRef();
  const scroll = useScroll();
  const stats = [
    { num: '150', suffix: '+', label: 'Projects Delivered' },
    { num: '98', suffix: '%', label: 'Client Retention' },
    { num: '12', suffix: '+', label: 'Countries Served' },
  ];

  useFrame(() => {
    if (!isMobile || !cardRef.current) return;
    const progress = THREE.MathUtils.clamp((scroll.offset - 0.48) / 0.22, 0, 1);
    const eased = smoothstep(0, 1, progress);
    const cardHeight = cardRef.current.offsetHeight;
    const startY = window.innerHeight * 0.5 + cardHeight * 0.5 + 24;
    const y = (1 - eased) * startY;
    cardRef.current.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(0.9)`;
  });

  return (
    <div className="about-awesome-page">
      <div className="about-awesome-glow" aria-hidden="true" />
      <div className="about-orb about-orb-a" aria-hidden="true" />
      <div className="about-orb about-orb-b" aria-hidden="true" />

      <div ref={cardRef} className="about-awesome-card">
        <div className="about-awesome-border" aria-hidden="true" />
        <div className="about-mesh-bg" aria-hidden="true" />

        <div className="about-awesome-tag">&#9670; About CosmiChameleon</div>
        <h2 className="about-awesome-title">
          We craft the <span className="about-grad">digital future</span> for ambitious brands.
        </h2>

        <div className="about-awesome-stats">
          {stats.map((s, i) => (
            <div key={i} className="about-awesome-stat">
              <span className="about-awesome-num">{s.num}<em>{s.suffix}</em></span>
              <span className="about-awesome-num-label">{s.label}</span>
            </div>
          ))}
        </div>

        <p className="about-awesome-desc">
          Strategy, design and cutting-edge technology collide here — building products
          that captivate, convert and scale across 12+ countries.
        </p>

        <div className="about-awesome-chips">
          <span className="chip chip-cyan">Strategy</span>
          <span className="chip chip-violet">Design</span>
          <span className="chip chip-pink">AI &amp; Tech</span>
          <span className="chip chip-lime">Growth</span>
        </div>
      </div>
    </div>
  );
}

function LaunchEvolutionStage({ scrollStart, scrollEnd }) {
  const scroll = useScroll();
  const stageRef = useRef();
  const particlesRef = useRef();
  const copyRef = useRef();
  const captionRef = useRef();
  const typedRef = useRef(false);
  const lastParticleFadeRef = useRef(-1);
  const lastCopyFadeRef = useRef(-1);
  const lastTransformRef = useRef('');
  const linksVisibleRef = useRef(false);
  const [linksVisible, setLinksVisible] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  useFrame(() => {
    const offset = scroll.offset;
    const entrance = smoothstep(scrollStart, Math.min(1, scrollStart + 0.08), offset);
    if (stageRef.current) {
      stageRef.current.style.opacity = entrance.toFixed(3);
      // Let wheel gestures reach the ScrollControls element behind the overlay.
      stageRef.current.style.pointerEvents = 'none';
    }
    const progress = THREE.MathUtils.clamp((offset - scrollStart) / Math.max(0.0001, scrollEnd - scrollStart), 0, 1);
    const nextLinksVisible = entrance >= 0.99 && progress >= 0.15;
    if (nextLinksVisible !== linksVisibleRef.current) {
      linksVisibleRef.current = nextLinksVisible;
      setLinksVisible(nextLinksVisible);
    }
    const titleFade = smoothstep(0.08, 0.68, progress);
    const titleSlide = (1 - smoothstep(0.08, 0.68, progress)) * 44;
    const titleShift = (1 - smoothstep(0.12, 0.68, progress)) * 26;
    const particleFade = smoothstep(0.42, 0.82, progress);
    if (particlesRef.current && Math.abs(particleFade - lastParticleFadeRef.current) > 0.002) {
      lastParticleFadeRef.current = particleFade;
      particlesRef.current.style.opacity = particleFade.toFixed(3);
    }
    if (copyRef.current && (Math.abs(titleFade - lastCopyFadeRef.current) > 0.002)) {
      lastCopyFadeRef.current = titleFade;
      copyRef.current.style.opacity = titleFade.toFixed(3);
    }
    if (copyRef.current) {
      const transform = `translate3d(${titleShift.toFixed(2)}px, ${titleSlide.toFixed(2)}px, 0)`;
      if (transform !== lastTransformRef.current) {
        lastTransformRef.current = transform;
        copyRef.current.style.transform = transform;
      }
    }
    if (captionRef.current && !typedRef.current && progress > 0.92) {
      typedRef.current = true;
      captionRef.current.classList.add('typing-active');
    }
  });

  return createPortal(
    <div ref={stageRef} className="launch-stage" style={{ position: 'fixed', inset: 0, zIndex: 5 }}>
      <div ref={particlesRef} className="launch-particles" />
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
          <p ref={captionRef} className="image-caption typing-caption">The future starts here</p>
          {linksVisible && (
            <div className="social-links launch-social-links" style={{ pointerEvents: 'auto' }}>
              <a href="https://www.instagram.com/cosmichameleon.io" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="social-icon">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="mailto:hello@cosmichameleon.com" className="social-link" title="Email" aria-label="Email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="social-icon">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="22,4 12,13 2,4" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/cosmichameleon/" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="social-icon">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <button onPointerDown={(event) => { event.stopPropagation(); setShowWhatsApp(true); }} className="social-link" title="WhatsApp" aria-label="WhatsApp">WA</button>
            </div>
          )}
        </div>
      </div>
      {showWhatsApp && <WhatsAppForm onClose={() => setShowWhatsApp(false)} />}
    </div>,
    document.body
  );
}

function ScrollSection({ children, scrollStart, scrollEnd, persist = false, style = {} }) {
  const ref = useRef();
  const lastOpacityRef = useRef(-1);
  const scroll = useScroll();

  useFrame(() => {
    if (!ref.current) return;
    const offset = scroll.offset;
    let next;
    if (offset >= scrollStart) {
      if (persist) {
        if (offset <= scrollStart) {
          next = 1;
        } else {
          const progress = (offset - scrollStart) / Math.max(0.01, scrollEnd - scrollStart);
          next = Math.min(1, progress / 0.15);
        }
      } else if (offset <= scrollEnd) {
        const progress = (offset - scrollStart) / (scrollEnd - scrollStart);
        let opacity = 1;
        if (progress < 0.15) opacity = progress / 0.15;
        else if (progress > 0.85) opacity = (1 - progress) / 0.15;
        next = Math.max(0, Math.min(1, opacity));
      } else {
        next = 0;
      }
    } else {
      next = 0;
    }
    if (Math.abs(next - lastOpacityRef.current) > 0.002) {
      lastOpacityRef.current = next;
      ref.current.style.opacity = next;
    }
  });

  return (
    <div ref={ref} style={{ ...style, opacity: 0 }}>
      {children}
    </div>
  );
}

function HeroLogoSection({ onServices, onProducts, onDefault, activeView }) {
  const ref = useRef();
  const lastOpacityRef = useRef(-1);
  const scroll = useScroll();

  useFrame(() => {
    if (!ref.current) return;
    const offset = scroll.offset;
    const fade = 1 - THREE.MathUtils.clamp(smoothstep(0.03, 0.16, offset), 0, 1);
    if (Math.abs(fade - lastOpacityRef.current) > 0.002) {
      lastOpacityRef.current = fade;
      ref.current.style.opacity = fade.toFixed(3);
    }
  });

  return (
    <section ref={ref} className="hero-modern" style={{ opacity: 1 }}>
      <div className="hero-eyebrow">AI <span>•</span> SOFTWARE <span>•</span> CLOUD <span>•</span> DATA</div>
      <div className="hero-modern-copy">
        <button className="hero-branding" onClick={onDefault} aria-label="Go to default page">
          <img
            className="hero-brand-logo"
            src="/logoo-2.png"
            alt="CosmiChameleon"
          />
          <span className="hero-brand-name">COSMICHAMELEON</span>
        </button>
        <h1>
          <span className="hero-tech-line">
            <span className="hero-tech-label">Technology that</span>
            <video
              className="hero-chameleon-walk"
              //src="/bluechameleon.mp4"
              autoPlay
              muted
              loop
              playsInline
              onLoadedMetadata={(event) => { event.currentTarget.playbackRate = 0.02; }}
              aria-hidden="true"
            />
          </span>
          <span> evolves</span>
          <br />
          <em>with your business.</em>
        </h1>
        <p>Intelligent digital solutions built for what’s next.</p>
        <div className="hero-actions">
          <button
            className={`hero-cta ${activeView === 'services' ? 'hero-cta-primary' : 'hero-cta-secondary'}`}
            onClick={onServices}
          >
            Explore Services
          </button>
          <button
            className={`hero-cta ${activeView === 'products' ? 'hero-cta-primary' : 'hero-cta-secondary'}`}
            onClick={onProducts}
          >
            Our Products
          </button>
        </div>
      </div>
      <div className="hero-modern-rule" aria-hidden="true" />
    </section>
  );
}

function smoothstep(a, b, x) {
  const u = THREE.MathUtils.clamp((x - a) / Math.max(0.0001, b - a), 0, 1);
  return u * u * (3 - 2 * u);
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
      document.fonts.load('600 42px "Fredoka"'),
      document.fonts.load('400 21px "Inter"'),
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
      document.fonts.load('600 42px "Fredoka"'),
      document.fonts.load('400 21px "Inter"'),
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
  if (!title && !text) {
    const blank = new THREE.CanvasTexture(canvas);
    blank.needsUpdate = true;
    return blank;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

const glow = ctx.createRadialGradient(288, 118, 0, 288, 118, 210);
  glow.addColorStop(0, `rgba(${accent}, ${hover ? 0.2 : 0.11})`);
  glow.addColorStop(0.55, `rgba(${accent}, ${hover ? 0.09 : 0.05})`);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 576, 420);

  ctx.fillStyle = `rgba(${accent}, ${hover ? 0.95 : 0.85})`;
  ctx.fillRect(176, 56, 224, 3);

  const titleLines = splitTitleLines(title);
  let size = boost ? 64 : 52;
  ctx.font = `600 ${size}px "Fredoka"`;
  const titleMaxWidth = boost ? 520 : 490;
  while (titleLines.some((line) => ctx.measureText(line).width > titleMaxWidth) && size > (boost ? 26 : 22)) {
    size -= 1;
    ctx.font = `600 ${size}px "Fredoka"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '1.2px';
  const titleStartY = boost ? 136 : 132;
  const titleGap = boost ? 66 : 50;
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
      document.fonts.load(`600 ${boost ? 64 : 52}px "Fredoka"`),
      document.fonts.load('400 18px "Inter"'),
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
  if (!title && !subtitle) {
    const blank = new THREE.CanvasTexture(canvas);
    blank.needsUpdate = true;
    return blank;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

const glow = ctx.createRadialGradient(320, 118, 0, 320, 118, 240);
  glow.addColorStop(0, `rgba(${accent}, 0.22)`);
  glow.addColorStop(0.55, `rgba(${accent}, 0.09)`);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 640, 420);

  ctx.fillStyle = `rgba(${accent}, 0.95)`;
  ctx.fillRect(205, 56, 230, 3);

  const titleLines = splitTitleLines(title);
  let size = boost ? 76 : 62;
  ctx.font = `600 ${size}px "Fredoka"`;
  const titleMaxWidth = boost ? 560 : 520;
  while (titleLines.some((line) => ctx.measureText(line).width > titleMaxWidth) && size > (boost ? 32 : 26)) {
    size -= 1;
    ctx.font = `600 ${size}px "Fredoka"`;
  }

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '1.5px';
  const titleStartY = boost ? 142 : 134;
  const titleGap = boost ? 72 : 56;
  titleLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 320, titleStartY + i * titleGap));
  ctx.restore();

  let subSize = boost ? 34 : 26;
  ctx.font = `600 ${subSize}px "Inter"`;
  while (ctx.measureText(subtitle.toUpperCase()).width > (boost ? 560 : 520) && subSize > (boost ? 15 : 13)) {
    subSize -= 1;
    ctx.font = `600 ${subSize}px "Inter"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = `rgba(${accent}, 0.98)`;
  ctx.letterSpacing = '4px';
  ctx.fillText(String(subtitle).toUpperCase(), 320, boost ? 264 : 246);
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
      document.fonts.load(`600 ${boost ? 76 : 62}px "Fredoka"`),
      document.fonts.load(`600 ${boost ? 34 : 26}px "Inter"`),
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
    ctx.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = `rgba(${accent}, 0.45)`;
  ctx.lineWidth = 1.5;
  path();
  ctx.stroke();

  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillRect(40, 40, 920, 3);

  ctx.font = '600 18px "Inter"';
  ctx.letterSpacing = '4px';
  ctx.fillStyle = `rgba(${accent}, 0.95)`;
  ctx.fillText(String(category || '').toUpperCase(), 500, 96);

  const maxW = 840;
  let title = item.title || '';
  let ts = 62;
  ctx.font = `600 ${ts}px "Fredoka"`;
  while (ctx.measureText(title).width > maxW && ts > 30) {
    ts -= 2;
    ctx.font = `600 ${ts}px "Fredoka"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '1px';
  ctx.fillText(title, 500, 210);
  ctx.restore();
  ctx.letterSpacing = '0';

  ctx.fillStyle = `rgba(${accent}, 0.95)`;
  ctx.fillRect(390, 275, 220, 4);

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
    ctx.font = '600 16px "Inter"';
    ctx.letterSpacing = '3px';
    ctx.fillStyle = `rgba(${accent}, 0.95)`;
    ctx.fillText(String(sec.tag || sec.label).toUpperCase(), 458, cy + 60);

    ctx.font = '600 44px "Fredoka"';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '0.5px';
    ctx.fillText(sec.label, 458, cy + 122);

    ctx.font = '400 24px "Inter"';
    ctx.letterSpacing = '0.3px';
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    const dl = wrapText(ctx, sec.text || '', 440);
    dl.slice(0, 3).forEach((line, j) => ctx.fillText(line, 458, cy + 176 + j * 34));
    ctx.letterSpacing = '0';
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
    ctx.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
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
  ctx.font = '600 18px "Inter"';
  ctx.letterSpacing = '4px';
  ctx.fillStyle = `rgba(${accent}, 0.95)`;
  ctx.fillText(String(category || '').toUpperCase(), 500, 160);

  let size = 74;
  ctx.font = `600 ${size}px "Fredoka"`;
  const maxW = 840;
  while (ctx.measureText(item.title).width > maxW && size > 26) {
    size -= 2;
    ctx.font = `600 ${size}px "Fredoka"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '1px';
  ctx.fillText(item.title, 500, 340);
  ctx.restore();
  ctx.letterSpacing = '0';

  ctx.fillStyle = `rgba(${accent}, 0.95)`;
  ctx.fillRect(390, 420, 220, 4);

  ctx.font = '400 26px "Inter"';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const lines = wrapText(ctx, item.text || '', 760);
  lines.slice(0, 4).forEach((line, j) => {
    ctx.fillText(line, 500, 560 + j * 44);
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
      document.fonts.load('600 74px "Fredoka"'),
      document.fonts.load('600 18px "Inter"'),
      document.fonts.load('400 26px "Inter"'),
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
    ctx.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = `rgba(${accent}, 0.45)`;
  ctx.lineWidth = 1.5;
  path();
  ctx.stroke();

  ctx.fillStyle = `rgba(${accent}, 0.9)`;
  ctx.fillRect(40, 40, 920, 3);

  ctx.font = '600 18px "Inter"';
  ctx.letterSpacing = '4px';
  ctx.fillStyle = `rgba(${accent}, 0.95)`;
  ctx.fillText(String(subtitle || 'Cosmichameleon').toUpperCase(), 500, 114);

  ctx.font = '600 64px "Fredoka"';
  const maxW = 840;
  let t = title || 'Cosmichameleon';
  let ts = 68;
  ctx.font = `600 ${ts}px "Fredoka"`;
  while (ctx.measureText(t).width > maxW && ts > 28) {
    ts -= 2;
    ctx.font = `600 ${ts}px "Fredoka"`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '1px';
  ctx.fillText(t, 500, 250);
  ctx.restore();
  ctx.letterSpacing = '0';

  ctx.fillStyle = `rgba(${accent}, 0.95)`;
  ctx.fillRect(390, 330, 220, 4);

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
      ctx.font = '600 36px "Fredoka"';
      ctx.letterSpacing = '0.5px';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(it.title || ''), 140, y - 12);
      ctx.font = '400 24px "Inter"';
      ctx.letterSpacing = '0.3px';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const tl = wrapText(ctx, it.text || '', 820).slice(0, 1);
      tl.forEach((ln, j) => ctx.fillText(ln, 140, y + 18 + j * 28));
      ctx.letterSpacing = '0';
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

function OrbitingCard({ title, subtitle, color, items, stairIndex, totalCards, journey, view, kind = 'default', onSelect, onCardClick, selectedIndex, onOptionClick, onSubClick, isMobile, dnaLength = DNA_LENGTH, dnaOffset = DNA_OFFSET }) {
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
  const journeyStartZRef = useRef(null);
  const nearVideoRef = useRef(true);
  const [nearVideo, setNearVideo] = React.useState(true);
  const nearPlayRef = useRef(true);
  const [nearPlay, setNearPlay] = React.useState(true);
  const isServiceTitleBoost = true;

const worldX = view === 'default'
    ? -25 + stairIndex * 10
    : -22 + stairIndex * 10;
  const cardCenterY = isMobile ? 0 : -1;
  const mobileCardStep = 5.5;
  const worldY = isMobile
    ? (view === 'default' ? 25 - stairIndex * mobileCardStep : 22 - stairIndex * mobileCardStep)
    : cardCenterY;
  const orbitRadius = 5.1;
  const entryStart = -0.12 + stairIndex * 0.012;
  const entryDur = 0.07;
  const flyIn = isMobile ? 6 : 10;
  const JOURNEY_CARD_SCALE = isMobile ? 0.8 : 1.1;
  const OPTION_ROW = 3.7;
  const OPTION_COL = 10.5;
  const OPTION_SIZE = [4.0, 2.9];
  const OPTION_CARD_DEPTH = 0.24;
  const SUB_CARD_SIZE = [4.0, 2.9];
  const SUB_CARD_SCALE = 1;
  const SUB_CARD_STEP = 10;
  const SUB_CARD_OFFSET = 14;
  const SUB_CARD_DEPTH = 0.24;
const SUB_ORBIT_RADIUS = 4.6;
  const cardsClickable = true;
  const VIDEO_NEAR_RANGE = 12;
  const VIDEO_PLAY_RANGE = 18;
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
  const mirrorSign = !isMobile && stairIndex >= 2 ? -1 : 1;
const mainVideoActive = !isJourneying && !revealed && nearPlay;
  const subVideosActive = false;
  const optionVideosActive = isJourneyTarget && nearVideo;

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;

    const camDx = isMobile
      ? Math.abs(state.camera.position.y - worldY)
      : Math.abs(state.camera.position.x - worldX);
    const nearNow = camDx < VIDEO_NEAR_RANGE || isJourneying;
    if (nearNow !== nearVideoRef.current) {
      nearVideoRef.current = nearNow;
      setNearVideo(nearNow);
    }
    const playNow = camDx < VIDEO_PLAY_RANGE || isJourneying;
    if (playNow !== nearPlayRef.current) {
      nearPlayRef.current = playNow;
      setNearPlay(playNow);
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
        if (journeyStartZRef.current === null) journeyStartZRef.current = posYZRef.current.z;
        posYZRef.current.z = THREE.MathUtils.lerp(posYZRef.current.z, -4.5, 0.055);
        const journeyDistance = Math.max(0.01, journeyStartZRef.current + 4.5);
        const journeyProgress = THREE.MathUtils.clamp(
          (journeyStartZRef.current - posYZRef.current.z) / journeyDistance,
          0,
          1,
        );
        const farSideReveal = THREE.MathUtils.smoothstep(journeyProgress, 0.72, 0.9);
        meshRef.current.visible = kind === 'default' && farSideReveal > 0.01;
        rotYRef.current = THREE.MathUtils.lerp(rotYRef.current, 0, 0.055);
        groupRef.current.position.set(
          isMobile ? posYZRef.current.y : posXRef.current,
          isMobile ? worldY : cardCenterY + posYZRef.current.y,
          posYZRef.current.z,
        );
        groupRef.current.rotation.set(0, rotYRef.current, 0);
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
        scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, JOURNEY_CARD_SCALE, 0.06);
        groupRef.current.scale.setScalar(Math.max(0.0001, scaleRef.current));
        meshRef.current.material.opacity = THREE.MathUtils.lerp(meshRef.current.material.opacity, farSideReveal, 0.08);

        const optIn = isJourneyTarget
          ? farSideReveal
          : THREE.MathUtils.clamp((state.camera.position.x - 18) / 8, 0, 1);
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

    journeyStartZRef.current = null;
    groupRef.current.visible = true;
    meshRef.current.visible = true;
    // Keep the rear face anchored at the helix orbit point.
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
    const entryT = isMobile
      ? THREE.MathUtils.clamp((offset - entryStart) / entryDur, 0, 1)
      : THREE.MathUtils.clamp((offset - entryStart) / entryDur, 0, 1);
    if (entryT <= 0) {
      groupRef.current.visible = false;
      return;
    }

    const eased = 1 - Math.pow(1 - entryT, 3);

    const camRel = isMobile
      ? state.camera.position.y - worldY
      : state.camera.position.x - worldX;
    const distance = Math.abs(camRel);
    const swingTarget = camRel < 0
      ? THREE.MathUtils.clamp(Math.pow(distance, 0.75) * 0.32, -Math.PI, Math.PI)
      : THREE.MathUtils.clamp(-camRel * 0.28, -Math.PI, Math.PI);
    angleRef.current = THREE.MathUtils.lerp(angleRef.current, swingTarget, 1 - Math.exp(-delta * 8));
    const angle = angleRef.current;

    const orbitY = Math.sin(angle) * orbitRadius;
    const orbitZ = Math.cos(angle) * orbitRadius * 0.9;

    posXRef.current = worldX;
    rotYRef.current = THREE.MathUtils.lerp(rotYRef.current, 0, 0.1);

      posYZRef.current.y = THREE.MathUtils.lerp(posYZRef.current.y, orbitY, 0.1);
      posYZRef.current.z = THREE.MathUtils.lerp(posYZRef.current.z, orbitZ, 0.1);
      groupRef.current.position.x = isMobile
        ? posYZRef.current.y
        : posXRef.current;
      groupRef.current.position.y = isMobile
        ? worldY + (1 - eased) * flyIn
        : cardCenterY + posYZRef.current.y;
      groupRef.current.position.z = posYZRef.current.z;
      groupRef.current.rotation.set(0, rotYRef.current, 0);

      const cardAngle = isMobile ? 0 : -angle;
      meshRef.current.rotation.set(isMobile ? 0 : cardAngle, 0, 0);

      const facing = Math.cos(angle);
      const baseScale = 0.7 + (facing * 0.5 + 0.5) * 0.5;
      const targetScale = baseScale * (hoverRef.current ? 1.1 : 1) * (isMobile ? 0.66 : 1);
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
          if (!isJourneying) {
            if (onCardClick && (view === 'products' || view === 'services' || view === 'default')) onCardClick();
            else toggleRevealed();
          }
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
        <CardVideoPlane src={mainVideoSrc} size={SUB_CARD_SIZE} opacity={0.82} overlay={0.12} z={SUB_CARD_DEPTH / 2 + 0.02} renderOrder={2} active={mainVideoActive} startDelay={(stairIndex % 3) * 450} pull={nearVideo} />
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
                <CardVideoPlane src={optionVideoSrcs[i]} size={OPTION_SIZE} opacity={0.82} overlay={0.12} z={OPTION_CARD_DEPTH / 2 + 0.02} renderOrder={2} active={optionVideosActive} startDelay={i * 300} />
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
              <CardVideoPlane src={subVideoSrcs[i]} size={SUB_CARD_SIZE} opacity={0.82} overlay={0.12} z={SUB_CARD_DEPTH / 2 + 0.02} renderOrder={2} active={subVideosActive} startDelay={i * 300} />
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

const TOTAL_PAGES = 3;
const DNA_LENGTH = 65;
const CAMERA_RANGE = 100;
const DNA_OFFSET = -25;
const DNA_JOURNEY_SHIFT = 20;

const JOURNEY_END_X = 80;
const JOURNEY_CAM_X = 48;
const JOURNEY_CAM_LOOK_Y = 0.7;
const JOURNEY_WALK_SPEED = 26;
const JOURNEY_CAM_ARRIVE = 42;
const JOURNEY_LEFT_START = -60;

function getJourneyTarget(view, stairIndex, isMobile) {
  const worldX = view === 'default'
    ? -25 + stairIndex * 10
    : -22 + stairIndex * 10;
  const worldY = isMobile
    ? (view === 'default' ? 25 - stairIndex * 5.5 : 22 - stairIndex * 5.5)
    : 0;
  return isMobile ? -worldY : -worldX;
}

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

const VIDEO_TEX_MAX_W = 256;
const CARD_VIDEO_ASPECT = 4 / 2.9;
const VIDEO_TEX_PULL_EVERY_FRAMES = 4;

const sharedVideoTextureCache = new Map();
const activeVideoEntries = new Set();
let videoPullRAF = null;
let videoPullAccum = 0;

function drawVideoCover(video, ctx, width, height) {
  if (!video.videoWidth || !video.videoHeight) return;
  const sourceAspect = video.videoWidth / video.videoHeight;
  const targetAspect = width / height;
  let sx = 0;
  let sy = 0;
  let sw = video.videoWidth;
  let sh = video.videoHeight;

  if (sourceAspect > targetAspect) {
    sw = video.videoHeight * targetAspect;
    sx = (video.videoWidth - sw) / 2;
  } else {
    sh = video.videoWidth / targetAspect;
    sy = (video.videoHeight - sh) / 2;
  }

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
}

function pullActiveVideoFrames() {
  videoPullAccum += 1;
  if (videoPullAccum >= VIDEO_TEX_PULL_EVERY_FRAMES) {
    videoPullAccum = 0;
    for (const entry of activeVideoEntries) {
      const v = entry.video;
      if (v && v.readyState >= 2 && !v.paused && entry.pullEnabled !== false) {
        drawVideoCover(v, entry.ctx, entry.canvas.width, entry.canvas.height);
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

function useSharedVideoTexture(src, active = true, startDelay = 0, pullEnabled = true) {
  const [texture, setTexture] = useState(() => sharedVideoTextureCache.get(src)?.texture || null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const playTimerRef = useRef(null);

  useEffect(() => {
    const entry = sharedVideoTextureCache.get(src);
    if (entry) entry.pullEnabled = pullEnabled;
  }, [src, pullEnabled]);

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
      canvas.height = Math.round(VIDEO_TEX_MAX_W / CARD_VIDEO_ASPECT);
      const ctx = canvas.getContext('2d');

      const canvasTexture = new THREE.CanvasTexture(canvas);
      canvasTexture.colorSpace = THREE.SRGBColorSpace;
      canvasTexture.minFilter = THREE.LinearFilter;
      canvasTexture.magFilter = THREE.LinearFilter;
      canvasTexture.generateMipmaps = false;
      entry = { video, canvas, ctx, texture: canvasTexture, activeCount: 0 };
      entry.fitCanvas = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const w = VIDEO_TEX_MAX_W;
          const h = Math.round(w / CARD_VIDEO_ASPECT);
          canvas.width = w;
          canvas.height = h;
          canvasTexture.needsUpdate = true;
        }
      };
      sharedVideoTextureCache.set(src, entry);
    } else if (!entry.video.getAttribute('src')) {
      entry.video.src = encodedSrc;
      entry.video.load();
    }
    entry.activeCount += 1;

    const drawFrame = () => {
      drawVideoCover(entry.video, entry.ctx, entry.canvas.width, entry.canvas.height);
      entry.texture.needsUpdate = true;
    };
    const tryPlay = () => {
      const playResult = entry.video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {});
      }
    };
    const schedulePlay = () => {
      if (startDelay <= 0) { tryPlay(); return; }
      if (playTimerRef.current !== null) return;
      playTimerRef.current = setTimeout(() => {
        playTimerRef.current = null;
        tryPlay();
      }, startDelay);
    };
    const cancelScheduledPlay = () => {
      if (playTimerRef.current !== null) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
const syncActive = () => {
      if (activeRef.current) {
        schedulePlay();
      } else {
        cancelScheduledPlay();
      }
    };
    syncActive();

    entry.video.addEventListener('canplay', syncActive);
    entry.video.addEventListener('loadeddata', () => { entry.fitCanvas(); drawFrame(); syncActive(); });
    entry.video.addEventListener('playing', syncActive);
    entry.video.addEventListener('ended', syncActive);
entry.__onPlaying = () => {
        entry.fitCanvas();
        drawVideoCover(entry.video, entry.ctx, entry.canvas.width, entry.canvas.height);
        entry.texture.needsUpdate = true;
      };
    entry.video.load();

    const resumeOnGesture = () => {
      drawFrame();
      schedulePlay();
    };
    window.addEventListener('pointerdown', resumeOnGesture);
    window.addEventListener('touchstart', resumeOnGesture);

    setTexture(entry.texture);

    return () => {
      entry.activeCount -= 1;
      if (entry.activeCount <= 0) {
        entry.video.pause();
        entry.video.removeAttribute('src');
        entry.video.load();
      }
      if (playTimerRef.current !== null) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
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
    const startPlayback = () => {
      const playResult = entry.video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {});
      }
    };
    if (active) {
      activeVideoEntries.add(entry);
      startVideoPull();
      entry.fitCanvas();
      if (entry.video.readyState >= 2) {
        entry.ctx.drawImage(entry.video, 0, 0, entry.canvas.width, entry.canvas.height);
        entry.texture.needsUpdate = true;
      }
      if (startDelay <= 0) {
        startPlayback();
      } else if (playTimerRef.current === null) {
        playTimerRef.current = setTimeout(() => {
          playTimerRef.current = null;
          if (activeRef.current) startPlayback();
        }, startDelay);
      }
      entry.video.addEventListener('playing', entry.__onPlaying);
    } else {
      if (playTimerRef.current !== null) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      entry.video.pause();
      entry.video.removeEventListener('playing', entry.__onPlaying);
      activeVideoEntries.delete(entry);
      if (activeVideoEntries.size === 0) stopVideoPull();
    }
    return undefined;
  }, [src, active, startDelay]);

  return texture;
}

function CardVideoPlane({ src, size, opacity = 0.32, z = 0.006, renderOrder = 1, overlay = 0, active = true, startDelay = 0, pull = true }) {
  const texture = useSharedVideoTexture(src, active, startDelay, pull);
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
        <mesh position={[0, 0, z + 0.002]} renderOrder={renderOrder + 0.1}>
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
    title: "Our Expertise", subtitle: "", color: "56, 189, 248", stairIndex: 0,
    items: [
      { title: "Website Development", text: "Modern, blazing-fast sites built to convert.", sections: [
        { label: "Static Websites", tag: "STATIC", text: "Fast, brochure-style pages that present your brand with clean, dependable structure.", video: "static.mp4" },
        { label: "Dynamic Websites", tag: "DYNAMIC", text: "Content-driven builds with CMS power, live updates and real user interaction.", video: "dynamic.mp4" },
        { label: "E-commerce Websites", tag: "E-COMMERCE", text: "Complete storefronts with secure checkout, product flows and conversion focus.", video: "ecommerce.mp4" },
      ] },
      { title: "Lead Generation", text: "Targeted pipelines that keep your funnel full.", sections: [
        { label: "Landing Page Systems", tag: "LANDERS", text: "High-converting pages built around single offers and clear calls to action.", video: "landing.mp4" },
        { label: "Capture Automation", tag: "AUTOMATION", text: "Forms, segmentation and follow-up that never let a lead go cold.", video: "capture.mp4" },
        { label: "Qualification Scoring", tag: "LEAD SCORING", text: "Route the hottest prospects to sales the moment they show intent.", video: "scoring.mp4" },
      ] },
      { title: "Digital Marketing / SEO", text: "Search and social strategies engineered to grow reach.", sections: [
        { label: "Technical SEO", tag: "SEO", text: "Site architecture, speed and indexing tuned for sustained rankings.", video: "techseo.mp4" },
        { label: "Content Engine", tag: "CONTENT", text: "A publishing rhythm that compounds authority month after month.", video: "content.mp4" },
        { label: "Social Growth", tag: "SOCIAL", text: "Organic and paid social that builds communities and converts them.", video: "social.mp4" },
      ] },
      { title: "Custom Software Development", text: "Tailored systems built around how your business works.", sections: [
        { label: "Platforms & Portals", tag: "PLATFORMS", text: "Dedicated web and internal platforms designed around your workflows.", video: "platform.mp4" },
        { label: "API & Integration", tag: "INTEGRATION", text: "Connect legacy tools and modern services into one seamless stack.", video: "api.mp4" },
        { label: "Mobile & Desktop", tag: "APPS", text: "Native and cross-platform apps that put your product in users' hands.", video: "apps.mp4" },
      ] },
      { title: "E-commerce Solutions", text: "Storefronts and flows designed to turn visitors into buyers.", sections: [
        { label: "Storefront Build", tag: "STORE", text: "Merchant-optimized stores that load fast and look premium.", video: "store.mp4" },
        { label: "Checkout Optimization", tag: "CONVERSION", text: "Friction-free checkout engineered to lift order value.", video: "checkout.mp4" },
        { label: "Retention & Loyalty", tag: "RETENTION", text: "Subscriptions, reorders and loyalty mechanics that grow LTV.", video: "loyalty.mp4" },
      ] },
      { title: "Gen AI and ML Solutions", text: "Intelligent models that automate, predict, and scale.", sections: [
        { label: "Predictive Analytics", tag: "ML", text: "Forecasts for demand, churn and pricing powered by your data.", video: "predict.mp4" },
        { label: "AI Content Systems", tag: "GEN AI", text: "On-brand content at scale with human review built in.", video: "genai.mp4" },
        { label: "Custom Model Training", tag: "MODELS", text: "Models trained on your business, not off-the-shelf guesses.", video: "models.mp4" },
      ] },
      { title: "Ads Management", text: "Paid campaigns tuned for maximum return on every spend.", sections: [
        { label: "Performance Campaigns", tag: "PPC", text: "Search, social and display buying managed for ROAS.", video: "ppc.mp4" },
        { label: "Creative Testing", tag: "CREATIVE", text: "Systematic tests that find winning ads before the budget burns.", video: "creativetest.mp4" },
        { label: "Growth Loops", tag: "SCALE", text: "Data-feedback loops that scale spend only where it converts.", video: "growth.mp4" },
      ] },
    ],
  },
  {
    title: "Proprietary", subtitle: "Products", color: "255, 68, 136", stairIndex: 1,
    items: [
      {
        title: "Website Security Scanner",
        url: "https://shieldscope.netlify.app/",
        text: "Find security weaknesses before attackers do.",
        overview: "An automated security assessment platform that scans websites and web applications for common security, configuration, and exposure issues and presents findings in an easy-to-understand report.",
        features: ["Website and application discovery", "Security header checks", "SSL/TLS and certificate checks", "Common vulnerability checks", "Configuration and exposure checks", "Risk scoring and prioritized findings", "Actionable remediation guidance", "Exportable security reports"],
        customers: "SMEs, startups, agencies, e-commerce businesses, SaaS companies, and organizations that need recurring website security checks.",
        model: "Subscription plans, one-time security audits, agency or white-label plans, and enterprise assessments.",
      },
      {
        title: "Email Automation Platform",
        url: "https://mailx-mu.vercel.app/",
        text: "Automate business communication from trigger to follow-up.",
        overview: "A workflow automation product that sends personalized emails based on events, customer actions, lead stages, internal processes, and scheduled campaigns.",
        features: ["Automated email sequences", "Lead nurturing", "Personalized templates", "Follow-up scheduling", "CRM integration", "Trigger-based workflows", "Analytics and delivery tracking", "Team approval workflows"],
        customers: "Sales teams, recruiters, agencies, e-commerce companies, SaaS businesses, and service providers.",
        model: "Monthly subscription based on contacts, emails, workflows, or seats; optional setup and integration services.",
      },
      {
        title: "AI Voice Agent - Inbound & Outbound",
        url: "https://voice-agent-lac-ten.vercel.app/login",
        text: "AI voice agents that answer, call, qualify, and take action.",
        overview: "A conversational voice platform for inbound and outbound business calls. Agents understand natural speech, follow business rules, collect information, qualify leads, book appointments, and hand off to humans when required.",
        features: ["Inbound call handling", "Outbound calling campaigns", "Lead qualification", "Appointment scheduling", "FAQ and customer support", "CRM integration", "Call summaries and transcripts", "Human handoff and escalation", "Multiple agent workflows"],
        customers: "Sales teams, customer support departments, clinics, real estate firms, recruiters, service businesses, and call-center operations.",
        model: "Usage-based pricing per minute or call, monthly platform plans, setup fees, and enterprise contracts.",
      },
      {
        title: "BrainShadow",
        url: "https://shadow-brain-4lux.vercel.app/",
        text: "An intelligent digital memory and work companion.",
        overview: "A personal or business AI knowledge system designed to capture information, organize context, retrieve relevant knowledge, and assist users with decisions and everyday work.",
        features: ["Personal knowledge capture", "Semantic search", "AI memory and context", "Document and note ingestion", "Conversation history", "Task and reminder support", "Context-aware recommendations", "Private knowledge spaces", "RAG-powered answers"],
        customers: "Professionals, founders, teams, researchers, students, consultants, and knowledge-heavy businesses.",
        model: "Freemium subscription, individual Pro plans, team plans, and private enterprise deployments.",
      },
      {
        title: "AI Resume Analyzer",
        text: "Turn resumes into actionable hiring intelligence.",
        overview: "An AI recruitment product that analyzes resumes against job requirements, extracts candidate information, identifies relevant skills and experience, and helps recruiters shortlist candidates faster.",
        features: ["Resume parsing", "Job-description matching", "Skill extraction", "Experience analysis", "Candidate scoring", "Shortlisting support", "Missing-skill identification", "Recruiter summaries", "Bulk resume processing"],
        customers: "Recruitment agencies, HR teams, startups, staffing firms, colleges, and companies hiring at scale.",
        model: "Per-resume credits, recruiter subscriptions, team plans, API access, and enterprise hiring solutions.",
      },
      {
        title: "AI Customer Support Chatbot",
        text: "24/7 AI support trained around your business.",
        overview: "An AI customer-support assistant that answers customer questions using approved business knowledge, helps users complete common tasks, and escalates complex conversations to human support.",
        features: ["Website chat widget", "Knowledge-base and RAG integration", "FAQ automation", "Order and account assistance", "Multilingual support", "Human handoff", "Conversation history", "Support analytics", "CRM and helpdesk integration"],
        customers: "E-commerce brands, SaaS companies, service businesses, education companies, marketplaces, and customer-support teams.",
        model: "Monthly subscription by conversations or agents, setup or integration fees, and enterprise plans.",
      },
    ],
  },
{
    title: "Why", subtitle: "Cosmichameleon", color: "170, 90, 255", stairIndex: 2,
    items: [
      { title: "Strategies Built For You", text: "No templates — every plan is custom." },
      { title: "Data Driven Decisions", text: "We let the numbers guide the way." },
      { title: "Creative Innovation", text: "Fresh ideas engineered to stand out." },
      { title: "Reliability", text: "A partner you can count on, always." },
      { title: "Speed To Market", text: "Launch faster than your competitors." },
      { title: "End To End Ownership", text: "Strategy, build, launch and growth under one roof." },
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
      { title: "Performance Creative", text: "Making every impression work harder." },
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

const serviceCatalog = [
  {
    title: 'AI & Intelligent Systems',
    text: 'AI-powered products and automation for modern businesses.',
    overview: 'Design and delivery of intelligent systems that automate work, augment teams, and create new digital capabilities.',
    features: ['AI Agent Development', 'AI Automation', 'Generative AI Solutions', 'RAG & Knowledge Systems', 'AI Chatbots', 'AI Voice Agents', 'AI Copilots', 'Multi-Agent Systems', 'MCP & AI Tool Integration'],
    customers: 'Modern businesses building AI-powered products, workflows, and customer experiences.',
  },
  {
    title: 'Software & Product Development',
    text: 'Build scalable digital products from idea to launch.',
    overview: 'End-to-end product engineering for scalable digital products, from early validation through launch and ongoing growth.',
    features: ['AI SaaS Development', 'Custom Software Development', 'SaaS Product Development', 'Web Application Development', 'E-Commerce Development', 'Mobile App Development', 'MVP Development', 'Startup Product Development', 'API Development', 'API & System Integration', 'Legacy Software Modernization'],
    customers: 'Startups, growing companies, and established teams launching or modernizing digital products.',
  },
  {
    title: 'Design & Digital Experience',
    text: 'Create intuitive, consistent, user-focused digital experiences.',
    overview: 'Experience design that turns complex products into clear, consistent, and enjoyable journeys for users.',
    features: ['UI/UX Design', 'Product Design', 'Design Systems'],
    customers: 'Organizations creating new products or improving the usability and consistency of existing experiences.',
  },
  {
    title: 'Cloud & Engineering',
    text: 'Reliable infrastructure and modern software delivery.',
    overview: 'Cloud architecture and engineering practices that improve reliability, delivery speed, and operational scale.',
    features: ['Cloud Architecture', 'Cloud Migration', 'AI Infrastructure', 'DevOps & CI/CD', 'Docker & Kubernetes', 'MLOps & LLMOps'],
    customers: 'Teams scaling infrastructure, modernizing delivery, or operating AI workloads in production.',
  },
  {
    title: 'Data & AI Analytics',
    text: 'Turn data into intelligent systems and business insights.',
    overview: 'Data foundations and intelligent analytics that make business information useful, searchable, and actionable.',
    features: ['Data Engineering', 'Data Pipelines & ETL', 'Data Warehousing', 'Business Intelligence', 'AI Analytics & Forecasting', 'AI Document Processing', 'Computer Vision', 'Multimodal AI', 'AI Search & Semantic Search', 'AI Content Systems'],
    customers: 'Businesses turning operational data into reporting, predictions, automation, and better decisions.',
  },
  {
    title: 'Security & Technology Consulting',
    text: 'Secure systems and practical technology strategy.',
    overview: 'Security-minded technology guidance that reduces risk and connects technical decisions to business priorities.',
    features: ['AI Cybersecurity', 'Application Security', 'Technology Consulting', 'AI Strategy & Roadmaps', 'Digital Transformation'],
    customers: 'Organizations assessing risk, planning transformation, or aligning technology with business goals.',
  },
  {
    title: 'Growth & Technology Talent',
    text: 'Grow your business and extend your technology team.',
    overview: 'Growth systems and flexible technology talent that help teams acquire customers and extend delivery capacity.',
    features: ['CRM Implementation', 'CRM & Sales Automation', 'B2B Lead Generation', 'Digital Marketing & Growth', 'AI Talent & IT Staffing', 'Dedicated Development Teams'],
    customers: 'Businesses expanding revenue operations, hiring technical capability, or adding dedicated delivery teams.',
  },
];

const defaultCardDetails = [
  {
    title: 'Careers',
    text: 'Build meaningful technology with a curious, ambitious team.',
    overview: 'Join a collaborative team working across AI, software, design, cloud, data, and growth to create digital products with real impact.',
    jobs: [
      { title: 'AI Training Account Provider', description: 'Remote opportunity supporting AI-related training activities.', url: 'https://www.linkedin.com/company/job-jockey-official/posts/?feedView=all' },
      { title: 'Business Development and Bidding Intern', description: 'Remote role focused on discovering project opportunities and acquiring clients.', url: 'https://www.linkedin.com/company/job-jockey-official/posts/?feedView=all' },
      { title: 'AI Agent Developer Intern', description: 'Remote internship building real-world AI agents with modern development workflows.', url: 'https://www.linkedin.com/company/job-jockey-official/posts/?feedView=all' },
      { title: 'AI UI/UX Designer Intern', description: 'Remote internship designing AI-powered products and user experiences.', url: 'https://www.linkedin.com/company/job-jockey-official/posts/?feedView=all' },
      { title: 'Operations Intern', description: 'Remote internship supporting day-to-day operations and coordination.', url: 'https://www.linkedin.com/company/job-jockey-official/posts/?feedView=all' },
      { title: 'Computer Teacher', description: 'Teaching opportunity in Udaipur focused on computer and technology education.', url: 'https://www.linkedin.com/company/job-jockey-official/posts/?feedView=all' },
    ],
    features: ['Collaborative remote culture', 'AI and modern engineering', 'Creative problem solving', 'Learning and mentorship'],
    customers: 'Designers, developers, strategists, growth specialists, and technology enthusiasts.',
    model: 'Project-based and long-term opportunities',
  },
  {
    title: 'Case Study',
    text: 'See how strategy, design, and technology become useful products.',
    overview: 'Explore selected product stories, from the original challenge and solution through the technology choices and outcomes that shaped each build.',
    features: ['Challenge and context', 'Strategy and approach', 'Product design and engineering', 'Results and learnings'],
    customers: 'Teams evaluating a digital partner for their next product, platform, or transformation.',
    model: 'Discovery, delivery, and measurable growth',
  },
  {
    title: 'Why CosmiChameleon',
    text: 'A strategic, creative, and technical partner for meaningful growth.',
    overview: 'We combine strategy, design, engineering, and growth thinking to build work that is useful, memorable, and built for change.',
    features: ['Strategies built for you', 'Data-driven decisions', 'Creative innovation', 'Reliability', 'Speed to market', 'End-to-end ownership'],
    customers: 'Ambitious teams that want one accountable partner across strategy, build, launch, and growth.',
    model: 'Long-term strategic partnership',
  },
  {
    title: 'Marketing',
    text: 'Insights and growth ideas for a fast-changing digital landscape.',
    overview: 'Practical perspectives on AI, advertising, creative performance, and the digital behaviors shaping modern growth.',
    features: ['The rise of AI in ads', 'Viral scaling strategy', 'Short-form video mastery', 'Data-driven storytelling', 'Platform algorithm evolution', 'Performance creative'],
    customers: 'Marketing teams and founders looking for sharper ideas and stronger campaign performance.',
    model: 'Insights, strategy, and growth consulting',
  },
];

function DNAHelix({ journey, mouseYRef, isMobile, length = DNA_LENGTH, offset = DNA_OFFSET }) {
  const ref = useRef();
  const fadeRef = useRef(1);
  const mobileCameraRange = CAMERA_RANGE * 0.68;

  useFrame((state, delta) => {
    if (!ref.current) return;
    const target = isMobile
        ? 0
        : journey
        ? offset
        : offset;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, target, 1 - Math.exp(-delta * 2.2));
    ref.current.rotation.z = isMobile ? Math.PI / 2 : 0;

    let opacity = 1;
    if (journey) {
      opacity = THREE.MathUtils.clamp((state.camera.position.z + 8) / 10, 0, 1);
    }
    const next = THREE.MathUtils.lerp(fadeRef.current, opacity, 1 - Math.exp(-delta * 6));

    // Only touch the whole subgraph when the fade actually moves meaningfully
    if (Math.abs(next - fadeRef.current) > 0.003) {
      fadeRef.current = next;
      ref.current.traverse((o) => {
        if (o.material) {
          if (o.userData.baseOp === undefined) o.userData.baseOp = o.material.opacity;
          o.material.opacity = o.userData.baseOp * fadeRef.current;
        }
      });
    }
  });

  return (
    <group
      ref={ref}
      position={[isMobile ? 0 : offset, isMobile ? (mobileCameraRange - length) / 2 : 0, 0]}
      scale={isMobile ? 0.78 : 1}
    >
      <ActiveDNA key={length} length={length} />
    </group>
  );
}

function scatterValue(index, salt, amount) {
  const random = Math.abs(Math.sin((index + 1) * salt) * 43758.5453) % 1;
  return (random - 0.5) * amount;
}

function GlitchText({ children }) {
  const wordsRef = useRef([]);
  const tokens = String(children).split(/(\s+)/);

  const resetWords = () => {
    wordsRef.current.forEach((word) => {
      if (!word) return;
      word.style.transform = '';
      word.style.opacity = '';
      word.style.filter = '';
    });
  };

  const distortWords = (event) => {
    const radius = 150;
    wordsRef.current.forEach((word) => {
      if (!word) return;
      const rect = word.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      const strength = Math.max(0, 1 - distance / radius);
      const x = Number(word.dataset.scatterX) * strength;
      const y = Number(word.dataset.scatterY) * strength;
      const rotate = Number(word.dataset.scatterR) * strength;
      word.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${1 - strength * 0.12})`;
      word.style.opacity = String(1 - strength * 0.2);
      word.style.filter = `blur(${(strength * 1.4).toFixed(2)}px)`;
    });
  };

  return (
    <span className="glitch-text" onPointerMove={distortWords} onPointerLeave={resetWords}>
      {tokens.map((token, index) => (
        /^\s+$/.test(token) ? token : (
          <span
            key={`${token}-${index}`}
            className="glitch-word"
            ref={(word) => { wordsRef.current[index] = word; }}
            style={{
              '--scatter-x': `${scatterValue(index, 12.9898, 70)}`,
              '--scatter-y': `${scatterValue(index, 78.233, 55)}`,
              '--scatter-r': `${scatterValue(index, 39.417, 45)}`,
            }}
            data-scatter-x={scatterValue(index, 12.9898, 70)}
            data-scatter-y={scatterValue(index, 78.233, 55)}
            data-scatter-r={scatterValue(index, 39.417, 45)}
          >
            {token}
          </span>
        )
      ))}
    </span>
  );
}

function ProductDetailOverlay({ product, service, defaultCard, color, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setIsClosing(false);
  }, [product, service, defaultCard]);

  const detail = product || service || defaultCard;
  if (!detail) return null;

  const requestClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(onClose, 520);
  };

  return createPortal(
    <div className={`product-detail-overlay ${isClosing ? 'is-closing' : ''}`} onPointerDown={requestClose}>
      <article
        className="product-detail-panel"
        style={{ '--product-accent': `rgb(${color})` }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button className="product-detail-close" onClick={requestClose} aria-label="Close product details">&times;</button>
        <div className="product-detail-kicker"><GlitchText>{product ? 'Proprietary product' : service ? 'CosmiChameleon service' : 'CosmiChameleon'}</GlitchText></div>
        <h2><GlitchText>{detail.title}</GlitchText></h2>
        <p className="product-detail-lede"><GlitchText>{detail.text}</GlitchText></p>

        <div className="product-detail-scroll">
          <section>
            <h3><GlitchText>{product ? 'Product Overview' : service ? 'Service Overview' : 'Overview'}</GlitchText></h3>
            <p><GlitchText>{detail.overview}</GlitchText></p>
          </section>
          {detail.projects?.length > 0 && (
            <section>
              <h3>Project Links</h3>
              <div className="portfolio-project-links">
                {detail.projects.map((project) => (
                  <a
                    key={project.title}
                    className="portfolio-project-link"
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>{project.title}</strong>
                    <span>{project.description}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
          {detail.jobs?.length > 0 && (
            <section>
              <h3>Open Positions</h3>
              <div className="career-job-links">
                {detail.jobs.map((job) => (
                  <a
                    key={job.title}
                    className="career-job-link"
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>{job.title}</strong>
                    <span>{job.description}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
          <section>
            <h3>Core Features</h3>
            <ul>
              {detail.features.map((feature) => <li key={feature}><GlitchText>{feature}</GlitchText></li>)}
            </ul>
          </section>
          <section>
            <h3>Target Customers</h3>
            <p><GlitchText>{detail.customers}</GlitchText></p>
          </section>
          {!service && detail.model && <section>
            <h3>Recommended Business Model</h3>
            <p><GlitchText>{detail.model}</GlitchText></p>
          </section>}
          {product?.url && (
            <a
              className="product-explore-link"
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore More
            </a>
          )}
        </div>
      </article>
    </div>,
    document.body
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [journey, setJourney] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedService, setExpandedService] = useState(null);
  const [expandedDefault, setExpandedDefault] = useState(null);
  const [activeView, setActiveView] = useState('default');
  const [showAbout, setShowAbout] = useState(false);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const suppressDocClickRef = useRef(false);
  const scrollElRef = useRef(null);

  const resetScrollToStart = () => {
    if (scrollElRef.current) {
      scrollElRef.current.scrollLeft = 0;
      scrollElRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (!journey) setSelectedOption(null);
  }, [journey]);

  useEffect(() => {
    if (!journey || activeView !== 'default') return undefined;
    const revealTimer = setTimeout(() => {
      setExpandedDefault(defaultCardDetails[journey.card] || null);
    }, 1750);
    return () => clearTimeout(revealTimer);
  }, [journey, activeView]);

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
    { title: 'Careers', subtitle: '', color: '56, 189, 248', kind: 'default', items: defaultCardDetails[0].features, defaultCard: defaultCardDetails[0] },
    { title: 'Case Study', subtitle: '', color: '255, 92, 138', kind: 'default', items: defaultCardDetails[1].features, defaultCard: defaultCardDetails[1] },
    { title: sphereData[2].title, subtitle: sphereData[2].subtitle, color: sphereData[2].color, kind: 'default', items: defaultCardDetails[2].features, defaultCard: defaultCardDetails[2] },
    { title: sphereData[3].title, subtitle: sphereData[3].subtitle, color: sphereData[3].color, kind: 'default', items: defaultCardDetails[3].features, defaultCard: defaultCardDetails[3] },
  ].map((card, i) => ({ ...card, stairIndex: i }));

  const productCardColors = ['0, 229, 255', '255, 92, 138', '124, 92, 255', '255, 184, 77'];
  const productCards = sphereData[1].items.map((item, i) => ({
    title: item.title,
    subtitle: '',
    product: item,
    color: productCardColors[i % productCardColors.length],
    kind: 'product',
    items: [],
    stairIndex: i,
  }));

  const serviceCards = serviceCatalog.map((item, i) => ({
    title: item.title,
    subtitle: sphereData[0].subtitle,
    service: item,
    color: SERVICE_ITEM_COLORS[i % SERVICE_ITEM_COLORS.length],
    kind: 'service',
    items: [],
    stairIndex: i,
  }));

  const sceneCards = activeView === 'services'
    ? serviceCards
    : activeView === 'products'
      ? productCards
      : defaultCards;

  const sceneDnaLength = activeView === 'services'
    ? 90
    : activeView === 'products'
      ? 90
      : (isMobile ? 48 : DNA_LENGTH);
  const sceneDnaOffset = activeView === 'services'
    ? DNA_OFFSET + 20
    : activeView === 'products'
      ? DNA_OFFSET + 20
      : DNA_OFFSET;
  const scenePages = isMobile
    ? (activeView === 'services' ? 4.5 : 4.2)
    : (activeView === 'services' ? 3.5 : TOTAL_PAGES);
  const launchStart = activeView === 'services'
    ? (isMobile ? 0.9 : 0.94)
    : activeView === 'products'
      ? (isMobile ? 0.78 : 0.82)
      : (isMobile ? 0.76 : 0.78);
  const launchTop = activeView === 'services' ? (isMobile ? '300vh' : '0vh') : (isMobile ? '200vh' : '0vh');
  const launchLeft = activeView === 'services' ? (isMobile ? '0' : '300vw') : (isMobile ? '0' : '200vw');

  const totalSceneCards = sceneCards.length;
  const changeView = (nextView) => {
    setSelectedOption(null);
    setExpandedProduct(null);
    setExpandedService(null);
    setExpandedDefault(null);
    setJourney(null);
    resetScrollToStart();
    setActiveView(nextView);
  };
  return (
    <>
    <div className="app-shell">
      <div className="scene-ambient" aria-hidden="true" />
      <div className="scene-vignette" aria-hidden="true" />
      <div className="scene-canvas-wrap">
        <Canvas
          camera={{ position: [-(CAMERA_RANGE / 2), 0, 18], fov: 45 }}
          dpr={[1, 1.1]}
          gl={{ antialias: true, alpha: true }}
          style={{ position: 'relative', zIndex: 1, background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 10]} intensity={0.8} />
          <directionalLight position={[-10, -5, -10]} intensity={0.3} />

<ScrollControls pages={scenePages} horizontal={!isMobile} damping={0.15} enabled={!journey} style={{ zIndex: 3 }}>
            <ScrollElBridge scrollElRef={scrollElRef} />
            <Galaxy length={sceneDnaLength * 1.5} isMobile={isMobile} />
            <DNAHelix journey={journey} mouseYRef={mouseYRef} isMobile={isMobile} length={sceneDnaLength} offset={sceneDnaOffset} />
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
                  isMobile={isMobile}
                  dnaLength={sceneDnaLength}
                  dnaOffset={sceneDnaOffset}
                  onSelect={() => {
                    setExpandedDefault(null);
                    setJourney({ card: i, target: getJourneyTarget(activeView, i, isMobile) });
                  }}
                  onCardClick={card.product
                    ? () => setExpandedProduct(card.product)
                    : card.service
                      ? () => setExpandedService(card.service)
                      : card.defaultCard
                        ? () => {
                            setExpandedDefault(null);
                            setJourney({ card: i, target: getJourneyTarget(activeView, i, isMobile) });
                          }
                        : undefined}
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
            <CameraTracker length={CAMERA_RANGE} journey={journey} mouseXRef={mouseXRef} mouseYRef={mouseYRef} isMobile={isMobile} />

            <Scroll html style={{ width: '100vw', height: '100vh', opacity: journey ? 0 : 1, pointerEvents: journey ? 'none' : 'auto' }}>

              <HeroLogoSection
                onServices={() => changeView('services')}
                onProducts={() => changeView('products')}
                onDefault={() => changeView('default')}
                activeView={activeView}
              />

              {activeView === 'default' && <ScrollSection
                scrollStart={isMobile ? 0.68 : 0.7}
                scrollEnd={0.9}
                style={{
                  position: 'absolute',
                  left: isMobile ? '0' : '140vw',
                  top: isMobile ? '100vh' : '0vh',
                  width: '100vw',
                  height: '100vh',
                  color: 'white',
                }}
              >
                <div className="about-scroll-section">
                  <AboutUsScrollStage isMobile={isMobile} />
                </div>
              </ScrollSection>}

              <ScrollSection
                scrollStart={launchStart}
                scrollEnd={1.0}
                persist
                style={{
                  position: 'absolute',
                  top: launchTop,
                  left: launchLeft,
                  width: '100vw',
                  height: '100vh',
                  textAlign: 'center',
                  color: 'white',
                }}
              >
                <div className="image-section image-section-launch image-section-full">
                  <div className="image-placeholder image-placeholder-3">
                    <LaunchEvolutionStage scrollStart={launchStart} scrollEnd={1.0} />
                  </div>
                </div>
              </ScrollSection>

            </Scroll>
          </ScrollControls>
        </Canvas>
      </div>

      {journey && !expandedDefault && (
        <button
          className="journey-close"
          onClick={() => { setSelectedOption(null); setExpandedDefault(null); setJourney(null); }}
          aria-label="Close journey"
        >
          &times;
        </button>
      )}
    </div>
    <ProductDetailOverlay
      product={expandedProduct}
      service={expandedService}
      defaultCard={expandedDefault}
      color={expandedProduct
        ? productCardColors[sphereData[1].items.indexOf(expandedProduct) % productCardColors.length]
        : expandedService
          ? SERVICE_ITEM_COLORS[serviceCatalog.indexOf(expandedService) % SERVICE_ITEM_COLORS.length]
          : expandedDefault
            ? defaultCards[defaultCardDetails.indexOf(expandedDefault)]?.color || '0, 229, 255'
            : '0, 229, 255'}
      onClose={() => {
        setExpandedProduct(null);
        setExpandedService(null);
        setExpandedDefault(null);
        setJourney(null);
      }}
    />
    {showAbout && <AboutUsOverlay onClose={() => setShowAbout(false)} />}
    </>
  );
}


