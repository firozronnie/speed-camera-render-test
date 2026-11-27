import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();
const geometryCache = new Map<string, THREE.BufferGeometry>();

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
};

const fitText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  weight = '900',
  family = 'Arial Black, Arial, sans-serif',
): number => {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
};

export const makeTexture = (
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture => {
  const existing = textureCache.get(key);
  if (existing) return existing;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
};

export const boxGeo = (w: number, h: number, d: number): THREE.BufferGeometry => {
  const key = `b:${w}:${h}:${d}`;
  let geo = geometryCache.get(key);
  if (!geo) {
    geo = new THREE.BoxGeometry(w, h, d);
    geometryCache.set(key, geo);
  }
  return geo;
};

export const cylGeo = (
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments = 20,
): THREE.BufferGeometry => {
  const key = `c:${radiusTop}:${radiusBottom}:${height}:${segments}`;
  let geo = geometryCache.get(key);
  if (!geo) {
    geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    geometryCache.set(key, geo);
  }
  return geo;
};

export const sphereGeo = (radius: number, segments = 20): THREE.BufferGeometry => {
  const key = `s:${radius}:${segments}`;
  let geo = geometryCache.get(key);
  if (!geo) {
    geo = new THREE.SphereGeometry(radius, segments, segments);
    geometryCache.set(key, geo);
  }
  return geo;
};

export const planeGeo = (w: number, h: number): THREE.BufferGeometry => {
  const key = `p:${w}:${h}`;
  let geo = geometryCache.get(key);
  if (!geo) {
    geo = new THREE.PlaneGeometry(w, h);
    geometryCache.set(key, geo);
  }
  return geo;
};

export const torusGeo = (
  radius: number,
  tube: number,
  radial = 12,
  tubular = 28,
): THREE.BufferGeometry => {
  const key = `t:${radius}:${tube}:${radial}:${tubular}`;
  let geo = geometryCache.get(key);
  if (!geo) {
    geo = new THREE.TorusGeometry(radius, tube, radial, tubular);
    geometryCache.set(key, geo);
  }
  return geo;
};

export const flatMaterial = (texture: THREE.Texture): THREE.MeshBasicMaterial =>
  new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

export const signTexture = (
  text: string,
  bg = '#F7F7F2',
  fg = '#152238',
): THREE.CanvasTexture =>
  makeTexture(`sign:${text}:${bg}:${fg}`, 768, 384, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(6,12,24,0.35)';
    roundRect(ctx, 22, 28, w - 44, h - 34, 26);
    ctx.fill();
    ctx.fillStyle = bg;
    roundRect(ctx, 16, 16, w - 44, h - 44, 26);
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#1B2940';
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#D4A017';
    roundRect(ctx, 38, 38, w - 88, h - 88, 18);
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitText(ctx, text, w - 130, 190);
    ctx.fillText(text, w / 2 - 10, h / 2 - 4);
  });

export const roadTextTexture = (text: string): THREE.CanvasTexture =>
  makeTexture(`road:${text}`, 1024, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = fitText(ctx, text, w - 110, 300);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 26;
    ctx.strokeStyle = '#9AA3A8';
    ctx.strokeText(text, w / 2, h / 2 + 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, w / 2, h / 2 + 10);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(110, h / 2 + size * 0.62, w - 220, 8);
    ctx.globalAlpha = 1;
  });

export const hudTexture = (text: string, color: string): THREE.CanvasTexture =>
  makeTexture(`hud:${text}:${color}`, 1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    fitText(ctx, text, w - 60, 150);
    ctx.lineWidth = 24;
    ctx.strokeStyle = '#0A1020';
    ctx.strokeText(text, w / 2, h / 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.fillText(text, w / 2, h / 2);
    ctx.shadowBlur = 0;
  });

