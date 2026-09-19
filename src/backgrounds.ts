import type { Background, BgStyle, ImageBgState, LightType } from './types';
import { isDark, luminance, mulberry32, rgba, shade } from './templates';
import { findImage } from './imageAssets';

/* =========================================================================
   Rich background renderer.
   Supports THREE modes:
   1. Procedural (vector/pattern based)
   2. Image (high-res raster backgrounds)
   3. Hybrid (image + vector overlay)
   
   One function paints base + style artwork + pattern + lighting to a canvas
   context. It is used by the live preview (canvas layer) AND the export
   renderer, so what you see is exactly what you export.
   ========================================================================= */

export async function renderBackground(
  ctx: CanvasRenderingContext2D,
  b: Background,
  w: number,
  h: number,
  accents: { a1: string; a2: string },
): Promise<void> {
  const kind = b.kind || 'procedural';
  
  if (kind === 'image' || kind === 'hybrid') {
    // Render image background
    const img = b.image;
    if (img && (img.imageId || img.customSrc)) {
      await paintImageBackground(ctx, img, w, h);
    } else {
      // Fallback to procedural if no image
      paintBase(ctx, b, w, h);
    }
    
    if (kind === 'hybrid') {
      // Add vector overlay on top
      const style = b.style || 'plain';
      if (style !== 'plain') {
        ctx.save();
        ctx.globalAlpha = 0.55;
        paintStyle(ctx, style, b, w, h, accents);
        ctx.restore();
      }
      paintPattern(ctx, b, w, h);
    }
    
    // Apply overlays
    if (img) paintImageOverlays(ctx, img, w, h);
    paintLighting(ctx, b, w, h);
    return;
  }
  
  // Procedural mode
  paintBase(ctx, b, w, h);
  const style = b.style || 'plain';
  if (style !== 'plain') paintStyle(ctx, style, b, w, h, accents);
  paintPattern(ctx, b, w, h);
  paintLighting(ctx, b, w, h);
}

/* ---------------- base fill ---------------- */
function paintBase(ctx: CanvasRenderingContext2D, b: Background, w: number, h: number) {
  if (b.type === 'solid') {
    ctx.fillStyle = b.c1; ctx.fillRect(0, 0, w, h);
  } else if (b.type === 'linear') {
    const a = ((b.angle - 90) * Math.PI) / 180;
    const cx = w / 2, cy = h / 2, len = (Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a))) / 2;
    const g = ctx.createLinearGradient(cx - Math.cos(a) * len, cy - Math.sin(a) * len, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    g.addColorStop(0, b.c1); g.addColorStop(1, b.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  } else if (b.type === 'radial') {
    const g = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.72);
    g.addColorStop(0, b.c1); g.addColorStop(1, b.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  } else {
    // mesh
    ctx.fillStyle = b.c1; ctx.fillRect(0, 0, w, h);
    const blob = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(color, 0.7)); g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    };
    const rnd = mulberry32(b.seed || 7);
    const n = Math.max(2, Math.min(6, b.meshPoints || 4));
    for (let i = 0; i < n; i++) {
      const col = i % 2 === 0 ? b.c2 : b.c3;
      blob(rnd() * w, rnd() * h, Math.max(w, h) * (0.3 + rnd() * 0.25), col);
    }
  }
}

