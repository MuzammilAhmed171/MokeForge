import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useStudio } from '../store';
import { makeThumbnail, renderProject } from '../renderer';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { StagePreview } from './StagePreview';
import { ExportModal } from './ExportModal';
import { GeneratePanel } from './GeneratePanel';
import { ShortcutsModal } from './ShortcutsModal';
import { ContextMenu } from './ContextMenu';
import { CommandPalette } from './CommandPalette';
import { AuthExportModal } from './AuthExportModal';
import { DesktopOnlyView } from './DesktopOnlyView';
import { clamp } from '../templates';
import {
  IcArrowL, IcDice, IcDownload, IcExport, IcFit, IcRedo, IcSave, IcStar, IcUndo, IcUpload, IcWand, IcZoomIn, IcZoomOut, LogoMark, IcEye, IcLock,
} from '../icons';

export function Editor() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [guestAuthModalOpen, setGuestAuthModalOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const undo = useStudio(s => s.undo);
  const redo = useStudio(s => s.redo);
  const canUndo = useStudio(s => s.past.length > 0);
  const canRedo = useStudio(s => s.future.length > 0);
  const randomize = useStudio(s => s.randomize);
  const save = useStudio(s => s.save);
  const dirty = useStudio(s => s.dirty);
  const closeEditor = useStudio(s => s.closeEditor);
  const setExportOpen = useStudio(s => s.setExportOpen);
  const addFiles = useStudio(s => s.addFiles);
  const selection = useStudio(s => s.selection);
  const setSelection = useStudio(s => s.setSelection);
  const removeDevice = useStudio(s => s.removeDevice);
  const duplicateDevice = useStudio(s => s.duplicateDevice);
  const checkpoint = useStudio(s => s.checkpoint);
  const zoom = useStudio(s => s.zoom);
  const setZoom = useStudio(s => s.setZoom);
  const toast = useStudio(s => s.toast);
  const setGenOpen = useStudio(s => s.setGenOpen);
  const favorite = useStudio(s => s.favorite);
  const favorites = useStudio(s => s.favorites);
  const exportMockup = useStudio(s => s.exportMockup);
  const importMockup = useStudio(s => s.importMockup);
  const mockupRef = useRef<HTMLInputElement>(null);
  const [toolMode, setToolMode] = useState<'select' | 'zoom' | 'pan'>('select');
  const [previewMode, setPreviewMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const saveNow = useCallback(async (silent = false) => {
    const p = useStudio.getState().project;
    if (!p) return;
    try {
      const thumb = await makeThumbnail(p);
      update(pp => ({ ...pp, thumbnail: thumb }), false);
    } catch { }
    useStudio.getState().save(silent);
  }, [update]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); void saveNow(false); }
      else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selection?.kind === 'device' && selection.id) {
          duplicateDevice(selection.id);
        } else if (selection?.kind === 'canvasImage' && selection.id) {
          const project = useStudio.getState().project;
          if (project) {
            const canvasImage = project.canvasImages?.find(img => img.id === selection.id);
            if (canvasImage) {
              checkpoint();
              update(p => ({
                ...p,
                canvasImages: [...(p.canvasImages || []), { ...canvasImage, id: Math.random().toString(36).slice(2), x: canvasImage.x + 0.02, y: canvasImage.y + 0.02 }]
              }));
              toast('Canvas image duplicated');
            }
          }
        }
      }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selection?.id) {
        e.preventDefault();
        if (selection.kind === 'device') {
          removeDevice(selection.id);
        } else if (selection.kind === 'icon') {
          const removeIcon = useStudio.getState().removeIcon;
          removeIcon(selection.id);
        } else if (selection.kind === 'textbox') {
          const removeTextBox = useStudio.getState().removeTextBox;
          removeTextBox(selection.id);
        } else if (selection.kind === 'deco') {
          update(p => ({ ...p, decos: p.decos.filter(d => d.id !== selection.id) }), false);
          setSelection(null);
        } else if (selection.kind === 'canvasImage') {
          const removeCanvasImage = useStudio.getState().removeCanvasImage;
          removeCanvasImage(selection.id);
        }
      }
      else if (e.key === 'Escape') {
        setSelection(null);
        setToolMode('select');
        setPreviewMode(false);
      }
      else if (e.key === 'z' && !mod) {
        setToolMode(prev => prev === 'zoom' ? 'select' : 'zoom');
      }
      else if (e.key === 'h' && !mod) {
        setToolMode(prev => prev === 'pan' ? 'select' : 'pan');
      }
      else if (e.key === 'p' && !mod) {
        setPreviewMode(prev => !prev);
      }
      else if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(zoom * 1.2);
      }
      else if (mod && e.key === '-') {
        e.preventDefault();
        setZoom(zoom * 0.8);
      }
      else if (mod && e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
      else if (e.key.startsWith('Arrow') && selection?.id) {
        e.preventDefault();
        
        let step = 4;
        if (e.shiftKey && mod) step = 10;
        else if (e.shiftKey) step = 20;
        else if (mod) step = 1;
        
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        
        checkpoint();
        
        if (selection.kind === 'device') {
          update(p => ({ ...p, devices: p.devices.map(d => d.id === selection.id ? { ...d, x: d.x + dx, y: d.y + dy } : d) }), false);
        } else if (selection.kind === 'icon') {
          update(p => ({ ...p, icons: p.icons.map(i => i.id === selection.id ? { ...i, x: i.x + (dx / p.canvas.w), y: i.y + (dy / p.canvas.h) } : i) }), false);
        } else if (selection.kind === 'textbox') {
          update(p => ({ ...p, textboxes: p.textboxes.map(t => t.id === selection.id ? { ...t, x: t.x + (dx / p.canvas.w), y: t.y + (dy / p.canvas.h) } : t) }), false);
        } else if (selection.kind === 'deco') {
          update(p => ({ ...p, decos: p.decos.map(d => d.id === selection.id ? { ...d, x: d.x + (dx / p.canvas.w), y: d.y + (dy / p.canvas.h) } : d) }), false);
        } else if (selection.kind === 'canvasImage') {
          update(p => ({ ...p, canvasImages: (p.canvasImages || []).map(img => img.id === selection.id ? { ...img, x: img.x + (dx / p.canvas.w), y: img.y + (dy / p.canvas.h) } : img) }), false);
        }
      }
      else if (mod && e.key.toLowerCase() === 'g') { e.preventDefault(); setGenOpen(true); }
      else if (mod && e.key.toLowerCase() === 'e') { e.preventDefault(); setExportOpen(true); }
      else if (mod && e.shiftKey && e.key.toLowerCase() === 'r') { e.preventDefault(); randomize(); }
      else if (mod && e.key === '[') { e.preventDefault(); setZoom(zoom * 0.9); }
      else if (mod && e.key === ']') { e.preventDefault(); setZoom(zoom * 1.1); }
      else if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      else if (mod && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        useStudio.getState().copySelection();
      }
      else if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        useStudio.getState().pasteClipboard();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, saveNow, selection, duplicateDevice, removeDevice, setSelection, checkpoint, update]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'));
      if (files.length) { e.preventDefault(); void addFiles(files); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  const fitZoom = () => {
    const availW = window.innerWidth - 264 - 292 - 120;
    const availH = window.innerHeight - 48 - 70;
    setZoom(clamp(Math.min(availW / project.canvas.w, availH / project.canvas.h), 0.1, 2));
  };

  useEffect(() => { fitZoom(); }, []);

  useEffect(() => {
    if (isAuthenticated && sessionStorage.getItem('mockforge_pending_export') === 'true') {
      sessionStorage.removeItem('mockforge_pending_export');
      setExportOpen(true);
    }
  }, [isAuthenticated, setExportOpen]);

  const handleBack = () => {
    if (isAuthenticated) {
      closeEditor();
      navigate('/dashboard');
    } else {
      void saveNow(true);
      navigate('/');
    }
  };

  if (isSmallScreen) {
    return <DesktopOnlyView />;
  }

  return (
    <div className="h-full flex flex-col anim-fade-in">
      <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-line2 bg-panel relative z-20">
        <button className="icon-btn" onClick={handleBack} title={isAuthenticated ? "Back to dashboard" : "Back to Home"}><IcArrowL size={16} /></button>
        <LogoMark size={19} />
        <input
          className="bg-transparent outline-none border border-transparent hover:border-line focus:border-acc rounded-md px-2 py-1 transition-colors w-[220px]"
          style={{ fontFamily: 'var(--font-disp)', fontWeight: 600, fontSize: 14 }}
          value={project.name}
          onChange={(e) => update(p => ({ ...p, name: e.target.value }), false)}
          onFocus={() => checkpoint()}
        />
        <span className="flex items-center gap-1.5 text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: dirty ? 'var(--color-gold)' : 'var(--color-acc2)', animation: dirty ? 'pulseDot 1.4s infinite' : undefined }} />
          {dirty ? 'unsaved' : 'saved'}
        </span>

        {!isAuthenticated && (
          <button
            onClick={() => setGuestAuthModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-acc/10 text-acc border border-acc/25 hover:bg-acc/20 transition-all cursor-pointer"
            title="Trial Mode: Sign in to sync your designs to your account"
          >
            <IcLock size={11} />
            <span>Trial Mode · Sign In to Sync</span>
          </button>
        )}

        <div className="flex-1" />

        <button className="icon-btn" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)"><IcUndo size={15} /></button>
        <button className="icon-btn" disabled={!canRedo} onClick={redo} title="Redo (Ctrl+Shift+Z)"><IcRedo size={15} /></button>

        <div className="w-px h-5 bg-line mx-1" />

        <button 
          className={`icon-btn ${toolMode === 'zoom' ? 'bg-acc/20 text-acc' : ''}`} 
          onClick={() => setToolMode(toolMode === 'zoom' ? 'select' : 'zoom')}
          title="Zoom Tool (Z)"
        >
          <IcZoomIn size={15} />
        </button>
        <button 
          className="icon-btn"
          onClick={() => setZoom(zoom * 0.8)}
          title="Zoom Out"
        >
          <IcZoomOut size={15} />
        </button>
        <button 
          className={`icon-btn ${previewMode ? 'bg-acc/20 text-acc' : ''}`} 
          onClick={() => setPreviewMode(!previewMode)}
          title="Preview Mode (P)"
        >
          <IcEye size={15} />
        </button>

        <div className="w-px h-5 bg-line mx-1" />

        <button className="btn btn-acc" onClick={() => setGenOpen(true)} title="Design Engine">
          <IcWand size={14} />
          <span>Design Engine</span>
        </button>
        <button className="btn" onClick={randomize} title="Surprise me">
          <IcDice size={14} />
          <span>Surprise</span>
        </button>
        <button className="btn" onClick={() => void saveNow(false)}>
          <IcSave size={14} />
          <span>Save</span>
        </button>
        <button className="btn" onClick={() => setExportOpen(true)}>
          <IcExport size={14} />
          <span>Export</span>
        </button>

        <div className="w-px h-5 bg-line mx-1" />
        <button 
          className={`icon-btn ${favorites.some(f => f.label === project.name) ? 'text-gold' : ''}`}
          title={favorites.some(f => f.label === project.name) ? 'Already in favorites' : 'Save to favorites'}
          onClick={() => void favorite()}
        >
          <IcStar size={15} />
        </button>
        <button
          className="icon-btn"
          title="Download .mockup"
          onClick={() => {
            if (!isAuthenticated) {
              setGuestAuthModalOpen(true);
            } else {
              exportMockup();
            }
          }}
        >
          <IcDownload size={15} />
        </button>
        <button className="icon-btn" title="Import .mockup" onClick={() => mockupRef.current?.click()}><IcUpload size={15} /></button>
        <input
          ref={mockupRef} type="file" hidden accept=".json,application/json"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void importMockup(f); e.target.value = ''; }}
        />
        <ShortcutsModal />
      </div>

      {previewMode ? (
        <PreviewOverlay 
          zoom={zoom} 
          setZoom={setZoom} 
          onExit={() => setPreviewMode(false)} 
          project={project}
        />
      ) : (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <LeftPanel />
          <div className="flex-1 flex flex-col min-w-0 h-full">
            <StagePreview toolMode={toolMode} onContextMenu={(e: React.MouseEvent) => setContextMenu({ x: e.clientX, y: e.clientY })} />
            <div className="h-9 shrink-0 border-t border-line2 bg-panel flex items-center justify-between px-3">
              <span className="text-[10.5px] hidden md:block" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>
                {toolMode === 'zoom' ? 'Zoom mode - Click to zoom in' : 
                 toolMode === 'pan' ? 'Pan mode - Drag to pan canvas' :
                 'drag to move · ctrl+scroll to zoom · ctrl+v paste screenshot'}
              </span>
              <div className="flex items-center gap-1">
                <button className="icon-btn !w-7 !h-7" onClick={() => setZoom(zoom * 0.85)}><IcZoomOut size={13} /></button>
                <span className="text-[10.5px] w-10 text-center" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-mut)' }}>{Math.round(zoom * 100)}%</span>
                <button className="icon-btn !w-7 !h-7" onClick={() => setZoom(zoom * 1.18)}><IcZoomIn size={13} /></button>
                <button className="icon-btn !w-7 !h-7" onClick={fitZoom} title="Fit to screen"><IcFit size={13} /></button>
              </div>
            </div>
          </div>
          <RightPanel />
        </div>
      )}

      <ExportModal />
      <AuthExportModal
        open={guestAuthModalOpen}
        onClose={() => setGuestAuthModalOpen(false)}
        onSuccess={() => setExportOpen(true)}
        pendingAction="download"
      />
      <GeneratePanel />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
      {commandPaletteOpen && (
        <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
      )}
      {project.devices.length === 0 && project.assets.length === 0 && (
        <FirstRunHint onPick={() => toast('Add a device or drop a screenshot to begin', 'info')} />
      )}
    </div>
  );
}

