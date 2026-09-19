import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as RPointerEvent, DragEvent as RDragEvent } from 'react';
import { useStudio } from '../store';
import type { Background, DeviceLayer, IconLayer as IconLayerType, Project } from '../types';
import { clamp, computeFit, deviceGeometry, DEVICE_META, luminance, textOn, DECO_PRESETS } from '../templates';
import { renderBackground } from '../backgrounds';
import { drawDecos } from '../decos';
import { DeviceFrame } from './DeviceFrame';
import { ICONS } from '../iconLibrary';
import { AdvancedGrid } from './AdvancedGrid';

export function bgStyle(b: Background): CSSProperties {
  if (b.type === 'solid') return { background: b.c1 };
  if (b.type === 'linear') return { background: `linear-gradient(${b.angle}deg, ${b.c1}, ${b.c2})` };
  if (b.type === 'radial') return { background: `radial-gradient(120% 120% at 50% 42%, ${b.c1}, ${b.c2})` };
  return { background: `radial-gradient(70% 70% at 82% 16%, ${b.c2}77, transparent 70%), radial-gradient(65% 65% at 14% 88%, ${b.c3}6e, transparent 70%), ${b.c1}` };
}

function PaintCanvas({ p, depth }: { p: Project; depth: 'front' | 'all' }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    if (depth === 'all') {
      renderBackground(ctx, p.background, p.canvas.w, p.canvas.h, p.accents).then(() => {
        drawDecos(ctx, p.decos, p.canvas.w, p.canvas.h, p.accents, 'back');
      });
    } else {
      drawDecos(ctx, p.decos, p.canvas.w, p.canvas.h, p.accents, 'front');
    }
  }, [p.background, p.decos, p.accents, p.canvas.w, p.canvas.h, depth]);
  return (
    <canvas
      ref={ref}
      width={p.canvas.w}
      height={p.canvas.h}
      className="absolute inset-0"
      style={{ width: p.canvas.w, height: p.canvas.h, pointerEvents: 'none' }}
    />
  );
}