/* ---------------- advanced vector patterns ---------------- */
function paintAdvancedPatterns(ctx: CanvasRenderingContext2D, b: Background, w: number, h: number, accents: { a1: string; a2: string }) {
  const rnd = mulberry32((b.seed || 7) * 31337);
  const dark = isDark(b.c1);
  const ink = dark ? '#ffffff' : '#15171c';
  const min = Math.min(w, h);
  
  // Randomly select pattern type - more variety with 20 patterns
  const patternType = Math.floor(rnd() * 20);
  
  ctx.save();
  ctx.globalAlpha = 0.15 + rnd() * 0.2;
  
  switch (patternType) {
    case 0: // Flowing waves
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = i % 2 === 0 ? accents.a1 : accents.a2;
        ctx.lineWidth = 2 + rnd() * 3;
        ctx.beginPath();
        const yOffset = h * (0.2 + i * 0.15);
        for (let x = 0; x <= w; x += 10) {
          const y = yOffset + Math.sin((x / w) * Math.PI * (2 + rnd() * 3) + i) * (30 + rnd() * 40);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
      
    case 1: // Geometric shapes
      for (let i = 0; i < 12; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const size = 30 + rnd() * 80;
        ctx.strokeStyle = i % 2 === 0 ? accents.a1 : accents.a2;
        ctx.lineWidth = 1.5;
        
        if (rnd() > 0.5) {
          // Circle
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Triangle
          ctx.beginPath();
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size, y + size);
          ctx.lineTo(x - size, y + size);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
      
    case 2: // Dots grid
      const spacing = 40 + rnd() * 30;
      for (let x = spacing; x < w; x += spacing) {
        for (let y = spacing; y < h; y += spacing) {
          if (rnd() > 0.7) {
            ctx.fillStyle = rnd() > 0.5 ? accents.a1 : accents.a2;
            ctx.beginPath();
            ctx.arc(x, y, 2 + rnd() * 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;
      
    case 3: // Diagonal lines
      ctx.strokeStyle = accents.a1;
      ctx.lineWidth = 1;
      for (let i = -h; i < w + h; i += 30 + rnd() * 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
      }
      break;
      
    case 4: // Concentric circles
      const centerX = w * (0.3 + rnd() * 0.4);
      const centerY = h * (0.3 + rnd() * 0.4);
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = i % 2 === 0 ? accents.a1 : accents.a2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (i + 1) * (min * 0.08), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
      
    case 5: // Hexagonal pattern
      const hexSize = 40 + rnd() * 30;
      const hexH = hexSize * Math.sqrt(3);
      for (let row = 0; row < h / hexH + 1; row++) {
        for (let col = 0; col < w / (hexSize * 1.5) + 1; col++) {
          const x = col * hexSize * 1.5;
          const y = row * hexH + (col % 2) * hexH / 2;
          if (rnd() > 0.8) {
            ctx.strokeStyle = rnd() > 0.5 ? accents.a1 : accents.a2;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i;
              const px = x + hexSize * Math.cos(angle);
              const py = y + hexSize * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
      break;
      
    case 6: // Organic blobs
      for (let i = 0; i < 6; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const radius = 50 + rnd() * 100;
        ctx.fillStyle = i % 2 === 0 ? rgba(accents.a1, 0.3) : rgba(accents.a2, 0.3);
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const r = radius + Math.sin(angle * 3 + i) * 20;
          const px = x + r * Math.cos(angle);
          const py = y + r * Math.sin(angle);
          if (angle === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
      break;
      
    case 7: // Cross pattern
      const crossSize = 20 + rnd() * 30;
      for (let x = crossSize; x < w; x += crossSize * 2) {
        for (let y = crossSize; y < h; y += crossSize * 2) {
          if (rnd() > 0.85) {
            ctx.strokeStyle = rnd() > 0.5 ? accents.a1 : accents.a2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - crossSize / 2, y);
            ctx.lineTo(x + crossSize / 2, y);
            ctx.moveTo(x, y - crossSize / 2);
            ctx.lineTo(x, y + crossSize / 2);
            ctx.stroke();
          }
        }
      }
      break;
      
    case 8: // Star burst
      const starX = w * (0.3 + rnd() * 0.4);
      const starY = h * (0.3 + rnd() * 0.4);
      const rays = 12 + Math.floor(rnd() * 8);
      for (let i = 0; i < rays; i++) {
        const angle = (Math.PI * 2 / rays) * i;
        const len = min * (0.2 + rnd() * 0.3);
        ctx.strokeStyle = i % 2 === 0 ? rgba(accents.a1, 0.4) : rgba(accents.a2, 0.4);
        ctx.lineWidth = 1 + rnd() * 2;
        ctx.beginPath();
        ctx.moveTo(starX, starY);
        ctx.lineTo(starX + Math.cos(angle) * len, starY + Math.sin(angle) * len);
        ctx.stroke();
      }
      break;
      
    case 9: // Spiral
      const spiralX = w * (0.3 + rnd() * 0.4);
      const spiralY = h * (0.3 + rnd() * 0.4);
      ctx.strokeStyle = accents.a1;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 8; a += 0.1) {
        const r = a * (min * 0.02);
        const px = spiralX + r * Math.cos(a);
        const py = spiralY + r * Math.sin(a);
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
      
    case 10: // Diamond grid
      const diamondSize = 50 + rnd() * 40;
      ctx.strokeStyle = rgba(accents.a1, 0.3);
      ctx.lineWidth = 1;
      for (let x = 0; x < w + diamondSize; x += diamondSize) {
        for (let y = 0; y < h + diamondSize; y += diamondSize) {
          ctx.beginPath();
          ctx.moveTo(x, y - diamondSize / 2);
          ctx.lineTo(x + diamondSize / 2, y);
          ctx.lineTo(x, y + diamondSize / 2);
          ctx.lineTo(x - diamondSize / 2, y);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
      
    case 11: // Flow field
      const flowLines = 20 + Math.floor(rnd() * 15);
      for (let i = 0; i < flowLines; i++) {
        const startX = rnd() * w;
        const startY = rnd() * h;
        ctx.strokeStyle = i % 2 === 0 ? rgba(accents.a1, 0.3) : rgba(accents.a2, 0.3);
        ctx.lineWidth = 1 + rnd() * 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        let x = startX, y = startY;
        for (let step = 0; step < 50; step++) {
          const angle = Math.sin(x * 0.01) * Math.cos(y * 0.01) * Math.PI * 2;
          x += Math.cos(angle) * 5;
          y += Math.sin(angle) * 5;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
      
    case 12: // Isometric grid
      const isoSize = 60 + rnd() * 40;
      ctx.strokeStyle = rgba(accents.a1, 0.25);
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += isoSize) {
        for (let y = 0; y < h; y += isoSize) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + isoSize / 2, y - isoSize / 2);
          ctx.lineTo(x + isoSize, y);
          ctx.lineTo(x + isoSize / 2, y + isoSize / 2);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
      
    case 13: // Particle field
      const particles = 100 + Math.floor(rnd() * 100);
      for (let i = 0; i < particles; i++) {
        const px = rnd() * w;
        const py = rnd() * h;
        const pr = 1 + rnd() * 3;
        ctx.fillStyle = i % 2 === 0 ? rgba(accents.a1, 0.4) : rgba(accents.a2, 0.4);
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
      // Connect nearby particles
      ctx.strokeStyle = rgba(accents.a1, 0.1);
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles; i++) {
        for (let j = i + 1; j < particles; j++) {
          const dist = Math.hypot(rnd() * w - rnd() * w, rnd() * h - rnd() * h);
          if (dist < min * 0.1) {
            ctx.beginPath();
            ctx.moveTo(rnd() * w, rnd() * h);
            ctx.lineTo(rnd() * w, rnd() * h);
            ctx.stroke();
          }
        }
      }
      break;
      
    case 14: // Wave interference
      for (let i = 0; i < 8; i++) {
        const waveX = rnd() * w;
        const waveY = rnd() * h;
        ctx.strokeStyle = i % 2 === 0 ? rgba(accents.a1, 0.2) : rgba(accents.a2, 0.2);
        ctx.lineWidth = 1;
        for (let r = 0; r < min * 0.4; r += 10) {
          ctx.beginPath();
          ctx.arc(waveX, waveY, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
      
    case 15: // Abstract mesh
      const meshPoints: [number, number][] = [];
      for (let i = 0; i < 20; i++) {
        meshPoints.push([rnd() * w, rnd() * h]);
      }
      ctx.strokeStyle = rgba(accents.a1, 0.15);
      ctx.lineWidth = 1;
      for (let i = 0; i < meshPoints.length; i++) {
        for (let j = i + 1; j < meshPoints.length; j++) {
          const dist = Math.hypot(meshPoints[i][0] - meshPoints[j][0], meshPoints[i][1] - meshPoints[j][1]);
          if (dist < min * 0.3) {
            ctx.beginPath();
            ctx.moveTo(meshPoints[i][0], meshPoints[i][1]);
            ctx.lineTo(meshPoints[j][0], meshPoints[j][1]);
            ctx.stroke();
          }
        }
      }
      // Draw points
      for (const [px, py] of meshPoints) {
        ctx.fillStyle = accents.a1;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 16: // Geometric tessellation
      const tileSize = 80 + rnd() * 40;
      for (let x = 0; x < w; x += tileSize) {
        for (let y = 0; y < h; y += tileSize) {
          ctx.strokeStyle = rnd() > 0.5 ? rgba(accents.a1, 0.2) : rgba(accents.a2, 0.2);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + tileSize, y);
          ctx.lineTo(x + tileSize / 2, y + tileSize);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
      
    case 17: // Circular flow
      const flowCenterX = w * (0.3 + rnd() * 0.4);
      const flowCenterY = h * (0.3 + rnd() * 0.4);
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 / 30) * i;
        const radius = min * (0.1 + rnd() * 0.3);
        ctx.strokeStyle = i % 2 === 0 ? rgba(accents.a1, 0.25) : rgba(accents.a2, 0.25);
        ctx.lineWidth = 1 + rnd() * 2;
        ctx.beginPath();
        ctx.arc(flowCenterX, flowCenterY, radius, angle, angle + Math.PI * 0.5);
        ctx.stroke();
      }
      break;
      
    case 18: // Abstract lines
      const lineCount = 15 + Math.floor(rnd() * 10);
      for (let i = 0; i < lineCount; i++) {
        const startX = rnd() * w;
        const startY = rnd() * h;
        const endX = rnd() * w;
        const endY = rnd() * h;
        ctx.strokeStyle = i % 2 === 0 ? rgba(accents.a1, 0.3) : rgba(accents.a2, 0.3);
        ctx.lineWidth = 1 + rnd() * 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(
          startX + rnd() * 100 - 50, startY + rnd() * 100 - 50,
          endX + rnd() * 100 - 50, endY + rnd() * 100 - 50,
          endX, endY
        );
        ctx.stroke();
      }
      break;
      
    case 19: // Gradient orbs
      const orbCount = 5 + Math.floor(rnd() * 5);
      for (let i = 0; i < orbCount; i++) {
        const orbX = rnd() * w;
        const orbY = rnd() * h;
        const orbR = min * (0.1 + rnd() * 0.2);
        const grad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR);
        grad.addColorStop(0, i % 2 === 0 ? rgba(accents.a1, 0.4) : rgba(accents.a2, 0.4));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(orbX - orbR, orbY - orbR, orbR * 2, orbR * 2);
      }
      break;
  }
  
  ctx.restore();
}

/* ---------------- style artwork ---------------- */
function paintStyle(ctx: CanvasRenderingContext2D, style: BgStyle, b: Background, w: number, h: number, accents: { a1: string; a2: string }) {
  const rnd = mulberry32((b.seed || 7) ^ style.length * 7919);
  const dark = isDark(b.c1);
  const ink = dark ? '#ffffff' : '#15171c';
  const min = Math.min(w, h);

  // Add advanced patterns for more variety
  if (style === 'abstract' || style === 'studio') {
    paintAdvancedPatterns(ctx, b, w, h, accents);
  }

  switch (style) {
    case 'studio': {
      // soft floor + horizon + gentle vignette — product-photography feel
      const horizon = h * 0.66;
      const floor = ctx.createLinearGradient(0, horizon, 0, h);
      floor.addColorStop(0, rgba(ink, 0)); floor.addColorStop(1, rgba(ink, dark ? 0.05 : 0.07));
      ctx.fillStyle = floor; ctx.fillRect(0, horizon, w, h - horizon);
      ctx.strokeStyle = rgba(ink, dark ? 0.06 : 0.08); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(w, horizon); ctx.stroke();
      // big soft spotlight behind device
      const g = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.5);
      g.addColorStop(0, rgba(ink, dark ? 0.07 : 0.55)); g.addColorStop(1, rgba(ink, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      vignette(ctx, w, h, dark ? 0.4 : 0.12);
      break;
    }
    case 'architectural': {
      // minimal planes / columns with negative space
      ctx.save();
      const col = rgba(ink, dark ? 0.05 : 0.06);
      ctx.fillStyle = col;
      ctx.fillRect(w * 0.08, 0, w * 0.16, h);            // left plane
      ctx.fillRect(w * 0.78, h * 0.18, w * 0.06, h * 0.82); // column
      // floating platform line
      ctx.fillStyle = rgba(ink, dark ? 0.08 : 0.1);
      ctx.fillRect(0, h * 0.72, w, Math.max(2, h * 0.004));
      // arch
      ctx.strokeStyle = rgba(accents.a1, 0.35); ctx.lineWidth = Math.max(2, min * 0.004);
      ctx.beginPath(); ctx.arc(w * 0.86, h * 0.3, min * 0.16, Math.PI, 0); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'abstract': {
      // soft dimensional spheres + layered ribbons, plenty of negative space
      ctx.save();
      const sphere = (x: number, y: number, r: number, c1: string, c2: string, alpha: number) => {
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
        g.addColorStop(0, rgba(c1, alpha)); g.addColorStop(1, rgba(c2, alpha * 0.85));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      };
      sphere(w * 0.85, h * 0.22, min * 0.16, shade(accents.a1, 40), shade(accents.a1, -60), 0.85);
      sphere(w * 0.1, h * 0.82, min * 0.12, shade(accents.a2, 30), shade(accents.a2, -50), 0.7);
      sphere(w * 0.93, h * 0.85, min * 0.08, dark ? '#3a3f4a' : '#d8dde5', dark ? '#171a20' : '#aab2bf', 0.9);
      // ribbon
      ctx.strokeStyle = rgba(accents.a2, 0.3); ctx.lineWidth = Math.max(3, min * 0.012); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-min * 0.1, h * 0.55);
      ctx.bezierCurveTo(w * 0.3, h * 0.35, w * 0.6, h * 0.75, w * 1.1, h * 0.42);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'grid': {
      // subtle blueprint / modular grid, never overpowering
      ctx.save();
      const col = rgba(ink, dark ? 0.07 : 0.09);
      const step = Math.max(40, min / 14);
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
      // accent cross-marks at a few intersections
      ctx.strokeStyle = rgba(accents.a1, 0.3); ctx.lineWidth = 1.4;
      for (let i = 0; i < 5; i++) {
        const gx = Math.floor(rnd() * (w / step)) * step, gy = Math.floor(rnd() * (h / step)) * step;
        ctx.beginPath(); ctx.moveTo(gx - 6, gy); ctx.lineTo(gx + 6, gy); ctx.moveTo(gx, gy - 6); ctx.lineTo(gx, gy + 6); ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'editorial': {
      // oversized index number + thin rules + generous whitespace
      ctx.save();
      ctx.fillStyle = rgba(ink, dark ? 0.05 : 0.06);
      ctx.font = `700 ${min * 0.55}px "Space Grotesk", sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String((b.seed || 7) % 9 + 1).padStart(2, '0'), -min * 0.05, h * 0.98);
      ctx.strokeStyle = rgba(ink, dark ? 0.14 : 0.18); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(w * 0.07, h * 0.14); ctx.lineTo(w * 0.4, h * 0.14); ctx.stroke();
      ctx.fillStyle = rgba(accents.a1, 0.85);
      ctx.fillRect(w * 0.07, h * 0.14 - 5, Math.max(8, min * 0.02), Math.max(8, min * 0.02));
      ctx.restore();
      break;
    }
    case 'tech': {
      // network nodes + faint circuit geometry (tasteful, no neon)
      ctx.save();
      const col = rgba(ink, dark ? 0.1 : 0.12);
      const n = 14;
      const pts: [number, number][] = [];
      for (let i = 0; i < n; i++) pts.push([rnd() * w, rnd() * h]);
      ctx.strokeStyle = rgba(ink, dark ? 0.05 : 0.07); ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        if (d < min * 0.34) { ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); }
      }
      ctx.stroke();
      for (const [x, y] of pts) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = rgba(accents.a2, 0.5);
      for (let i = 0; i < 3; i++) { const [x, y] = pts[i * 3]; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      break;
    }
    case 'glass': {
      // frosted translucent shapes
      ctx.save();
      const glass = (x: number, y: number, r: number) => {
        ctx.fillStyle = rgba('#ffffff', dark ? 0.05 : 0.35);
        ctx.strokeStyle = rgba('#ffffff', dark ? 0.12 : 0.6); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      };
      glass(w * 0.82, h * 0.24, min * 0.17);
      glass(w * 0.14, h * 0.76, min * 0.12);
      // glass ring
      ctx.strokeStyle = rgba('#ffffff', dark ? 0.1 : 0.4); ctx.lineWidth = Math.max(2, min * 0.014);
      ctx.beginPath(); ctx.arc(w * 0.5, h * 1.05, min * 0.3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.restore();
      break;
    }
    default: break;
  }
}

/* ---------------- pattern overlay ---------------- */
function paintPattern(ctx: CanvasRenderingContext2D, b: Background, w: number, h: number) {
  const { pattern, patternOpacity, c1 } = b;
  if (pattern === 'none' || patternOpacity <= 0) return;
  const col = luminance(c1) > 0.5 ? '#191b21' : '#f2f0ea';
  ctx.save();
  ctx.globalAlpha = patternOpacity;
  if (pattern === 'dots') {
    ctx.fillStyle = col;
    for (let y = 13; y < h; y += 26) for (let x = 13; x < w; x += 26) { ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill(); }
  } else if (pattern === 'grid') {
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x <= w; x += 48) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y <= h; y += 48) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  } else if (pattern === 'diag') {
    ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = -h; i < w; i += 16) { ctx.moveTo(i, h); ctx.lineTo(i + h, 0); }
    ctx.stroke();
  } else if (pattern === 'rings') {
    ctx.strokeStyle = col; ctx.lineWidth = 1.2;
    for (let y = 85; y < h; y += 170) for (let x = 85; x < w; x += 170) {
      ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 66, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (pattern === 'noise') {
    let a = 1234567 >>> 0;
    const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    ctx.fillStyle = col;
    const count = Math.floor((w * h) / 550);
    for (let i = 0; i < count; i++) { ctx.globalAlpha = patternOpacity * rnd() * 0.7; ctx.fillRect(rnd() * w, rnd() * h, 1.1, 1.1); }
  }
  ctx.restore();
}

/* ---------------- image background ---------------- */
const FILTER_PRESET: Record<string, string> = {
  original: '', grayscale: 'grayscale(1)', warm: 'sepia(0.35) saturate(1.25)',
  cool: 'hue-rotate(-18deg) saturate(1.05)', muted: 'saturate(0.5)',
  high: 'contrast(1.3) saturate(1.25)', soft: 'contrast(0.9) brightness(1.06)',
  dark: 'brightness(0.72)', light: 'brightness(1.28)',
};

async function paintImageBackground(ctx: CanvasRenderingContext2D, img: ImageBgState, w: number, h: number) {
  const src = img.customSrc || (img.imageId ? findImage(img.imageId)?.src : null);
  if (!src) return;
  
  // Load image
  const image = await loadImage(src);
  const iw = image.naturalWidth, ih = image.naturalHeight;
  
  ctx.save();
  
  // Mask clip
  if (img.mask === 'rounded') {
    ctx.beginPath();
    ctx.roundRect(w * 0.03, h * 0.04, w * 0.94, h * 0.92, Math.min(w, h) * 0.05);
    ctx.clip();
  } else if (img.mask === 'circle') {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.46, 0, Math.PI * 2);
    ctx.clip();
  }
  
  // Compute destination rect
  let dw = w, dh = h, dx = 0, dy = 0;
  const s = img.scale;
  if (img.fit === 'cover') {
    const sc = Math.max(w / iw, h / ih) * s;
    dw = iw * sc; dh = ih * sc;
    dx = (w - dw) / 2 + img.x * w * 0.3;
    dy = (h - dh) / 2 + img.y * h * 0.3;
  } else if (img.fit === 'contain') {
    const sc = Math.min(w / iw, h / ih) * s;
    dw = iw * sc; dh = ih * sc;
    dx = (w - dw) / 2 + img.x * w * 0.3;
    dy = (h - dh) / 2 + img.y * h * 0.3;
  } else if (img.fit === 'center') {
    dw = iw * s; dh = ih * s;
    dx = (w - dw) / 2 + img.x * w * 0.3;
    dy = (h - dh) / 2 + img.y * h * 0.3;
  } else {
    // fill / stretch
    dw = w * s; dh = h * s;
    dx = (w - dw) / 2 + img.x * w * 0.3;
    dy = (h - dh) / 2 + img.y * h * 0.3;
  }
  
  // Filters
  const preset = FILTER_PRESET[img.colorFilter] || '';
  const flt = [
    `brightness(${img.brightness})`,
    `contrast(${img.contrast})`,
    `saturate(${img.saturation})`,
    img.blur > 0 ? `blur(${img.blur}px)` : '',
    img.hue !== 0 ? `hue-rotate(${img.hue}deg)` : '',
    preset,
  ].filter(Boolean).join(' ');
  if (flt) ctx.filter = flt;
  
  ctx.globalAlpha = img.opacity;
  ctx.globalCompositeOperation = img.blend || 'source-over';
  
  if (img.rotation !== 0) {
    ctx.translate(w / 2, h / 2);
    ctx.rotate((img.rotation * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);
  }
  
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();
}

function paintImageOverlays(ctx: CanvasRenderingContext2D, img: ImageBgState, w: number, h: number) {
  // Tint
  if (img.tint && img.tintOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = img.tintOpacity;
    ctx.fillStyle = img.tint;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  
  // Overlay
  if (img.overlay !== 'none' && img.overlayOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = img.overlayOpacity;
    
    if (img.overlay === 'color' || img.overlay === 'black' || img.overlay === 'white') {
      ctx.fillStyle = img.overlayColor;
      ctx.fillRect(0, 0, w, h);
    } else if (img.overlay === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, img.overlayColor + '00');
      g.addColorStop(1, img.overlayColor);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    } else if (img.overlay === 'vignette') {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, img.overlayColor);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    
    ctx.restore();
  }
}

/* ---------------- image loader ---------------- */
const imgCache = new Map<string, HTMLImageElement>();
function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = imgCache.get(src);
  if (hit && hit.complete && hit.naturalWidth) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/.test(src)) img.crossOrigin = 'anonymous';
    const t = setTimeout(() => reject(new Error('image load timeout')), 12000);
    img.onload = () => { clearTimeout(t); imgCache.set(src, img); resolve(img); };
    img.onerror = () => { clearTimeout(t); reject(new Error('image load failed')); };
    img.src = src;
  });
}

/* ---------------- lighting ---------------- */
function paintLighting(ctx: CanvasRenderingContext2D, b: Background, w: number, h: number) {
  const lt = b.light?.type || 'none';
  if (lt === 'none') return;
  const inten = b.light?.intensity ?? 0.5;
  const dark = isDark(b.c1);
  const hi = dark ? '#ffffff' : '#ffffff';
  ctx.save();
  const radial = (x: number, y: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(hi, a)); g.addColorStop(1, rgba(hi, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  };
  const linear = (x0: number, y0: number, x1: number, y1: number, a: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, rgba(hi, a)); g.addColorStop(1, rgba(hi, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  };
  if (lt === 'top') linear(0, 0, 0, h * 0.6, 0.16 * inten);
  else if (lt === 'bottom') linear(0, h, 0, h * 0.4, 0.14 * inten);
  else if (lt === 'left') linear(0, 0, w * 0.55, 0, 0.13 * inten);
  else if (lt === 'right') linear(w, 0, w * 0.45, 0, 0.13 * inten);
  else if (lt === 'center') radial(w / 2, h * 0.42, Math.max(w, h) * 0.5, 0.2 * inten);
  else if (lt === 'ambient') {
    radial(w * 0.2, h * 0.15, Math.max(w, h) * 0.45, 0.08 * inten);
    radial(w * 0.85, h * 0.85, Math.max(w, h) * 0.45, 0.06 * inten);
  }
  ctx.restore();
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, a: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

/* ---------------- swatch thumbnail (for pickers) ---------------- */
export async function bgThumb(b: Background, accents: { a1: string; a2: string }, size = 132): Promise<string> {
  const c = document.createElement('canvas');
  const ratio = 0.66;
  c.width = size; c.height = Math.round(size * ratio);
  const ctx = c.getContext('2d')!;
  await renderBackground(ctx, b, c.width, c.height, accents);
  return c.toDataURL('image/jpeg', 0.82);
}

/* ---------------- lighting label helper ---------------- */
export const lightLabel = (t: LightType) =>
  t === 'none' ? 'None' : t === 'top' ? 'Top' : t === 'bottom' ? 'Riser' : t === 'left' ? 'Left' : t === 'right' ? 'Right' : t === 'center' ? 'Center' : 'Ambient';
