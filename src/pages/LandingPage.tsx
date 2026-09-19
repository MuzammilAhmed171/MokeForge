import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { IcSpark, IcLayers, IcWand, IcExport, IcDice, LogoMark } from '../icons';
import { Footer } from '../components/Footer';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="border-b border-line2 bg-panel/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={32} />
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>MockForge</span>
          </div>
          <nav className="flex items-center gap-4">
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

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line bg-panel mb-6 anim-fade-up">
            <IcSpark size={16} />
            <span className="text-sm" style={{ color: 'var(--color-acc)' }}>Professional Mockup Studio</span>
          </div>
          
          <h1 className="text-6xl font-bold mb-6 anim-fade-up" style={{ fontFamily: 'var(--font-disp)', animationDelay: '0.1s' }}>
            Create Stunning<br />
            <span style={{ color: 'var(--color-acc)' }}>Portfolio Mockups</span><br />
            in Minutes
          </h1>
          
          <p className="text-xl mb-8 anim-fade-up" style={{ color: 'var(--color-mut)', animationDelay: '0.2s' }}>
            Professional device mockups, advanced design editor, smart layouts, and instant export. 
            Everything you need to showcase your work beautifully.
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
                  <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-disp)' }}>
                    Full Access to Professional Editor
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <IcSpark size={20} className="text-acc mt-1 flex-shrink-0" />
                      <span style={{ color: 'var(--color-mut)' }}>125+ device models with realistic frames</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <IcLayers size={20} className="text-acc mt-1 flex-shrink-0" />
                      <span style={{ color: 'var(--color-mut)' }}>Advanced layer management & smart guides</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <IcWand size={20} className="text-acc mt-1 flex-shrink-0" />
                      <span style={{ color: 'var(--color-mut)' }}>AI-powered design generation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <IcExport size={20} className="text-acc mt-1 flex-shrink-0" />
                      <span style={{ color: 'var(--color-mut)' }}>High-quality exports in multiple formats</span>
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
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-disp)' }}>
            Everything You Need
          </h2>
          <p className="text-lg" style={{ color: 'var(--color-mut)' }}>
            Professional tools for creating stunning mockups
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: IcLayers, title: 'Device Mockups', desc: 'Laptops, phones, tablets, browsers, monitors - 125+ models with realistic frames' },
            { icon: IcWand, title: 'Advanced Editor', desc: 'Drag & drop, resize, rotate, layer management, smart guides, and precision controls' },
            { icon: IcSpark, title: 'Smart Backgrounds', desc: 'Procedural, image, and hybrid backgrounds with 50+ presets and custom options' },
            { icon: IcDice, title: 'Design Generation', desc: 'AI-powered randomization with mood-based themes and unlimited variations' },
            { icon: IcExport, title: 'Professional Export', desc: 'High-quality PNG, JPG, WebP exports with custom sizes and transparency' },
            { icon: IcSpark, title: 'Icons & Decorations', desc: '100+ icons, 50+ decorations, drag & drop, and full customization' },
          ].map((feature, i) => (
            <div key={i} className="card card-hover p-6 anim-fade-up" style={{ animationDelay: `${0.1 * i}s` }}>
              <div className="w-12 h-12 rounded-lg bg-acc/10 flex items-center justify-center mb-4 text-acc">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--color-mut)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-disp)' }}>
            How It Works
          </h2>
          <p className="text-lg" style={{ color: 'var(--color-mut)' }}>
            Create professional mockups in 4 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Upload', desc: 'Upload your screenshots or use sample designs' },
            { step: '2', title: 'Design', desc: 'Choose devices, backgrounds, and layouts' },
            { step: '3', title: 'Customize', desc: 'Fine-tune with advanced editor tools' },
            { step: '4', title: 'Export', desc: 'Download high-quality mockups instantly' },
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

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="card p-12 text-center" style={{ background: 'linear-gradient(135deg, var(--color-panel), var(--color-panel2))' }}>
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-disp)' }}>
            Ready to Create Amazing Mockups?
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--color-mut)' }}>
            Join thousands of designers and developers using MockForge
          </p>
          <Link to="/signup" className="btn btn-acc !px-8 !py-3 !text-base">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
