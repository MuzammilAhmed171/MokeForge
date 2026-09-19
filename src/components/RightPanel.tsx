import { useState } from 'react';
import { useStudio } from '../store';
import type { BgStyle, DeviceLayer, LightType, Material, PatternKind, ShadowPreset } from '../types';
import {
  clamp, DECO_SETS, DEVICE_META, FIT_MODES, LIGHTING, MATERIALS, PATTERNS, SHADOWS,
  TECH_BADGES, TYPO_PRESETS, textOn, suggestFitMode,
} from '../templates';
import { DECO_PRESETS } from '../templates';
import { ColorInput, PosGrid, Section, Seg, SliderRow, Toggle } from './ui';
import {
  IcAlignH, IcAlignV, IcArrowL, IcCopy, IcDown, IcEye, IcEyeOff, IcLayers, IcLock, IcTrash, IcUnlock, IcUp,
} from '../icons';

const BG_STYLE_OPTS: { id: BgStyle; label: string }[] = [
  { id: 'plain', label: 'Clean' }, { id: 'studio', label: 'Studio' }, { id: 'abstract', label: 'Abstract' },
  { id: 'architectural', label: 'Arch' }, { id: 'grid', label: 'Grid' }, { id: 'editorial', label: 'Editorial' },
  { id: 'tech', label: 'Tech' }, { id: 'glass', label: 'Glass' },
];

export function RightPanel() {
  const selection = useStudio(s => s.selection);
  const project = useStudio(s => s.project)!;
  const device = selection?.kind === 'device' ? project.devices.find(d => d.id === selection.id) : undefined;
  const icon = selection?.kind === 'icon' ? project.icons.find(i => i.id === selection.id) : undefined;
  const deco = selection?.kind === 'deco' ? project.decos.find(d => d.id === selection.id) : undefined;
  const textbox = selection?.kind === 'textbox' ? project.textboxes.find(t => t.id === selection.id) : undefined;
  const canvasImage = selection?.kind === 'canvasImage' ? project.canvasImages?.find((img: any) => img.id === selection.id) : undefined;

  return (
    <div className="w-[292px] shrink-0 border-l border-line2 bg-panel flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-ink min-h-0">
        {selection && <QuickActions />}
        {selection && selection.kind !== 'background' && <UniversalTransform />}
        {device ? <DeviceProps d={device} />
          : canvasImage ? <CanvasImageProps img={canvasImage} />
          : icon ? <IconProps i={icon} />
          : deco ? <DecoProps d={deco} />
          : textbox ? <TextBoxProps t={textbox} />
          : selection?.kind === 'text' ? <TextProps />
          : selection?.kind === 'logo' ? <LogoProps />
          : <BackgroundProps />}
        <LayersList />
      </div>
    </div>
  );
}