/* ---------- Fullscreen Preview Overlay ---------- */
function PreviewOverlay({ zoom, setZoom, onExit, project }: { zoom: number; setZoom: (z: number) => void; onExit: () => void; project: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [canvasUrl, setCanvasUrl] = useState<string | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Render the project to a canvas image
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const canvas = await renderProject(project, { scale: 2 });
        if (!cancelled) setCanvasUrl(canvas.toDataURL('image/png'));
      } catch { /* fail silently */ }
    })();
    return () => { cancelled = true; };
  }, [project]);

  // Enter browser fullscreen on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    } catch { /* fullscreen may not be available */ }

    const onFsChange = () => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        onExit();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Fit to screen on load
  useEffect(() => {
    if (!canvasUrl) return;
    const img = new Image();
    img.onload = () => {
      const sw = window.screen.width || window.innerWidth;
      const sh = window.screen.height || window.innerHeight;
      const fitZoom = Math.min(sw / img.naturalWidth, sh / img.naturalHeight) * 0.9;
      setPreviewZoom(clamp(fitZoom, 0.05, 5));
      setPanX(0);
      setPanY(0);
    };
    img.src = canvasUrl;
  }, [canvasUrl]);

  // ESC key handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitPreview();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-hide controls after 3s of inactivity
  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    };
    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  const exitPreview = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    } catch { /* ignore */ }
    onExit();
  };

  // Zoom handlers
  const zoomIn = () => setPreviewZoom(z => clamp(z * 1.25, 0.05, 10));
  const zoomOut = () => setPreviewZoom(z => clamp(z * 0.8, 0.05, 10));
  const zoomFit = () => {
    if (!canvasUrl) return;
    const img = new Image();
    img.onload = () => {
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      const fitZ = Math.min(sw / img.naturalWidth, sh / img.naturalHeight) * 0.9;
      setPreviewZoom(clamp(fitZ, 0.05, 5));
      setPanX(0);
      setPanY(0);
    };
    img.src = canvasUrl;
  };

  // Attach non-passive wheel listener to strictly prevent Chrome/browser zooming
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Always prevent default browser pinch/page zoom
      e.preventDefault();
      e.stopPropagation();

      // If user is pinching on trackpad (which fires wheel with ctrlKey) or scrolling
      const factor = e.deltaY < 0 ? 1.12 : 0.88;
      setPreviewZoom(z => clamp(z * factor, 0.05, 10));
    };

    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('gesturestart', handleGesture, { passive: false });
    el.addEventListener('gesturechange', handleGesture, { passive: false });
    el.addEventListener('gestureend', handleGesture, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('gesturestart', handleGesture);
      el.removeEventListener('gesturechange', handleGesture);
      el.removeEventListener('gestureend', handleGesture);
    };
  }, []);

  // Drag to pan
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: panX, oy: panY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPanX(dragRef.current.ox + (e.clientX - dragRef.current.sx));
    setPanY(dragRef.current.oy + (e.clientY - dragRef.current.sy));
  };
  const onPointerUp = () => { dragRef.current = null; };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#0a0b0e] cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Rendered preview */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        {canvasUrl ? (
          <img
            src={canvasUrl}
            alt="Preview"
            draggable={false}
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${previewZoom})`,
              transformOrigin: 'center center',
              maxWidth: 'none',
              maxHeight: 'none',
              imageRendering: previewZoom > 2 ? 'pixelated' : 'auto',
              transition: dragRef.current ? 'none' : 'transform 0.15s ease-out',
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-acc border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-mut" style={{ fontFamily: 'var(--font-mono)' }}>Rendering preview...</span>
          </div>
        )}
      </div>

      {/* Floating controls — auto-hide after 3s */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/10 shadow-2xl"
        style={{
          background: 'rgba(14,15,20,0.85)',
          backdropFilter: 'blur(16px)',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        <button className="preview-ctrl-btn" onClick={zoomOut} title="Zoom Out">
          <IcZoomOut size={16} />
        </button>
        <span
          className="text-[11px] w-12 text-center select-none"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-mut)' }}
        >
          {Math.round(previewZoom * 100)}%
        </span>
        <button className="preview-ctrl-btn" onClick={zoomIn} title="Zoom In">
          <IcZoomIn size={16} />
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <button className="preview-ctrl-btn" onClick={zoomFit} title="Fit to Screen">
          <IcFit size={16} />
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <button
          className="preview-ctrl-btn px-3 text-[11px] font-medium"
          onClick={exitPreview}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          ESC
        </button>
      </div>

      {/* Top-right close button (always visible on hover) */}
      <button
        className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
        style={{
          background: 'rgba(14,15,20,0.7)',
          backdropFilter: 'blur(12px)',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none',
        }}
        onClick={exitPreview}
        title="Exit Preview"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

function FirstRunHint({ onPick }: { onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className="fixed bottom-14 left-1/2 -translate-x-1/2 z-30 anim-fade-up flex items-center gap-2 px-4 py-2 rounded-full border border-line bg-panel2 shadow-xl cursor-pointer hover:border-[#4a4f5c] transition-colors"
      style={{ animationDelay: '.6s' }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--color-acc)', animation: 'pulseDot 1.6s infinite' }} />
      <span className="text-[12px] text-mut">
        Start: drop a screenshot, or try <span className="text-fg font-medium">Insert sample screens</span> in the Screens tab
      </span>
    </button>
  );
}
