import * as THREE from 'three';
import type {SkyKind} from './shots-full';

type Ctx = CanvasRenderingContext2D;

const cache = new Map<string, THREE.CanvasTexture>();

const SANS = '"Arial Black", "DejaVu Sans", Arial, sans-serif';
const MONO = '"DejaVu Sans Mono", "Courier New", monospace';

// Seeded random so every render tab produces the identical world.
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function make(
  key: string,
  w: number,
  h: number,
  draw: (c: Ctx, w: number, h: number) => void,
  repeat?: [number, number],
): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d canvas context unavailable');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

function fit(c: Ctx, text: string, maxW: number, family: string, maxSize: number, weight = 'bold'): number {
  let size = maxSize;
  c.font = `${weight} ${size}px ${family}`;
  while (c.measureText(text).width > maxW && size > 16) {
    size -= 6;
    c.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// ---------------------------------------------------------------- sky (gradient + clouds + stars)

const SKY_STOPS: Record<SkyKind, string[]> = {
  day: ['#1260C8', '#2F8FE6', '#7CC4F4', '#CDEBFF', '#E8F6FF'],
  dusk: ['#1E1F63', '#6B2F85', '#D2527A', '#FF9A63', '#FFD08A'],
  night: ['#03061A', '#0A1244', '#17236B', '#2B3B88', '#4A5AA8'],
  dark: ['#040720', '#08103A', '#0C1A55', '#0C1A55', '#0A1444'],
};
const SKY_BOTTOM: Record<SkyKind, string> = {
  day: '#8FBF8A',
  dusk: '#7A4A5A',
  night: '#0A1030',
  dark: '#040720',
};

export function skyTexture(kind: SkyKind): THREE.CanvasTexture {
  return make('sky:' + kind, 2048, 1024, (c, w, h) => {
    const stops = SKY_STOPS[kind];
    const g = c.createLinearGradient(0, 0, 0, h / 2);
    stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col));
    c.fillStyle = g;
    c.fillRect(0, 0, w, h / 2);
    const g2 = c.createLinearGradient(0, h / 2, 0, h);
    g2.addColorStop(0, stops[stops.length - 1]);
    g2.addColorStop(1, SKY_BOTTOM[kind]);
    c.fillStyle = g2;
    c.fillRect(0, h / 2, w, h / 2);
    const r = rng(kind.length * 97 + 5);
    if (kind === 'night' || kind === 'dark') {
      for (let i = 0; i < 320; i++) {
        c.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.65})`;
        const s = 1 + r() * 2.2;
        c.fillRect(r() * w, r() * h * 0.45, s, s);
      }
    }
    if (kind !== 'dark') {
      const rgb = kind === 'day' ? '255,255,255' : kind === 'dusk' ? '255,206,172' : '110,130,200';
      const a = kind === 'night' ? 0.35 : 0.92;
      for (let i = 0; i < 30; i++) {
        const cx = r() * w;
        const cy = h * (0.1 + r() * 0.32);
        const size = 70 + r() * 140;
        for (let j = 0; j < 9; j++) {
          const px = cx + (r() - 0.5) * size * 1.8;
          const py = cy + (r() - 0.5) * size * 0.3;
          const pr = size * (0.28 + r() * 0.32);
          const rg = c.createRadialGradient(px, py, 0, px, py, pr);
          rg.addColorStop(0, `rgba(${rgb},${a})`);
          rg.addColorStop(0.6, `rgba(${rgb},${a * 0.55})`);
          rg.addColorStop(1, `rgba(${rgb},0)`);
          c.fillStyle = rg;
          c.beginPath();
          c.arc(px, py, pr, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
  });
}

export function glowTexture(): THREE.CanvasTexture {
  return make('glow', 256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
}

// ---------------------------------------------------------------- ground + road

export function groundTexture(): THREE.CanvasTexture {
  return make(
    'ground',
    512,
    512,
    (c, w, h) => {
      c.fillStyle = '#3F9F4A';
      c.fillRect(0, 0, w, h);
      const r = rng(7);
      const cols = ['#2F8A3C', '#58B85F', '#7DCB6A', '#36963F', '#4DAF55'];
      for (let i = 0; i < 5200; i++) {
        c.fillStyle = cols[Math.floor(r() * cols.length)];
        c.fillRect(r() * w, r() * h, 2 + r() * 3, 3 + r() * 5);
      }
    },
    [110, 110],
  );
}

export function asphaltTexture(): THREE.CanvasTexture {
  return make(
    'asphalt',
    512,
    256,
    (c, w, h) => {
      c.fillStyle = '#2D3036';
      c.fillRect(0, 0, w, h);
      const r = rng(13);
      for (let i = 0; i < 3800; i++) {
        const v = 40 + Math.floor(r() * 60);
        c.fillStyle = `rgb(${v},${v},${v + 4})`;
        c.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
      }
    },
    [100, 2],
  );
}

export function woodTexture(): THREE.CanvasTexture {
  return make(
    'wood',
    512,
    512,
    (c, w, h) => {
      c.fillStyle = '#9B6B3F';
      c.fillRect(0, 0, w, h);
      const r = rng(19);
      for (let i = 0; i < 8; i++) {
        c.fillStyle = `rgba(${60 + r() * 50},${35 + r() * 30},15,0.35)`;
        c.fillRect(0, (i * h) / 8, w, h / 8 - 3);
        c.fillStyle = 'rgba(30,15,5,0.7)';
        c.fillRect(0, (i * h) / 8, w, 3);
      }
      for (let i = 0; i < 400; i++) {
        c.fillStyle = 'rgba(40,20,5,0.18)';
        c.fillRect(r() * w, r() * h, 20 + r() * 60, 1);
      }
    },
    [6, 5],
  );
}

export function slowTexture(): THREE.CanvasTexture {
  return make('slow', 1024, 440, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const txt = 'SLOW!';
    const size = fit(c, txt, w * 0.92, SANS, 380);
    c.font = `bold ${size}px ${SANS}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#FFFFFF';
    c.fillText(txt, w / 2, h * 0.52);
    c.lineWidth = 10;
    c.strokeStyle = '#F2C200';
    c.strokeText(txt, w / 2, h * 0.52);
    // worn paint chips
    const r = rng(31);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 260; i++) {
      c.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.6})`;
      c.fillRect(r() * w, r() * h, 2 + r() * 8, 1 + r() * 5);
    }
    c.globalCompositeOperation = 'source-over';
  });
}

// ---------------------------------------------------------------- signs and panels

export function fineSignTexture(value: number): THREE.CanvasTexture {
  return make('fine:' + value, 512, 384, (c, w, h) => {
    c.fillStyle = '#FFFFFF';
    c.fillRect(0, 0, w, h);
    c.lineWidth = 22;
    c.strokeStyle = '#D62828';
    c.strokeRect(11, 11, w - 22, h - 22);
    c.fillStyle = '#111111';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `bold 96px ${SANS}`;
    c.fillText('FINE', w / 2, 100);
    const txt = '$' + value;
    const size = fit(c, txt, w * 0.78, SANS, 200);
    c.font = `bold ${size}px ${SANS}`;
    c.fillStyle = '#D62828';
    c.fillText(txt, w / 2, 250);
  });
}

export function textPanel(
  key: string,
  lines: string[],
  bg: string,
  fg: string,
  w = 1024,
  h = 512,
): THREE.CanvasTexture {
  return make('panel:' + key, w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.lineWidth = 14;
    c.strokeStyle = fg;
    c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = fg;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const step = h / (lines.length + 1);
    lines.forEach((line, i) => {
      const size = fit(c, line, w * 0.84, SANS, lines.length === 1 ? 190 : 150);
      c.font = `bold ${size}px ${SANS}`;
      c.fillText(line, w / 2, step * (i + 1));
    });
  });
}

export function qMarkTexture(): THREE.CanvasTexture {
  return make('qmark', 512, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, h / 2);
    c.rotate(Math.PI / 4);
    c.fillStyle = '#111111';
    c.fillRect(-190, -190, 380, 380);
    c.fillStyle = '#FFD21F';
    c.fillRect(-172, -172, 344, 344);
    c.restore();
    c.fillStyle = '#111111';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `bold 330px ${SANS}`;
    c.fillText('?', w / 2, h / 2 + 14);
  });
}

export function checkTexture(): THREE.CanvasTexture {
  return make('check', 1024, 512, (c, w, h) => {
    c.fillStyle = '#FFF6DC';
    c.fillRect(0, 0, w, h);
    c.lineWidth = 12;
    c.strokeStyle = '#2F7D4A';
    c.strokeRect(14, 14, w - 28, h - 28);
    c.lineWidth = 4;
    c.strokeRect(34, 34, w - 68, h - 68);
    c.fillStyle = '#2F7D4A';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `bold 52px ${SANS}`;
    c.fillText('FINE LOTTERY BANK', w / 2, 88);
    c.font = `bold 38px ${SANS}`;
    c.fillStyle = '#44624F';
    c.fillText('PAY TO THE ORDER OF: CAREFUL DRIVER', w / 2, 160);
    const amt = '$2,000';
    const size = fit(c, amt, w * 0.72, SANS, 250);
    c.font = `bold ${size}px ${SANS}`;
    c.fillStyle = '#14532D';
    c.fillText(amt, w / 2, 304);
    c.font = `italic bold 42px ${SANS}`;
    c.fillStyle = '#44624F';
    c.fillText('PAID BY THE SPEEDERS', w / 2, 438);
  });
}

export function codeTexture(): THREE.CanvasTexture {
  return make('code', 1024, 700, (c, w, h) => {
    c.fillStyle = '#0B1220';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#1E293B';
    c.fillRect(0, 0, w, 70);
    c.fillStyle = '#EF4444';
    c.beginPath();
    c.arc(44, 35, 12, 0, 6.3);
    c.fill();
    c.fillStyle = '#FACC15';
    c.beginPath();
    c.arc(84, 35, 12, 0, 6.3);
    c.fill();
    c.fillStyle = '#22C55E';
    c.beginPath();
    c.arc(124, 35, 12, 0, 6.3);
    c.fill();
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    const lines: Array<[string, string]> = [
      ['if (speed <= limit) {', '#7DD3FC'],
      ['   flash(driver);', '#4ADE80'],
      ['   lottery.enter(driver);', '#4ADE80'],
      ['}', '#7DD3FC'],
      ['jackpot += fines;', '#FDE047'],
    ];
    lines.forEach(([t, col], i) => {
      c.font = `bold 62px ${MONO}`;
      c.fillStyle = col;
      c.fillText(t, 50, 150 + i * 105);
    });
  });
}

// ---------------------------------------------------------------- buildings, TV, jackpot, bill

export function windowsTexture(seed: number, base: string): THREE.CanvasTexture {
  return make('win:' + seed + base, 256, 512, (c, w, h) => {
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 8; col++) {
        const lit = r() < 0.55;
        c.fillStyle = lit ? (r() < 0.5 ? '#FFD98A' : '#FFF2C4') : '#1B2236';
        c.fillRect(col * 32 + 6, row * 32 + 6, 20, 22);
      }
    }
  });
}

export function footballTexture(): THREE.CanvasTexture {
  return make('football', 1024, 576, (c, w, h) => {
    for (let i = 0; i < 12; i++) {
      c.fillStyle = i % 2 ? '#2F8F3B' : '#3AA046';
      c.fillRect((i * w) / 12, 0, w / 12 + 1, h);
    }
    c.strokeStyle = '#FFFFFF';
    c.lineWidth = 6;
    c.strokeRect(40, 70, w - 80, h - 110);
    c.beginPath();
    c.moveTo(w / 2, 70);
    c.lineTo(w / 2, h - 40);
    c.stroke();
    c.beginPath();
    c.arc(w / 2, h / 2 + 15, 70, 0, Math.PI * 2);
    c.stroke();
    c.strokeRect(40, h / 2 - 110, 130, 250);
    c.strokeRect(w - 170, h / 2 - 110, 130, 250);
    const r = rng(41);
    for (let i = 0; i < 22; i++) {
      c.fillStyle = i < 11 ? '#D62839' : '#1E63D6';
      c.beginPath();
      c.arc(90 + r() * (w - 180), 110 + r() * (h - 190), 13, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#FFFFFF';
    c.beginPath();
    c.arc(w / 2 + 40, h / 2 + 10, 9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.78)';
    c.fillRect(w / 2 - 230, 8, 460, 56);
    c.fillStyle = '#FFFFFF';
    c.font = `bold 38px ${MONO}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('HOME 2 - 1 AWAY', w / 2, 37);
  });
}

