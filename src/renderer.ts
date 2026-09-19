import type { Asset, DeviceLayer, Project } from './types';
import {
  clamp, computeFit, DEVICE_META, deviceGeometry, luminance, SHADOWS, textOn,
} from './templates';
import { renderBackground } from './backgrounds';
import { drawDecos } from './decos';

/* ---------------- image cache ---------------- */
const imgCache = new Map<string, HTMLImageElement>();
function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = imgCache.get(src);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { imgCache.set(src, img); resolve(img); };
    img.onerror = () => reject(new Error('img load failed'));
    img.src = src;
  });
}

let fontsReady: Promise<unknown> | null = null;
function ensureFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load('700 48px "Space Grotesk"'),
      document.fonts.load('400 20px "JetBrains Mono"'),
      document.fonts.load('500 14px "JetBrains Mono"'),
      document.fonts.load('500 16px "IBM Plex Sans"'),
    ]).catch(() => undefined);
  }
  return fontsReady;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function shadeLocal(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => clamp(Math.round(v + amt), 0, 255);
  const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const aspectOf = (d: DeviceLayer) => DEVICE_META[d.kind].aspect;
const materialGlare = (m: string) => (m === 'glossy' ? 1.8 : m === 'glass' ? 1.4 : m === 'metallic' ? 1.1 : 1);

/* ---------------- placeholder screen ---------------- */
function drawPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#14161b';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -h; i < w; i += 14) { ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  const fs = clamp(w * 0.045, 10, 22);
  ctx.font = `500 ${fs}px "JetBrains Mono"`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('+ add screenshot', x + w / 2, y + h / 2);
  ctx.restore();
}