export const displayTexture = (text: string): THREE.CanvasTexture =>
  makeTexture(`display:${text}`, 1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0A1626';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 12;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#8FF3D1';
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur = 22;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitText(ctx, text, w - 70, 112);
    ctx.fillText(text, w / 2, h / 2 + 4);
    ctx.shadowBlur = 0;
  });

export const codeTexture = (text: string): THREE.CanvasTexture =>
  makeTexture(`code:${text}`, 1024, 640, (ctx, w, h) => {
    ctx.fillStyle = '#111A2B';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#22314A';
    ctx.fillRect(0, 0, w, 72);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ['#EF5B5B', '#E8B93B', '#4BC57A'][i];
      ctx.beginPath();
      ctx.arc(44 + i * 42, 36, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8FA3C0';
    ctx.font = 'bold 34px monospace';
    ctx.fillText('camera_rule.js', 190, 48);
    ctx.fillStyle = '#7DE2A9';
    ctx.font = 'bold 42px monospace';
    ctx.fillText('> ' + text.slice(0, 24), 54, 190);
    ctx.fillStyle = '#E8D07A';
    ctx.fillText('  flash(goodDriver)', 54, 270);
    ctx.fillStyle = '#8FA3C0';
    ctx.fillText('  enterLottery(...)', 54, 350);
    ctx.fillStyle = '#7DE2A9';
    ctx.fillText('  payFromFines()', 54, 430);
    ctx.fillStyle = '#E8D07A';
    ctx.fillText('}', 54, 510);
  });

export const banknoteTexture = (): THREE.CanvasTexture =>
  makeTexture('banknote', 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#B9DDA8';
    roundRect(ctx, 4, 4, w - 8, h - 8, 16);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#2E7D51';
    ctx.stroke();
    ctx.strokeStyle = 'rgba(24,92,58,0.65)';
    ctx.lineWidth = 4;
    roundRect(ctx, 24, 24, w - 48, h - 48, 10);
    ctx.stroke();
    ctx.fillStyle = '#1C5C3A';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, 54, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B9DDA8';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', w / 2, h / 2 + 2);
    ctx.fillStyle = '#1C5C3A';
    ctx.font = 'bold 76px Arial Black, Arial';
    ctx.fillText('100', w / 2 - 130, h / 2 + 8);
    ctx.fillText('100', w / 2 + 128, h / 2 + 8);
  });

export const checkTexture = (): THREE.CanvasTexture =>
  makeTexture('check', 1024, 512, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(4,10,20,0.3)';
    roundRect(ctx, 18, 24, w - 30, h - 24, 20);
    ctx.fill();
    ctx.fillStyle = '#FDFDF7';
    roundRect(ctx, 8, 8, w - 34, h - 34, 20);
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#1F6B45';
    ctx.stroke();
    ctx.fillStyle = '#1F6B45';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('THE FUN THEORY  •  STOCKHOLM', 62, 84);
    ctx.font = 'bold 210px Arial Black, Arial';
    fitText(ctx, '$2,000', w - 170, 210);
    ctx.fillText('$2,000', 62, 292);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 38px Arial, sans-serif';
    ctx.fillText('PAID FROM SPEEDER FINES', 68, 408);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(620, 430);
    ctx.lineTo(930, 430);
    ctx.stroke();
  });

export const questionTexture = (): THREE.CanvasTexture =>
  makeTexture('question', 512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = '900 420px Arial Black, Arial';
    ctx.lineWidth = 34;
    ctx.strokeStyle = '#182338';
    ctx.strokeText('?', w / 2, h / 2 + 18);
    ctx.fillStyle = '#FFD400';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 34;
    ctx.fillText('?', w / 2, h / 2 + 18);
    ctx.shadowBlur = 0;
  });

