import { useState } from 'react';
import { useStudio } from '../store';
import {
  VIEWPORT_OPTIONS,
  CaptureViewport,
  cleanAndFormatUrl,
  extractDomain,
  captureWebsiteScreenshots
} from '../services/websiteCapture';
import type { Asset } from '../types';
import {
  IcClose, IcSpark, IcSpin, IcCheck, IcLaptop, IcPhone, IcTablet, IcArrowR
} from '../icons';

interface UrlCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_SAMPLES = [
  { name: 'Stripe', url: 'https://stripe.com' },
  { name: 'Linear', url: 'https://linear.app' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Dribbble', url: 'https://dribbble.com' },
  { name: 'Figma', url: 'https://figma.com' },
  { name: 'Airbnb', url: 'https://airbnb.com' }
];

export function UrlCaptureModal({ open, onClose }: UrlCaptureModalProps) {
  const project = useStudio(s => s.project);
  const addAsset = useStudio(s => s.addAsset);
  const update = useStudio(s => s.update);
  const toast = useStudio(s => s.toast);

  const [url, setUrl] = useState('');
  const [selectedViewports, setSelectedViewports] = useState<CaptureViewport[]>(['desktop', 'mobile', 'tablet']);
  const [autoAssign, setAutoAssign] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [capturedAssets, setCapturedAssets] = useState<Asset[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const toggleViewport = (vp: CaptureViewport) => {
    setSelectedViewports(prev => {
      if (prev.includes(vp)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(v => v !== vp);
      } else {
        return [...prev, vp];
      }
    });
  };

  const handleCapture = async (targetUrlOverride?: string) => {
    const target = targetUrlOverride || url;
    const formatted = cleanAndFormatUrl(target);
    if (!formatted) {
      setErrorMsg('Please enter a valid website URL (e.g. stripe.com)');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setProgressPct(10);
    setProgressMsg('Connecting to website engine...');
    setCapturedAssets([]);

    try {
      const assets = await captureWebsiteScreenshots(
        formatted,
        selectedViewports,
        (msg, pct) => {
          setProgressMsg(msg);
          setProgressPct(pct);
        }
      );

      setCapturedAssets(assets);
      setIsLoading(false);

      // Auto-insert assets into the project
      for (const asset of assets) {
        addAsset(asset);
      }

      // Auto-assign to devices if requested
      if (autoAssign && project && project.devices.length > 0) {
        const desktopAsset = assets.find(a => a.name.toLowerCase().includes('desktop'));
        const mobileAsset = assets.find(a => a.name.toLowerCase().includes('mobile'));
        const tabletAsset = assets.find(a => a.name.toLowerCase().includes('tablet'));

        update(p => {
          let assignedDesktop = false;
          let assignedMobile = false;
          let assignedTablet = false;

          const devices = p.devices.map(d => {
            const kind = d.kind;
            if ((kind === 'laptop' || kind === 'browser' || kind === 'monitor') && desktopAsset && !assignedDesktop) {
              assignedDesktop = true;
              return { ...d, assetId: desktopAsset.id };
            }
            if (kind === 'phone' && mobileAsset && !assignedMobile) {
              assignedMobile = true;
              return { ...d, assetId: mobileAsset.id };
            }
            if (kind === 'tablet' && tabletAsset && !assignedTablet) {
              assignedTablet = true;
              return { ...d, assetId: tabletAsset.id };
            }
            // If device still doesn't have asset, attach first available
            if (!d.assetId && assets[0]) {
              return { ...d, assetId: assets[0].id };
            }
            return d;
          });

          return { ...p, devices };
        }, true);
      }

      toast(`🎉 Captured ${assets.length} website screens from ${extractDomain(formatted)}!`, 'ok');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Failed to capture screenshots. Please check the URL.');
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in"
      style={{ background: 'rgba(8, 9, 11, 0.84)', backdropFilter: 'blur(10px)' }}
      onPointerDown={onClose}
    >
      <div
        className="anim-pop w-[640px] max-w-[96vw] max-h-[92vh] overflow-y-auto rounded-2xl border border-line bg-panel shadow-[0_40px_140px_rgba(0,0,0,0.75)] flex flex-col"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-line2 flex items-center justify-between sticky top-0 bg-panel/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-acc to-acc2 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,107,61,0.35)]">
              <IcSpark size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-bold tracking-tight text-fg" style={{ fontFamily: 'var(--font-disp)' }}>
                  Auto-Capture Website
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-acc/15 text-acc border border-acc/30">
                  Advanced
                </span>
              </div>
              <p className="text-[11.5px] mt-0.5 text-mut" style={{ fontFamily: 'var(--font-mono)' }}>
                Enter any live URL to fetch Desktop, Mobile & Tablet mockups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn !w-8 !h-8 hover:!bg-white/10 rounded-lg text-mut hover:text-fg"
          >
            <IcClose size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* URL Input Bar */}
          <div>
            <label className="block text-[11.5px] font-semibold text-fg mb-1.5 flex items-center justify-between">
              <span>Website URL</span>
              <span className="text-[10px] text-dim font-mono">live rendered screenshots</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-dim font-mono text-xs select-none pointer-events-none">
                https://
              </div>
              <input
                type="text"
                autoFocus
                placeholder="stripe.com, linear.app, or your portfolio URL"
                value={url.replace(/^https?:\/\//i, '')}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    void handleCapture();
                  }
                }}
                disabled={isLoading}
                className="input !pl-[72px] !pr-24 !py-3 !text-[13.5px] w-full font-mono bg-ink border-line focus:border-acc transition-all"
              />
              <button
                disabled={isLoading || !url.trim()}
                onClick={() => void handleCapture()}
                className="absolute right-1.5 btn btn-acc !py-1.5 !px-3.5 text-xs font-semibold disabled:opacity-50"
              >
                {isLoading ? <IcSpin size={13} /> : <IcArrowR size={13} />}
                <span>{isLoading ? 'Fetching…' : 'Capture'}</span>
              </button>
            </div>

            {/* Quick Sample Links */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
              <span className="text-[10px] text-dim font-mono shrink-0">Try samples:</span>
              {QUICK_SAMPLES.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setUrl(s.url);
                    void handleCapture(s.url);
                  }}
                  className="px-2 py-0.5 rounded-md text-[10.5px] bg-panel2 hover:bg-panel3 border border-line text-mut hover:text-acc hover:border-acc/40 transition-all font-mono shrink-0 cursor-pointer"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Viewport Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11.5px] font-semibold text-fg">
                Target Viewports ({selectedViewports.length} selected)
              </label>
              <span className="text-[10.5px] text-dim font-mono">click to toggle</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {VIEWPORT_OPTIONS.map((vp) => {
                const isSelected = selectedViewports.includes(vp.id);
                return (
                  <div
                    key={vp.id}
                    onClick={() => !isLoading && toggleViewport(vp.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-acc bg-acc/5 shadow-[0_0_15px_rgba(255,107,61,0.12)]'
                        : 'border-line bg-panel2 opacity-60 hover:opacity-100 hover:border-line2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{vp.icon}</span>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                          isSelected ? 'bg-acc border-acc text-white' : 'border-line bg-panel'
                        }`}
                      >
                        {isSelected && <IcCheck size={10} />}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-fg truncate">{vp.label}</div>
                      <div className="text-[9.5px] font-mono text-dim mt-0.5">{vp.sublabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auto Assign Toggle */}
          <div className="p-3 rounded-xl border border-line bg-panel2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-acc2"><IcSpark size={16} /></span>
              <div>
                <div className="text-[12px] font-medium text-fg">Auto-assign screens to canvas devices</div>
                <div className="text-[10px] text-dim font-mono">
                  Attaches desktop screen to laptops, mobile to phones, tablet to iPads
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="accent-acc w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl border border-danger/40 bg-danger/10 text-danger text-xs flex items-center gap-2 anim-shake">
              <span>⚠️</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {/* Loading Animation & Progress */}
          {isLoading && (
            <div className="p-5 rounded-xl border border-acc/30 bg-ink/80 text-center space-y-3 anim-fade-in">
              <div className="flex items-center justify-center gap-2 text-acc font-semibold text-sm">
                <IcSpin size={18} />
                <span>{progressMsg || 'Rendering website screenshots…'}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-panel2 h-2 rounded-full overflow-hidden border border-line">
                <div
                  className="h-full bg-gradient-to-r from-acc to-acc2 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="text-[10.5px] font-mono text-dim">
                Capturing responsive viewports with Chrome engine ({progressPct}%)
              </div>
            </div>
          )}

          {/* Captured Results Preview */}
          {capturedAssets.length > 0 && !isLoading && (
            <div className="space-y-2.5 pt-2 border-t border-line2 anim-fade-up">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-bold text-fg flex items-center gap-1.5">
                  <span className="text-acc2">✓</span>
                  <span>Captured {capturedAssets.length} Screenshots</span>
                </div>
                <span className="text-[10px] font-mono text-acc2">Ready & added to studio</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {capturedAssets.map((asset) => (
                  <div key={asset.id} className="rounded-xl border border-line bg-panel2 overflow-hidden group relative">
                    <img src={asset.dataUrl} alt={asset.name} className="w-full aspect-[4/3] object-cover object-top" />
                    <div className="p-2 border-t border-line2 bg-panel">
                      <div className="text-[10.5px] font-semibold text-fg truncate">{asset.name}</div>
                      <div className="text-[9px] font-mono text-dim mt-0.5">
                        {asset.w} × {asset.h} px
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line2 bg-panel flex items-center justify-between mt-auto">
          <span className="text-[11px] font-mono text-dim">
            {capturedAssets.length > 0
              ? 'Screenshots are live in your studio asset list'
              : 'Works with any public website URL'}
          </span>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={onClose}>
              {capturedAssets.length > 0 ? 'Close' : 'Cancel'}
            </button>
            {capturedAssets.length > 0 ? (
              <button className="btn btn-acc" onClick={handleFinish}>
                <IcCheck size={14} /> Done
              </button>
            ) : (
              <button
                className="btn btn-acc"
                disabled={isLoading || !url.trim()}
                onClick={() => void handleCapture()}
              >
                {isLoading ? <IcSpin size={14} /> : <IcSpark size={14} />}
                Capture Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