function UniversalTransform() {
  const selection = useStudio(s => s.selection);
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const lockedObjects = useStudio(s => s.lockedObjects);

  if (!selection || !selection.id) return null;

  const isLocked = lockedObjects.has(`${selection.kind}:${selection.id}`);

  // Get object based on selection kind
  let obj: any = null;
  if (selection.kind === 'device') {
    obj = project.devices.find(d => d.id === selection.id);
  } else if (selection.kind === 'icon') {
    obj = project.icons.find(i => i.id === selection.id);
  } else if (selection.kind === 'textbox') {
    obj = project.textboxes.find(t => t.id === selection.id);
  } else if (selection.kind === 'deco') {
    obj = project.decos.find(d => d.id === selection.id);
  }

  if (!obj) return null;

  const handleReset = () => {
    checkpoint();
    if (selection.kind === 'device') {
      update(p => ({
        ...p,
        devices: p.devices.map(d => d.id === selection.id ? {
          ...d,
          x: (p.canvas.w - d.w) / 2,
          y: (p.canvas.h - d.w / DEVICE_META[d.kind].aspect) / 2,
          tilt: 0,
          opacity: 1,
        } : d)
      }));
    } else if (selection.kind === 'icon') {
      update(p => ({
        ...p,
        icons: p.icons.map(i => i.id === selection.id ? {
          ...i,
          x: 0.5,
          y: 0.5,
          rotation: 0,
          opacity: 1,
        } : i)
      }));
    } else if (selection.kind === 'textbox') {
      update(p => ({
        ...p,
        textboxes: p.textboxes.map(t => t.id === selection.id ? {
          ...t,
          x: 0.5,
          y: 0.5,
          rotation: 0,
          opacity: 1,
        } : t)
      }));
    } else if (selection.kind === 'deco') {
      update(p => ({
        ...p,
        decos: p.decos.map(d => d.id === selection.id ? {
          ...d,
          x: 0.5,
          y: 0.5,
          rotation: 0,
          opacity: 1,
        } : d)
      }));
    }
  };

  return (
    <div className="px-3.5 py-3 border-b border-line2">
      <div className="flex items-center justify-between mb-2">
        <div className="label-mono">Transform</div>
        <button
          className="text-[9px] px-2 py-0.5 rounded border border-line hover:border-acc hover:text-acc transition-colors"
          onClick={handleReset}
          disabled={isLocked}
          title="Reset Transform"
        >
          Reset
        </button>
      </div>

      {isLocked && (
        <div className="text-[10px] text-acc mb-2 flex items-center gap-1">
          <IcLock size={10} />
          <span>Object Locked</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* Position */}
        <div>
          <div className="text-[9px] text-dim mb-0.5">X</div>
          <input
            type="number"
            className="input !py-1 !text-[11px]"
            value={Math.round(selection.kind === 'device' ? obj.x : obj.x * project.canvas.w)}
            onChange={(e) => {
              checkpoint();
              const val = parseFloat(e.target.value);
              if (selection.kind === 'device') {
                update(p => ({ ...p, devices: p.devices.map(d => d.id === selection.id ? { ...d, x: val } : d) }), false);
              } else {
                update(p => ({ ...p, [selection.kind === 'icon' ? 'icons' : selection.kind === 'textbox' ? 'textboxes' : 'decos']: p[selection.kind === 'icon' ? 'icons' : selection.kind === 'textbox' ? 'textboxes' : 'decos'].map((i: any) => i.id === selection.id ? { ...i, x: val / p.canvas.w } : i) }), false);
              }
            }}
            disabled={isLocked}
          />
        </div>
        <div>
          <div className="text-[9px] text-dim mb-0.5">Y</div>
          <input
            type="number"
            className="input !py-1 !text-[11px]"
            value={Math.round(selection.kind === 'device' ? obj.y : obj.y * project.canvas.h)}
            onChange={(e) => {
              checkpoint();
              const val = parseFloat(e.target.value);
              if (selection.kind === 'device') {
                update(p => ({ ...p, devices: p.devices.map(d => d.id === selection.id ? { ...d, y: val } : d) }), false);
              } else {
                update(p => ({ ...p, [selection.kind === 'icon' ? 'icons' : selection.kind === 'textbox' ? 'textboxes' : 'decos']: p[selection.kind === 'icon' ? 'icons' : selection.kind === 'textbox' ? 'textboxes' : 'decos'].map((i: any) => i.id === selection.id ? { ...i, y: val / p.canvas.h } : i) }), false);
              }
            }}
            disabled={isLocked}
          />
        </div>

        {/* Size (only for devices) */}
        {selection.kind === 'device' && (
          <>
            <div>
              <div className="text-[9px] text-dim mb-0.5">Width</div>
              <input
                type="number"
                className="input !py-1 !text-[11px]"
                value={Math.round(obj.w)}
                onChange={(e) => {
                  checkpoint();
                  const val = parseFloat(e.target.value);
                  update(p => ({ ...p, devices: p.devices.map(d => d.id === selection.id ? { ...d, w: val } : d) }), false);
                }}
                disabled={isLocked}
              />
            </div>
            <div>
              <div className="text-[9px] text-dim mb-0.5">Height</div>
              <input
                type="number"
                className="input !py-1 !text-[11px]"
                value={Math.round(obj.w / DEVICE_META[obj.kind as keyof typeof DEVICE_META].aspect)}
                disabled
                title="Height is calculated from width and aspect ratio"
              />
            </div>
          </>
        )}

        {/* Rotation */}
        <div>
          <div className="text-[9px] text-dim mb-0.5">Rotation</div>
          <input
            type="number"
            className="input !py-1 !text-[11px]"
            value={Math.round(selection.kind === 'device' ? obj.tilt : obj.rotation)}
            onChange={(e) => {
              checkpoint();
              const val = parseFloat(e.target.value);
              if (selection.kind === 'device') {
                update(p => ({ ...p, devices: p.devices.map(d => d.id === selection.id ? { ...d, tilt: val } : d) }), false);
              } else {
                update(p => ({ ...p, [selection.kind === 'icon' ? 'icons' : selection.kind === 'textbox' ? 'textboxes' : 'decos']: p[selection.kind === 'icon' ? 'icons' : selection.kind === 'textbox' ? 'textboxes' : 'decos'].map((i: any) => i.id === selection.id ? { ...i, rotation: val } : i) }), false);
              }
            }}
            disabled={isLocked}
          />
        </div>

        {/* Opacity */}
        <div>
          <div className="text-[9px] text-dim mb-0.5">Opacity</div>
          <input
            type="number"
            className="input !py-1 !text-[11px]"
            value={Math.round((obj.opacity ?? 1) * 100)}
            min={0}
            max={100}
            onChange={(e) => {
              checkpoint();
              const val = parseFloat(e.target.value) / 100;
              if (selection.kind === 'device') {
                update(p => ({ ...p, devices: p.devices.map(d => d.id === selection.id ? { ...d, opacity: val } : d) }), false);
              } else {
                update(p => ({ ...p, [selection.kind === 'icon' ? 'icons' : selection.kind === 'textbox' ? 'textboxes' : 'decos']: p[selection.kind === 'icon' ? 'icons' : selection.kind === 'textbox' ? 'textboxes' : 'decos'].map((i: any) => i.id === selection.id ? { ...i, opacity: val } : i) }), false);
              }
            }}
            disabled={isLocked}
          />
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const selection = useStudio(s => s.selection);
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const toast = useStudio(s => s.toast);
  const duplicateDevice = useStudio(s => s.duplicateDevice);
  const removeDevice = useStudio(s => s.removeDevice);
  const removeIcon = useStudio(s => s.removeIcon);
  const removeTextBox = useStudio(s => s.removeTextBox);
  const setSelection = useStudio(s => s.setSelection);
  const lockedObjects = useStudio(s => s.lockedObjects);
  const lockObject = useStudio(s => s.lockObject);
  const unlockObject = useStudio(s => s.unlockObject);

  if (!selection) return null;

  const isLocked = selection.id ? lockedObjects.has(`${selection.kind}:${selection.id}`) : false;

  const handleDuplicate = () => {
    console.log('Duplicate clicked, selection:', selection);
    checkpoint();
    if (selection.kind === 'device' && selection.id) {
      duplicateDevice(selection.id);
      toast('Duplicated');
    } else if (selection.kind === 'icon' && selection.id) {
      const icon = project.icons.find(i => i.id === selection.id);
      if (icon) {
        update(p => ({ ...p, icons: [...p.icons, { ...icon, id: Math.random().toString(36).slice(2), x: icon.x + 0.02, y: icon.y + 0.02 }] }));
        toast('Icon duplicated');
      }
    } else if (selection.kind === 'textbox' && selection.id) {
      const textbox = project.textboxes.find(t => t.id === selection.id);
      if (textbox) {
        update(p => ({ ...p, textboxes: [...p.textboxes, { ...textbox, id: Math.random().toString(36).slice(2), x: textbox.x + 0.02, y: textbox.y + 0.02 }] }));
        toast('Text box duplicated');
      }
    } else if (selection.kind === 'deco' && selection.id) {
      const deco = project.decos.find(d => d.id === selection.id);
      if (deco) {
        update(p => ({ ...p, decos: [...p.decos, { ...deco, id: Math.random().toString(36).slice(2), x: deco.x + 0.02, y: deco.y + 0.02 }] }));
        toast('Decoration duplicated');
      }
    } else if (selection.kind === 'canvasImage' && selection.id) {
      console.log('Canvas image duplicate, id:', selection.id);
      const canvasImage = project.canvasImages?.find(img => img.id === selection.id);
      console.log('Found canvas image:', canvasImage);
      if (canvasImage) {
        update(p => ({ ...p, canvasImages: [...(p.canvasImages || []), { ...canvasImage, id: Math.random().toString(36).slice(2), x: canvasImage.x + 0.02, y: canvasImage.y + 0.02 }] }));
        toast('Image duplicated');
      }
    }
  };

  const handleDelete = () => {
    checkpoint();
    if (selection.kind === 'device' && selection.id) {
      removeDevice(selection.id);
      toast('Deleted');
    } else if (selection.kind === 'icon' && selection.id) {
      removeIcon(selection.id);
      toast('Icon deleted');
    } else if (selection.kind === 'textbox' && selection.id) {
      removeTextBox(selection.id);
      toast('Text box deleted');
    } else if (selection.kind === 'deco' && selection.id) {
      update(p => ({ ...p, decos: p.decos.filter(d => d.id !== selection.id) }));
      setSelection(null);
      toast('Decoration deleted');
    } else if (selection.kind === 'canvasImage' && selection.id) {
      update(p => ({ ...p, canvasImages: (p.canvasImages || []).filter(img => img.id !== selection.id) }));
      setSelection(null);
      toast('Image deleted');
    }
  };

  const handleLock = () => {
    if (selection.id) {
      if (isLocked) {
        unlockObject(selection.kind, selection.id);
        toast('Unlocked');
      } else {
        lockObject(selection.kind, selection.id);
        toast('Locked');
      }
    }
  };

  const handleToggleVisibility = () => {
    checkpoint();
    if (selection.kind === 'device' && selection.id) {
      update(p => ({ ...p, devices: p.devices.map(d => d.id === selection.id ? { ...d, visible: !d.visible } : d) }));
    } else if (selection.kind === 'icon' && selection.id) {
      update(p => ({ ...p, icons: p.icons.map(i => i.id === selection.id ? { ...i, opacity: i.opacity > 0 ? 0 : 1 } : i) }));
    } else if (selection.kind === 'textbox' && selection.id) {
      update(p => ({ ...p, textboxes: p.textboxes.map(t => t.id === selection.id ? { ...t, opacity: t.opacity > 0 ? 0 : 1 } : t) }));
    } else if (selection.kind === 'deco' && selection.id) {
      update(p => ({ ...p, decos: p.decos.map(d => d.id === selection.id ? { ...d, opacity: d.opacity > 0 ? 0 : 1 } : d) }));
    } else if (selection.kind === 'canvasImage' && selection.id) {
      update(p => ({ ...p, canvasImages: (p.canvasImages || []).map(img => img.id === selection.id ? { ...img, visible: !img.visible } : img) }));
    } else if (selection.kind === 'text') {
      update(p => ({ ...p, text: { ...p.text, enabled: !p.text.enabled } }));
    } else if (selection.kind === 'logo') {
      update(p => ({ ...p, logo: { ...p.logo, enabled: !p.logo.enabled } }));
    }
  };

  return (
    <div className="px-3 py-2 border-b border-line2 bg-panel flex items-center gap-1">
      <button className="icon-btn !w-7 !h-7" onClick={handleDuplicate} title="Duplicate (Ctrl+D)">
        <IcCopy size={13} />
      </button>
      <button className="icon-btn !w-7 !h-7 hover:!text-danger" onClick={handleDelete} title="Delete (Del)">
        <IcTrash size={13} />
      </button>
      <button className={`icon-btn !w-7 !h-7 ${isLocked ? 'text-acc' : ''}`} onClick={handleLock} title={isLocked ? 'Unlock' : 'Lock'}>
        {isLocked ? <IcLock size={13} /> : <IcUnlock size={13} />}
      </button>
      <button className="icon-btn !w-7 !h-7" onClick={handleToggleVisibility} title="Toggle Visibility">
        <IcEye size={13} />
      </button>
      <div className="flex-1" />
      <button className="icon-btn !w-7 !h-7" onClick={() => { 
        console.log('Bring Forward clicked, selection:', selection);
        checkpoint(); 
        if (selection.kind === 'device' && selection.id) { 
          update(p => ({ ...p, devices: p.devices.map(d => d.id === selection.id ? { ...d, z: d.z + 1 } : d) })); 
          toast('Brought forward'); 
        } else if (selection.kind === 'canvasImage' && selection.id) {
          console.log('Canvas image bring forward, id:', selection.id);
          update(p => ({ ...p, canvasImages: (p.canvasImages || []).map(img => img.id === selection.id ? { ...img, z: img.z + 1 } : img) }));
          toast('Brought forward');
        } else if (selection.kind === 'icon' && selection.id) {
          console.log('Icon bring forward, id:', selection.id);
          update(p => ({ ...p, icons: p.icons.map(i => i.id === selection.id ? { ...i, z: (i.z || 0) + 1 } : i) }));
          toast('Brought forward');
        } else if (selection.kind === 'deco' && selection.id) {
          console.log('Deco bring forward, id:', selection.id);
          update(p => ({ ...p, decos: p.decos.map(d => d.id === selection.id ? { ...d, z: (d.z || 0) + 1 } : d) }));
          toast('Brought forward');
        } else if (selection.kind === 'textbox' && selection.id) {
          console.log('Textbox bring forward, id:', selection.id);
          update(p => ({ ...p, textboxes: p.textboxes.map(t => t.id === selection.id ? { ...t, z: (t.z || 0) + 1 } : t) }));
          toast('Brought forward');
        }
      }} title="Bring Forward">
        <IcUp size={13} />
      </button>
      <button className="icon-btn !w-7 !h-7" onClick={() => { 
        console.log('Send Backward clicked, selection:', selection);
        checkpoint(); 
        if (selection.kind === 'device' && selection.id) { 
          update(p => ({ ...p, devices: p.devices.map(d => d.id === selection.id ? { ...d, z: Math.max(0, d.z - 1) } : d) })); 
          toast('Sent backward'); 
        } else if (selection.kind === 'canvasImage' && selection.id) {
          console.log('Canvas image send backward, id:', selection.id);
          update(p => ({ ...p, canvasImages: (p.canvasImages || []).map(img => img.id === selection.id ? { ...img, z: Math.max(0, img.z - 1) } : img) }));
          toast('Sent backward');
        } else if (selection.kind === 'icon' && selection.id) {
          console.log('Icon send backward, id:', selection.id);
          update(p => ({ ...p, icons: p.icons.map(i => i.id === selection.id ? { ...i, z: Math.max(0, (i.z || 0) - 1) } : i) }));
          toast('Sent backward');
        } else if (selection.kind === 'deco' && selection.id) {
          console.log('Deco send backward, id:', selection.id);
          update(p => ({ ...p, decos: p.decos.map(d => d.id === selection.id ? { ...d, z: Math.max(0, (d.z || 0) - 1) } : d) }));
          toast('Sent backward');
        } else if (selection.kind === 'textbox' && selection.id) {
          console.log('Textbox send backward, id:', selection.id);
          update(p => ({ ...p, textboxes: p.textboxes.map(t => t.id === selection.id ? { ...t, z: Math.max(0, (t.z || 0) - 1) } : t) }));
          toast('Sent backward');
        }
      }} title="Send Backward">
        <IcDown size={13} />
      </button>
    </div>
  );
}

function DeviceProps({ d }: { d: DeviceLayer }) {
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const removeDevice = useStudio(s => s.removeDevice);
  const duplicateDevice = useStudio(s => s.duplicateDevice);
  const reorderDevice = useStudio(s => s.reorderDevice);
  const alignDevices = useStudio(s => s.alignDevices);
  const distributeDevices = useStudio(s => s.distributeDevices);
  const meta = DEVICE_META[d.kind];
  const patch = (fn: (x: DeviceLayer) => DeviceLayer) =>
    update(p => ({ ...p, devices: p.devices.map(x => x.id === d.id ? fn(x) : x) }), false);
  const aspect = meta.aspect;
  const h = d.w / aspect;

  return (
    <>
      <Section title={meta.label} right={
        <span className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>{d.name}</span>
      }>
        <div className="flex gap-1 mb-1">
          <button className="icon-btn" title="Move up (front)" onClick={() => reorderDevice(d.id, 1)}><IcUp size={14} /></button>
          <button className="icon-btn" title="Move down (back)" onClick={() => reorderDevice(d.id, -1)}><IcDown size={14} /></button>
          <button className="icon-btn" title="Duplicate (Ctrl+D)" onClick={() => duplicateDevice(d.id)}><IcCopy size={14} /></button>
          <button className="icon-btn hover:!text-danger" title="Delete (Del)" onClick={() => removeDevice(d.id)}><IcTrash size={14} /></button>
        </div>
      </Section>

      <Section title="Screenshot">
        <div className="grid grid-cols-4 gap-1.5">
          <button
            className="h-12 rounded-md border text-[9px] cursor-pointer transition-all"
            style={{
              fontFamily: 'var(--font-mono)',
              borderColor: d.assetId === null ? 'var(--color-acc)' : 'var(--color-line)',
              background: d.assetId === null ? 'rgba(255,107,61,0.1)' : 'var(--color-panel)',
              color: d.assetId === null ? 'var(--color-acc)' : 'var(--color-dim)',
            }}
            onClick={() => { checkpoint(); patch(x => ({ ...x, assetId: null })); }}
          >
            none
          </button>
          {project.assets.map(a => (
            <button
              key={a.id}
              className="h-12 rounded-md overflow-hidden border cursor-pointer transition-all hover:scale-[1.04]"
              style={{ borderColor: d.assetId === a.id ? 'var(--color-acc)' : 'var(--color-line)', boxShadow: d.assetId === a.id ? '0 0 0 2px rgba(255,107,61,0.2)' : undefined }}
              onClick={() => { checkpoint(); patch(x => ({ ...x, assetId: a.id })); }}
              title={a.name}
            >
              <img src={a.dataUrl} alt={a.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {d.assetId && (
          <>
            <div className="mt-3">
              <div className="label-mono mb-1.5">Fit mode</div>
              <Seg options={FIT_MODES} value={d.fit} onChange={(v) => { checkpoint(); patch(x => ({ ...x, fit: v })); }} />
            </div>
            
            <div className="mt-3 flex gap-1.5">
              <button 
                className="btn flex-1 !text-[10px] !py-1.5 justify-center"
                onClick={() => { 
                  checkpoint(); 
                  const asset = project.assets.find(a => a.id === d.assetId);
                  if (asset) {
                    const screenAspect = (d.w / DEVICE_META[d.kind].aspect) / d.w;
                    const imageAspect = asset.w / asset.h;
                    const suggestedFit = suggestFitMode(screenAspect, imageAspect);
                    patch(x => ({ ...x, zoom: 1, panX: 0, panY: 0, fit: suggestedFit }));
                  } else {
                    patch(x => ({ ...x, zoom: 1, panX: 0, panY: 0, fit: 'cover' }));
                  }
                }}
              >
                Auto-fit
              </button>
              <button 
                className="btn flex-1 !text-[10px] !py-1.5 justify-center"
                onClick={() => { 
                  checkpoint(); 
                  patch(x => ({ ...x, zoom: 1, panX: 0, panY: 0 })); 
                }}
              >
                Reset
              </button>
            </div>

            <div className="mt-3">
              <SliderRow label="Zoom" value={d.zoom} min={0.5} max={3} step={0.01} fmt={v => `${Math.round(v * 100)}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, zoom: v }))} />
              <SliderRow label="Position X" value={d.panX} min={-1} max={1} step={0.01} fmt={v => `${Math.round(v * 100)}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, panX: v }))} />
              <SliderRow label="Position Y" value={d.panY} min={-1} max={1} step={0.01} fmt={v => `${Math.round(v * 100)}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, panY: v }))} />
            </div>

            <div className="mt-2 p-2 rounded-lg border border-line bg-panel">
              <div className="text-[9px] text-dim mb-1">Quick tips:</div>
              <ul className="text-[9px] text-mut space-y-0.5">
                <li>• Use "Auto-fit" for perfect fit</li>
                <li>• Zoom in/out to adjust size</li>
                <li>• Pan to reposition screenshot</li>
                <li>• "Cover" mode fills entire frame</li>
              </ul>
            </div>
          </>
        )}
      </Section>

      <Section title="Transform">
        <SliderRow label="Size" value={Math.round((d.w / project.canvas.w) * 100)} min={8} max={110} fmt={v => `${v}%`} onStart={checkpoint}
          onChange={v => patch(x => ({ ...x, w: clamp((v / 100) * project.canvas.w, 90, project.canvas.w * 1.1) }))} />
        <SliderRow label="Tilt" value={d.tilt} min={-24} max={24} fmt={v => `${v}°`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, tilt: v }))} />
        <SliderRow label="X" value={Math.round(d.x)} min={-Math.round(d.w)} max={project.canvas.w} onStart={checkpoint} onChange={v => patch(x => ({ ...x, x: v }))} />
        <SliderRow label="Y" value={Math.round(d.y)} min={-Math.round(h)} max={project.canvas.h} onStart={checkpoint} onChange={v => patch(x => ({ ...x, y: v }))} />
      </Section>

      <Section title="Frame color">
        <div className="flex gap-2 flex-wrap">
          {meta.colors.map(c => (
            <button
              key={c.hex}
              title={c.name}
              onClick={() => { checkpoint(); patch(x => ({ ...x, color: c.hex })); }}
              className="cursor-pointer transition-transform hover:scale-110"
              style={{
                width: 26, height: 26, borderRadius: 8, background: c.hex,
                border: `2px solid ${d.color === c.hex ? 'var(--color-acc)' : 'var(--color-line)'}`,
                boxShadow: d.color === c.hex ? '0 0 0 3px rgba(255,107,61,0.18)' : undefined,
              }}
            />
          ))}
          <ColorInput value={d.color} onChange={(v) => patch(x => ({ ...x, color: v }))} label="custom" />
        </div>
      </Section>

      <Section title="Shadow">
        <div className="grid grid-cols-5 gap-1">
          {SHADOWS.map(sh => (
            <button
              key={sh.id}
              onClick={() => { checkpoint(); patch(x => ({ ...x, shadow: sh.id as ShadowPreset })); }}
              className="py-1.5 text-[10.5px] rounded-md border cursor-pointer transition-all"
              style={{
                fontFamily: 'var(--font-mono)',
                borderColor: d.shadow === sh.id ? 'var(--color-acc)' : 'var(--color-line)',
                background: d.shadow === sh.id ? 'rgba(255,107,61,0.12)' : 'var(--color-panel)',
                color: d.shadow === sh.id ? 'var(--color-acc)' : 'var(--color-mut)',
              }}
            >
              {sh.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Appearance">
        <SliderRow label="Brightness" value={Math.round((d.brightness ?? 1) * 100)} min={50} max={150} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, brightness: v / 100 }))} />
        <SliderRow label="Reflection" value={Math.round((d.reflection ?? 0) * 100)} min={0} max={100} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, reflection: v / 100 }))} />
        <SliderRow label="Corner radius" value={Math.round((d.radiusMul ?? 1) * 100)} min={40} max={200} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, radiusMul: v / 100 }))} />
        <SliderRow label="Opacity" value={Math.round((d.opacity ?? 1) * 100)} min={10} max={100} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, opacity: v / 100 }))} />
        <div className="mt-2">
          <div className="label-mono mb-1.5">Material</div>
          <Seg options={MATERIALS} value={d.material ?? 'matte'} onChange={(v) => { checkpoint(); patch(x => ({ ...x, material: v as Material })); }} />
        </div>
      </Section>

      <Section title="Arrange all devices">
        <div className="grid grid-cols-2 gap-1.5">
          <button className="btn !text-[11px] justify-center" onClick={() => alignDevices('h')}><IcAlignH size={13} /> Top</button>
          <button className="btn !text-[11px] justify-center" onClick={() => alignDevices('center')}><IcAlignH size={13} /> Centers</button>
          <button className="btn !text-[11px] justify-center" onClick={() => alignDevices('v')}><IcAlignV size={13} /> Left</button>
          <button className="btn !text-[11px] justify-center" onClick={() => distributeDevices('h')}><IcAlignH size={13} /> Spread H</button>
        </div>
      </Section>

      {d.kind === 'browser' && (
        <Section title="Address bar">
          <input className="input" value={d.url} placeholder="yourapp.com"
            onChange={(e) => patch(x => ({ ...x, url: e.target.value }))}
            onFocus={() => checkpoint()} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
        </Section>
      )}
    </>
  );
}

function BackgroundProps() {
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const b = project.background;
  const patch = (fn: (x: typeof b) => typeof b) => update(p => ({ ...p, background: fn(p.background) }), false);
  const dpatch = (fn: (x: typeof project.decoration) => typeof project.decoration) => update(p => ({ ...p, decoration: fn(p.decoration) }), false);

  const changeBgStyle = (style: BgStyle) => {
    checkpoint();
    update(p => ({
      ...p,
      background: { ...p.background, style },
      decos: [],
      icons: [],
    }), false);
  };

  return (
    <>
      <Section title="Backdrop style">
        <div className="grid grid-cols-4 gap-1 mb-2.5">
          {BG_STYLE_OPTS.map(s => (
            <button
              key={s.id}
              onClick={() => changeBgStyle(s.id)}
              className="py-1.5 text-[9.5px] rounded-md border cursor-pointer transition-all"
              style={{
                fontFamily: 'var(--font-mono)',
                borderColor: b.style === s.id ? 'var(--color-acc)' : 'var(--color-line)',
                background: b.style === s.id ? 'rgba(255,107,61,0.12)' : 'var(--color-panel)',
                color: b.style === s.id ? 'var(--color-acc)' : 'var(--color-mut)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="label-mono mb-1.5">Lighting</div>
        <Seg
          options={LIGHTING.map(l => ({ id: l.id, label: l.label.split(' ')[0] })) as { id: LightType; label: string }[]}
          value={b.light?.type ?? 'none'}
          onChange={(v) => { checkpoint(); patch(x => ({ ...x, light: { type: v, intensity: x.light?.intensity ?? 0.55 } })); }}
        />
      </Section>

      <Section title="Background">
        <Seg
          options={[{ id: 'solid', label: 'Solid' }, { id: 'linear', label: 'Linear' }, { id: 'radial', label: 'Radial' }, { id: 'mesh', label: 'Mesh' }] as { id: typeof b.type; label: string }[]}
          value={b.type}
          onChange={(v) => { 
            checkpoint(); 
            patch(x => ({ ...x, type: v, kind: 'procedural' }));
            update(p => ({ ...p, decos: [], icons: [] }), false);
          }}
        />
        <div className="flex items-center gap-3 mt-3">
          <ColorInput value={b.c1} onChange={(v) => { checkpoint(); patch(x => ({ ...x, c1: v })); }} label="base" />
          {b.type !== 'solid' && <ColorInput value={b.c2} onChange={(v) => { checkpoint(); patch(x => ({ ...x, c2: v })); }} label="second" />}
          {b.type === 'mesh' && <ColorInput value={b.c3} onChange={(v) => { checkpoint(); patch(x => ({ ...x, c3: v })); }} label="third" />}
        </div>
      </Section>

      <Section title="Pattern overlay">
        <div className="grid grid-cols-6 gap-1 mb-2.5">
          {PATTERNS.map(pt => (
            <button
              key={pt.id}
              onClick={() => { 
                checkpoint(); 
                patch(x => ({ ...x, pattern: pt.id as PatternKind, kind: 'procedural' }));
              }}
              className="py-1.5 text-[9.5px] rounded-md border cursor-pointer transition-all"
              style={{
                fontFamily: 'var(--font-mono)',
                borderColor: b.pattern === pt.id ? 'var(--color-acc)' : 'var(--color-line)',
                background: b.pattern === pt.id ? 'rgba(255,107,61,0.12)' : 'var(--color-panel)',
                color: b.pattern === pt.id ? 'var(--color-acc)' : 'var(--color-mut)',
              }}
            >
              {pt.label}
            </button>
          ))}
        </div>
        {b.pattern !== 'none' && (
          <SliderRow label="Pattern opacity" value={Math.round(b.patternOpacity * 100)} min={2} max={60} fmt={v => `${v}%`}
            onStart={checkpoint} onChange={v => patch(x => ({ ...x, patternOpacity: v / 100 }))} />
        )}
      </Section>

      <Section title="Decorative shapes">
        <div className="grid grid-cols-6 gap-1 mb-2.5">
          {DECO_SETS.map(ds => (
            <button
              key={ds.id}
              onClick={() => { 
                checkpoint(); 
                update(p => ({ ...p, decos: [], decoration: { ...p.decoration, set: ds.id } }), false);
              }}
              className="py-1.5 text-[9.5px] rounded-md border cursor-pointer transition-all"
              style={{
                fontFamily: 'var(--font-mono)',
                borderColor: project.decoration.set === ds.id ? 'var(--color-acc)' : 'var(--color-line)',
                background: project.decoration.set === ds.id ? 'rgba(255,107,61,0.12)' : 'var(--color-panel)',
                color: project.decoration.set === ds.id ? 'var(--color-acc)' : 'var(--color-mut)',
              }}
            >
              {ds.label}
            </button>
          ))}
        </div>
        <SliderRow label="Intensity" value={Math.round(project.decoration.intensity * 100)} min={40} max={150} fmt={v => `${v}%`}
          onStart={checkpoint} onChange={v => dpatch(x => ({ ...x, intensity: v / 100 }))} />
        <div className="flex items-center gap-3 mt-3">
          <ColorInput value={project.accents.a1} onChange={(v) => { checkpoint(); update(p => ({ ...p, accents: { ...p.accents, a1: v } })); }} label="accent" />
          <ColorInput value={project.accents.a2} onChange={(v) => { checkpoint(); update(p => ({ ...p, accents: { ...p.accents, a2: v } })); }} label="accent 2" />
        </div>
      </Section>

      <Section title={`Decoration layers · ${project.decos.length}`}>
        {project.decos.length === 0 && (
          <p className="text-[10.5px]" style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
            none — add from the Decor tab or press Surprise me
          </p>
        )}
        <div className="space-y-2">
          {project.decos.map((dec, i) => {
            const label = DECO_PRESETS.find(pp => pp.id === dec.preset)?.label ?? dec.preset;
            return (
              <div key={dec.id} className="rounded-lg border border-line bg-panel p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium">{i + 1}. {label}</span>
                  <button className="icon-btn !w-5 !h-5" onClick={() => { checkpoint(); update(p => ({ ...p, decos: p.decos.filter(x => x.id !== dec.id) }), false); }}>
                    <IcTrash size={10} />
                  </button>
                </div>
                <SliderRow label="Opacity" value={Math.round(dec.opacity * 100)} min={5} max={100} fmt={v => `${v}%`}
                  onStart={checkpoint} onChange={v => update(p => ({ ...p, decos: p.decos.map(x => x.id === dec.id ? { ...x, opacity: v / 100 } : x) }), false)} />
                <SliderRow label="Scale" value={Math.round(dec.scale * 1000)} min={20} max={220} fmt={v => `${(v / 1000).toFixed(2)}`}
                  onStart={checkpoint} onChange={v => update(p => ({ ...p, decos: p.decos.map(x => x.id === dec.id ? { ...x, scale: v / 1000 } : x) }), false)} />
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function TextProps() {
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const t = project.text;
  
  if (!t) return null;
  
  // Safe patch function with null checks
  const patch = (fn: (x: typeof t) => typeof t) => update(p => {
    if (!p.text) return p;
    return { ...p, text: fn(p.text) };
  }, false);

  return (
    <>
      <Section title="Typography presets">
        <div className="flex flex-wrap gap-1.5">
          {TYPO_PRESETS.map(tp => (
            <button
              key={tp.id}
              className={`chip ${t.scale === tp.scale && t.position === tp.pos ? 'on' : ''}`}
              onClick={() => { checkpoint(); patch(x => ({ ...x, scale: tp.scale, position: tp.pos })); }}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Font family">
        <div className="grid grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto">
          {[
            { id: 'space-grotesk', label: 'Space Grotesk', font: '"Space Grotesk", sans-serif' },
            { id: 'ibm-plex', label: 'IBM Plex', font: '"IBM Plex Sans", sans-serif' },
            { id: 'system', label: 'System', font: 'system-ui, sans-serif' },
            { id: 'mono', label: 'Mono', font: '"JetBrains Mono", monospace' },
            { id: 'serif', label: 'Serif', font: 'Georgia, serif' },
            { id: 'rounded', label: 'Rounded', font: '"Nunito", sans-serif' },
            { id: 'playfair', label: 'Playfair', font: '"Playfair Display", serif' },
            { id: 'roboto', label: 'Roboto', font: '"Roboto", sans-serif' },
            { id: 'open-sans', label: 'Open Sans', font: '"Open Sans", sans-serif' },
            { id: 'lato', label: 'Lato', font: '"Lato", sans-serif' },
            { id: 'montserrat', label: 'Montserrat', font: '"Montserrat", sans-serif' },
            { id: 'poppins', label: 'Poppins', font: '"Poppins", sans-serif' },
            { id: 'raleway', label: 'Raleway', font: '"Raleway", sans-serif' },
            { id: 'oswald', label: 'Oswald', font: '"Oswald", sans-serif' },
            { id: 'merriweather', label: 'Merriweather', font: '"Merriweather", serif' },
            { id: 'source-code', label: 'Source Code', font: '"Source Code Pro", monospace' },
            { id: 'fira-code', label: 'Fira Code', font: '"Fira Code", monospace' },
            { id: 'inter', label: 'Inter', font: '"Inter", sans-serif' },
            { id: 'work-sans', label: 'Work Sans', font: '"Work Sans", sans-serif' },
            { id: 'nunito-sans', label: 'Nunito Sans', font: '"Nunito Sans", sans-serif' },
          ].map(f => (
            <button
              key={f.id}
              className="py-2 px-2 rounded-md border text-[10px] transition-all"
              style={{
                fontFamily: f.font,
                borderColor: (t.fontFamily || 'space-grotesk') === f.id ? 'var(--color-acc)' : 'var(--color-line)',
                background: (t.fontFamily || 'space-grotesk') === f.id ? 'rgba(255,107,61,0.12)' : 'var(--color-panel)',
                color: (t.fontFamily || 'space-grotesk') === f.id ? 'var(--color-acc)' : 'var(--color-mut)',
              }}
              onClick={() => { checkpoint(); patch(x => ({ ...x, fontFamily: f.id })); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Text block" right={<Toggle on={t.enabled} onChange={(v) => { checkpoint(); patch(x => ({ ...x, enabled: v })); }} />}>
        <input className="input mb-2" placeholder="Project name" value={t.title}
          onChange={(e) => patch(x => ({ ...x, title: e.target.value }))} onFocus={checkpoint}
          style={{ fontFamily: 'var(--font-disp)', fontWeight: 600 }} />
        <input className="input" placeholder="One-line description" value={t.subtitle}
          onChange={(e) => patch(x => ({ ...x, subtitle: e.target.value }))} onFocus={checkpoint}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
        <div className="mt-3">
          <SliderRow label="Text scale" value={Math.round(t.scale * 100)} min={60} max={160} fmt={v => `${v}%`}
            onStart={checkpoint} onChange={v => patch(x => ({ ...x, scale: v / 100 }))} />
        </div>
      </Section>

      <Section title="Position">
        <PosGrid value={t.position} onChange={(v) => { checkpoint(); patch(x => ({ ...x, position: v })); }} />
      </Section>

      <Section title="Color">
        <div className="flex items-center gap-3">
          <Toggle on={t.autoColor} onChange={(v) => { checkpoint(); patch(x => ({ ...x, autoColor: v })); }} label="Auto contrast" />
          {!t.autoColor && <ColorInput value={t.color} onChange={(v) => { checkpoint(); patch(x => ({ ...x, color: v })); }} />}
        </div>
        <div className="mt-2 text-[10.5px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>
          auto → {textOn(project.background.c1)}
        </div>
      </Section>

      <Section title="Tech badges" right={<Toggle on={t.showBadges} onChange={(v) => { checkpoint(); patch(x => ({ ...x, showBadges: v })); }} />}>
        <div className="flex flex-wrap gap-1.5">
          {TECH_BADGES.map(b => {
            const on = t.badges.includes(b);
            return (
              <button
                key={b}
                className={`chip ${on ? 'on' : ''}`}
                onClick={() => { checkpoint(); patch(x => ({ ...x, badges: on ? x.badges.filter(y => y !== b) : [...x.badges, b] })); }}
              >
                {b}
              </button>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function LogoProps() {
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const l = project.logo;
  const patch = (fn: (x: typeof l) => typeof l) => update(p => ({ ...p, logo: fn(p.logo) }), false);

  return (
    <>
      <Section title="Logo" right={<Toggle on={l.enabled} onChange={(v) => { checkpoint(); patch(x => ({ ...x, enabled: v })); }} />}>
        <div className="grid grid-cols-4 gap-1.5">
          {project.assets.map(a => (
            <button
              key={a.id}
              className="h-12 rounded-md overflow-hidden border cursor-pointer bg-panel transition-all hover:scale-[1.04] p-1"
              style={{ borderColor: l.assetId === a.id ? 'var(--color-acc)' : 'var(--color-line)' }}
              onClick={() => { checkpoint(); patch(x => ({ ...x, assetId: a.id, enabled: true })); }}
              title={a.name}
            >
              <img src={a.dataUrl} alt={a.name} className="w-full h-full object-contain" />
            </button>
          ))}
          {project.assets.length === 0 && (
            <p className="col-span-4 text-[11.5px]" style={{ color: 'var(--color-dim)' }}>Upload a logo in the Screens tab first.</p>
          )}
        </div>
        <div className="mt-3">
          <SliderRow label="Size" value={Math.round(l.size * 100)} min={4} max={25} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, size: v / 100 }))} />
          <SliderRow label="Opacity" value={Math.round(l.opacity * 100)} min={10} max={100} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, opacity: v / 100 }))} />
        </div>
      </Section>
      <Section title="Position">
        <PosGrid value={l.position} onChange={(v) => { checkpoint(); patch(x => ({ ...x, position: v })); }} />
      </Section>
    </>
  );
}

function DecoProps({ d }: { d: any }) {
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const patch = (fn: (x: any) => any) =>
    update(p => ({ ...p, decos: p.decos.map(x => x.id === d.id ? fn(x) : x) }), false);

  return (
    <>
      <Section title="Decoration" right={
        <button className="icon-btn !w-6 !h-6 hover:!text-danger" onClick={() => {
          checkpoint();
          update(p => ({ ...p, decos: p.decos.filter(x => x.id !== d.id) }));
        }}>
          <IcTrash size={12} />
        </button>
      }>
        <div className="text-[11px] mb-2" style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
          {d.preset}
        </div>
      </Section>

      <Section title="Transform">
        <SliderRow label="Size" value={Math.round(d.scale * 100)} min={2} max={30} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, scale: v / 100 }))} />
        <SliderRow label="Rotation" value={d.rotation} min={-180} max={180} fmt={v => `${v}°`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, rotation: v }))} />
        <SliderRow label="Opacity" value={Math.round(d.opacity * 100)} min={10} max={100} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, opacity: v / 100 }))} />
      </Section>

      <Section title="Effects">
        <SliderRow label="Blur" value={d.blur || 0} min={0} max={20} fmt={v => `${v}px`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, blur: v }))} />
        <Toggle on={d.shadow || false} onChange={(v) => { checkpoint(); patch((x: any) => ({ ...x, shadow: v })); }} label="Shadow" />
        <Toggle on={d.glow || false} onChange={(v) => { checkpoint(); patch((x: any) => ({ ...x, glow: v })); }} label="Glow" />
        {d.glow && (
          <ColorInput value={d.hue || '#ffffff'} onChange={(v) => { checkpoint(); patch((x: any) => ({ ...x, hue: v })); }} label="glow color" />
        )}
      </Section>

      <Section title="Depth">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            className={`py-2 text-[10px] rounded-md border cursor-pointer transition-all ${d.depth === 'back' ? 'border-acc bg-acc/10 text-acc' : 'border-line bg-panel text-mut'}`}
            onClick={() => { checkpoint(); patch((x: any) => ({ ...x, depth: 'back' })); }}
          >
            Behind devices
          </button>
          <button
            className={`py-2 text-[10px] rounded-md border cursor-pointer transition-all ${d.depth === 'front' ? 'border-acc bg-acc/10 text-acc' : 'border-line bg-panel text-mut'}`}
            onClick={() => { checkpoint(); patch((x: any) => ({ ...x, depth: 'front' })); }}
          >
            In front
          </button>
        </div>
      </Section>
    </>
  );
}

function TextBoxProps({ t }: { t: any }) {
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const removeTextBox = useStudio(s => s.removeTextBox);
  const patch = (fn: (x: any) => any) =>
    update(p => ({ ...p, textboxes: p.textboxes.map(x => x.id === t.id ? fn(x) : x) }), false);

  const fontFamilies = [
    'Space Grotesk', 'IBM Plex Sans', 'Inter', 'Roboto', 'Open Sans', 
    'Montserrat', 'Poppins', 'Raleway', 'Oswald', 'Merriweather',
    'Source Code Pro', 'Fira Code', 'JetBrains Mono'
  ];

  return (
    <>
      <Section title="Text Box" right={
        <button className="icon-btn !w-6 !h-6 hover:!text-danger" onClick={() => removeTextBox(t.id)}>
          <IcTrash size={12} />
        </button>
      }>
        <textarea
          className="input !text-[12px] !min-h-[60px] resize-y"
          value={t.text}
          onChange={(e) => patch((x: any) => ({ ...x, text: e.target.value }))}
          onFocus={() => checkpoint()}
          placeholder="Enter your text..."
        />
      </Section>

      <Section title="Typography">
        <div className="space-y-2">
          <div>
            <div className="label-mono mb-1">Font Family</div>
            <select
              className="input !text-[11px]"
              value={t.fontFamily}
              onChange={(e) => patch((x: any) => ({ ...x, fontFamily: e.target.value }))}
            >
              {fontFamilies.map(f => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </div>
          <SliderRow label="Font Size" value={t.fontSize} min={12} max={120} fmt={v => `${v}px`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, fontSize: v }))} />
          <SliderRow label="Font Weight" value={t.fontWeight} min={100} max={900} step={100} fmt={v => `${v}`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, fontWeight: v }))} />
          <div>
            <div className="label-mono mb-1">Alignment</div>
            <div className="grid grid-cols-3 gap-1">
              {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  className={`py-1.5 text-[10px] rounded-md border cursor-pointer transition-all capitalize ${t.align === align ? 'border-acc bg-acc/10 text-acc' : 'border-line bg-panel text-mut'}`}
                  onClick={() => { checkpoint(); patch((x: any) => ({ ...x, align })); }}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
          <ColorInput value={t.color} onChange={v => patch((x: any) => ({ ...x, color: v }))} label="text color" />
        </div>
      </Section>

      <Section title="Transform">
        <SliderRow label="Width" value={Math.round(t.width * 100)} min={10} max={80} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, width: v / 100 }))} />
        <SliderRow label="Rotation" value={t.rotation} min={-180} max={180} fmt={v => `${v}°`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, rotation: v }))} />
        <SliderRow label="Opacity" value={Math.round(t.opacity * 100)} min={10} max={100} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, opacity: v / 100 }))} />
      </Section>

      <Section title="Background">
        <div>
          <div className="label-mono mb-1">Type</div>
          <div className="grid grid-cols-4 gap-1">
            {(['none', 'solid', 'gradient', 'glass'] as const).map(type => (
              <button
                key={type}
                className={`py-1.5 text-[10px] rounded-md border cursor-pointer transition-all capitalize ${t.bgType === type ? 'border-acc bg-acc/10 text-acc' : 'border-line bg-panel text-mut'}`}
                onClick={() => { checkpoint(); patch((x: any) => ({ ...x, bgType: type })); }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        {t.bgType !== 'none' && (
          <>
            <ColorInput value={t.bgColor} onChange={v => patch((x: any) => ({ ...x, bgColor: v }))} label="bg color" />
            <SliderRow label="Padding" value={t.padding} min={0} max={40} fmt={v => `${v}px`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, padding: v }))} />
            <SliderRow label="Border Radius" value={t.borderRadius} min={0} max={30} fmt={v => `${v}px`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, borderRadius: v }))} />
          </>
        )}
      </Section>

      <Section title="Effects">
        <Toggle on={t.shadow} onChange={v => patch((x: any) => ({ ...x, shadow: v }))} label="Shadow" />
        <Toggle on={t.glow} onChange={v => patch((x: any) => ({ ...x, glow: v }))} label="Glow" />
        {t.glow && (
          <ColorInput value={t.glowColor} onChange={v => patch((x: any) => ({ ...x, glowColor: v }))} label="glow color" />
        )}
      </Section>
    </>
  );
}

function CanvasImageProps({ img }: { img: any }) {
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const removeCanvasImage = useStudio(s => s.removeCanvasImage);
  const patch = (fn: (x: any) => any) =>
    update(p => ({ ...p, canvasImages: p.canvasImages.map(x => x.id === img.id ? fn(x) : x) }), false);
  
  const asset = project.assets.find(a => a.id === img.assetId);
  
  return (
    <>
      <Section title="Canvas Image" right={
        <button className="icon-btn !w-6 !h-6 hover:!text-danger" onClick={() => removeCanvasImage(img.id)}>
          <IcTrash size={12} />
        </button>
      }>
        <div className="text-[11px] mb-2" style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
          {asset?.name || 'Unknown asset'}
        </div>
      </Section>
      
      <Section title="Transform">
        <SliderRow label="Width" value={Math.round(img.width * 100)} min={5} max={100} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, width: v / 100, height: x.maintainAspectRatio ? (v / 100) / ((asset?.w || 1) / (asset?.h || 1)) : x.height }))} />
        <SliderRow label="Height" value={Math.round(img.height * 100)} min={5} max={100} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, height: v / 100, width: x.maintainAspectRatio ? (v / 100) * ((asset?.w || 1) / (asset?.h || 1)) : x.width }))} />
        <SliderRow label="Rotation" value={img.rotation} min={-180} max={180} fmt={v => `${v}°`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, rotation: v }))} />
        <SliderRow label="Opacity" value={Math.round(img.opacity * 100)} min={0} max={100} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, opacity: v / 100 }))} />
        <div className="mt-2">
          <Toggle on={img.maintainAspectRatio} onChange={v => patch((x: any) => ({ ...x, maintainAspectRatio: v }))} label="Maintain aspect ratio" />
        </div>
      </Section>
      
      <Section title="Corner Radius">
        <SliderRow label="Radius" value={img.borderRadius} min={0} max={50} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, borderRadius: v }))} />
      </Section>
      
      <Section title="Effects">
        <Toggle on={img.shadow} onChange={v => patch((x: any) => ({ ...x, shadow: v }))} label="Shadow" />
        {img.shadow && (
          <>
            <SliderRow label="Blur" value={img.shadowBlur} min={0} max={50} fmt={v => `${v}px`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, shadowBlur: v }))} />
            <SliderRow label="Offset X" value={img.shadowOffsetX} min={-50} max={50} fmt={v => `${v}px`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, shadowOffsetX: v }))} />
            <SliderRow label="Offset Y" value={img.shadowOffsetY} min={-50} max={50} fmt={v => `${v}px`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, shadowOffsetY: v }))} />
            <ColorInput value={img.shadowColor} onChange={v => patch((x: any) => ({ ...x, shadowColor: v }))} label="shadow color" />
          </>
        )}
        
        <div className="mt-3">
          <Toggle on={img.glow} onChange={v => patch((x: any) => ({ ...x, glow: v }))} label="Glow" />
          {img.glow && (
            <>
              <SliderRow label="Blur" value={img.glowBlur} min={0} max={50} fmt={v => `${v}px`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, glowBlur: v }))} />
              <ColorInput value={img.glowColor} onChange={v => patch((x: any) => ({ ...x, glowColor: v }))} label="glow color" />
            </>
          )}
        </div>
      </Section>
      
      <Section title="Adjustments">
        <SliderRow label="Brightness" value={Math.round(img.brightness * 100)} min={0} max={200} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, brightness: v / 100 }))} />
        <SliderRow label="Contrast" value={Math.round(img.contrast * 100)} min={0} max={200} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, contrast: v / 100 }))} />
        <SliderRow label="Saturation" value={Math.round(img.saturation * 100)} min={0} max={200} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, saturation: v / 100 }))} />
        <SliderRow label="Blur" value={img.blur} min={0} max={20} fmt={v => `${v}px`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, blur: v }))} />
        <SliderRow label="Hue" value={img.hue} min={0} max={360} fmt={v => `${v}°`} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, hue: v }))} />
      </Section>
      
      <Section title="Layer">
        <SliderRow label="Z-Index" value={img.z} min={0} max={100} onStart={checkpoint} onChange={v => patch((x: any) => ({ ...x, z: v }))} />
      </Section>
    </>
  );
}

function IconProps({ i }: { i: import('../types').IconLayer }) {
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const removeIcon = useStudio(s => s.removeIcon);
  const patch = (fn: (x: import('../types').IconLayer) => import('../types').IconLayer) =>
    update(p => ({ ...p, icons: p.icons.map(x => x.id === i.id ? fn(x) : x) }), false);

  return (
    <>
      <Section title="Icon" right={
        <button className="icon-btn !w-6 !h-6 hover:!text-danger" onClick={() => removeIcon(i.id)}><IcTrash size={12} /></button>
      }>
        <div className="text-[11px] mb-2" style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
          Icon ID: {i.iconId}
        </div>
      </Section>

      <Section title="Transform">
        <SliderRow label="Size" value={Math.round(i.size * 100)} min={2} max={20} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, size: v / 100 }))} />
        <SliderRow label="Rotation" value={i.rotation} min={-180} max={180} fmt={v => `${v}°`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, rotation: v }))} />
        <SliderRow label="Opacity" value={Math.round(i.opacity * 100)} min={10} max={100} fmt={v => `${v}%`} onStart={checkpoint} onChange={v => patch(x => ({ ...x, opacity: v / 100 }))} />
      </Section>

      <Section title="Color">
        <ColorInput value={i.color} onChange={(v) => { checkpoint(); patch(x => ({ ...x, color: v })); }} label="icon" />
      </Section>

      <Section title="Background">
        <div className="grid grid-cols-3 gap-1 mb-2">
          {(['none', 'circle', 'rounded', 'glass', 'gradient', 'badge'] as const).map(bg => (
            <button
              key={bg}
              onClick={() => { checkpoint(); patch(x => ({ ...x, bgStyle: bg })); }}
              className="py-1.5 text-[10px] rounded-md border cursor-pointer transition-all capitalize"
              style={{
                fontFamily: 'var(--font-mono)',
                borderColor: i.bgStyle === bg ? 'var(--color-acc)' : 'var(--color-line)',
                background: i.bgStyle === bg ? 'rgba(255,107,61,0.12)' : 'var(--color-panel)',
                color: i.bgStyle === bg ? 'var(--color-acc)' : 'var(--color-mut)',
              }}
            >
              {bg}
            </button>
          ))}
        </div>
        {i.bgStyle !== 'none' && (
          <ColorInput value={i.bgColor || '#ffffff'} onChange={(v) => { checkpoint(); patch(x => ({ ...x, bgColor: v })); }} label="bg color" />
        )}
      </Section>

      <Section title="Effects">
        <Toggle on={i.shadow} onChange={(v) => { checkpoint(); patch(x => ({ ...x, shadow: v })); }} label="Shadow" />
        <Toggle on={i.glow} onChange={(v) => { checkpoint(); patch(x => ({ ...x, glow: v })); }} label="Glow" />
      </Section>

      <Section title="Material Style">
        <div className="grid grid-cols-3 gap-1">
          {(['matte', 'glossy', 'glass', 'metallic', 'ceramic', 'holographic'] as const).map(mat => (
            <button
              key={mat}
              onClick={() => { 
                checkpoint(); 
                const materialStyles = {
                  matte: { shadow: false, glow: false, bgStyle: 'rounded' as const, bgColor: '#888888' },
                  glossy: { shadow: true, glow: false, bgStyle: 'gradient' as const, bgColor: '#ffffff' },
                  glass: { shadow: false, glow: false, bgStyle: 'glass' as const, bgColor: '#ffffff' },
                  metallic: { shadow: true, glow: false, bgStyle: 'gradient' as const, bgColor: '#c0c0c0' },
                  ceramic: { shadow: true, glow: false, bgStyle: 'rounded' as const, bgColor: '#f5f5f5' },
                  holographic: { shadow: false, glow: true, bgStyle: 'gradient' as const, bgColor: '#ff69b4' },
                };
                patch(x => ({ ...x, ...materialStyles[mat] }));
              }}
              className="py-1.5 text-[10px] rounded-md border cursor-pointer transition-all capitalize"
              style={{
                fontFamily: 'var(--font-mono)',
                borderColor: 'var(--color-line)',
                background: 'var(--color-panel)',
                color: 'var(--color-mut)',
              }}
            >
              {mat}
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

function LayersList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const project = useStudio(s => s.project)!;
  const selection = useStudio(s => s.selection);
  const setSelection = useStudio(s => s.setSelection);
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const reorderDevice = useStudio(s => s.reorderDevice);
  const lockedObjects = useStudio(s => s.lockedObjects);
  
  const rowCls = (on: boolean) =>
    `w-full flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-left ${on ? 'bg-[rgba(255,107,61,0.1)]' : 'hover:bg-panel2'}`;

  // Build layers array with type info
  const allLayers = [
    ...project.devices.map(d => ({ id: d.id, kind: 'device' as const, name: d.name, visible: d.visible, locked: lockedObjects.has(`device:${d.id}`) })),
    ...(project.canvasImages || []).map((img: any) => {
      const asset = project.assets.find(a => a.id === img.assetId);
      return { id: img.id, kind: 'canvasImage' as const, name: asset?.name || 'Canvas Image', visible: img.visible && img.opacity > 0, locked: lockedObjects.has(`canvasImage:${img.id}`) };
    }),
    ...project.textboxes.map((tb: any) => ({ id: tb.id, kind: 'textbox' as const, name: tb.text?.slice(0, 20) || 'Text Box', visible: tb.opacity > 0, locked: lockedObjects.has(`textbox:${tb.id}`) })),
    ...project.icons.map((icon: any) => ({ id: icon.id, kind: 'icon' as const, name: 'Icon', visible: icon.opacity > 0, locked: lockedObjects.has(`icon:${icon.id}`) })),
    ...project.decos.map((deco: any) => ({ id: deco.id, kind: 'deco' as const, name: 'Decoration', visible: deco.opacity > 0, locked: lockedObjects.has(`deco:${deco.id}`) })),
    { id: 'text', kind: 'text' as const, name: 'Text block', visible: project.text?.enabled ?? true, locked: lockedObjects.has('text:main') },
    { id: 'logo', kind: 'logo' as const, name: 'Logo', visible: project.logo?.enabled ?? false, locked: lockedObjects.has('logo:main') },
    { id: 'background', kind: 'background' as const, name: 'Background', visible: true, locked: false },
  ];

  // Filter layers
  const filteredLayers = allLayers.filter(layer => {
    // Search filter
    if (searchQuery && !layer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Type filter
    if (filterType !== 'all' && layer.kind !== filterType) {
      return false;
    }
    return true;
  });
  
  return (
    <Section title="Layers" right={<IcLayers size={13} />}>
      {/* Search */}
      <div className="mb-2">
        <input
          type="text"
          className="input !py-1 !text-[11px]"
          placeholder="Search layers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All' },
          { id: 'device', label: 'Devices' },
          { id: 'textbox', label: 'Text' },
          { id: 'icon', label: 'Icons' },
          { id: 'deco', label: 'Deco' },
        ].map(f => (
          <button
            key={f.id}
            className={`px-2 py-0.5 text-[9px] rounded border whitespace-nowrap transition-colors ${
              filterType === f.id 
                ? 'border-acc bg-acc/10 text-acc' 
                : 'border-line bg-panel text-mut hover:border-acc/50'
            }`}
            onClick={() => setFilterType(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Layers */}
      <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
        {filteredLayers.length === 0 ? (
          <div className="text-center py-4 text-[11px]" style={{ color: 'var(--color-dim)' }}>
            {searchQuery || filterType !== 'all' ? 'No layers found' : 'No layers yet'}
          </div>
        ) : (
          filteredLayers.map(layer => {
            const on = selection?.kind === layer.kind && selection.id === layer.id;
            return (
              <div 
                key={`${layer.kind}-${layer.id}`} 
                className={rowCls(!!on)} 
                onClick={() => setSelection({ kind: layer.kind, id: layer.id })}
                style={on ? { boxShadow: 'inset 2px 0 0 var(--color-acc)' } : undefined}
              >
                {/* Visibility */}
                <button 
                  className="icon-btn !w-6 !h-6" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    checkpoint();
                    if (layer.kind === 'device') {
                      update(p => ({ ...p, devices: p.devices.map(x => x.id === layer.id ? { ...x, visible: !x.visible } : x) }), false);
                    } else if (layer.kind === 'canvasImage') {
                      update(p => ({ ...p, canvasImages: p.canvasImages.map(x => x.id === layer.id ? { ...x, visible: !x.visible } : x) }), false);
                    } else if (layer.kind === 'textbox') {
                      update(p => ({ ...p, textboxes: p.textboxes.map(x => x.id === layer.id ? { ...x, opacity: x.opacity === 0 ? 1 : 0 } : x) }), false);
                    } else if (layer.kind === 'icon') {
                      update(p => ({ ...p, icons: p.icons.map(x => x.id === layer.id ? { ...x, opacity: x.opacity === 0 ? 1 : 0 } : x) }), false);
                    } else if (layer.kind === 'deco') {
                      update(p => ({ ...p, decos: p.decos.map(x => x.id === layer.id ? { ...x, opacity: x.opacity === 0 ? 1 : 0 } : x) }), false);
                    } else if (layer.kind === 'text') {
                      update(p => ({ ...p, text: { ...p.text, enabled: !p.text.enabled } }), false);
                    } else if (layer.kind === 'logo') {
                      update(p => ({ ...p, logo: { ...p.logo, enabled: !p.logo.enabled } }), false);
                    }
                  }}
                  disabled={layer.locked}
                >
                  {layer.visible ? <IcEye size={12} /> : <IcEyeOff size={12} />}
                </button>

                {/* Name */}
                <span className="flex-1 text-[12px] truncate flex items-center gap-1" style={{ opacity: layer.visible ? 1 : 0.45 }}>
                  {layer.locked && <IcLock size={11} />}
                  {layer.name}
                </span>

                {/* Actions */}
                {layer.kind === 'device' && (
                  <button className="icon-btn !w-5 !h-5" onClick={(e) => { e.stopPropagation(); reorderDevice(layer.id, 1); }}>
                    <IcArrowL size={10} className="rotate-90" />
                  </button>
                )}
                {(layer.kind === 'textbox' || layer.kind === 'icon' || layer.kind === 'deco' || layer.kind === 'canvasImage') && (
                  <button 
                    className="icon-btn !w-5 !h-5 hover:!text-danger" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      checkpoint();
                      if (layer.kind === 'textbox') {
                        update(p => ({ ...p, textboxes: p.textboxes.filter(x => x.id !== layer.id) }), false);
                      } else if (layer.kind === 'icon') {
                        update(p => ({ ...p, icons: p.icons.filter(x => x.id !== layer.id) }), false);
                      } else if (layer.kind === 'deco') {
                        update(p => ({ ...p, decos: p.decos.filter(x => x.id !== layer.id) }), false);
                      } else if (layer.kind === 'canvasImage') {
                        update(p => ({ ...p, canvasImages: p.canvasImages.filter(x => x.id !== layer.id) }), false);
                      }
                    }}
                    disabled={layer.locked}
                  >
                    <IcTrash size={10} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </Section>
  );
}