export const tvTexture = (): THREE.CanvasTexture =>
  makeTexture('tv-football', 768, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#2F9E49');
    grad.addColorStop(1, '#1C7437');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.beginPath();
    ctx.moveTo(w / 2, 30);
    ctx.lineTo(w / 2, h - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#F8FAFC';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(110 + i * 70, 165 + (i % 2) * 165, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#183B8A';
      ctx.beginPath();
      ctx.arc(w - 110 - i * 70, 150 + (i % 2) * 180, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(420, 300, 14, 0, Math.PI * 2);
    ctx.fill();
  });

export type HeadEmotion =
  | 'neutral'
  | 'shock'
  | 'worry'
  | 'confusion'
  | 'happy'
  | 'grumpy'
  | 'thinking'
  | 'skeleton';

export const headTexture = (
  emotion: HeadEmotion,
  faceColor = '#F2C29B',
): THREE.CanvasTexture =>
  makeTexture(`head:${emotion}:${faceColor}`, 512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const skeleton = emotion === 'skeleton';
    const skin = skeleton ? '#FFFFFF' : faceColor;

    ctx.fillStyle = skeleton || faceColor === '#F2C29B' ? '#FFFFFF' : faceColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 214, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#182338';
    ctx.stroke();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(cx, cy, 184, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#182338';
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = skeleton ? 0.1 : 0.28;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(cx - 58, cy - 72, 62, 34, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const ink = '#182338';
    if (skeleton) {
      ctx.fillStyle = '#0B1020';
      ctx.beginPath();
      ctx.ellipse(cx - 66, cy - 28, 42, 52, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 66, cy - 28, 42, 52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 12);
      ctx.lineTo(cx - 16, cy + 48);
      ctx.lineTo(cx + 16, cy + 48);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, cx - 78, cy + 78, 156, 62, 12);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 6;
      ctx.stroke();
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 30, cy + 80);
        ctx.lineTo(cx + i * 30, cy + 138);
        ctx.stroke();
      }
      return;
    }

    if (emotion === 'shock') {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 9;
      for (const dx of [-66, 66]) {
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy - 26, 36, 46, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(cx + dx, cy - 20, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
      }
    } else if (emotion === 'grumpy') {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 13;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 96, cy - 40);
      ctx.lineTo(cx - 34, cy - 22);
      ctx.moveTo(cx + 96, cy - 40);
      ctx.lineTo(cx + 34, cy - 22);
      ctx.stroke();
    } else {
      for (const dx of [-64, 64]) {
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(cx + dx, cy - 24, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx + dx - 4, cy - 29, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = ink;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    if (emotion === 'worry') {
      ctx.beginPath();
      ctx.moveTo(cx - 102, cy - 66);
      ctx.lineTo(cx - 28, cy - 86);
      ctx.moveTo(cx + 102, cy - 66);
      ctx.lineTo(cx + 28, cy - 86);
      ctx.stroke();
    } else if (emotion === 'confusion') {
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy - 86);
      ctx.lineTo(cx - 26, cy - 86);
      ctx.stroke();
    }

    if (emotion === 'happy') {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(cx - 76, cy + 60);
      ctx.quadraticCurveTo(cx, cy + 158, cx + 76, cy + 60);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(cx - 56, cy + 70);
      ctx.quadraticCurveTo(cx, cy + 120, cx + 56, cy + 70);
      ctx.closePath();
      ctx.fill();
    } else if (emotion === 'shock') {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 92, 38, 50, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (emotion === 'grumpy') {
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, cx - 68, cy + 68, 136, 48, 10);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 7;
      ctx.stroke();
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 24, cy + 70);
        ctx.lineTo(cx + i * 24, cy + 114);
        ctx.stroke();
      }
    } else {
      // neutral, worry, confusion, thinking: small flat / downturned mouth.
      ctx.strokeStyle = ink;
      ctx.lineWidth = 10;
      ctx.beginPath();
      if (emotion === 'worry') {
        ctx.moveTo(cx - 30, cy + 82);
        ctx.quadraticCurveTo(cx, cy + 58, cx + 30, cy + 82);
      } else {
        ctx.moveTo(cx - 30, cy + 72);
        ctx.lineTo(cx + 30, cy + 72);
      }
      ctx.stroke();
    }
  });

