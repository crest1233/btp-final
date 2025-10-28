import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowRight, Users, Briefcase, TrendingUp, Star, Zap, Shield, Menu, X } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { APP_VERSION, APP_NAME } from '../../version';

interface LandingScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function LandingScreen({ navigate }: LandingScreenProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('features');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    const header = document.getElementById('landing-header');
    const headerHeight = header?.offsetHeight ?? 64;
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 8; // small gap
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  useEffect(() => {
    const ids = ['features', 'testimonials', 'cta', 'footer'];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: null,
        threshold: 0.4,
        rootMargin: '-20% 0px -40% 0px',
      }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const linkClass = (id: string) =>
    `text-sm ${activeSection === id ? 'text-purple-700 font-semibold' : 'text-gray-700 hover:text-purple-700'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header / Top Navbar */}
      <header id="landing-header" className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">{APP_NAME}</span>
            </div>
            <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Primary">
              <a href="#features" className={linkClass('features')} onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
              <a href="#testimonials" className={linkClass('testimonials')} onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>Testimonials</a>
              <a href="#cta" className={linkClass('cta')} onClick={(e) => { e.preventDefault(); scrollToSection('cta'); }}>Get Started</a>
              <a href="#footer" className={linkClass('footer')} onClick={(e) => { e.preventDefault(); scrollToSection('footer'); }}>Resources</a>
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('login')}>Sign In</Button>
              <Button onClick={() => navigate('roleSelection')} className="gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <button
              aria-label="Open menu"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-4 py-3 space-y-2">
              <a href="#features" className="block text-sm text-gray-700 hover:text-purple-700" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
              <a href="#testimonials" className="block text-sm text-gray-700 hover:text-purple-700" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>Testimonials</a>
              <a href="#cta" className="block text-sm text-gray-700 hover:text-purple-700" onClick={(e) => { e.preventDefault(); scrollToSection('cta'); }}>Get Started</a>
              <a href="#footer" className="block text-sm text-gray-700 hover:text-purple-700" onClick={(e) => { e.preventDefault(); scrollToSection('footer'); }}>Resources</a>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate('login')}>Sign In</Button>
                <Button className="flex-1 gap-2" onClick={() => navigate('roleSelection')}>
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4" />
            <span className="text-sm">The Future of Creator-Brand Collaboration</span>
          </div>
          
          <h1 className="text-gray-900 mb-6 max-w-4xl mx-auto">
            Connect Creators with Brands, Effortlessly
          </h1>
          
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Inverso bridges the gap between talented creators and ambitious brands. 
            Find perfect collaborations, manage campaigns, and grow together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => navigate('roleSelection')} className="gap-2">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('login')}>
              Sign In
            </Button>
          </div>

          {/* Hero Image */}
          <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbGxhYm9yYXRpb258ZW58MXx8fHwxNzYwNTA5Mzc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Collaboration"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Problem/Solution Section */}
        <div id="features" className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-2 border-purple-100">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-gray-900 mb-3">For Creators</h3>
              <p className="text-gray-600 mb-4">
                Showcase your talent, connect with top brands, and monetize your content 
                with fair pricing based on your engagement and reach.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-600" />
                  Get discovered by premium brands
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  AI-powered price prediction
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Secure campaign management
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-gray-900 mb-3">For Brands</h3>
              <p className="text-gray-600 mb-4">
                Find the perfect creators for your campaigns, manage collaborations, 
                and track performance all in one place.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-600" />
                  Advanced creator discovery
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Campaign analytics & insights
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Verified creator profiles
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials */}
        <div id="testimonials" className="text-center mb-16">
          <h2 className="text-gray-900 mb-12">Trusted by Creators & Brands</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Content Creator',
                text: 'Inverso helped me land collaborations with brands I always dreamed of working with.',
              },
              {
                name: 'Mike Chen',
                role: 'Marketing Director',
                text: 'Finding the right creators has never been easier. The platform saves us hours of research.',
              },
              {
                name: 'Emma Davis',
                role: 'Lifestyle Influencer',
                text: 'The pricing tool ensures I\'m always compensated fairly for my work.',
              },
            ].map((testimonial, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-1 text-yellow-500 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">"{testimonial.text}"</p>
                  <div>
                    <p className="text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-gray-500 text-xs">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card id="cta" className="bg-gradient-to-br from-purple-600 to-blue-600 border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-white mb-4">Ready to Get Started?</h2>
            <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of creators and brands already collaborating on Inverso
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('roleSelection')} className="gap-2">
              Create Your Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer id="footer" className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg" />
              <span className="text-gray-900">{APP_NAME}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">v{APP_VERSION}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-purple-600 transition-colors">About</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Support</a>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 {APP_NAME}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