/* ---------------- device drawing ---------------- */
async function drawDevice(ctx: CanvasRenderingContext2D, d: DeviceLayer, asset: Asset | undefined, accent: string) {
  const h = d.w / aspectOf(d);
  const g = deviceGeometry(d.kind, d.w, h, d.radiusMul ?? 1);
  const sh = SHADOWS.find(s => s.id === d.shadow) ?? SHADOWS[1];

  ctx.save();
  ctx.globalAlpha = d.opacity ?? 1;
  ctx.translate(d.x + d.w / 2, d.y + h / 2);
  ctx.rotate((d.tilt * Math.PI) / 180);
  ctx.translate(-d.w / 2, -h / 2);

  const body = d.color;
  const applyShadow = () => {
    if (sh.alpha > 0) {
      ctx.shadowColor = sh.id === 'glow' ? accent + 'aa' : `rgba(0,0,0,${sh.alpha})`;
      ctx.shadowBlur = sh.blur; ctx.shadowOffsetX = sh.dx; ctx.shadowOffsetY = sh.dy;
    }
  };
  const clearShadow = () => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; };

  if (d.kind === 'laptop') {
    const baseH = h * 0.062, lidH = h - baseH;
    applyShadow();
    ctx.fillStyle = body; rr(ctx, 0, 0, d.w, lidH, d.w * 0.02); ctx.fill();
    clearShadow();
    ctx.fillStyle = '#0b0c0f'; rr(ctx, g.x, g.y, g.w, g.h, g.r); ctx.fill();
    await drawScreen(ctx, g, d, asset);
    ctx.fillStyle = shadeLocal(body, -38);
    ctx.beginPath(); ctx.arc(d.w / 2, g.y / 2, Math.max(1.6, d.w * 0.004), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shadeLocal(body, 26);
    rr(ctx, -d.w * 0.045, lidH, d.w * 1.09, baseH * 0.55, baseH * 0.3); ctx.fill();
    ctx.fillStyle = shadeLocal(body, -12);
    rr(ctx, -d.w * 0.045, lidH + baseH * 0.5, d.w * 1.09, baseH * 0.5, baseH * 0.3); ctx.fill();
    ctx.fillStyle = shadeLocal(body, -30);
    rr(ctx, d.w / 2 - d.w * 0.07, lidH, d.w * 0.14, baseH * 0.32, baseH * 0.16); ctx.fill();
    glare(ctx, g, d);
  } else if (d.kind === 'phone') {
    applyShadow();
    ctx.fillStyle = body; rr(ctx, 0, 0, d.w, h, d.w * 0.13 * (d.radiusMul ?? 1)); ctx.fill();
    clearShadow();
    ctx.fillStyle = shadeLocal(body, -22);
    rr(ctx, d.w - 1, h * 0.24, 3, h * 0.09, 1.5); ctx.fill();
    rr(ctx, d.w - 1, h * 0.36, 3, h * 0.06, 1.5); ctx.fill();
    ctx.fillStyle = '#0b0c0f'; rr(ctx, g.x, g.y, g.w, g.h, g.r); ctx.fill();
    await drawScreen(ctx, g, d, asset);
    ctx.fillStyle = '#0b0c0f'; ctx.strokeStyle = '#26282e'; ctx.lineWidth = 1;
    rr(ctx, d.w / 2 - g.w * 0.15, g.y + g.h * 0.022, g.w * 0.3, g.h * 0.03, g.h * 0.015); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    rr(ctx, d.w / 2 - g.w * 0.18, g.y + g.h * 0.965, g.w * 0.36, Math.max(3, h * 0.005), 2); ctx.fill();
    glare(ctx, g, d);
  } else if (d.kind === 'tablet') {
    applyShadow();
    ctx.fillStyle = body; rr(ctx, 0, 0, d.w, h, d.w * 0.035 * (d.radiusMul ?? 1)); ctx.fill();
    clearShadow();
    ctx.fillStyle = '#0b0c0f'; rr(ctx, g.x, g.y, g.w, g.h, g.r); ctx.fill();
    await drawScreen(ctx, g, d, asset);
    ctx.fillStyle = shadeLocal(body, -38);
    ctx.beginPath(); ctx.arc(d.w / 2, g.y / 2, Math.max(1.8, d.w * 0.0045), 0, Math.PI * 2); ctx.fill();
    glare(ctx, g, d);
  } else if (d.kind === 'browser') {
    const light = luminance(body) > 0.5;
    const chromeH = g.y;
    applyShadow();
    ctx.fillStyle = body; rr(ctx, 0, 0, d.w, h, d.w * 0.02); ctx.fill();
    clearShadow();
    ctx.fillStyle = light ? '#fbfbfc' : '#15171b';
    rr(ctx, g.x, g.y, g.w, g.h, g.r); ctx.fill();
    await drawScreen(ctx, g, d, asset);
    const dotR = Math.max(3, chromeH * 0.12), cy = chromeH / 2;
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(chromeH * 0.55 + i * dotR * 2.6, cy, dotR, 0, Math.PI * 2); ctx.fill(); });
    const pw = d.w * 0.38, px = (d.w - pw) / 2;
    ctx.fillStyle = light ? '#e9ebef' : '#2c313a';
    rr(ctx, px, cy - chromeH * 0.27, pw, chromeH * 0.54, chromeH * 0.27); ctx.fill();
    ctx.fillStyle = light ? '#6b7280' : '#9aa1ad';
    ctx.font = `500 ${Math.max(9, chromeH * 0.3)}px "JetBrains Mono"`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.url || 'yourapp.com', d.w / 2, cy + 0.5, pw * 0.9);
  } else if (d.kind === 'monitor') {
    const standH = h * 0.15, screenH = h - standH;
    applyShadow();
    ctx.fillStyle = body; rr(ctx, 0, 0, d.w, screenH, d.w * 0.012); ctx.fill();
    clearShadow();
    ctx.fillStyle = '#0b0c0f'; rr(ctx, g.x, g.y, g.w, g.h, g.r); ctx.fill();
    await drawScreen(ctx, g, d, asset);
    ctx.fillStyle = shadeLocal(body, -30);
    ctx.beginPath(); ctx.arc(d.w / 2, screenH - (screenH - g.y - g.h) / 2, Math.max(1.6, d.w * 0.004), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shadeLocal(body, -16);
    ctx.beginPath();
    ctx.moveTo(d.w * 0.465, screenH);
    ctx.lineTo(d.w * 0.535, screenH);
    ctx.lineTo(d.w * 0.55, screenH + standH * 0.72);
    ctx.lineTo(d.w * 0.45, screenH + standH * 0.72);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = shadeLocal(body, -6);
    rr(ctx, d.w / 2 - d.w * 0.12, screenH + standH * 0.72, d.w * 0.24, standH * 0.2, standH * 0.1); ctx.fill();
    glare(ctx, g, d);
  }
  ctx.restore();

  /* floor reflection */
  if ((d.reflection ?? 0) > 0.02) {
    ctx.save();
    const refH = h * 0.22 * (d.reflection ?? 0);
    const grad = ctx.createLinearGradient(0, d.y + h, 0, d.y + h + refH);
    grad.addColorStop(0, 'rgba(255,255,255,0.10)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(d.x + d.w * 0.08, d.y + h, d.w * 0.84, refH);
    ctx.restore();
  }
}

async function drawScreen(ctx: CanvasRenderingContext2D, g: { x: number; y: number; w: number; h: number; r: number }, d: DeviceLayer, asset: Asset | undefined) {
  ctx.save();
  rr(ctx, g.x, g.y, g.w, g.h, g.r);
  ctx.clip();
  if (asset) {
    try {
      const img = await loadImage(asset.dataUrl);
      const f = computeFit(g, img.naturalWidth || asset.w, img.naturalHeight || asset.h, d.fit, d.zoom, d.panX, d.panY);
      ctx.drawImage(img, f.dx, f.dy, f.dw, f.dh);
    } catch { drawPlaceholder(ctx, g.x, g.y, g.w, g.h); }
  } else {
    drawPlaceholder(ctx, g.x, g.y, g.w, g.h);
  }
  /* brightness */
  const br = d.brightness ?? 1;
  if (Math.abs(br - 1) > 0.02) {
    if (br > 1) { ctx.fillStyle = `rgba(255,255,255,${clamp((br - 1) * 0.9, 0, 0.6)})`; }
    else { ctx.fillStyle = `rgba(0,0,0,${clamp((1 - br) * 0.9, 0, 0.7)})`; }
    ctx.fillRect(g.x, g.y, g.w, g.h);
  }
  ctx.restore();
}

function glare(ctx: CanvasRenderingContext2D, g: { x: number; y: number; w: number; h: number; r: number }, d: DeviceLayer) {
  const k = materialGlare(d.material ?? 'matte');
  ctx.save();
  rr(ctx, g.x, g.y, g.w, g.h, g.r); ctx.clip();
  const grad = ctx.createLinearGradient(g.x, g.y, g.x + g.w * 0.7, g.y + g.h);
  grad.addColorStop(0, `rgba(255,255,255,${0.07 * k})`);
  grad.addColorStop(0.35, `rgba(255,255,255,${0.015 * k})`);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(g.x, g.y, g.w, g.h);
  ctx.restore();
}

/* ---------------- text block ---------------- */
const TEXT_FONTS = [
  '"Space Grotesk", sans-serif',
  '"IBM Plex Sans", sans-serif',
  'system-ui, -apple-system, sans-serif',
];
const MONO = '"JetBrains Mono", monospace';

function drawTextBlock(ctx: CanvasRenderingContext2D, p: Project) {
  const t = p.text;
  if (!t) return;
  if (!t.enabled || (!t.title && !t.subtitle && !(t.showBadges && t.badges.length))) return;
  const { w: cw, h: ch } = p.canvas;
  const M = Math.round(Math.min(cw, ch) * 0.055);
  const ts = clamp(cw * 0.037, 24, 58) * t.scale;
  const color = t.autoColor ? textOn(p.background.c1) : t.color;
  const k = clamp(ts / 40, 0.7, 1.4);

  // Determine typography style based on project mood
  const mood = p.mood || 'auto';
  let fontWeight = 700;
  let letterSpacing = 0;
  let subtitleFont = MONO;
  let titleFont = TEXT_FONTS[0];
  let textTransform: 'none' | 'uppercase' | 'lowercase' = 'none';
  let textShadow = false;
  let textGlow = false;
  
  // More diverse typography based on mood
  if (mood === 'luxury') {
    fontWeight = 300;
    letterSpacing = 4;
    titleFont = TEXT_FONTS[1];
    textTransform = 'uppercase';
  } else if (mood === 'elegant') {
    fontWeight = 300;
    letterSpacing = 3;
    titleFont = TEXT_FONTS[1];
  } else if (mood === 'bold' || mood === 'impact') {
    fontWeight = 900;
    letterSpacing = -1;
    titleFont = TEXT_FONTS[0];
    textShadow = true;
  } else if (mood === 'developer' || mood === 'technical') {
    fontWeight = 600;
    titleFont = MONO;
    subtitleFont = MONO;
    textTransform = 'uppercase';
  } else if (mood === 'editorial') {
    fontWeight = 400;
    letterSpacing = 2;
    titleFont = TEXT_FONTS[2];
  } else if (mood === 'minimal') {
    fontWeight = 300;
    letterSpacing = 1;
    titleFont = TEXT_FONTS[2];
  } else if (mood === 'playful') {
    fontWeight = 800;
    letterSpacing = -0.5;
    titleFont = TEXT_FONTS[0];
    textGlow = true;
  } else if (mood === 'creative') {
    fontWeight = 700;
    letterSpacing = 1;
    titleFont = TEXT_FONTS[0];
    textGlow = true;
  } else if (mood === 'futuristic') {
    fontWeight = 600;
    letterSpacing = 2;
    titleFont = MONO;
    subtitleFont = MONO;
    textTransform = 'uppercase';
    textGlow = true;
  } else if (mood === 'dark') {
    fontWeight = 700;
    letterSpacing = 1;
    titleFont = TEXT_FONTS[0];
    textShadow = true;
  } else if (mood === 'premium') {
    fontWeight = 600;
    letterSpacing = 2;
    titleFont = TEXT_FONTS[1];
  } else if (mood === 'corporate') {
    fontWeight = 600;
    letterSpacing = 1;
    titleFont = TEXT_FONTS[2];
  }

  ctx.save();
  ctx.font = `${fontWeight} ${ts}px ${titleFont}`;
  const tw = t.title ? ctx.measureText(t.title).width : 0;
  const subFs = ts * 0.34;
  ctx.font = `400 ${subFs}px ${subtitleFont}`;
  const sw = t.subtitle ? ctx.measureText(t.subtitle.toUpperCase()).width + t.subtitle.length * letterSpacing * k : 0;
  const badgeFs = 12.5 * k;
  ctx.font = `500 ${badgeFs}px ${MONO}`;
  const padX = 12 * k, pillH = 26 * k, gap = 8 * k;
  const maxRow = cw - M * 2;
  const rows: { w: number }[] = [];
  let rowW = 0;
  const widths = t.badges.map(b => ctx.measureText(b).width + padX * 2);
  widths.forEach((bw, i) => {
    if (rowW > 0 && rowW + gap + bw > maxRow) { rows.push({ w: rowW }); rowW = bw; }
    else rowW = rowW > 0 ? rowW + gap + bw : bw;
    if (i === widths.length - 1) rows.push({ w: rowW });
  });
  const bw = t.showBadges && rows.length ? Math.max(...rows.map(r => r.w)) : 0;
  const rowsUsed = rows.length;
  const blockW = Math.max(tw, sw, bw);
  let blockH = 0;
  if (t.title) blockH += ts * 1.1;
  if (t.subtitle) blockH += (blockH ? ts * 0.34 : 0) + subFs * 1.4;
  if (t.showBadges && rowsUsed) blockH += (blockH ? ts * 0.42 : 0) + rowsUsed * (pillH + gap) - gap;

  const pos = t.position || 'bottom-left';
  const bx = pos.includes('left') ? M : pos.includes('right') ? cw - M - blockW : (cw - blockW) / 2;
  const by = pos.startsWith('top') ? M : pos.startsWith('bottom') ? ch - M - blockH : (ch - blockH) / 2;

  let y = by;
  const align = pos.includes('left') ? 'left' : pos.includes('right') ? 'right' : 'center';
  const ax = align === 'left' ? bx : align === 'right' ? bx + blockW : bx + blockW / 2;

  if (t.title) {
    ctx.font = `${fontWeight} ${ts}px ${titleFont}`;
    ctx.fillStyle = color; ctx.textAlign = align as CanvasTextAlign; ctx.textBaseline = 'top';
    
    // Apply text shadow if enabled
    if (textShadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    // Apply text glow if enabled
    if (textGlow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    }
    
    // Apply letter spacing if supported
    if (letterSpacing !== 0) {
      try { (ctx as unknown as { letterSpacing: string }).letterSpacing = `${letterSpacing}px`; } catch { /* unsupported */ }
    }
    
    ctx.fillText(t.title, ax, y);
    
    // Reset letter spacing
    if (letterSpacing !== 0) {
      try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'; } catch { /* unsupported */ }
    }
    
    y += ts * 1.1 + (t.subtitle ? ts * 0.34 : 0);
  }
  if (t.subtitle) {
    ctx.font = `400 ${subFs}px ${subtitleFont}`;
    ctx.fillStyle = color; ctx.globalAlpha = 0.72;
    try { (ctx as unknown as { letterSpacing: string }).letterSpacing = `${1.6 * k}px`; } catch { /* unsupported */ }
    ctx.fillText(t.subtitle.toUpperCase(), ax, y);
    try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'; } catch { /* unsupported */ }
    ctx.globalAlpha = 1;
    y += subFs * 1.4 + (t.showBadges && rowsUsed ? ts * 0.42 : 0);
  }
  if (t.showBadges && rowsUsed) {
    const dark = luminance(color) < 0.5;
    let byy = y;
    let start = 0;
    for (const row of rows) {
      let x = align === 'left' ? bx : align === 'right' ? bx + blockW - row.w : bx + (blockW - row.w) / 2;
      for (let i = start; i < t.badges.length; i++) {
        const bwid = widths[i];
        if (x + bwid > (align === 'left' ? bx + row.w + 1 : bx + blockW + 1) && i > start) break;
        ctx.fillStyle = dark ? 'rgba(21,23,28,0.07)' : 'rgba(255,255,255,0.1)';
        rr(ctx, x, byy, bwid, pillH, pillH / 2); ctx.fill();
        ctx.strokeStyle = dark ? 'rgba(21,23,28,0.16)' : 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1; rr(ctx, x, byy, bwid, pillH, pillH / 2); ctx.stroke();
        ctx.fillStyle = color; ctx.globalAlpha = 0.88;
        ctx.font = `500 ${badgeFs}px ${MONO}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t.badges[i], x + bwid / 2, byy + pillH / 2 + 0.5);
        ctx.globalAlpha = 1;
        x += bwid + gap;
        start = i + 1;
      }
      byy += pillH + gap;
    }
  }
  ctx.restore();
}

/* ---------------- canvas images ---------------- */
async function drawCanvasImages(ctx: CanvasRenderingContext2D, p: Project) {
  if (!p.canvasImages || p.canvasImages.length === 0) return;
  
  const sorted = [...p.canvasImages].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  
  for (const canvasImage of sorted) {
    if (!canvasImage.visible) continue;
    
    const asset = p.assets.find(a => a.id === canvasImage.assetId);
    if (!asset) continue;
    
    try {
      const img = await loadImage(asset.dataUrl);
      const x = canvasImage.x * p.canvas.w;
      const y = canvasImage.y * p.canvas.h;
      const width = canvasImage.width * p.canvas.w;
      const height = canvasImage.height * p.canvas.h;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      ctx.save();
      
      // Apply rotation
      if (canvasImage.rotation !== 0) {
        ctx.translate(centerX, centerY);
        ctx.rotate((canvasImage.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      
      // Apply opacity
      ctx.globalAlpha = canvasImage.opacity;
      
      // Apply filters
      const filters = [];
      if (canvasImage.brightness !== 1) filters.push(`brightness(${canvasImage.brightness})`);
      if (canvasImage.contrast !== 1) filters.push(`contrast(${canvasImage.contrast})`);
      if (canvasImage.saturation !== 1) filters.push(`saturate(${canvasImage.saturation})`);
      if (canvasImage.blur > 0) filters.push(`blur(${canvasImage.blur}px)`);
      if (canvasImage.hue !== 0) filters.push(`hue-rotate(${canvasImage.hue}deg)`);
      if (filters.length > 0) {
        ctx.filter = filters.join(' ');
      }
      
      // Apply shadow
      if (canvasImage.shadow) {
        ctx.shadowColor = canvasImage.shadowColor;
        ctx.shadowBlur = canvasImage.shadowBlur;
        ctx.shadowOffsetX = canvasImage.shadowOffsetX;
        ctx.shadowOffsetY = canvasImage.shadowOffsetY;
      }
      
      // Apply glow
      if (canvasImage.glow) {
        ctx.shadowColor = canvasImage.glowColor;
        ctx.shadowBlur = canvasImage.glowBlur;
      }
      
      // Clip with border radius
      if (canvasImage.borderRadius > 0) {
        const radius = (canvasImage.borderRadius / 100) * Math.min(width, height);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
      }
      
      // Draw image
      ctx.drawImage(img, x, y, width, height);
      
      ctx.restore();
    } catch {
      // Skip failed images
    }
  }
}

async function drawLogo(ctx: CanvasRenderingContext2D, p: Project) {
  if (!p.logo.enabled || !p.logo.assetId) return;
  const asset = p.assets.find(a => a.id === p.logo.assetId);
  if (!asset) return;
  try {
    const img = await loadImage(asset.dataUrl);
    const lw = p.logo.size * p.canvas.w;
    const lh = lw * ((img.naturalHeight || asset.h) / (img.naturalWidth || asset.w));
    const M = Math.round(Math.min(p.canvas.w, p.canvas.h) * 0.055);
    const pos = p.logo.position;
    const x = pos.includes('left') ? M : pos.includes('right') ? p.canvas.w - M - lw : (p.canvas.w - lw) / 2;
    const y = pos.startsWith('top') ? M : pos.startsWith('bottom') ? p.canvas.h - M - lh : (p.canvas.h - lh) / 2;
    ctx.save();
    ctx.globalAlpha = p.logo.opacity;
    ctx.drawImage(img, x, y, lw, lh);
    ctx.restore();
  } catch { /* skip logo */ }
}

/* ---------------- icons ---------------- */
import { ICONS } from './iconLibrary';

function drawIcons(ctx: CanvasRenderingContext2D, p: Project) {
  if (!p.icons || p.icons.length === 0) return;
  
  for (const icon of p.icons) {
    const iconDef = ICONS.find(i => i.id === icon.iconId);
    if (!iconDef) continue;
    
    const size = icon.size * Math.min(p.canvas.w, p.canvas.h);
    const x = icon.x * p.canvas.w - size / 2;
    const y = icon.y * p.canvas.h - size / 2;
    
    ctx.save();
    ctx.globalAlpha = icon.opacity;
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate((icon.rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);
    
    // Draw background if enabled
    if (icon.bgStyle !== 'none' && icon.bgColor) {
      const bgColor = icon.bgColor;
      const bgPadding = size * 0.2;
      
      if (icon.bgStyle === 'circle') {
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (icon.bgStyle === 'rounded') {
        ctx.fillStyle = bgColor;
        rr(ctx, 0, 0, size, size, size * 0.2);
        ctx.fill();
      } else if (icon.bgStyle === 'glass') {
        ctx.fillStyle = bgColor + '33';
        rr(ctx, 0, 0, size, size, size * 0.2);
        ctx.fill();
        ctx.strokeStyle = bgColor + '66';
        ctx.lineWidth = 1;
        rr(ctx, 0, 0, size, size, size * 0.2);
        ctx.stroke();
      } else if (icon.bgStyle === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, bgColor + '88');
        grad.addColorStop(1, bgColor);
        ctx.fillStyle = grad;
        rr(ctx, 0, 0, size, size, size * 0.2);
        ctx.fill();
      } else if (icon.bgStyle === 'badge') {
        ctx.fillStyle = bgColor;
        rr(ctx, 0, 0, size, size, size * 0.08);
        ctx.fill();
      }
    }
    
    // Draw icon
    ctx.strokeStyle = icon.color;
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const padding = icon.bgStyle !== 'none' ? size * 0.2 : 0;
    const iconSize = size - padding * 2;
    const scale = iconSize / 24;
    
    ctx.translate(padding, padding);
    ctx.scale(scale, scale);
    
    // Parse and draw SVG path
    const path = new Path2D(iconDef.d);
    ctx.stroke(path);
    
    // Add glow if enabled
    if (icon.glow) {
      ctx.shadowColor = icon.color;
      ctx.shadowBlur = 12;
      ctx.stroke(path);
    }
    
    // Add shadow if enabled
    if (icon.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.stroke(path);
    }
    
    ctx.restore();
  }
}

/* ---------------- main ---------------- */
export async function renderProject(p: Project, opts: { scale?: number; transparent?: boolean } = {}): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const scale = opts.scale ?? 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(p.canvas.w * scale);
  canvas.height = Math.round(p.canvas.h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.imageSmoothingQuality = 'high';

  const transparent = !!opts.transparent;
  if (!transparent) await renderBackground(ctx, p.background, p.canvas.w, p.canvas.h, p.accents);

  const hasLayers = p.decos && p.decos.length > 0;
  if (!transparent) {
    if (hasLayers) drawDecos(ctx, p.decos, p.canvas.w, p.canvas.h, p.accents, 'back');
    else drawDecos(ctx, [], p.canvas.w, p.canvas.h, p.accents, 'back');
  }

  const sorted = [...p.devices].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  for (const d of sorted) {
    if (!d.visible) continue;
    await drawDevice(ctx, d, p.assets.find(a => a.id === d.assetId), p.accents.a1);
  }

  if (!transparent && hasLayers) drawDecos(ctx, p.decos, p.canvas.w, p.canvas.h, p.accents, 'front');

  // Draw icons
  if (p.icons && p.icons.length > 0) {
    drawIcons(ctx, p);
  }

  // Draw canvas images
  if (p.canvasImages && p.canvasImages.length > 0) {
    await drawCanvasImages(ctx, p);
  }

  await drawLogo(ctx, p);
  drawTextBlock(ctx, p);
  return canvas;
}

export async function makeThumbnail(p: Project, maxW = 560): Promise<string> {
  const scale = Math.min(1, maxW / p.canvas.w);
  const canvas = await renderProject(p, { scale });
  return canvas.toDataURL('image/jpeg', 0.78);
}

export async function exportBlob(
  p: Project,
  opts: { format: 'png' | 'jpeg' | 'webp'; quality: number; scale: number; targetW: number; targetH: number; transparent: boolean },
): Promise<Blob> {
  const src = await renderProject(p, { scale: opts.scale, transparent: opts.transparent && opts.format !== 'jpeg' });
  let out = src;
  if (opts.targetW > 0 && opts.targetH > 0 && (opts.targetW !== src.width || opts.targetH !== src.height)) {
    out = document.createElement('canvas');
    out.width = opts.targetW; out.height = opts.targetH;
    const ctx = out.getContext('2d')!;
    if (!opts.transparent || opts.format === 'jpeg') { ctx.fillStyle = p.background.c1; ctx.fillRect(0, 0, out.width, out.height); }
    const sc = Math.min(out.width / src.width, out.height / src.height);
    const dw = src.width * sc, dh = src.height * sc;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, (out.width - dw) / 2, (out.height - dh) / 2, dw, dh);
  }
  return new Promise((resolve, reject) => {
    const mime = opts.format === 'png' ? 'image/png' : opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
    out.toBlob(b => (b ? resolve(b) : reject(new Error('export failed'))), mime, opts.quality);
  });
}
