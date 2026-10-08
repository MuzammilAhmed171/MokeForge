import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogoMark, IcLaptop, IcCopy, IcCheck, IcArrowL, IcMonitor, IcSpark } from '../icons';
import { useAuth } from '../auth/AuthContext';
import { useStudio } from '../store';

export function DesktopOnlyView() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const closeEditor = useStudio(s => s.closeEditor);
  const toast = useStudio(s => s.toast);
  const [copied, setCopied] = useState(false);

  const handleBack = () => {
    if (isAuthenticated) {
      closeEditor();
      navigate('/dashboard');
    } else {
      closeEditor();
      navigate('/');
    }
  };

  const handleCopyLink = () => {
    try {
      const url = window.location.origin + '/editor';
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast('Studio link copied! Send it to your computer', 'ok');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast('Could not copy link', 'err');
    }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col text-fg relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,61,0.4) 0%, rgba(69,214,200,0.2) 50%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Header */}
      <header className="h-14 border-b border-line2 px-4 flex items-center justify-between bg-panel/80 backdrop-blur-md relative z-10">
        <button
          onClick={handleBack}
          className="btn btn-ghost !px-2.5 !py-1.5 text-xs flex items-center gap-1.5"
        >
          <IcArrowL size={14} />
          <span>{isAuthenticated ? 'Dashboard' : 'Home'}</span>
        </button>

        <div className="flex items-center gap-2">
          <LogoMark size={22} />
          <span className="font-bold text-sm tracking-tight" style={{ fontFamily: 'var(--font-disp)' }}>
            MockForge
          </span>
        </div>

        <div className="w-16" /> {/* spacer */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-[480px] w-full text-center space-y-6">
          {/* Animated Desktop Graphics */}
          <div className="relative mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-acc/20 via-panel2 to-acc2/20 border border-line flex items-center justify-center shadow-[0_0_40px_rgba(255,107,61,0.2)]">
            <div className="text-acc animate-pulse">
              <IcLaptop size={44} />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-lg bg-acc2/20 border border-acc2/40 flex items-center justify-center text-acc2">
              <IcSpark size={14} />
            </div>
          </div>

          {/* Titles & Message */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-acc/10 text-acc border border-acc/25 font-mono">
              <IcMonitor size={12} />
              <span>Desktop Studio Recommended</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg" style={{ fontFamily: 'var(--font-disp)' }}>
              Best Experienced on Desktop
            </h1>
            <p className="text-sm text-mut leading-relaxed max-w-[390px] mx-auto">
              MockForge Studio is a professional multi-panel canvas editor designed for larger desktop & laptop screens.
            </p>
          </div>

          {/* Action Cards */}
          <div className="p-4 rounded-xl border border-line bg-panel/70 backdrop-blur-sm text-left space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs text-dim font-mono">
              <span>Open on your Computer</span>
              <span className="text-acc2">Quick Share</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full btn btn-acc !py-2.5 justify-center flex items-center gap-2 font-semibold text-xs cursor-pointer shadow-md"
            >
              {copied ? <IcCheck size={15} /> : <IcCopy size={15} />}
              <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Studio Link for PC'}</span>
            </button>

            <button
              onClick={handleBack}
              className="w-full btn btn-ghost !py-2 justify-center text-xs text-mut hover:text-fg"
            >
              Return to {isAuthenticated ? 'Dashboard' : 'Home Page'}
            </button>
          </div>

          {/* Footer Note */}
          <div className="text-[11px] font-mono text-dim">
            Minimum recommended screen width: <span className="text-fg font-semibold">1024px</span>
          </div>
        </div>
      </main>
    </div>
  );
}