export function jackpotTexture(): THREE.CanvasTexture {
  return make('jackpot', 768, 1024, (c, w, h) => {
    c.fillStyle = '#7A0C1E';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#D4A017';
    c.fillRect(30, 40, w - 60, 190);
    c.fillStyle = '#3D0610';
    c.fillRect(46, 56, w - 92, 158);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const size = fit(c, 'JACKPOT', w - 150, SANS, 130);
    c.font = `bold ${size}px ${SANS}`;
    c.fillStyle = '#FFD84A';
    c.fillText('JACKPOT', w / 2, 138);
    for (let i = 0; i < 14; i++) {
      c.fillStyle = i % 2 ? '#FFF2A8' : '#FF9A3C';
      c.beginPath();
      c.arc(60 + i * ((w - 120) / 13), 250, 11, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 3; i++) {
      const x = 70 + i * 215;
      c.fillStyle = '#111111';
      c.fillRect(x - 6, 320, 192, 330);
      c.fillStyle = '#FFFFFF';
      c.fillRect(x, 326, 180, 318);
      c.fillStyle = '#D62828';
      c.font = `bold 240px ${SANS}`;
      c.fillText('7', x + 90, 490);
    }
    c.fillStyle = '#D4A017';
    c.fillRect(70, 720, w - 140, 14);
    c.fillStyle = '#FFD84A';
    c.font = `bold 78px ${SANS}`;
    c.fillText('FINES = CASH', w / 2, 830);
    c.fillStyle = '#111111';
    c.fillRect(150, 900, w - 300, 70);
  });
}

export function billTexture(): THREE.CanvasTexture {
  return make('bill', 256, 128, (c, w, h) => {
    c.fillStyle = '#5DB75B';
    c.fillRect(0, 0, w, h);
    c.lineWidth = 8;
    c.strokeStyle = '#2F7D3A';
    c.strokeRect(5, 5, w - 10, h - 10);
    c.fillStyle = '#7ED07B';
    c.beginPath();
    c.ellipse(w / 2, h / 2, 70, 44, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1F5E2A';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `bold 64px ${SANS}`;
    c.fillText('$', w / 2, h / 2 + 4);
  });
}