export const bodyTexture = (shirt: string, jacket?: string): THREE.CanvasTexture =>
  makeTexture(`body:${shirt}:${jacket ?? ''}`, 512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10,18,32,0.25)';
    roundRect(ctx, 104, 158, 314, 314, 70);
    ctx.fill();
    ctx.fillStyle = jacket ?? shirt;
    roundRect(ctx, 96, 148, 320, 314, 70);
    ctx.fill();
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#182338';
    ctx.stroke();
    if (jacket) {
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.moveTo(256, 160);
      ctx.lineTo(150, 210);
      ctx.lineTo(256, 330);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(256, 160);
      ctx.lineTo(362, 210);
      ctx.lineTo(256, 330);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#182338';
      ctx.lineWidth = 7;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(140, 250);
      ctx.lineTo(140, 400);
      ctx.stroke();
    }
    ctx.fillStyle = '#F2C29B';
    ctx.beginPath();
    ctx.arc(256, 156, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#182338';
    ctx.stroke();
  });

/** Deterministic grain so every surface has speckle, wear and variation. */
export const asphaltTexture = (): THREE.CanvasTexture => {
  const texture = makeTexture('asphalt-noise', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3A414A';
    ctx.fillRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(255,255,255,0.06)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.08)');
    grad.addColorStop(1, 'rgba(255,255,255,0.04)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 11000; i++) {
      const x = (Math.sin(i * 91.7) * 43758.5453) % 1;
      const y = (Math.sin(i * 47.3) * 24634.6345) % 1;
      const px = (x < 0 ? x + 1 : x) * w;
      const py = (y < 0 ? y + 1 : y) * h;
      const shade = Math.floor(60 + ((i * 37) % 90));
      ctx.fillStyle = `rgba(${shade},${shade + 4},${shade + 8},${0.18 + (i % 7) * 0.045})`;
      ctx.fillRect(px, py, 1 + (i % 3), 1 + (i % 2));
    }
    ctx.strokeStyle = 'rgba(18,22,28,0.35)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo((i * 83) % w, 0);
      ctx.lineTo(120 + ((i * 61) % 300), h);
      ctx.stroke();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 46);
  return texture;
};

export const grassVariationTexture = (): THREE.CanvasTexture => {
  const texture = makeTexture('grass-variation', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#4C8B3C';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      const x = (Math.sin(i * 31.9) * 19341.25) % 1;
      const y = (Math.sin(i * 73.1) * 28461.77) % 1;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(24,74,30,0.30)' : 'rgba(154,206,88,0.24)';
      ctx.fillRect(
        (x < 0 ? x + 1 : x) * w,
        (y < 0 ? y + 1 : y) * h,
        2 + (i % 4),
        2 + (i % 3),
      );
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(34, 34);
  return texture;
};

export const laneMarkTexture = (): THREE.CanvasTexture => {
  const texture = makeTexture('lane-wear', 128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#F1F3F2';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = (Math.sin(i * 19.7) * 13579.11) % 1;
      const y = (Math.sin(i * 57.3) * 24680.13) % 1;
      ctx.fillStyle = i % 2 ? 'rgba(70,76,82,0.55)' : 'rgba(120,126,130,0.35)';
      ctx.fillRect((x < 0 ? x + 1 : x) * w, (y < 0 ? y + 1 : y) * h, 2, 3);
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

export const facadeTexture = (night: boolean): THREE.CanvasTexture =>
  makeTexture(`facade:${night ? 'night' : 'day'}`, 512, 512, (ctx, w, h) => {
    ctx.fillStyle = night ? '#1B2C46' : '#67737F';
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 6; col++) {
        const lit = (row * 7 + col * 3) % 5 < 2;
        const x = 20 + col * 80;
        const y = 20 + row * 60;
        ctx.fillStyle = lit
          ? night
            ? '#FFD98A'
            : '#D8E9F2'
          : night
            ? '#0C182C'
            : '#33404C';
        ctx.fillRect(x, y, 52, 38);
        ctx.strokeStyle = 'rgba(8,14,24,0.55)';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, 52, 38);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(x + 3, y + 3, 46, 5);
      }
    }
  });

