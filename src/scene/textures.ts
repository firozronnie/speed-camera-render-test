import * as THREE from 'three';

// Deterministic pseudo-random so every frame renders the same world.
export function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function makeCanvas(w: number, h: number) {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	return c;
}

/** Vertical sky gradient: bright blue top -> pale horizon. */
export function skyGradientTexture(): THREE.CanvasTexture {
	const c = makeCanvas(16, 512);
	const ctx = c.getContext('2d')!;
	const g = ctx.createLinearGradient(0, 0, 0, 512);
	g.addColorStop(0, '#2F7FD0');
	g.addColorStop(0.55, '#6FB3E8');
	g.addColorStop(0.85, '#BFE3F7');
	g.addColorStop(1, '#D8EDFA');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 16, 512);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

/** Grass ground: green gradient + speckle noise. */
export function grassTexture(): THREE.CanvasTexture {
	const c = makeCanvas(256, 256);
	const ctx = c.getContext('2d')!;
	const g = ctx.createLinearGradient(0, 0, 256, 256);
	g.addColorStop(0, '#4CAF50');
	g.addColorStop(1, '#2E7D32');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 256, 256);
	const rnd = mulberry32(7);
	for (let i = 0; i < 2200; i++) {
		const v = rnd();
		ctx.fillStyle =
			v > 0.66 ? 'rgba(124,196,127,0.5)' : v > 0.33 ? 'rgba(27,94,32,0.45)' : 'rgba(76,175,80,0.4)';
		ctx.fillRect(rnd() * 256, rnd() * 256, 2, 2 + rnd() * 3);
	}
	const tex = new THREE.CanvasTexture(c);
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

/** Asphalt: dark grey with fine grain. */
export function asphaltTexture(): THREE.CanvasTexture {
	const c = makeCanvas(256, 256);
	const ctx = c.getContext('2d')!;
	ctx.fillStyle = '#3A3F44';
	ctx.fillRect(0, 0, 256, 256);
	const rnd = mulberry32(21);
	for (let i = 0; i < 2600; i++) {
		const v = rnd();
		ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.16)';
		ctx.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5);
	}
	const tex = new THREE.CanvasTexture(c);
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

export type TextTextureOptions = {
	bg?: string;
	lines: {text: string; size: number; color: string; y: number; bold?: boolean}[];
	w?: number;
	h?: number;
};

/** Generic text-on-board texture (signs, displays, plates). */
export function textTexture(opts: TextTextureOptions): THREE.CanvasTexture {
	const w = opts.w ?? 512;
	const h = opts.h ?? 384;
	const c = makeCanvas(w, h);
	const ctx = c.getContext('2d')!;
	if (opts.bg) {
		ctx.fillStyle = opts.bg;
		ctx.fillRect(0, 0, w, h);
	}
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	for (const line of opts.lines) {
		ctx.font = `${line.bold === false ? '' : '900 '} ${line.size}px Arial, sans-serif`;
		ctx.fillStyle = line.color;
		ctx.fillText(line.text, w / 2, line.y);
	}
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	return tex;
}

/** Giant road paint: white SLOW! letters, slightly worn. */
export function slowPaintTexture(): THREE.CanvasTexture {
	const c = makeCanvas(1024, 512);
	const ctx = c.getContext('2d')!;
	ctx.clearRect(0, 0, 1024, 512);
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '900 210px Arial, sans-serif';
	ctx.fillStyle = 'rgba(255,255,255,0.96)';
	ctx.fillText('SLOW!', 512, 256);
	// worn specks
	const rnd = mulberry32(99);
	ctx.globalCompositeOperation = 'destination-out';
	for (let i = 0; i < 260; i++) {
		ctx.fillStyle = `rgba(0,0,0,${0.25 + rnd() * 0.5})`;
		ctx.fillRect(rnd() * 1024, rnd() * 512, 2 + rnd() * 8, 2 + rnd() * 5);
	}
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}
