import { Link } from 'react-router-dom';
import { loadFooterConfig, isFieldVisible, getCurrentYear, getSocialLinks, getLegalLinks } from '../config/footerConfig';
import { LogoMark, IcSpark, IcLayers } from '../icons';

export function Footer() {
  const config = loadFooterConfig();
  const socialLinks = getSocialLinks(config);
  const legalLinks = getLegalLinks(config);
  const currentYear = getCurrentYear();

  const hasContactInfo = isFieldVisible(config.email) || isFieldVisible(config.phone) || isFieldVisible(config.address);
  const hasCreatorInfo = isFieldVisible(config.creatorName);

  return (
    <footer className="bg-panel border-t border-line2">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Column 1: Brand, Tagline & Capabilities (Spans 6 cols on desktop) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <LogoMark size={34} />
              <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>
                {config.companyName || 'MOCK FORGE'}
              </span>
            </div>
            
            {isFieldVisible(config.tagline) && (
              <p className="text-sm font-semibold" style={{ color: 'var(--color-acc)' }}>
                {config.tagline}
              </p>
            )}

            {isFieldVisible(config.description) && (
              <p className="text-sm leading-relaxed max-w-lg" style={{ color: 'var(--color-mut)' }}>
                {config.description}
              </p>
            )}

            {/* Feature Capability Badges - Keeps footer rich & informative */}
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-line bg-panel2" style={{ color: 'var(--color-mut)' }}>
                <IcLayers size={13} className="text-acc" /> 125+ Device Frames
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-line bg-panel2" style={{ color: 'var(--color-mut)' }}>
                <IcSpark size={13} className="text-acc" /> Smart Backgrounds
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-line bg-panel2" style={{ color: 'var(--color-mut)' }}>
                High-Res PNG / WebP
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-line bg-panel2" style={{ color: 'var(--color-mut)' }}>
                100% In-Browser
              </span>
            </div>
          </div>

          {/* Column 2: Studio Navigation (Spans 3 cols on desktop) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-fg)' }}>
              Studio &amp; App
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="text-sm hover:text-acc transition-colors inline-flex items-center gap-1.5" style={{ color: 'var(--color-mut)' }}>
                  Mockup Generator
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-sm hover:text-acc transition-colors inline-flex items-center gap-1.5" style={{ color: 'var(--color-mut)' }}>
                  Start Creating Free
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm hover:text-acc transition-colors inline-flex items-center gap-1.5" style={{ color: 'var(--color-mut)' }}>
                  Account Log In
                </Link>
              </li>
            </ul>

            {/* Live System Health Badge */}
            <div className="pt-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-panel2 text-xs" style={{ color: 'var(--color-dim)' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>All Studio Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Column 3: Creator & Contact (Spans 3 cols on desktop) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-fg)' }}>
              Creator &amp; Support
            </h3>
            
            <ul className="space-y-3 text-sm">
              {hasCreatorInfo && (
                <li style={{ color: 'var(--color-mut)' }}>
                  <span className="block text-xs uppercase font-medium mb-0.5" style={{ color: 'var(--color-dim)' }}>Built By</span>
                  {isFieldVisible(config.creatorPortfolio) ? (
                    <a
                      href={config.creatorPortfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-acc transition-colors inline-flex items-center gap-1"
                      style={{ color: 'var(--color-fg)' }}
                    >
                      {config.creatorName}
                      <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <span className="font-medium" style={{ color: 'var(--color-fg)' }}>{config.creatorName}</span>
                  )}
                  {isFieldVisible(config.creatorRole) && (
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--color-dim)' }}>{config.creatorRole}</span>
                  )}
                </li>
              )}

              {isFieldVisible(config.email) && (
                <li style={{ color: 'var(--color-mut)' }}>
                  <span className="block text-xs uppercase font-medium mb-0.5" style={{ color: 'var(--color-dim)' }}>Direct Inquiries</span>
                  <a
                    href={`mailto:${config.email}`}
                    className="hover:text-acc transition-colors break-all text-xs md:text-sm"
                    style={{ color: 'var(--color-fg)' }}
                  >
                    {config.email}
                  </a>
                </li>
              )}
            </ul>

            {/* Social Links if present */}
            {socialLinks.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-all hover:scale-110"
                    style={{ 
                      backgroundColor: 'var(--color-panel2)',
                      border: '1px solid var(--color-line)',
                    }}
                    title={link.name}
                  >
                    {link.icon === 'portfolio' || link.icon === 'website' ? (
                      <svg className="w-4 h-4" style={{ color: 'var(--color-mut)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" style={{ color: 'var(--color-mut)' }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-line2 bg-panel/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <div className="text-xs md:text-sm" style={{ color: 'var(--color-dim)' }}>
              {isFieldVisible(config.copyrightText) ? (
                <span>{config.copyrightText}</span>
              ) : (
                <span>© {currentYear} {config.companyName || 'MOCK FORGE'}. All rights reserved.</span>
              )}
            </div>

            {/* Legal Links (if any configured) */}
            {legalLinks.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {legalLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:text-acc transition-colors"
                    style={{ color: 'var(--color-dim)' }}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            )}

            {/* Tech Stack Indicator */}
            {config.showBuiltWith && (
              <div className="text-xs" style={{ color: 'var(--color-dim)' }}>
                Built with React, TypeScript &amp; Node.js
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
