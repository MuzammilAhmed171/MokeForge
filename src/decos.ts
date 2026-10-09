import type { DecoDepth, DecoLayer } from './types';
import { DECO_PRESETS, mulberry32, rgba, shade } from './templates';

/* =========================================================================
   Decoration renderer. Draws DecoLayer instances (from DECO_PRESETS) to a
   canvas. `depth` filters back vs front layers so devices can sit between
   them — real depth ordering. Shared by preview and export.
   ========================================================================= */

export function drawDecos(
  ctx: CanvasRenderingContext2D,
  decos: DecoLayer[],
  w: number,
  h: number,
  accents: { a1: string; a2: string },
  depth: DecoDepth,
): void {
  const min = Math.min(w, h);
  for (const d of decos || []) {
    if (d.depth !== depth) continue;
    const preset = DECO_PRESETS.find(p => p.id === d.preset);
    if (!preset) continue;
    const color = d.hue || (Math.floor(d.seed) % 2 === 0 ? accents.a1 : accents.a2);
    const x = d.x * w, y = d.y * h;
    const r = d.scale * min;
    const rnd = mulberry32(d.seed || 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((d.rotation * Math.PI) / 180);
    ctx.globalAlpha = d.opacity;
    if (d.blur > 0) ctx.filter = `blur(${d.blur}px)`;
    drawPrim(ctx, preset.prim, r, color, rnd);
    ctx.restore();
  }
}

function drawPrim(ctx: CanvasRenderingContext2D, prim: string, r: number, color: string, rnd: () => number) {
  switch (prim) {
    case 'disc': {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'sphere': {
      const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
      g.addColorStop(0, shade(color, 60)); g.addColorStop(1, shade(color, -60));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ring': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.12);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'orbit': {
      ctx.strokeStyle = rgba(color, 0.5); ctx.lineWidth = Math.max(1.5, r * 0.04);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(r, 0, Math.max(3, r * 0.12), 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'square': {
      ctx.fillStyle = color; ctx.fillRect(-r, -r, r * 2, r * 2);
      break;
    }
    case 'triangle': {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.closePath(); ctx.fill();
      break;
    }
    case 'line': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.14); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
      break;
    }
    case 'arc': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.12); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      break;
    }
    case 'plus': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.34); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
      break;
    }
    case 'dotgrid': {
      const step = r * 0.45; ctx.fillStyle = color;
      for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 5; gx++) {
        ctx.beginPath(); ctx.arc(-r + gx * step, -r + gy * step, Math.max(1.4, r * 0.07), 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'sparkle': {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.16, -r * 0.16, r, 0);
      ctx.quadraticCurveTo(r * 0.16, r * 0.16, 0, r);
      ctx.quadraticCurveTo(-r * 0.16, r * 0.16, -r, 0);
      ctx.quadraticCurveTo(-r * 0.16, -r * 0.16, 0, -r);
      ctx.fill();
      break;
    }
    case 'blob': {
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.2);
      g.addColorStop(0, rgba(shade(color, 50), 0.9)); g.addColorStop(1, rgba(color, 0.55));
      ctx.fillStyle = g; ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * Math.PI * 2;
        const rad = r * (0.82 + 0.18 * Math.sin(t * 3 + rnd() * 6));
        const px = Math.cos(t) * rad, py = Math.sin(t) * rad;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'ribbon': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(3, r * 0.16); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.4);
      ctx.bezierCurveTo(-r * 0.3, -r * 0.6, r * 0.3, r * 0.6, r, -r * 0.4);
      ctx.stroke();
      break;
    }
    case 'wave': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.08); ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const px = -r + (i / 40) * r * 2;
        const py = Math.sin((i / 40) * Math.PI * 3) * r * 0.25;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
    }
    case 'cube': {
      const s = r * 0.9;
      ctx.fillStyle = shade(color, 20); ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.fillStyle = shade(color, -30);
      ctx.beginPath(); ctx.moveTo(s / 2, -s / 2); ctx.lineTo(s / 2 + s * 0.3, -s / 2 - s * 0.18); ctx.lineTo(s / 2 + s * 0.3, s / 2 - s * 0.18); ctx.lineTo(s / 2, s / 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(color, -12);
      ctx.beginPath(); ctx.moveTo(-s / 2, -s / 2); ctx.lineTo(-s / 2 + s * 0.3, -s / 2 - s * 0.18); ctx.lineTo(s / 2 + s * 0.3, -s / 2 - s * 0.18); ctx.lineTo(s / 2, -s / 2); ctx.closePath(); ctx.fill();
      break;
    }
    case 'torus': {
      ctx.strokeStyle = shade(color, 25); ctx.lineWidth = r * 0.42;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = shade(color, -35); ctx.lineWidth = r * 0.2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.7, Math.PI * 0.9, Math.PI * 1.9); ctx.stroke();
      break;
    }
    case 'pill': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-r, -r * 0.32); ctx.arc(r * 0.4, -r * 0.32, r * 0.32, Math.PI, 0);
      ctx.lineTo(r * 0.72, r * 0.32); ctx.arc(r * 0.4, r * 0.32, r * 0.32, 0, Math.PI);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'glasscard': {
      const gw = r * 1.9, gh = r * 1.25;
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      const rad = gw * 0.09;
      ctx.moveTo(-gw / 2 + rad, -gh / 2);
      ctx.arcTo(gw / 2, -gh / 2, gw / 2, gh / 2, rad);
      ctx.arcTo(gw / 2, gh / 2, -gw / 2, gh / 2, rad);
      ctx.arcTo(-gw / 2, gh / 2, -gw / 2, -gh / 2, rad);
      ctx.arcTo(-gw / 2, -gh / 2, gw / 2, -gh / 2, rad);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = rgba(color, 0.85); ctx.beginPath(); ctx.arc(-gw / 2 + gw * 0.16, -gh / 2 + gh * 0.28, gh * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-gw / 2 + gw * 0.28, -gh / 2 + gh * 0.24, gw * 0.4, gh * 0.07);
      ctx.fillRect(-gw / 2 + gw * 0.12, gh * 0.05, gw * 0.66, gh * 0.06);
      ctx.fillRect(-gw / 2 + gw * 0.12, gh * 0.2, gw * 0.44, gh * 0.06);
      break;
    }
    case 'uipanel': {
      const gw = r * 1.7, gh = r * 1.3;
      ctx.fillStyle = 'rgba(20,22,27,0.82)';
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
      ctx.fillRect(-gw / 2, -gh / 2, gw, gh); ctx.strokeRect(-gw / 2, -gh / 2, gw, gh);
      ctx.fillStyle = rgba(color, 0.9); ctx.fillRect(-gw / 2 + gw * 0.08, -gh / 2 + gh * 0.12, gw * 0.3, gh * 0.09);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(-gw / 2 + gw * 0.08, -gh / 2 + gh * 0.32, gw * 0.84, gh * 0.06);
      ctx.fillRect(-gw / 2 + gw * 0.08, -gh / 2 + gh * 0.46, gw * 0.6, gh * 0.06);
      const bars = [0.7, 0.45, 0.9, 0.55];
      bars.forEach((bv, i) => {
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.25)' : rgba(color, 0.75);
        ctx.fillRect(-gw / 2 + gw * 0.08 + i * gw * 0.22, gh / 2 - gh * 0.1 - gh * 0.34 * bv, gw * 0.14, gh * 0.34 * bv);
      });
      break;
    }
    case 'notification': {
      const gw = r * 1.8, gh = r * 0.62;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath(); ctx.roundRect(-gw / 2, -gh / 2, gw, gh, gh * 0.3); ctx.fill();
      ctx.fillStyle = rgba(color, 1); ctx.beginPath(); ctx.arc(-gw / 2 + gh * 0.5, 0, gh * 0.24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a3f47';
      ctx.fillRect(-gw / 2 + gh * 0.9, -gh * 0.18, gw * 0.5, gh * 0.12);
      ctx.fillStyle = '#9aa1ad';
      ctx.fillRect(-gw / 2 + gh * 0.9, gh * 0.04, gw * 0.34, gh * 0.1);
      break;
    }
    case 'chart': {
      const gw = r * 1.5, gh = r * 1.1;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
      ctx.fillRect(-gw / 2, -gh / 2, gw, gh); ctx.strokeRect(-gw / 2, -gh / 2, gw, gh);
      const vals = [0.4, 0.7, 0.5, 0.9, 0.62];
      vals.forEach((v, i) => {
        ctx.fillStyle = i === 3 ? rgba(color, 0.95) : rgba(color, 0.4);
        ctx.fillRect(-gw / 2 + gw * 0.12 + i * gw * 0.16, gh / 2 - gh * 0.14 - gh * 0.6 * v, gw * 0.1, gh * 0.6 * v);
      });
      break;
    }
    case 'glassorb': {
      const g = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r);
      g.addColorStop(0, 'rgba(255,255,255,0.7)');
      g.addColorStop(0.3, color);
      g.addColorStop(1, shade(color, -60));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill();
      // specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.28, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'chromering': {
      ctx.strokeStyle = color; ctx.lineWidth = r * 0.26;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = r * 0.07;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'softsphere': {
      const g = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r);
      g.addColorStop(0, 'rgba(255,255,255,0.6)');
      g.addColorStop(1, color);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'roundedcube': {
      ctx.fillStyle = color;
      const s = r * 1.5;
      ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.15); ctx.fill();
      break;
    }
    case 'glasscube': {
      const s = r * 1.5;
      const g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.6)');
      g.addColorStop(1, color);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.1); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
      ctx.stroke();
      // white glare in corner
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.roundRect(-s / 2 + s * 0.1, -s / 2 + s * 0.1, s * 0.35, s * 0.35, s * 0.05); ctx.fill();
      break;
    }
    case 'floatingpill': {
      const pw = r * 1.6, ph = r * 0.8;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fill();
      break;
    }
    case 'metallicdisc': {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.88, r * 0.33, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'torus3d': {
      ctx.strokeStyle = color; ctx.lineWidth = r * 0.35;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = r * 0.08;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.78, Math.PI * 0.8, Math.PI * 1.8); ctx.stroke();
      break;
    }
    case 'glasstorus': {
      const g = ctx.createLinearGradient(-r, -r, r, r);
      g.addColorStop(0, 'rgba(255,255,255,0.8)');
      g.addColorStop(1, color);
      ctx.strokeStyle = g; ctx.lineWidth = r * 0.35;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'pyramid': {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.9, r * 0.9); ctx.lineTo(-r * 0.9, r * 0.9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(color, -25);
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r * 0.9); ctx.lineTo(-r * 0.9, r * 0.9); ctx.closePath(); ctx.fill();
      break;
    }
    case 'isocube': {
      const s = r * 0.9;
      // top facet
      ctx.fillStyle = shade(color, 35);
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.86, -s * 0.5); ctx.lineTo(0, 0); ctx.lineTo(-s * 0.86, -s * 0.5); ctx.closePath(); ctx.fill();
      // left facet
      ctx.fillStyle = shade(color, -10);
      ctx.beginPath(); ctx.moveTo(-s * 0.86, -s * 0.5); ctx.lineTo(0, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.86, s * 0.5); ctx.closePath(); ctx.fill();
      // right facet
      ctx.fillStyle = shade(color, -35);
      ctx.beginPath(); ctx.moveTo(s * 0.86, -s * 0.5); ctx.lineTo(0, 0); ctx.lineTo(0, s); ctx.lineTo(s * 0.86, s * 0.5); ctx.closePath(); ctx.fill();
      break;
    }
    case 'wireframecube': {
      const s = r * 0.8;
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.8, r * 0.05);
      // front
      ctx.strokeRect(-s * 0.7, -s * 0.3, s, s);
      // back
      ctx.strokeRect(-s * 0.3, -s * 0.7, s, s);
      // connect
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, -s * 0.3); ctx.lineTo(-s * 0.3, -s * 0.7);
      ctx.moveTo(-s * 0.7 + s, -s * 0.3); ctx.lineTo(-s * 0.3 + s, -s * 0.7);
      ctx.moveTo(-s * 0.7, -s * 0.3 + s); ctx.lineTo(-s * 0.3, -s * 0.7 + s);
      ctx.moveTo(-s * 0.7 + s, -s * 0.3 + s); ctx.lineTo(-s * 0.3 + s, -s * 0.7 + s);
      ctx.stroke();
      break;
    }
    case 'hexframe': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.16);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * r * 0.9, py = Math.sin(a) * r * 0.9;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      break;
    }
    case 'octframe': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.16);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const px = Math.cos(a) * r * 0.9, py = Math.sin(a) * r * 0.9;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      break;
    }
    case 'diamondframe': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.16);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9); ctx.lineTo(r * 0.9, 0); ctx.lineTo(0, r * 0.9); ctx.lineTo(-r * 0.9, 0);
      ctx.closePath(); ctx.stroke();
      break;
    }
    case 'doublearc': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.12); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = Math.max(1.5, r * 0.08);
      ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.75, Math.PI, 0); ctx.stroke();
      break;
    }
    case 'spiral': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.12); ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 60; i++) {
        const a = (i / 15) * Math.PI * 2;
        const rad = (i / 60) * r * 0.9;
        const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
    }
    case 'orbitlines': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, r * 0.06);
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.45, Math.PI / 3, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.45, (Math.PI / 3) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'halo': {
      ctx.strokeStyle = color; ctx.lineWidth = r * 0.18;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = r * 0.07;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'fluidribbon': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.4);
      ctx.bezierCurveTo(-r * 0.1, -r * 0.9, r * 0.7, -r * 0.4, r * 0.7, r * 0.4);
      ctx.bezierCurveTo(r * 0.1, r * 0.9, -r * 0.7, r * 0.4, -r * 0.7, -r * 0.4);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'liquidblob': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.bezierCurveTo(r * 0.8, -r * 0.7, r * 0.8, r * 0.7, 0, r * 0.9);
      ctx.bezierCurveTo(-r * 0.8, r * 0.7, -r * 0.8, -r * 0.7, 0, -r * 0.9);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'pebble': {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'cutout': {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'halfmoon': {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
      break;
    }
    case 'quartercircle': {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.9); ctx.lineTo(r * 0.9, -r * 0.9); ctx.arc(-r * 0.9, -r * 0.9, r * 1.8, 0, Math.PI / 2); ctx.closePath(); ctx.fill();
      break;
    }
    case 'layeredwave': {
      ctx.fillStyle = color;
      for (let w = 0; w < 3; w++) {
        ctx.save();
        ctx.globalAlpha = 0.4 + w * 0.25;
        ctx.beginPath();
        ctx.moveTo(-r, r * (0.2 + w * 0.25));
        ctx.quadraticCurveTo(-r * 0.3, r * (-0.2 + w * 0.2), 0, r * (0.2 + w * 0.25));
        ctx.quadraticCurveTo(r * 0.4, r * (0.5 + w * 0.2), r, r * (0.2 + w * 0.25));
        ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'fluidline': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.12); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, 0);
      ctx.bezierCurveTo(-r * 0.3, -r * 0.6, r * 0.3, r * 0.6, r * 0.9, 0);
      ctx.stroke();
      break;
    }
    case 'dottedorbit': {
      ctx.fillStyle = color;
      const count = 10;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, Math.max(2, r * 0.08), 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'dotcluster': {
      ctx.fillStyle = color;
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const d = Math.sqrt(i * i + j * j);
          if (d <= 2.2) {
            ctx.beginPath(); ctx.arc(i * r * 0.35, j * r * 0.35, Math.max(1, (2.5 - d) * r * 0.08), 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      break;
    }
    case 'microgrid': {
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
      const step = r * 0.25;
      for (let p = -r; p <= r; p += step) {
        ctx.beginPath(); ctx.moveTo(p, -r); ctx.lineTo(p, r); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r, p); ctx.lineTo(r, p); ctx.stroke();
      }
      break;
    }
    case 'cross': {
      ctx.fillStyle = color;
      const bw = r * 0.45, bl = r * 1.8;
      ctx.beginPath(); ctx.roundRect(-bw / 2, -bl / 2, bw, bl, bw * 0.25); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-bl / 2, -bw / 2, bl, bw, bw * 0.25); ctx.fill();
      break;
    }
    case 'pluscluster': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.08); ctx.lineCap = 'round';
      const drawPlusAt = (px: number, py: number, ps: number) => {
        ctx.beginPath();
        ctx.moveTo(px - ps, py); ctx.lineTo(px + ps, py);
        ctx.moveTo(px, py - ps); ctx.lineTo(px, py + ps);
        ctx.stroke();
      };
      drawPlusAt(-r * 0.4, -r * 0.4, r * 0.25);
      drawPlusAt(r * 0.4, r * 0.4, r * 0.25);
      break;
    }
    case 'slab': {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(-r * 0.9, -r * 0.25, r * 1.8, r * 0.5, r * 0.1); ctx.fill();
      break;
    }
    case 'layeredcards': {
      const cw = r * 1.2, ch = r * 0.8;
      ctx.fillStyle = color;
      ctx.save(); ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.roundRect(-cw / 2 - r * 0.2, -ch / 2 + r * 0.2, cw, ch, r * 0.1); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.roundRect(-cw / 2, -ch / 2, cw, ch, r * 0.1); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.roundRect(-cw / 2 + r * 0.2, -ch / 2 - r * 0.2, cw, ch, r * 0.1); ctx.fill(); ctx.restore();
      break;
    }
    case 'glasspanel': {
      const g = ctx.createLinearGradient(-r * 0.5, -r, r * 0.5, r);
      g.addColorStop(0, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, color);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(-r * 0.5, -r * 0.9, r, r * 1.8, r * 0.1); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      break;
    }
    case 'frostedshape': {
      const g = ctx.createLinearGradient(-r * 0.8, -r * 0.8, r * 0.8, r * 0.8);
      g.addColorStop(0, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, color);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.4); ctx.fill();
      break;
    }
    case 'pillcluster': {
      ctx.fillStyle = color;
      const pw = r * 0.6, ph = r * 0.3;
      ctx.save(); ctx.rotate(-0.35); ctx.beginPath(); ctx.roundRect(-r * 0.6, -r * 0.5, pw, ph, ph / 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.rotate(0.25); ctx.beginPath(); ctx.roundRect(0, 0, pw, ph, ph / 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.rotate(-0.15); ctx.beginPath(); ctx.roundRect(-r * 0.3, r * 0.4, pw, ph, ph / 2); ctx.fill(); ctx.restore();
      break;
    }
    case 'floatingtriangles': {
      ctx.fillStyle = color;
      const drawTri = (tx: number, ty: number, ts: number) => {
        ctx.beginPath(); ctx.moveTo(tx, ty - ts); ctx.lineTo(tx + ts * 0.86, ty + ts * 0.5); ctx.lineTo(tx - ts * 0.86, ty + ts * 0.5); ctx.closePath(); ctx.fill();
      };
      drawTri(-r * 0.4, -r * 0.4, r * 0.35);
      drawTri(r * 0.4, 0, r * 0.4);
      drawTri(-r * 0.2, r * 0.5, r * 0.3);
      break;
    }
    default: {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    }
  }
}