export const cloudTexture = (): THREE.CanvasTexture =>
  makeTexture('soft-cloud', 512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) {
      const cx = 60 + i * 36;
      const cy = 128 + Math.sin(i * 1.7) * 26;
      const r = 55 + (i % 4) * 18;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.55)');
      grad.addColorStop(0.55, 'rgba(255,255,255,0.28)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

export const skyGradientTexture = (night: boolean): THREE.CanvasTexture =>
  makeTexture(`sky-gradient:${night ? 'night' : 'day'}`, 64, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (night) {
      grad.addColorStop(0, '#050C22');
      grad.addColorStop(0.42, '#102650');
      grad.addColorStop(0.72, '#274270');
      grad.addColorStop(0.88, '#3A587E');
      grad.addColorStop(1, '#1B2B44');
    } else {
      grad.addColorStop(0, '#1F5FB8');
      grad.addColorStop(0.4, '#4E93D8');
      grad.addColorStop(0.72, '#9CCBEA');
      grad.addColorStop(0.88, '#F5D6A8');
      grad.addColorStop(1, '#D8C39C');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

export const glowTexture = (): THREE.CanvasTexture =>
  makeTexture('soft-glow', 256, 256, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,255,255,0.78)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

const environmentCache = new Map<string, THREE.CubeTexture>();

/** One gradient cube map, generated once, so chrome and clearcoat reflect something. */
export const skyEnvironment = (night: boolean): THREE.CubeTexture => {
  const key = night ? 'night' : 'day';
  const cached = environmentCache.get(key);
  if (cached) return cached;

  const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map((face) =>
    makeTexture(`env:${key}:${face}`, 256, 256, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (face === 'py') {
        grad.addColorStop(0, night ? '#0B1B3A' : '#2C6BC4');
        grad.addColorStop(1, night ? '#25406C' : '#8FC4EA');
      } else if (face === 'ny') {
        grad.addColorStop(0, night ? '#1B2B44' : '#D8C39C');
        grad.addColorStop(1, night ? '#0B1426' : '#5B523C');
      } else {
        grad.addColorStop(0, night ? '#0A1732' : '#3C82CE');
        grad.addColorStop(0.62, night ? '#1E3B68' : '#A9D4EF');
        grad.addColorStop(0.82, night ? '#3A587E' : '#F5D6A8');
        grad.addColorStop(1, night ? '#1B2B44' : '#7B6E52');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      if (face === 'py' || face === 'pz') {
        const sx = face === 'py' ? w * 0.62 : w * 0.74;
        const sy = face === 'py' ? h * 0.4 : h * 0.3;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 74);
        glow.addColorStop(0, night ? '#E8F0FF' : '#FFF6D6');
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }
    }),
  );

  const cube = new THREE.CubeTexture(faces.map((texture) => texture.image as HTMLCanvasElement));
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.mapping = THREE.CubeReflectionMapping;
  cube.needsUpdate = true;
  environmentCache.set(key, cube);
  return cube;
};

export const limbTexture = (part: 'arm' | 'leg', color: string): THREE.CanvasTexture =>
  makeTexture(`limb:${part}:${color}`, 128, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const inset = part === 'arm' ? 30 : 24;
    ctx.fillStyle = color;
    roundRect(ctx, inset, 12, w - inset * 2, h - 30, (w - inset * 2) / 2);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#182338';
    ctx.stroke();
    ctx.fillStyle = part === 'arm' ? '#F2C29B' : '#182338';
    ctx.beginPath();
    ctx.arc(w / 2, h - 34, part === 'arm' ? 28 : 30, 0, Math.PI * 2);
    ctx.fill();
    if (part === 'arm') {
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#182338';
      ctx.stroke();
    }
  });
