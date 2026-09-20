import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { IcSpark, IcLayers, IcWand, IcExport, IcDice, LogoMark, IcDown, IcUp } from '../icons';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';

const faqs = [
  {
    q: 'What is MOKE FORGE?',
    a: 'MOKE FORGE is a professional web-based mockup generator built for developers, UI/UX designers, and digital creators. It allows you to transform website screenshots and application designs into high-quality device mockups in seconds without requiring complex design software.',
  },
  {
    q: 'How do I create a website portfolio mockup from a screenshot?',
    a: 'Simply upload your website screenshot, choose from our collection of laptop, tablet, phone, or browser frames, customize the background and layout using the drag-and-drop editor, and export your high-resolution mockup with a single click.',
  },
  {
    q: 'Which device frames are supported in MOKE FORGE?',
    a: 'MOKE FORGE features 125+ realistic device frames including modern laptops (MacBook & ultrabooks), smartphones (iPhone & Android), tablets (iPad), Safari/Chrome browser windows, and desktop monitors.',
  },
  {
    q: 'Do I need Photoshop, Figma, or design software to use MOKE FORGE?',
    a: 'No. MOKE FORGE runs entirely in your web browser. You get an intuitive visual canvas with smart alignment guides, layering, angle controls, procedural backgrounds, and instant rendering with zero installation required.',
  },
  {
    q: 'Can I export mockups with transparent backgrounds and high resolution?',
    a: 'Yes. You can export your portfolio and website mockups in high-resolution PNG, JPG, or WebP formats, with options for custom dimensions, retina scaling, and transparent alpha channels.',
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-ink">
      <SEOHead
        title="MOKE FORGE — Portfolio & Website Mockup Generator"
        description="Create stunning portfolio mockups from website screenshots in minutes. Professional laptop, tablet, and mobile device frames, smart backgrounds, and instant high-res export."
        canonicalUrl="https://mokeforge.vercel.app/"
        schemaJson={faqSchema}
      />

      {/* Header */}
      <header className="border-b border-line2 bg-panel/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={32} />
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>
              MOKE FORGE
            </span>
          </div>
          <nav className="flex items-center gap-4" aria-label="Main Navigation">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-acc">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Log In</Link>
                <Link to="/signup" className="btn btn-acc">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20" aria-label="Hero">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line bg-panel mb-6 anim-fade-up">
              <LogoMark size={16} />
              <span className="text-sm" style={{ color: 'var(--color-acc)' }}>
                Professional Portfolio &amp; Website Mockup Generator
              </span>
            </div>

            <h1 className="text-6xl font-bold mb-6 anim-fade-up" style={{ fontFamily: 'var(--font-disp)', animationDelay: '0.1s' }}>
              Create Stunning<br />
              <span style={{ color: 'var(--color-acc)' }}>Portfolio Mockups</span><br />
              in Minutes
            </h1>

            <p className="text-xl mb-8 anim-fade-up leading-relaxed" style={{ color: 'var(--color-mut)', animationDelay: '0.2s' }}>
              Transform website screenshots into professional device mockups with realistic laptop, tablet, and mobile frames. Built for developers, designers, and agencies to showcase their work beautifully.
            </p>

            <div className="flex items-center justify-center gap-4 anim-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/signup" className="btn btn-acc !px-8 !py-3 !text-base">
                Start Creating Free
              </Link>
              <Link to="/login" className="btn !px-8 !py-3 !text-base">
                Log In
              </Link>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mt-16 anim-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="relative rounded-2xl border border-line overflow-hidden shadow-2xl bg-gradient-to-br from-panel to-panel2">
              <div className="aspect-video p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center h-full">
                  <div>
                    <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-disp)' }}>
                      Full Access to Professional Editor
                    </h2>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <IcSpark size={20} className="text-acc mt-1 flex-shrink-0" />
                        <span style={{ color: 'var(--color-mut)' }}>125+ device models with realistic laptop, phone &amp; tablet frames</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <IcLayers size={20} className="text-acc mt-1 flex-shrink-0" />
                        <span style={{ color: 'var(--color-mut)' }}>Advanced layer management, rotation &amp; smart guides</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <IcWand size={20} className="text-acc mt-1 flex-shrink-0" />
                        <span style={{ color: 'var(--color-mut)' }}>AI-powered design generation &amp; mood-based palettes</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <IcExport size={20} className="text-acc mt-1 flex-shrink-0" />
                        <span style={{ color: 'var(--color-mut)' }}>High-quality PNG, JPG &amp; WebP exports with transparent backgrounds</span>
                      </li>
                    </ul>
                    <Link to="/signup" className="btn btn-acc mt-6 inline-flex">
                      Start Creating Now
                    </Link>
                  </div>
                  <div className="hidden md:flex items-center justify-center">
                    <div className="relative">
                      <div className="w-64 h-40 bg-ink rounded-lg border-4 border-line shadow-2xl flex items-center justify-center">
                        <LogoMark size={60} />
                      </div>
                      <div className="absolute -bottom-4 -right-4 w-32 h-20 bg-ink rounded-lg border-2 border-line shadow-xl flex items-center justify-center">
                        <IcLayers size={30} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-20" aria-label="Features">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-disp)' }}>
              Everything You Need for Portfolio Presentation
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-mut)' }}>
              Professional tools for creating high-impact website and device mockups
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: IcLayers, title: 'Realistic Device Mockups', desc: 'Laptops, smartphones, tablets, browsers, and desktop monitors — 125+ models with photorealistic shadows and bezels.' },
              { icon: IcWand, title: 'Advanced Design Editor', desc: 'Drag & drop, multi-device positioning, angle controls, layer hierarchy, and precision alignment guides.' },
              { icon: IcSpark, title: 'Smart Studio Backgrounds', desc: 'Procedural gradients, realistic textures, mesh blends, and 50+ curated presets for modern portfolio presentations.' },
              { icon: IcDice, title: 'Design Randomization', desc: 'AI-assisted layout generation with curated color themes and instant style variations for web projects.' },
              { icon: IcExport, title: 'High-Resolution Export', desc: 'Pixel-perfect PNG, JPG, and WebP downloads with custom aspect ratios, retina scaling, and transparent backgrounds.' },
              { icon: IcSpark, title: 'Icons & Visual Badges', desc: '100+ tech icons, UI badges, decorations, and customizable elements to enrich your project showcases.' },
            ].map((feature, i) => (
              <article key={i} className="card card-hover p-6 anim-fade-up" style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="w-12 h-12 rounded-lg bg-acc/10 flex items-center justify-center mb-4 text-acc">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--color-mut)' }}>{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-7xl mx-auto px-6 py-20" aria-label="How It Works">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-disp)' }}>
              How to Create Mockups in 4 Simple Steps
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-mut)' }}>
              Fast, intuitive workflow designed for web developers, UI/UX designers, and portfolio creators
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Upload Screenshot', desc: 'Import website screenshots, app UI captures, or choose from our sample screens.' },
              { step: '2', title: 'Choose Device Frame', desc: 'Select from laptops, iPhones, Androids, iPads, or browser frames.' },
              { step: '3', title: 'Customize Layout', desc: 'Adjust background colors, gradients, shadows, rotation, and typography.' },
              { step: '4', title: 'Export High-Res', desc: 'Download crystal-clear mockups ready for your portfolio, GitHub, or Dribbble.' },
            ].map((item, i) => (
              <div key={i} className="text-center anim-fade-up" style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="w-16 h-16 rounded-full bg-acc flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold" style={{ color: '#1a0e08' }}>{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--color-mut)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-6 py-20" aria-label="Frequently Asked Questions">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-disp)' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-mut)' }}>
              Everything you need to know about creating mockups with MOKE FORGE
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="card p-6 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--color-panel)',
                    borderColor: isOpen ? 'var(--color-acc)' : 'var(--color-line)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left gap-4 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <h3
                      className="text-lg font-bold"
                      style={{
                        fontFamily: 'var(--font-disp)',
                        color: isOpen ? 'var(--color-acc)' : 'var(--color-fg)',
                      }}
                    >
                      {faq.q}
                    </h3>
                    <span className="flex-shrink-0" style={{ color: 'var(--color-acc)' }}>
                      {isOpen ? <IcUp size={20} /> : <IcDown size={20} />}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm md:text-base leading-relaxed" style={{ color: 'var(--color-mut)' }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-20" aria-label="Call to Action">
          <div className="card p-12 text-center" style={{ background: 'linear-gradient(135deg, var(--color-panel), var(--color-panel2))' }}>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-disp)' }}>
              Ready to Create Amazing Portfolio Mockups?
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--color-mut)' }}>
              Join thousands of developers, UI/UX designers, and creators using MOKE FORGE to elevate their project showcases.
            </p>
            <Link to="/signup" className="btn btn-acc !px-8 !py-3 !text-base">
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
