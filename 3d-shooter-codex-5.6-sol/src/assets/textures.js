/** Crisp procedural arena textures; no image files or network requests required. */
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

function makeTexture(draw, repeat = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  draw(ctx, canvas.width, canvas.height);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function noise(ctx, size, opacity = 0.08) {
  const image = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = (Math.random() - 0.5) * 46;
    image.data[i] += value;
    image.data[i + 1] += value;
    image.data[i + 2] += value;
    image.data[i + 3] = Math.max(image.data[i + 3], opacity * 255);
  }
  ctx.putImageData(image, 0, 0);
}

export function createConcreteWallTexture() {
  return makeTexture((ctx, w) => {
    const gradient = ctx.createLinearGradient(0, 0, w, w);
    gradient.addColorStop(0, '#35404a');
    gradient.addColorStop(1, '#18222b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = 'rgba(105, 198, 220, .25)';
    ctx.lineWidth = 3;
    for (let y = 0; y <= w; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      const offset = (y / 64) % 2 ? 32 : 0;
      for (let x = offset; x <= w; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke();
      }
    }
    noise(ctx, w);
  }, 2);
}

export function createMetalFloorTexture() {
  return makeTexture((ctx, w) => {
    ctx.fillStyle = '#151c23';
    ctx.fillRect(0, 0, w, w);
    const glow = ctx.createRadialGradient(128, 128, 10, 128, 128, 180);
    glow.addColorStop(0, 'rgba(47, 115, 128, .28)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = '#33434f'; ctx.lineWidth = 3;
    for (let p = 0; p <= w; p += 64) {
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, w); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke();
    }
    ctx.fillStyle = '#70808b';
    for (let x = 5; x < w; x += 64) for (let y = 5; y < w; y += 64) {
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    noise(ctx, w, 0.05);
  }, 8);
}

export function createWoodCrateTexture() {
  return makeTexture((ctx, w) => {
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#5e321e'); gradient.addColorStop(.5, '#a16132'); gradient.addColorStop(1, '#542918');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = '#35190f'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, w - 10, w - 10);
    ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(w - 10, w - 10); ctx.moveTo(w - 10, 10); ctx.lineTo(10, w - 10); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 190, 100, .32)'; ctx.lineWidth = 2;
    for (let y = 40; y < w; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    noise(ctx, w);
  });
}

export function createBarrelTexture() {
  return makeTexture((ctx, w) => {
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#122b38'); gradient.addColorStop(.5, '#29819a'); gradient.addColorStop(1, '#102631');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, w);
    ctx.fillStyle = '#0a141a'; ctx.fillRect(0, 25, w, 20); ctx.fillRect(0, 211, w, 20);
    ctx.fillStyle = '#f39a2d'; ctx.fillRect(0, 112, w, 32);
    noise(ctx, w, .04);
  });
}

export function createDangerSignTexture() {
  return makeTexture((ctx, w) => {
    ctx.fillStyle = '#f0a126'; ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = '#181c20'; ctx.lineWidth = 34;
    for (let x = -w; x < w * 2; x += 72) {
      ctx.beginPath(); ctx.moveTo(x, w); ctx.lineTo(x + w, 0); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, 0, w, 8);
    noise(ctx, w, .04);
  }, 2);
}