function DecoLayer({ deco, canvasW, canvasH, onDragStart, onDragEnd }: { deco: any; canvasW: number; canvasH: number; onDragStart: () => void; onDragEnd: () => void }) {
  const setSelection = useStudio(s => s.setSelection);
  const addToSelection = useStudio(s => s.addToSelection);
  const selection = useStudio(s => s.selection);
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const zoom = useStudio(s => s.zoom);
  const selected = useStudio(s => s.selection?.kind === 'deco' && (s.selection.id === deco.id || s.selection.ids?.includes(deco.id)));
  const lockedObjects = useStudio(s => s.lockedObjects);
  
  const size = deco.scale * Math.min(canvasW, canvasH);
  const x = deco.x * canvasW - size / 2;
  const y = deco.y * canvasH - size / 2;
  
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const isLocked = lockedObjects.has(`deco:${deco.id}`);
  
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    // If locked, only allow selection, no dragging
    if (isLocked) {
      setSelection({ kind: 'deco', id: deco.id, ids: [deco.id] });
      return;
    }
    
    if (e.shiftKey) {
      if (selection?.kind === 'deco' && selection.ids?.includes(deco.id)) {
        useStudio.getState().removeFromSelection('deco', deco.id);
      } else {
        addToSelection('deco', deco.id);
      }
    } else {
      setSelection({ kind: 'deco', id: deco.id, ids: [deco.id] });
    }
    
    checkpoint();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: deco.x, oy: deco.y };
    onDragStart();
  };
  
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / zoom / canvasW;
    const dy = (e.clientY - drag.sy) / zoom / canvasH;
    update(p => ({
      ...p,
      decos: p.decos.map(d => d.id === deco.id ? { ...d, x: drag.ox + dx, y: drag.oy + dy } : d)
    }), false);
  };
  
  const onUp = () => {
    dragRef.current = null;
    onDragEnd();
  };
  
  return (
    <div
      className={`absolute cursor-move ${selected ? 'sel-ring' : ''}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `rotate(${deco.rotation}deg)`,
        opacity: deco.opacity,
        filter: [
          deco.blur > 0 ? `blur(${deco.blur}px)` : '',
          deco.shadow ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : '',
          deco.glow ? `drop-shadow(0 0 12px ${deco.hue || '#ffffff'})` : '',
        ].filter(Boolean).join(' ') || undefined,
        pointerEvents: 'auto',
        zIndex: deco.z || 1,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <DecoShapeSVG deco={deco} size={size} />
    </div>
  );
}

function DecoShapeSVG({ deco, size }: { deco: any; size: number }) {
  const preset = DECO_PRESETS.find((p: any) => p.id === deco.preset);
  if (!preset) return null;
  
  const color = deco.hue || '#ff6b3d';
  const gradId = `grad-${deco.id}`;
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id={gradId} cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </radialGradient>
      </defs>
      
      {preset.prim === 'disc' && <circle cx="50" cy="50" r="45" fill={color} />}
      {preset.prim === 'ring' && <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8" />}
      {preset.prim === 'square' && <rect x="10" y="10" width="80" height="80" fill={color} />}
      {preset.prim === 'triangle' && <polygon points="50,10 90,90 10,90" fill={color} />}
      {preset.prim === 'line' && <line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="8" />}
      {preset.prim === 'arc' && <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="8" />}
      {preset.prim === 'dotgrid' && (
        <g fill={color}>
          {[0,1,2,3,4].map(i => [0,1,2,3,4].map(j => (
            <circle key={`${i}-${j}`} cx={20 + i * 15} cy={20 + j * 15} r="4" />
          )))}
        </g>
      )}
      {preset.prim === 'plus' && (
        <g stroke={color} strokeWidth="8" strokeLinecap="round">
          <line x1="50" y1="10" x2="50" y2="90" />
          <line x1="10" y1="50" x2="90" y2="50" />
        </g>
      )}
      
      {preset.prim === 'glassorb' && (
        <>
          <circle cx="50" cy="50" r="40" fill={`url(#${gradId})`} opacity="0.7" />
          <circle cx="35" cy="35" r="12" fill="white" opacity="0.6" />
        </>
      )}
      {preset.prim === 'chromering' && (
        <>
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="3" opacity="0.5" />
        </>
      )}
      {preset.prim === 'softsphere' && (
        <circle cx="50" cy="50" r="45" fill={`url(#${gradId})`} />
      )}
      {preset.prim === 'roundedcube' && (
        <rect x="15" y="15" width="70" height="70" rx="10" fill={color} opacity="0.8" />
      )}
      {preset.prim === 'glasscube' && (
        <>
          <rect x="15" y="15" width="70" height="70" rx="5" fill={`url(#${gradId})`} opacity="0.6" />
          <rect x="20" y="20" width="20" height="20" fill="white" opacity="0.4" />
        </>
      )}
      {preset.prim === 'floatingpill' && (
        <rect x="20" y="35" width="60" height="30" rx="15" fill={color} opacity="0.8" />
      )}
      {preset.prim === 'metallicdisc' && (
        <>
          <ellipse cx="50" cy="50" rx="45" ry="20" fill={color} />
          <ellipse cx="50" cy="45" rx="40" ry="15" fill="white" opacity="0.3" />
        </>
      )}
      {preset.prim === 'torus3d' && (
        <>
          <circle cx="50" cy="50" r="35" fill="none" stroke={color} strokeWidth="15" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="3" opacity="0.4" />
        </>
      )}
      {preset.prim === 'glasstorus' && (
        <>
          <circle cx="50" cy="50" r="35" fill="none" stroke={`url(#${gradId})`} strokeWidth="15" opacity="0.7" />
        </>
      )}
      {preset.prim === 'pyramid' && (
        <polygon points="50,10 90,90 10,90" fill={color} opacity="0.8" />
      )}
      
      {preset.prim === 'isocube' && (
        <g fill={color} opacity="0.8">
          <polygon points="50,10 90,30 90,70 50,90" />
          <polygon points="50,10 10,30 10,70 50,90" opacity="0.6" />
          <polygon points="50,10 90,30 50,50 10,30" opacity="0.4" />
        </g>
      )}
      {preset.prim === 'wireframecube' && (
        <g stroke={color} strokeWidth="2" fill="none">
          <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" />
          <line x1="50" y1="10" x2="50" y2="50" />
          <line x1="90" y1="30" x2="50" y2="50" />
          <line x1="10" y1="30" x2="50" y2="50" />
        </g>
      )}
      {preset.prim === 'hexframe' && (
        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="none" stroke={color} strokeWidth="8" />
      )}
      {preset.prim === 'octframe' && (
        <polygon points="35,10 65,10 90,35 90,65 65,90 35,90 10,65 10,35" fill="none" stroke={color} strokeWidth="8" />
      )}
      {preset.prim === 'diamondframe' && (
        <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke={color} strokeWidth="8" />
      )}
      {preset.prim === 'doublearc' && (
        <>
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="6" />
          <path d="M 15 55 A 35 35 0 0 1 85 55" fill="none" stroke={color} strokeWidth="6" opacity="0.6" />
        </>
      )}
      {preset.prim === 'spiral' && (
        <path d="M 50 50 Q 70 30 70 50 Q 70 70 50 70 Q 30 70 30 50 Q 30 30 50 30 Q 60 30 60 50" fill="none" stroke={color} strokeWidth="6" />
      )}
      {preset.prim === 'orbitlines' && (
        <g stroke={color} strokeWidth="3" fill="none" opacity="0.7">
          <ellipse cx="50" cy="50" rx="40" ry="20" transform="rotate(0 50 50)" />
          <ellipse cx="50" cy="50" rx="40" ry="20" transform="rotate(60 50 50)" />
          <ellipse cx="50" cy="50" rx="40" ry="20" transform="rotate(120 50 50)" />
        </g>
      )}
      {preset.prim === 'halo' && (
        <>
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8" opacity="0.3" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="3" opacity="0.5" />
        </>
      )}
      
      {preset.prim === 'fluidribbon' && (
        <path d="M 20 30 Q 50 10 80 30 Q 90 50 80 70 Q 50 90 20 70 Q 10 50 20 30" fill={color} opacity="0.7" />
      )}
      {preset.prim === 'foldedribbon' && (
        <path d="M 10 30 L 40 20 L 40 50 L 70 40 L 70 70 L 90 60 L 90 90 L 10 80 Z" fill={color} opacity="0.8" />
      )}
      {preset.prim === 'liquidblob' && (
        <path d="M 50 10 Q 85 20 85 50 Q 85 85 50 85 Q 15 85 15 50 Q 15 20 50 10 Z" fill={color} opacity="0.7" />
      )}
      {preset.prim === 'pebble' && (
        <ellipse cx="50" cy="50" rx="40" ry="35" fill={color} opacity="0.8" />
      )}
      {preset.prim === 'cutout' && (
        <>
          <circle cx="50" cy="50" r="45" fill={color} />
          <circle cx="50" cy="50" r="25" fill="white" />
        </>
      )}
      {preset.prim === 'halfmoon' && (
        <path d="M 50 10 A 40 40 0 0 1 50 90 Z" fill={color} opacity="0.8" />
      )}
      {preset.prim === 'quartercircle' && (
        <path d="M 10 10 L 90 10 L 90 90 A 80 80 0 0 1 10 10 Z" fill={color} opacity="0.8" />
      )}
      {preset.prim === 'layeredwave' && (
        <g fill={color} opacity="0.6">
          <path d="M 0 60 Q 25 40 50 60 T 100 60 L 100 100 L 0 100 Z" />
          <path d="M 0 70 Q 25 50 50 70 T 100 70 L 100 100 L 0 100 Z" opacity="0.8" />
          <path d="M 0 80 Q 25 60 50 80 T 100 80 L 100 100 L 0 100 Z" opacity="0.6" />
        </g>
      )}
      {preset.prim === 'fluidline' && (
        <path d="M 10 50 Q 30 20 50 50 T 90 50" fill="none" stroke={color} strokeWidth="6" />
      )}
      {preset.prim === 'dottedorbit' && (
        <g fill={color}>
          {[0,1,2,3,4,5,6,7].map(i => {
            const angle = (i / 8) * Math.PI * 2;
            const x = 50 + Math.cos(angle) * 35;
            const y = 50 + Math.sin(angle) * 35;
            return <circle key={i} cx={x} cy={y} r="4" />;
          })}
        </g>
      )}
      
      {preset.prim === 'dotcluster' && (
        <g fill={color}>
          {[0,1,2,3,4].map(i => [0,1,2,3,4].map(j => {
            const dist = Math.sqrt(Math.pow(i-2, 2) + Math.pow(j-2, 2));
            if (dist < 2.5) return <circle key={`${i}-${j}`} cx={20 + i * 15} cy={20 + j * 15} r={4 - dist} />;
            return null;
          }))}
        </g>
      )}
      {preset.prim === 'microgrid' && (
        <g stroke={color} strokeWidth="1" opacity="0.5">
          {[0,1,2,3,4,5,6,7].map(i => (
            <g key={i}>
              <line x1={10 + i * 10} y1="10" x2={10 + i * 10} y2="90" />
              <line x1="10" y1={10 + i * 10} x2="90" y2={10 + i * 10} />
            </g>
          ))}
        </g>
      )}
      {preset.prim === 'perspectivegrid' && (
        <g stroke={color} strokeWidth="1" opacity="0.4">
          <line x1="50" y1="10" x2="10" y2="90" />
          <line x1="50" y1="10" x2="90" y2="90" />
          <line x1="50" y1="10" x2="30" y2="90" />
          <line x1="50" y1="10" x2="70" y2="90" />
          {[0,1,2,3].map(i => <line key={i} x1="10" y1={30 + i * 15} x2="90" y2={30 + i * 15} />)}
        </g>
      )}
      {preset.prim === 'cross' && (
        <g fill={color}>
          <rect x="40" y="10" width="20" height="80" rx="5" />
          <rect x="10" y="40" width="80" height="20" rx="5" />
        </g>
      )}
      {preset.prim === 'pluscluster' && (
        <g stroke={color} strokeWidth="4" strokeLinecap="round">
          <line x1="30" y1="20" x2="30" y2="40" />
          <line x1="20" y1="30" x2="40" y2="30" />
          <line x1="70" y1="60" x2="70" y2="80" />
          <line x1="60" y1="70" x2="80" y2="70" />
        </g>
      )}
      {preset.prim === 'slab' && (
        <rect x="10" y="40" width="80" height="20" fill={color} opacity="0.8" />
      )}
      {preset.prim === 'layeredcards' && (
        <g>
          <rect x="10" y="50" width="60" height="40" rx="5" fill={color} opacity="0.4" />
          <rect x="20" y="40" width="60" height="40" rx="5" fill={color} opacity="0.6" />
          <rect x="30" y="30" width="60" height="40" rx="5" fill={color} opacity="0.8" />
        </g>
      )}
      {preset.prim === 'glasspanel' && (
        <rect x="30" y="10" width="40" height="80" rx="5" fill={`url(#${gradId})`} opacity="0.5" />
      )}
      {preset.prim === 'frostedshape' && (
        <rect x="15" y="15" width="70" height="70" rx="20" fill={`url(#${gradId})`} opacity="0.4" />
      )}
      {preset.prim === 'pillcluster' && (
        <g fill={color} opacity="0.8">
          <rect x="20" y="30" width="25" height="15" rx="7.5" transform="rotate(-20 32 37)" />
          <rect x="50" y="50" width="25" height="15" rx="7.5" transform="rotate(15 62 57)" />
          <rect x="35" y="65" width="25" height="15" rx="7.5" transform="rotate(-10 47 72)" />
        </g>
      )}
      
      {preset.prim === 'floatingtriangles' && (
        <g fill={color} opacity="0.7">
          <polygon points="30,20 50,50 10,50" />
          <polygon points="70,40 90,70 50,70" opacity="0.8" />
          <polygon points="40,60 60,90 20,90" opacity="0.6" />
        </g>
      )}
      {preset.prim === 'polygonstack' && (
        <g fill={color}>
          <polygon points="20,70 80,70 70,80 30,80" opacity="0.4" />
          <polygon points="25,60 75,60 65,70 35,70" opacity="0.6" />
          <polygon points="30,50 70,50 60,60 40,60" opacity="0.8" />
        </g>
      )}
      {preset.prim === 'isostair' && (
        <g fill={color} opacity="0.8">
          <rect x="20" y="70" width="20" height="10" />
          <rect x="40" y="60" width="20" height="20" />
          <rect x="60" y="50" width="20" height="30" />
        </g>
      )}
      {preset.prim === 'cylinder' && (
        <>
          <ellipse cx="50" cy="30" rx="30" ry="10" fill={color} opacity="0.6" />
          <rect x="20" y="30" width="60" height="40" fill={color} opacity="0.8" />
          <ellipse cx="50" cy="70" rx="30" ry="10" fill={color} />
        </>
      )}
      {preset.prim === 'cone' && (
        <polygon points="50,10 80,90 20,90" fill={color} opacity="0.8" />
      )}
      {preset.prim === 'capsulestack' && (
        <g fill={color} opacity="0.8">
          <rect x="20" y="25" width="30" height="15" rx="7.5" />
          <rect x="50" y="45" width="30" height="15" rx="7.5" />
          <rect x="35" y="65" width="30" height="15" rx="7.5" />
        </g>
      )}
      {preset.prim === 'flowergeo' && (
        <g fill={color} opacity="0.7">
          <circle cx="50" cy="30" r="15" />
          <circle cx="70" cy="50" r="15" />
          <circle cx="50" cy="70" r="15" />
          <circle cx="30" cy="50" r="15" />
          <circle cx="50" cy="50" r="10" fill="white" opacity="0.5" />
        </g>
      )}
      {preset.prim === 'radiallines' && (
        <g stroke={color} strokeWidth="2">
          {[0,1,2,3,4,5,6,7].map(i => {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = 50 + Math.cos(angle) * 20;
            const y1 = 50 + Math.sin(angle) * 20;
            const x2 = 50 + Math.cos(angle) * 40;
            const y2 = 50 + Math.sin(angle) * 40;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
      )}
      {preset.prim === 'cornerbrackets' && (
        <g stroke={color} strokeWidth="4" fill="none">
          <path d="M 10 30 L 10 10 L 30 10" />
          <path d="M 70 10 L 90 10 L 90 30" />
          <path d="M 90 70 L 90 90 L 70 90" />
          <path d="M 30 90 L 10 90 L 10 70" />
        </g>
      )}
      {preset.prim === 'shadowblob' && (
        <>
          <ellipse cx="50" cy="75" rx="35" ry="10" fill="black" opacity="0.2" />
          <path d="M 50 10 Q 80 20 80 50 Q 80 75 50 75 Q 20 75 20 50 Q 20 20 50 10 Z" fill={color} opacity="0.7" />
        </>
      )}
      
      {preset.prim === 'sphere' && (
        <>
          <circle cx="50" cy="50" r="45" fill={color} opacity="0.3" />
          <circle cx="35" cy="35" r="15" fill="white" opacity="0.5" />
        </>
      )}
      {preset.prim === 'cube' && (
        <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill={color} opacity="0.8" />
      )}
      {preset.prim === 'blob' && (
        <path d="M 50 10 Q 80 20 85 50 Q 80 80 50 90 Q 20 80 15 50 Q 20 20 50 10 Z" fill={color} opacity="0.7" />
      )}
      {preset.prim === 'sparkle' && (
        <path d="M 50 10 L 55 45 L 90 50 L 55 55 L 50 90 L 45 55 L 10 50 L 45 45 Z" fill={color} />
      )}
    </svg>
  );
}

function ScreenImage({ d, dataUrl, iw, ih }: { d: DeviceLayer; dataUrl: string; iw: number; ih: number }) {
  const h = d.w / DEVICE_META[d.kind].aspect;
  const g = deviceGeometry(d.kind, d.w, h, d.radiusMul);
  const f = computeFit(g, iw, ih, d.fit, d.zoom, d.panX, d.panY);
  const filter = Math.abs((d.brightness ?? 1) - 1) > 0.02
    ? `brightness(${d.brightness})` : undefined;
  
  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    left: f.dx - g.x,
    top: f.dy - g.y,
    width: f.dw,
    height: f.dh,
    pointerEvents: 'none',
    filter,
    opacity: d.opacity ?? 1,
    objectFit: d.fit === 'stretch' ? 'fill' : d.fit === 'cover' ? 'cover' : 'contain',
    maxWidth: 'none',
    maxHeight: 'none',
  };
  
  return (
    <div 
      className="absolute overflow-hidden" 
      style={{ 
        left: g.x, 
        top: g.y, 
        width: g.w, 
        height: g.h, 
        borderRadius: g.r,
        clipPath: `inset(0 round ${g.r}px)`,
      }}
    >
      <img
        src={dataUrl} 
        alt="" 
        draggable={false}
        className="absolute select-none"
        style={imgStyle}
      />
    </div>
  );
}

function PlaceholderScreen({ d, highlight }: { d: DeviceLayer; highlight: boolean }) {
  const h = d.w / DEVICE_META[d.kind].aspect;
  const g = deviceGeometry(d.kind, d.w, h, d.radiusMul);
  return (
    <div
      className="absolute flex items-center justify-center transition-colors"
      style={{
        left: g.x, top: g.y, width: g.w, height: g.h, borderRadius: g.r,
        background: highlight ? 'rgba(255,107,61,0.28)' : 'repeating-linear-gradient(45deg, #14161b 0 10px, #171a20 10px 20px)',
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: clamp(g.w * 0.045, 10, 22), color: highlight ? '#ffd9c4' : 'rgba(255,255,255,0.32)' }}>
        {highlight ? 'release to place' : '+ add screenshot'}
      </span>
    </div>
  );
}

function TextOverlay({ p }: { p: Project }) {
  // ALL hooks must be called BEFORE any conditional returns
  const selected = useStudio(s => s.selection?.kind === 'text');
  const setSelection = useStudio(s => s.setSelection);
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const zoom = useStudio(s => s.zoom);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  
  const t = p.text;
  if (!t) return null;
  if (!t.enabled || (!t.title && !t.subtitle && !(t.showBadges && t.badges.length))) return null;
  
  const { w: cw, h: ch } = p.canvas;
  const M = Math.round(Math.min(cw, ch) * 0.055);
  const ts = clamp(cw * 0.037, 24, 58) * t.scale;
  const k = clamp(ts / 40, 0.7, 1.4);
  const color = t.autoColor ? textOn(p.background.c1) : t.color;
  
  const fontMap: Record<string, string> = {
    'space-grotesk': '"Space Grotesk", sans-serif',
    'ibm-plex': '"IBM Plex Sans", sans-serif',
    'system': 'system-ui, -apple-system, sans-serif',
    'mono': '"JetBrains Mono", monospace',
    'serif': 'Georgia, serif',
    'rounded': '"Nunito", sans-serif',
    'playfair': '"Playfair Display", serif',
    'roboto': '"Roboto", sans-serif',
    'open-sans': '"Open Sans", sans-serif',
    'lato': '"Lato", sans-serif',
    'montserrat': '"Montserrat", sans-serif',
    'poppins': '"Poppins", sans-serif',
    'raleway': '"Raleway", sans-serif',
    'oswald': '"Oswald", sans-serif',
    'merriweather': '"Merriweather", serif',
    'source-code': '"Source Code Pro", monospace',
    'fira-code': '"Fira Code", monospace',
    'inter': '"Inter", sans-serif',
    'work-sans': '"Work Sans", sans-serif',
    'nunito-sans': '"Nunito Sans", sans-serif',
  };
  
  const fontFamily = fontMap[t.fontFamily || 'space-grotesk'] || fontMap['space-grotesk'];
  
  const useAbsolute = t.x !== undefined && t.y !== undefined;
  
  // Safe position access with fallback
  const pos = t.position || 'bottom-left';
  const align = pos.includes('left') ? 'flex-start' : pos.includes('right') ? 'flex-end' : 'center';
  const justify = pos.startsWith('top') ? 'flex-start' : pos.startsWith('bottom') ? 'flex-end' : 'center';
  const lightText = luminance(color) > 0.5;
  
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setSelection({ kind: 'text' });
    checkpoint();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    const currentX = t.x !== undefined ? t.x : (pos.includes('left') ? M : pos.includes('right') ? cw - M : cw / 2);
    const currentY = t.y !== undefined ? t.y : (pos.startsWith('top') ? M : pos.startsWith('bottom') ? ch - M : ch / 2);
    
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: currentX, oy: currentY };
  };
  
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    
    const dx = (e.clientX - drag.sx) / zoom;
    const dy = (e.clientY - drag.sy) / zoom;
    
    const newX = drag.ox + dx;
    const newY = drag.oy + dy;
    
    update(p => ({ ...p, text: { ...p.text, x: newX, y: newY } }), false);
  };
  
  const onUp = () => {
    dragRef.current = null;
  };
  
  const containerStyle = useAbsolute 
    ? { 
        position: 'absolute' as const,
        left: t.x,
        top: t.y,
        maxWidth: '92%',
      }
    : { 
        padding: M,
        alignItems: align,
        justifyContent: justify,
      };
  
  return (
    <div className={`absolute inset-0 ${useAbsolute ? '' : 'flex flex-col'} pointer-events-none`} style={containerStyle}>
      <div
        className={`flex flex-col cursor-move pointer-events-auto ${selected ? 'sel-ring' : ''}`}
        style={{ alignItems: useAbsolute ? 'flex-start' : align, maxWidth: '92%' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {t.title && (
          <div style={{ fontFamily, fontWeight: 700, fontSize: ts, lineHeight: 1.1, color, textAlign: useAbsolute ? 'left' : align === 'center' ? 'center' : align === 'flex-end' ? 'right' : 'left' }}>
            {t.title}
          </div>
        )}
        {t.subtitle && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: ts * 0.34, letterSpacing: 1.6 * k, textTransform: 'uppercase', color, opacity: 0.72, marginTop: t.title ? ts * 0.34 : 0 }}>
            {t.subtitle}
          </div>
        )}
        {t.showBadges && t.badges.length > 0 && (
          <div className="flex flex-wrap gap-[8px]" style={{ marginTop: (t.title || t.subtitle) ? ts * 0.42 : 0, justifyContent: useAbsolute ? 'flex-start' : align === 'center' ? 'center' : align }}>
            {t.badges.map(b => (
              <span key={b} style={{
                fontFamily: 'var(--font-mono)', fontSize: 12.5 * k, color,
                padding: `${5 * k}px ${12 * k}px`, borderRadius: 999,
                background: lightText ? 'rgba(255,255,255,0.1)' : 'rgba(21,23,28,0.07)',
                border: `1px solid ${lightText ? 'rgba(255,255,255,0.18)' : 'rgba(21,23,28,0.16)'}`,
              }}>{b}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogoOverlay({ p }: { p: Project }) {
  const setSelection = useStudio(s => s.setSelection);
  const selected = useStudio(s => s.selection?.kind === 'logo');
  if (!p.logo.enabled || !p.logo.assetId) return null;
  const asset = p.assets.find(a => a.id === p.logo.assetId);
  if (!asset) return null;
  const M = Math.round(Math.min(p.canvas.w, p.canvas.h) * 0.055);
  const lw = p.logo.size * p.canvas.w;
  const lh = lw * (asset.h / asset.w);
  const pos = p.logo.position;
  const x = pos.includes('left') ? M : pos.includes('right') ? p.canvas.w - M - lw : (p.canvas.w - lw) / 2;
  const y = pos.startsWith('top') ? M : pos.startsWith('bottom') ? p.canvas.h - M - lh : (p.canvas.h - lh) / 2;
  return (
    <img
      src={asset.dataUrl} alt="logo" draggable={false}
      className={`absolute cursor-default ${selected ? 'sel-ring' : ''}`}
      style={{ left: x, top: y, width: lw, height: lh, opacity: p.logo.opacity }}
      onPointerDown={(e) => { e.stopPropagation(); setSelection({ kind: 'logo' }); }}
    />
  );
}

function IconLayer({ icon, canvasW, canvasH, onDragStart, onDragEnd }: { icon: IconLayerType; canvasW: number; canvasH: number; onDragStart: () => void; onDragEnd: () => void }) {
  // ALL hooks first - before any conditional returns
  const setSelection = useStudio(s => s.setSelection);
  const addToSelection = useStudio(s => s.addToSelection);
  const selection = useStudio(s => s.selection);
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const zoom = useStudio(s => s.zoom);
  const selected = useStudio(s => s.selection?.kind === 'icon' && (s.selection.id === icon.id || s.selection.ids?.includes(icon.id)));
  const lockedObjects = useStudio(s => s.lockedObjects);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  
  const iconDef = ICONS.find((i) => i.id === icon.iconId);
  if (!iconDef) return null;
  
  const isLocked = lockedObjects.has(`icon:${icon.id}`);
  
  const size = icon.size * Math.min(canvasW, canvasH);
  const x = icon.x * canvasW - size / 2;
  const y = icon.y * canvasH - size / 2;

  const bgColor = icon.bgColor || '#ffffff';
  const bgPadding = size * 0.2;

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    // If locked, only allow selection, no dragging
    if (isLocked) {
      setSelection({ kind: 'icon', id: icon.id, ids: [icon.id] });
      return;
    }
    
    if (e.shiftKey) {
      if (selection?.kind === 'icon' && selection.ids?.includes(icon.id)) {
        useStudio.getState().removeFromSelection('icon', icon.id);
      } else {
        addToSelection('icon', icon.id);
      }
    } else {
      setSelection({ kind: 'icon', id: icon.id, ids: [icon.id] });
    }
    
    checkpoint();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: icon.x, oy: icon.y };
    onDragStart();
  };

  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / zoom / canvasW;
    const dy = (e.clientY - drag.sy) / zoom / canvasH;
    update(p => ({
      ...p,
      icons: p.icons.map(i => i.id === icon.id ? { ...i, x: drag.ox + dx, y: drag.oy + dy } : i)
    }), false);
  };

  const onUp = () => {
    dragRef.current = null;
    onDragEnd();
  };

  return (
    <div
      className={`absolute cursor-move ${selected ? 'sel-ring' : ''}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `rotate(${icon.rotation}deg)`,
        opacity: icon.opacity,
        zIndex: icon.z || 1,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {icon.bgStyle !== 'none' && (
        <div
          className="absolute inset-0"
          style={{
            background: icon.bgStyle === 'gradient' 
              ? `linear-gradient(135deg, ${bgColor}88, ${bgColor})`
              : icon.bgStyle === 'glass'
              ? `${bgColor}33`
              : bgColor,
            borderRadius: icon.bgStyle === 'circle' ? '50%' : icon.bgStyle === 'rounded' || icon.bgStyle === 'glass' ? '20%' : icon.bgStyle === 'badge' ? '8px' : '0',
            backdropFilter: icon.bgStyle === 'glass' ? 'blur(8px)' : undefined,
            border: icon.bgStyle === 'glass' ? `1px solid ${bgColor}66` : undefined,
            boxShadow: icon.shadow 
              ? '0 4px 12px rgba(0,0,0,0.3)' 
              : icon.bgStyle === 'glass'
              ? '0 2px 8px rgba(0,0,0,0.1)'
              : undefined,
            filter: icon.glow ? `drop-shadow(0 0 8px ${bgColor})` : undefined,
          }}
        />
      )}
      
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={icon.color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute inset-0 z-10"
        style={{ 
          padding: icon.bgStyle !== 'none' ? bgPadding : 0,
          width: size,
          height: size,
        }}
      >
        <path d={iconDef.d} />
      </svg>
    </div>
  );
}

function TextBoxLayer({ textbox, canvasW, canvasH, onDragStart, onDragEnd }: { textbox: any; canvasW: number; canvasH: number; onDragStart: () => void; onDragEnd: () => void }) {
  const setSelection = useStudio(s => s.setSelection);
  const addToSelection = useStudio(s => s.addToSelection);
  const selection = useStudio(s => s.selection);
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const zoom = useStudio(s => s.zoom);
  const selected = useStudio(s => s.selection?.kind === 'textbox' && (s.selection.id === textbox.id || s.selection.ids?.includes(textbox.id)));
  const lockedObjects = useStudio(s => s.lockedObjects);
  
  const x = textbox.x * canvasW;
  const y = textbox.y * canvasH;
  const width = textbox.width * canvasW;
  
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const isLocked = lockedObjects.has(`textbox:${textbox.id}`);
  
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    // If locked, only allow selection, no dragging
    if (isLocked) {
      setSelection({ kind: 'textbox', id: textbox.id, ids: [textbox.id] });
      return;
    }
    
    if (e.shiftKey) {
      if (selection?.kind === 'textbox' && selection.ids?.includes(textbox.id)) {
        useStudio.getState().removeFromSelection('textbox', textbox.id);
      } else {
        addToSelection('textbox', textbox.id);
      }
    } else {
      setSelection({ kind: 'textbox', id: textbox.id, ids: [textbox.id] });
    }
    
    checkpoint();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: textbox.x, oy: textbox.y };
    onDragStart();
  };
  
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / zoom / canvasW;
    const dy = (e.clientY - drag.sy) / zoom / canvasH;
    update(p => ({
      ...p,
      textboxes: p.textboxes.map(t => t.id === textbox.id ? { ...t, x: drag.ox + dx, y: drag.oy + dy } : t)
    }), false);
  };
  
  const onUp = () => {
    dragRef.current = null;
    onDragEnd();
  };
  
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(textbox.text);
  
  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(textbox.text);
  };
  
  const onFinishEdit = () => {
    setIsEditing(false);
    if (editText !== textbox.text) {
      update(p => ({
        ...p,
        textboxes: p.textboxes.map(t => t.id === textbox.id ? { ...t, text: editText } : t)
      }), false);
    }
  };
  
  const onEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onFinishEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(textbox.text);
    }
  };
  
  let bgStyle: React.CSSProperties = {};
  if (textbox.bgType === 'solid') {
    bgStyle.background = textbox.bgColor;
  } else if (textbox.bgType === 'gradient') {
    bgStyle.background = textbox.bgGradient || `linear-gradient(135deg, ${textbox.bgColor}88, ${textbox.bgColor})`;
  } else if (textbox.bgType === 'glass') {
    bgStyle.background = `${textbox.bgColor}33`;
    bgStyle.backdropFilter = 'blur(8px)';
    bgStyle.border = `1px solid ${textbox.bgColor}66`;
  }
  
  return (
    <div
      className={`absolute cursor-move ${selected ? 'sel-ring' : ''}`}
      style={{
        left: x,
        top: y,
        width: width,
        transform: `rotate(${textbox.rotation}deg)`,
        opacity: textbox.opacity,
        ...bgStyle,
        padding: textbox.padding,
        borderRadius: textbox.borderRadius,
        boxShadow: textbox.shadow ? '0 4px 12px rgba(0,0,0,0.3)' : textbox.glow ? `0 0 20px ${textbox.glowColor}` : undefined,
        filter: textbox.glow ? `drop-shadow(0 0 12px ${textbox.glowColor})` : undefined,
        pointerEvents: 'auto',
        zIndex: textbox.z || 1,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onDoubleClick={onDoubleClick}
    >
      {isEditing ? (
        <textarea
          autoFocus
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={onFinishEdit}
          onKeyDown={onEditKeyDown}
          style={{
            fontFamily: textbox.fontFamily,
            fontSize: textbox.fontSize,
            fontWeight: textbox.fontWeight,
            color: textbox.color,
            textAlign: textbox.align,
            lineHeight: 1.4,
            wordWrap: 'break-word',
            width: '100%',
            minHeight: textbox.fontSize * 1.4,
            background: 'transparent',
            border: '1px dashed var(--color-acc)',
            outline: 'none',
            resize: 'none',
            padding: 0,
          }}
        />
      ) : (
        <div
          style={{
            fontFamily: textbox.fontFamily,
            fontSize: textbox.fontSize,
            fontWeight: textbox.fontWeight,
            color: textbox.color,
            textAlign: textbox.align,
            lineHeight: 1.4,
            wordWrap: 'break-word',
          }}
        >
          {textbox.text}
        </div>
      )}
    </div>
  );
}

function CanvasImageLayer({ canvasImage, canvasW, canvasH, onDragStart, onDragEnd, guides, setGuides, setDistanceInfo }: { 
  canvasImage: any; 
  canvasW: number; 
  canvasH: number; 
  onDragStart: () => void; 
  onDragEnd: () => void;
  guides: { v: number | null; h: number | null };
  setGuides: (g: { v: number | null; h: number | null }) => void;
  setDistanceInfo: (info: { left?: number; right?: number; top?: number; bottom?: number } | null) => void;
}) {
  const project = useStudio(s => s.project)!;
  const setSelection = useStudio(s => s.setSelection);
  const addToSelection = useStudio(s => s.addToSelection);
  const selection = useStudio(s => s.selection);
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const zoom = useStudio(s => s.zoom);
  const lockedObjects = useStudio(s => s.lockedObjects);
  const selected = useStudio(s => s.selection?.kind === 'canvasImage' && (s.selection.id === canvasImage.id || s.selection.ids?.includes(canvasImage.id)));
  
  const x = canvasImage.x * canvasW;
  const y = canvasImage.y * canvasH;
  const width = canvasImage.width * canvasW;
  const height = canvasImage.height * canvasH;
  
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; ow: number; oh: number; ox: number; oy: number; direction: string } | null>(null);
  const rotateRef = useRef<{ sx: number; sy: number; startAngle: number } | null>(null);
  const isLocked = lockedObjects.has(`canvasImage:${canvasImage.id}`);
  
  const asset = project.assets.find(a => a.id === canvasImage.assetId);
  if (!asset) return null;
  
  // Hide if visible is false
  if (canvasImage.visible === false) return null;
  
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    if (isLocked) {
      setSelection({ kind: 'canvasImage', id: canvasImage.id, ids: [canvasImage.id] });
      return;
    }
    
    if (e.shiftKey) {
      if (selection?.kind === 'canvasImage' && selection.ids?.includes(canvasImage.id)) {
        useStudio.getState().removeFromSelection('canvasImage', canvasImage.id);
      } else {
        addToSelection('canvasImage', canvasImage.id);
      }
    } else {
      setSelection({ kind: 'canvasImage', id: canvasImage.id, ids: [canvasImage.id] });
    }
    
    checkpoint();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: canvasImage.x, oy: canvasImage.y };
    onDragStart();
  };
  
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / zoom / canvasW;
    const dy = (e.clientY - drag.sy) / zoom / canvasH;
    
    let nx = drag.ox + dx;
    let ny = drag.oy + dy;
    
    // Calculate center for guide snapping
    const cx = nx * canvasW + width / 2;
    const cy = ny * canvasH + height / 2;
    const tx = canvasW / 2;
    const ty = canvasH / 2;
    const th = 8 / zoom;
    
    // Center snapping
    const gv = Math.abs(cx - tx) < th;
    const gh = Math.abs(cy - ty) < th;
    if (gv) nx = (tx - width / 2) / canvasW;
    if (gh) ny = (ty - height / 2) / canvasH;
    
    setGuides({ v: gv ? tx : null, h: gh ? ty : null });
    
    // Calculate distances
    const left = Math.round(nx * canvasW);
    const right = Math.round(canvasW - (nx * canvasW + width));
    const top = Math.round(ny * canvasH);
    const bottom = Math.round(canvasH - (ny * canvasH + height));
    setDistanceInfo({ left, right, top, bottom });
    
    update(p => ({
      ...p,
      canvasImages: p.canvasImages.map(img => img.id === canvasImage.id ? { ...img, x: nx, y: ny } : img)
    }), false);
  };
  
  const onUp = () => {
    dragRef.current = null;
    onDragEnd();
  };
  
  // Resize handlers
  const onResizeStart = (e: RPointerEvent<HTMLDivElement>, direction: string = 'br') => {
    e.stopPropagation();
    if (isLocked) return;
    
    checkpoint();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = { 
      sx: e.clientX, 
      sy: e.clientY, 
      ow: canvasImage.width, 
      oh: canvasImage.height,
      ox: canvasImage.x,
      oy: canvasImage.y,
      direction
    };
    onDragStart();
  };
  
  const onResizeMove = (e: RPointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current;
    if (!resize) return;
    const dx = (e.clientX - resize.sx) / zoom / canvasW;
    const dy = (e.clientY - resize.sy) / zoom / canvasH;
    
    let newWidth = resize.ow;
    let newHeight = resize.oh;
    let newX = resize.ox;
    let newY = resize.oy;
    
    const dir = resize.direction;
    
    // Handle different resize directions
    if (dir.includes('r')) {
      newWidth = resize.ow + dx;
    }
    if (dir.includes('l')) {
      newWidth = resize.ow - dx;
      newX = resize.ox + dx;
    }
    if (dir.includes('b')) {
      newHeight = resize.oh + dy;
    }
    if (dir.includes('t')) {
      newHeight = resize.oh - dy;
      newY = resize.oy + dy;
    }
    
    // Maintain aspect ratio if enabled
    if (canvasImage.maintainAspectRatio) {
      const aspectRatio = asset.w / asset.h;
      if (dir === 'br' || dir === 'tr' || dir === 'bl' || dir === 'tl') {
        if (Math.abs(dx) > Math.abs(dy)) {
          newHeight = newWidth / aspectRatio;
          if (dir.includes('t')) {
            newY = resize.oy + (resize.oh - newHeight);
          }
        } else {
          newWidth = newHeight * aspectRatio;
          if (dir.includes('l')) {
            newX = resize.ox + (resize.ow - newWidth);
          }
        }
      }
    }
    
    // Clamp minimum size
    newWidth = Math.max(0.05, newWidth);
    newHeight = Math.max(0.05, newHeight);
    
    update(p => ({
      ...p,
      canvasImages: p.canvasImages.map(img => img.id === canvasImage.id ? { 
        ...img, 
        width: newWidth, 
        height: newHeight,
        x: newX,
        y: newY
      } : img)
    }), false);
  };
  
  const onResizeEnd = () => {
    resizeRef.current = null;
    onDragEnd();
  };
  
  // Rotate handler
  const onRotateStart = (e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isLocked) return;
    
    checkpoint();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const startAngle = Math.atan2(e.clientY / zoom - centerY, e.clientX / zoom - centerX) * (180 / Math.PI);
    rotateRef.current = { sx: e.clientX, sy: e.clientY, startAngle };
    onDragStart();
  };
  
  const onRotateMove = (e: RPointerEvent<HTMLDivElement>) => {
    const rotate = rotateRef.current;
    if (!rotate) return;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const currentAngle = Math.atan2(e.clientY / zoom - centerY, e.clientX / zoom - centerX) * (180 / Math.PI);
    const deltaAngle = currentAngle - rotate.startAngle;
    
    update(p => ({
      ...p,
      canvasImages: p.canvasImages.map(img => img.id === canvasImage.id ? { ...img, rotation: img.rotation + deltaAngle } : img)
    }), false);
    
    rotate.startAngle = currentAngle;
  };
  
  const onRotateEnd = () => {
    rotateRef.current = null;
    onDragEnd();
  };
  
  // Build filter string
  const filters = [];
  if (canvasImage.brightness !== 1) filters.push(`brightness(${canvasImage.brightness})`);
  if (canvasImage.contrast !== 1) filters.push(`contrast(${canvasImage.contrast})`);
  if (canvasImage.saturation !== 1) filters.push(`saturate(${canvasImage.saturation})`);
  if (canvasImage.blur > 0) filters.push(`blur(${canvasImage.blur}px)`);
  if (canvasImage.hue !== 0) filters.push(`hue-rotate(${canvasImage.hue}deg)`);
  
  const filterString = filters.length > 0 ? filters.join(' ') : undefined;
  
  // Build shadow
  const shadowString = canvasImage.shadow 
    ? `${canvasImage.shadowOffsetX}px ${canvasImage.shadowOffsetY}px ${canvasImage.shadowBlur}px ${canvasImage.shadowColor}`
    : undefined;
  
  return (
    <div
      className={`absolute cursor-move ${selected ? 'sel-ring' : ''}`}
      style={{
        left: x,
        top: y,
        width: width,
        height: height,
        transform: `rotate(${canvasImage.rotation}deg)`,
        opacity: canvasImage.opacity,
        borderRadius: `${canvasImage.borderRadius}%`,
        boxShadow: shadowString,
        filter: canvasImage.glow ? `drop-shadow(0 0 ${canvasImage.glowBlur}px ${canvasImage.glowColor})` : undefined,
        pointerEvents: 'auto',
        zIndex: canvasImage.z || 1,
        overflow: 'hidden',
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <img 
        src={asset.dataUrl} 
        alt={asset.name}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: filterString,
        }}
      />
      
      {/* Selection handles */}
      {selected && !isLocked && (
        <>
          {/* Corner resize handles */}
          {/* Top-left */}
          <div
            className="absolute bg-acc border-2 border-ink"
            style={{ left: -6, top: -6, width: 12, height: 12, borderRadius: 2, cursor: 'nwse-resize', zIndex: 101 }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'tl'); }}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
          {/* Top-right */}
          <div
            className="absolute bg-acc border-2 border-ink"
            style={{ right: -6, top: -6, width: 12, height: 12, borderRadius: 2, cursor: 'nesw-resize', zIndex: 101 }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'tr'); }}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
          {/* Bottom-left */}
          <div
            className="absolute bg-acc border-2 border-ink"
            style={{ left: -6, bottom: -6, width: 12, height: 12, borderRadius: 2, cursor: 'nesw-resize', zIndex: 101 }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'bl'); }}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
          {/* Bottom-right */}
          <div
            className="absolute bg-acc border-2 border-ink"
            style={{ right: -6, bottom: -6, width: 12, height: 12, borderRadius: 2, cursor: 'nwse-resize', zIndex: 101 }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'br'); }}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
          
          {/* Side resize handles */}
          {/* Top */}
          <div
            className="absolute bg-acc border-2 border-ink"
            style={{ left: '50%', top: -6, transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: 2, cursor: 'ns-resize', zIndex: 101 }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 't'); }}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
          {/* Bottom */}
          <div
            className="absolute bg-acc border-2 border-ink"
            style={{ left: '50%', bottom: -6, transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: 2, cursor: 'ns-resize', zIndex: 101 }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'b'); }}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
          {/* Left */}
          <div
            className="absolute bg-acc border-2 border-ink"
            style={{ left: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: 2, cursor: 'ew-resize', zIndex: 101 }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'l'); }}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
          {/* Right */}
          <div
            className="absolute bg-acc border-2 border-ink"
            style={{ right: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: 2, cursor: 'ew-resize', zIndex: 101 }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'r'); }}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
          
          {/* Rotate handle */}
          <div
            className="absolute bg-acc2 border-2 border-ink"
            style={{
              left: '50%',
              top: -30,
              transform: 'translateX(-50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              cursor: 'grab',
              zIndex: 101,
            }}
            onPointerDown={onRotateStart}
            onPointerMove={onRotateMove}
            onPointerUp={onRotateEnd}
            onPointerCancel={onRotateEnd}
          />
        </>
      )}
    </div>
  );
}

function DeviceNode({ d, guides, setGuides, setDistanceInfo, onDragStart, onDragEnd }: {
  d: DeviceLayer;
  guides: { v: number | null; h: number | null };
  setGuides: (g: { v: number | null; h: number | null }) => void;
  setDistanceInfo: (info: { left?: number; right?: number; top?: number; bottom?: number; gapX?: number; gapY?: number } | null) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const p = useStudio(s => s.project)!;
  const selected = useStudio(s => s.selection?.kind === 'device' && (s.selection.id === d.id || s.selection.ids?.includes(d.id)));
  const setSelection = useStudio(s => s.setSelection);
  const addToSelection = useStudio(s => s.addToSelection);
  const selection = useStudio(s => s.selection);
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const zoom = useStudio(s => s.zoom);
  const assignAsset = useStudio(s => s.assignAsset);
  const [dropHot, setDropHot] = useState(false);
  const asset = p.assets.find(a => a.id === d.assetId);
  const h = d.w / DEVICE_META[d.kind].aspect;
  const dragRef = useRef<{ mode: 'move' | 'resize' | 'rotate'; sx: number; sy: number; ox: number; oy: number; ow: number; startAngle?: number } | null>(null);

  const lockedObjects = useStudio(s => s.lockedObjects);
  const isLocked = lockedObjects.has(`device:${d.id}`);
  
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    // If locked, only allow selection, no dragging
    if (isLocked) {
      setSelection({ kind: 'device', id: d.id, ids: [d.id] });
      return;
    }
    
    if (e.shiftKey) {
      if (selection?.kind === 'device' && selection.ids?.includes(d.id)) {
        useStudio.getState().removeFromSelection('device', d.id);
      } else {
        addToSelection('device', d.id);
      }
    } else {
      if (!(selection?.kind === 'device' && selection.ids?.includes(d.id))) {
        setSelection({ kind: 'device', id: d.id, ids: [d.id] });
      }
    }
    
    checkpoint();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { mode: 'move', sx: e.clientX, sy: e.clientY, ox: d.x, oy: d.y, ow: d.w };
    onDragStart();
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / zoom;
    const dy = (e.clientY - drag.sy) / zoom;
    if (drag.mode === 'move') {
      let nx = drag.ox + dx, ny = drag.oy + dy;
      const cx = nx + d.w / 2, cy = ny + h / 2;
      const tx = p.canvas.w / 2, ty = p.canvas.h / 2;
      const th = 8 / zoom;
      const gv = Math.abs(cx - tx) < th; const gh = Math.abs(cy - ty) < th;
      if (gv) nx = tx - d.w / 2;
      if (gh) ny = ty - h / 2;
      setGuides({ v: gv ? tx : null, h: gh ? ty : null });
      
      const left = Math.round(nx);
      const right = Math.round(p.canvas.w - (nx + d.w));
      const top = Math.round(ny);
      const bottom = Math.round(p.canvas.h - (ny + h));
      setDistanceInfo({ left, right, top, bottom });
      
      update(dd => {
        const selectedIds = selection?.ids || [d.id];
        const currentDevice = dd.devices.find(dev => dev.id === d.id);
        if (!currentDevice) return dd;
        
        const offsetX = nx - currentDevice.x;
        const offsetY = ny - currentDevice.y;
        
        return {
          ...dd,
          devices: dd.devices.map(x => {
            if (selectedIds.includes(x.id)) {
              return { ...x, x: x.x + offsetX, y: x.y + offsetY };
            }
            return x;
          })
        };
      }, false);
    } else if (drag.mode === 'resize') {
      const nw = clamp(drag.ow + dx, 90, p.canvas.w * 1.1);
      update(dd => ({ ...dd, devices: dd.devices.map(x => x.id === d.id ? { ...x, w: nw } : x) }), false);
    } else if (drag.mode === 'rotate') {
      const centerX = d.x + d.w / 2;
      const centerY = d.y + h / 2;
      const currentAngle = Math.atan2(e.clientY / zoom - centerY, e.clientX / zoom - centerX) * (180 / Math.PI);
      const startAngle = drag.startAngle || 0;
      const newTilt = d.tilt + (currentAngle - startAngle);
      update(dd => ({ ...dd, devices: dd.devices.map(x => x.id === d.id ? { ...x, tilt: newTilt } : x) }), false);
      drag.startAngle = currentAngle;
    }
  };
  const onUp = () => { dragRef.current = null; setGuides({ v: null, h: null }); setDistanceInfo(null); onDragEnd(); };

  const onDrop = (e: RDragEvent) => {
    e.preventDefault();
    setDropHot(false);
    const assetId = e.dataTransfer.getData('text/asset-id');
    if (assetId) assignAsset(d.id, assetId);
  };

  return (
    <div
      className="absolute cursor-move"
      data-device-id={d.id}
      style={{ 
        left: d.x, 
        top: d.y, 
        width: d.w, 
        height: h, 
        transform: `rotate(${d.tilt}deg)`, 
        display: d.visible ? undefined : 'none', 
        opacity: d.opacity ?? 1,
        zIndex: d.z ?? p.devices.indexOf(d)
      }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onDragOver={(e) => { e.preventDefault(); setDropHot(true); }}
      onDragLeave={() => setDropHot(false)}
      onDrop={onDrop}
    >
      <DeviceFrame kind={d.kind} color={d.color} w={d.w} h={h} part="back" url={d.url} radiusMul={d.radiusMul} material={d.material} reflection={d.reflection} />
      {asset
        ? <ScreenImage d={d} dataUrl={asset.dataUrl} iw={asset.w} ih={asset.h} />
        : <PlaceholderScreen d={d} highlight={dropHot} />}
      <DeviceFrame kind={d.kind} color={d.color} w={d.w} h={h} part="front" url={d.url} radiusMul={d.radiusMul} material={d.material} reflection={d.reflection} />

      {selected && (
        <>
          <svg className="absolute pointer-events-none" style={{ left: -7, top: -7, width: d.w + 14, height: h + 14, zIndex: 50 }}>
            <rect className="sel-ring-svg" x={1} y={1} width={d.w + 12} height={h + 12} rx={8} />
          </svg>
          <div className="absolute" style={{ left: -7, top: -30, background: 'var(--color-acc)', color: '#1a0e08', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, letterSpacing: '0.06em', whiteSpace: 'nowrap', zIndex: 10001, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            {d.name.toUpperCase()}
          </div>
          <div
            className="absolute"
            style={{ right: -8, bottom: -8, width: 15, height: 15, background: 'var(--color-acc)', border: '2.5px solid #101114', borderRadius: 5, cursor: 'nwse-resize', zIndex: 100 }}
            onPointerDown={(e) => {
              e.stopPropagation();
              checkpoint();
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              dragRef.current = { mode: 'resize', sx: e.clientX, sy: e.clientY, ox: d.x, oy: d.y, ow: d.w };
            }}
          />
          <div
            className="absolute"
            style={{ left: '50%', top: -35, transform: 'translateX(-50%)', width: 18, height: 18, background: 'var(--color-acc2)', border: '2.5px solid #101114', borderRadius: '50%', cursor: 'grab', zIndex: 100 }}
            title="Rotate"
            onPointerDown={(e) => {
              e.stopPropagation();
              checkpoint();
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              const centerX = d.x + d.w / 2;
              const centerY = d.y + h / 2;
              const startAngle = Math.atan2(e.clientY / zoom - centerY, e.clientX / zoom - centerX) * (180 / Math.PI);
              dragRef.current = { mode: 'rotate', sx: e.clientX, sy: e.clientY, ox: d.x, oy: d.y, ow: d.w, startAngle };
            }}
          />
        </>
      )}
    </div>
  );
}

export function StagePreview({ toolMode = 'select', onContextMenu }: { toolMode?: 'select' | 'zoom' | 'pan'; onContextMenu?: (e: React.MouseEvent) => void }) {
  const p = useStudio(s => s.project)!;
  const zoom = useStudio(s => s.zoom);
  const setZoom = useStudio(s => s.setZoom);
  const setSelection = useStudio(s => s.setSelection);
  const selection = useStudio(s => s.selection);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });
  const [distanceInfo, setDistanceInfo] = useState<{ left?: number; right?: number; top?: number; bottom?: number; gapX?: number; gapY?: number } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.92));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, setZoom]);

  const handlePanStart = (e: React.PointerEvent) => {
    if (toolMode !== 'pan') return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: panOffset.x,
      offsetY: panOffset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanMove = (e: React.PointerEvent) => {
    if (!isPanning || toolMode !== 'pan') return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPanOffset({
      x: panStartRef.current.offsetX + dx,
      y: panStartRef.current.offsetY + dy,
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleMarqueeStart = (e: React.MouseEvent) => {
    if (toolMode !== 'select' || e.shiftKey) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setMarquee({ startX: x, startY: y, endX: x, endY: y });
    
    const handleMarqueeMove = (e: MouseEvent) => {
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      setMarquee(prev => prev ? { ...prev, endX: x, endY: y } : null);
    };
    
    const handleMarqueeEnd = () => {
      setMarquee(null);
      document.removeEventListener('mousemove', handleMarqueeMove);
      document.removeEventListener('mouseup', handleMarqueeEnd);
    };
    
    document.addEventListener('mousemove', handleMarqueeMove);
    document.addEventListener('mouseup', handleMarqueeEnd);
  };

  useEffect(() => {
    if (!marquee) return;
    
    const minX = Math.min(marquee.startX, marquee.endX);
    const maxX = Math.max(marquee.startX, marquee.endX);
    const minY = Math.min(marquee.startY, marquee.endY);
    const maxY = Math.max(marquee.startY, marquee.endY);
    
    const selectedDevices = p.devices.filter(d => {
      const deviceRight = d.x + d.w;
      const deviceBottom = d.y + (d.w / DEVICE_META[d.kind].aspect);
      
      return d.x < maxX && deviceRight > minX && d.y < maxY && deviceBottom > minY;
    });
    
    if (selectedDevices.length > 0) {
      const ids = selectedDevices.map(d => d.id);
      setSelection({ kind: 'device', id: ids[0], ids });
    }
  }, [marquee]);

  const W = p.canvas.w * zoom, H = p.canvas.h * zoom;
  const sorted = [...p.devices].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCanvasBackground = target === e.currentTarget || 
                               target.classList.contains('workspace-bg') ||
                               target.closest('[data-canvas-background]');
    
    if (!isCanvasBackground) {
      return;
    }
    
    if (toolMode === 'zoom') {
      const newZoom = zoom * 1.5;
      setZoom(Math.min(newZoom, 8));
    } else if (toolMode === 'select') {
      setSelection({ kind: 'background' });
    }
  };

  return (
    <div 
      ref={wrapRef} 
      className="workspace-bg relative flex-1 overflow-auto" 
      style={{ 
        touchAction: 'none',
        cursor: toolMode === 'zoom' ? 'zoom-in' : toolMode === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default'
      }}
      onPointerDown={handlePanStart}
      onPointerMove={handlePanMove}
      onPointerUp={handlePanEnd}
      onPointerCancel={handlePanEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) {
          onContextMenu(e);
        }
      }}
    >
      <div className="flex items-start justify-center p-6 pt-8 relative z-10" style={{ 
        width: '100%', 
        minHeight: '100%', 
        minWidth: 'fit-content',
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
      }}>
        <div
          className={`relative shadow-[0_30px_90px_rgba(0,0,0,0.55)] ${selection?.kind === 'background' ? 'sel-ring' : ''}`}
          style={{ width: W, height: H }}
          data-canvas-background="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCanvasClick(e);
            }
          }}
          onPointerDown={(e: any) => {
            if (toolMode === 'select' && e.target === e.currentTarget) {
              setSelection({ kind: 'background' });
              handleMarqueeStart(e);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            
            // Check if dropped on a device
            const target = e.target as HTMLElement;
            const deviceElement = target.closest('[data-device-id]');
            
            // If dropped on device, don't create canvas image (device will handle it)
            if (!deviceElement) {
              // Calculate drop position relative to canvas
              const rect = e.currentTarget.getBoundingClientRect();
              const dropX = (e.clientX - rect.left) / zoom / p.canvas.w;
              const dropY = (e.clientY - rect.top) / zoom / p.canvas.h;
              
              // Handle different drag types
              const assetId = e.dataTransfer.getData('text/asset-id');
              const iconId = e.dataTransfer.getData('text/icon-id');
              const decoPreset = e.dataTransfer.getData('text/deco-preset');
              
              if (assetId) {
                // Add canvas image at drop position
                const addCanvasImage = useStudio.getState().addCanvasImage;
                addCanvasImage(assetId, dropX, dropY);
              } else if (iconId) {
                // Add icon at drop position
                const update = useStudio.getState().update;
                const checkpoint = useStudio.getState().checkpoint;
                const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
                
                checkpoint();
                update(p => ({
                  ...p,
                  icons: [...p.icons, {
                    id: uid(),
                    iconId: iconId,
                    x: dropX,
                    y: dropY,
                    size: 0.08,
                    color: '#ffffff',
                    opacity: 1,
                    rotation: 0,
                    bgStyle: 'none',
                    bgColor: null,
                    shadow: false,
                    glow: false,
                    z: p.icons.length + 1, // Icons start from z-index 1+
                  }],
                }));
              } else if (decoPreset) {
                // Add decoration at drop position
                const update = useStudio.getState().update;
                const checkpoint = useStudio.getState().checkpoint;
                const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
                
                checkpoint();
                update(p => ({
                  ...p,
                  decos: [...p.decos, {
                    id: uid(),
                    preset: decoPreset,
                    x: dropX,
                    y: dropY,
                    scale: 0.07,
                    rotation: 0,
                    opacity: 0.7,
                    blur: 0,
                    depth: 'front',
                    hue: null,
                    seed: Math.floor(Math.random() * 1e9),
                    z: p.decos.length + 1, // Decos start from z-index 1+
                  }],
                }), false);
              }
            }
          }}
        >
          <div className="absolute top-0 left-0 origin-top-left overflow-hidden" style={{ width: p.canvas.w, height: p.canvas.h, transform: `scale(${zoom})` }}>
            <PaintCanvas p={p} depth="all" />
            {sorted.map(d => <DeviceNode key={d.id} d={d} guides={guides} setGuides={setGuides} setDistanceInfo={setDistanceInfo} onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)} />)}
            <PaintCanvas p={p} depth="front" />
            {p.canvasImages?.sort((a, b) => (a.z || 0) - (b.z || 0)).map(canvasImage => (
              <CanvasImageLayer key={canvasImage.id} canvasImage={canvasImage} canvasW={p.canvas.w} canvasH={p.canvas.h} onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)} guides={guides} setGuides={setGuides} setDistanceInfo={setDistanceInfo} />
            ))}
            {[...p.decos].sort((a, b) => (a.z || 0) - (b.z || 0)).map(deco => (
              <DecoLayer key={deco.id} deco={deco} canvasW={p.canvas.w} canvasH={p.canvas.h} onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)} />
            ))}
            {[...p.icons].sort((a, b) => (a.z || 0) - (b.z || 0)).map(icon => (
              <IconLayer key={icon.id} icon={icon} canvasW={p.canvas.w} canvasH={p.canvas.h} onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)} />
            ))}
            {[...p.textboxes].sort((a, b) => (a.z || 0) - (b.z || 0)).map(textbox => (
              <TextBoxLayer key={textbox.id} textbox={textbox} canvasW={p.canvas.w} canvasH={p.canvas.h} onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)} />
            ))}
            <LogoOverlay p={p} />
            <TextOverlay p={p} />
            
            {marquee && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: Math.min(marquee.startX, marquee.endX),
                  top: Math.min(marquee.startY, marquee.endY),
                  width: Math.abs(marquee.endX - marquee.startX),
                  height: Math.abs(marquee.endY - marquee.startY),
                  border: '2px dashed var(--color-acc)',
                  background: 'rgba(255, 107, 61, 0.1)',
                  zIndex: 9998
                }}
              />
            )}
            
            {isDragging && selection && (() => {
              let selectedObject = null;
              let otherObjects: Array<{x: number; y: number; width: number; height: number}> = [];

              if (selection.kind === 'device') {
                const selectedDevice = p.devices.find(d => d.id === selection.id);
                if (selectedDevice) {
                  const selectedH = selectedDevice.w / DEVICE_META[selectedDevice.kind].aspect;
                  selectedObject = {
                    x: selectedDevice.x,
                    y: selectedDevice.y,
                    width: selectedDevice.w,
                    height: selectedH
                  };
                  otherObjects = p.devices.filter(d => d.id !== selection.id).map(d => ({
                    x: d.x,
                    y: d.y,
                    width: d.w,
                    height: d.w / DEVICE_META[d.kind].aspect
                  }));
                }
              } else if (selection.kind === 'icon') {
                const selectedIcon = p.icons.find(i => i.id === selection.id);
                if (selectedIcon) {
                  const size = selectedIcon.size * Math.min(p.canvas.w, p.canvas.h);
                  selectedObject = {
                    x: selectedIcon.x * p.canvas.w - size / 2,
                    y: selectedIcon.y * p.canvas.h - size / 2,
                    width: size,
                    height: size
                  };
                  otherObjects = p.icons.filter(i => i.id !== selection.id).map(i => {
                    const s = i.size * Math.min(p.canvas.w, p.canvas.h);
                    return {
                      x: i.x * p.canvas.w - s / 2,
                      y: i.y * p.canvas.h - s / 2,
                      width: s,
                      height: s
                    };
                  });
                }
              } else if (selection.kind === 'deco') {
                const selectedDeco = p.decos.find(d => d.id === selection.id);
                if (selectedDeco) {
                  const size = selectedDeco.scale * Math.min(p.canvas.w, p.canvas.h);
                  selectedObject = {
                    x: selectedDeco.x * p.canvas.w - size / 2,
                    y: selectedDeco.y * p.canvas.h - size / 2,
                    width: size,
                    height: size
                  };
                  otherObjects = p.decos.filter(d => d.id !== selection.id).map(d => {
                    const s = d.scale * Math.min(p.canvas.w, p.canvas.h);
                    return {
                      x: d.x * p.canvas.w - s / 2,
                      y: d.y * p.canvas.h - s / 2,
                      width: s,
                      height: s
                    };
                  });
                }
              } else if (selection.kind === 'textbox') {
                const selectedTextbox = p.textboxes.find(t => t.id === selection.id);
                if (selectedTextbox) {
                  const estimatedHeight = selectedTextbox.fontSize * 1.5;
                  selectedObject = {
                    x: selectedTextbox.x * p.canvas.w,
                    y: selectedTextbox.y * p.canvas.h,
                    width: selectedTextbox.width * p.canvas.w,
                    height: estimatedHeight
                  };
                  otherObjects = p.textboxes.filter(t => t.id !== selection.id).map(t => ({
                    x: t.x * p.canvas.w,
                    y: t.y * p.canvas.h,
                    width: t.width * p.canvas.w,
                    height: t.fontSize * 1.5
                  }));
                }
              } else if (selection.kind === 'text') {
                // Main text block (title/subtitle)
                const textBlock = p.text;
                if (textBlock && textBlock.enabled) {
                  const M = Math.round(Math.min(p.canvas.w, p.canvas.h) * 0.055);
                  const ts = clamp(p.canvas.w * 0.037, 24, 58) * textBlock.scale;
                  const estimatedWidth = p.canvas.w * 0.6;
                  const estimatedHeight = ts * 2.5;
                  
                  // Calculate position based on textBlock.position
                  let textX = M;
                  let textY = p.canvas.h - M - estimatedHeight;
                  
                  if (textBlock.x !== undefined && textBlock.y !== undefined) {
                    textX = textBlock.x;
                    textY = textBlock.y;
                  } else {
                    // Use position preset
                    if (textBlock.position.includes('left')) textX = M;
                    else if (textBlock.position.includes('right')) textX = p.canvas.w - M - estimatedWidth;
                    else textX = (p.canvas.w - estimatedWidth) / 2;
                    
                    if (textBlock.position.startsWith('top')) textY = M;
                    else if (textBlock.position.startsWith('bottom')) textY = p.canvas.h - M - estimatedHeight;
                    else textY = (p.canvas.h - estimatedHeight) / 2;
                  }
                  
                  selectedObject = {
                    x: textX,
                    y: textY,
                    width: estimatedWidth,
                    height: estimatedHeight
                  };
                  
                  // Other objects for alignment
                  otherObjects = [
                    ...p.devices.map(d => ({
                      x: d.x,
                      y: d.y,
                      width: d.w,
                      height: d.w / DEVICE_META[d.kind].aspect
                    })),
                    ...p.textboxes.map(t => ({
                      x: t.x * p.canvas.w,
                      y: t.y * p.canvas.h,
                      width: t.width * p.canvas.w,
                      height: t.fontSize * 1.5
                    }))
                  ];
                }
              } else if (selection.kind === 'canvasImage') {
                const selectedCanvasImage = p.canvasImages?.find(img => img.id === selection.id);
                if (selectedCanvasImage) {
                  const asset = p.assets.find(a => a.id === selectedCanvasImage.assetId);
                  if (asset) {
                    const imgW = selectedCanvasImage.width * p.canvas.w;
                    const imgH = selectedCanvasImage.height * p.canvas.h;
                    selectedObject = {
                      x: selectedCanvasImage.x * p.canvas.w,
                      y: selectedCanvasImage.y * p.canvas.h,
                      width: imgW,
                      height: imgH
                    };
                    otherObjects = [
                      ...p.devices.map(d => ({
                        x: d.x,
                        y: d.y,
                        width: d.w,
                        height: d.w / DEVICE_META[d.kind].aspect
                      })),
                      ...(p.canvasImages || []).filter(img => img.id !== selection.id).map(img => ({
                        x: img.x * p.canvas.w,
                        y: img.y * p.canvas.h,
                        width: img.width * p.canvas.w,
                        height: img.height * p.canvas.h
                      }))
                    ];
                  }
                }
              }

              if (!selectedObject) return null;

              return (
                <AdvancedGrid 
                  canvasWidth={p.canvas.w}
                  canvasHeight={p.canvas.h}
                  zoom={zoom}
                  isDragging={isDragging}
                  selectedObject={selectedObject}
                  otherObjects={otherObjects}
                />
              );
            })()}

            {guides.v != null && (
              <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: guides.v, width: 1, background: 'var(--color-acc)', opacity: 0.6 }} />
            )}
            {guides.h != null && (
              <div className="absolute left-0 right-0 pointer-events-none" style={{ top: guides.h, height: 1, background: 'var(--color-acc)', opacity: 0.6 }} />
            )}

            {distanceInfo && (
              <>
                {distanceInfo.left !== undefined && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] font-mono pointer-events-none" style={{ background: 'rgba(255,107,61,0.9)', color: 'white' }}>
                    {distanceInfo.left}px
                  </div>
                )}
                {distanceInfo.right !== undefined && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] font-mono pointer-events-none" style={{ background: 'rgba(255,107,61,0.9)', color: 'white' }}>
                    {distanceInfo.right}px
                  </div>
                )}
                {distanceInfo.top !== undefined && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-mono pointer-events-none" style={{ background: 'rgba(255,107,61,0.9)', color: 'white' }}>
                    {distanceInfo.top}px
                  </div>
                )}
                {distanceInfo.bottom !== undefined && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-mono pointer-events-none" style={{ background: 'rgba(255,107,61,0.9)', color: 'white' }}>
                    {distanceInfo.bottom}px
                  </div>
                )}
              </>
            )}

            {p.devices.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-6 py-4 text-center" style={{ border: '1.5px dashed rgba(255,255,255,0.25)', borderRadius: 12 }}>
                  <div style={{ fontFamily: 'var(--font-disp)', fontWeight: 600, fontSize: 20, color: textOn(p.background.c1) }}>Canvas is empty</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: textOn(p.background.c1), opacity: 0.6, marginTop: 4 }}>add a device from the left panel</div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute -bottom-7 left-0 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--color-dim)' }}>
            <span>{p.canvas.w} × {p.canvas.h}</span>
            <span style={{ color: '#3a3f4b' }}>·</span>
            <span>{p.devices.length} device{p.devices.length === 1 ? '' : 's'}</span>
            <span style={{ color: '#3a3f4b' }}>·</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
