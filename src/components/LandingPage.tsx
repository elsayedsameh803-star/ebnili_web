import { useState } from 'react';
import {
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  Check,
  Code2,
  Eye,
  Download,
  History,
  Shield,
  Rocket,
  ShoppingBag,
  LayoutDashboard,
  Star,
  Menu,
  X,
  Github,
  Twitter,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PRICING, ORANGE_CASH_NUMBER } from '@/lib/types';

interface LandingPageProps {
  onNavigate: (view: 'signin' | 'signup' | 'builder') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { user } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const features = [
    { icon: Sparkles, title: 'AI-Powered Generation', desc: 'Describe your app in plain language and watch it come to life instantly.' },
    { icon: Eye, title: 'Live Side-by-Side Preview', desc: 'See your code and preview side-by-side with mobile, tablet, and desktop views.' },
    { icon: History, title: 'Version History', desc: 'Every generation is saved. Roll back to any version at any time.' },
    { icon: Download, title: 'Export & Share', desc: 'Download your project as a ZIP or share a link with your team.' },
    { icon: Shield, title: 'Secure & Private', desc: 'Your projects are protected with device-level security and auth.' },
    { icon: Layers, title: 'Template Library', desc: 'Start from e-commerce, landing page, or dashboard templates.' },
  ];

  const templates = [
    { icon: ShoppingBag, name: 'E-Commerce', color: 'from-orange-500 to-amber-500' },
    { icon: Rocket, name: 'Landing Page', color: 'from-blue-500 to-cyan-500' },
    { icon: LayoutDashboard, name: 'Dashboard', color: 'from-green-500 to-emerald-500' },
    { icon: Code2, name: 'Custom App', color: 'from-slate-700 to-slate-900' },
  ];

  const tiers = [
    {
      id: 'free' as const,
      name: 'Free',
      price: 0,
      icon: Zap,
      features: ['3 AI generations', 'Basic templates', 'Mobile + desktop preview', 'Copy code export'],
      cta: 'Start Free',
    },
    {
      id: 'starter' as const,
      name: 'Starter',
      price: PRICING.starter.price,
      icon: Sparkles,
      features: ['100 AI generations', 'All templates', 'All viewport sizes', 'ZIP export', 'Version history'],
      cta: 'Get Starter',
      popular: true,
    },
    {
      id: 'pro' as const,
      name: 'PRO',
      price: PRICING.pro.price,
      icon: Crown,
      features: ['Unlimited generations', 'Priority processing', 'Advanced templates', 'Team sharing', 'Priority support', 'Custom branding'],
      cta: 'Go PRO',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900">Ebnili</span>
              <span className="text-[10px] text-slate-400 ml-1.5">ابنيلي</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#templates" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Templates</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                onClick={() => onNavigate('builder')}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
              >
                Dashboard <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button onClick={() => onNavigate('signin')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-slate-700">
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-slate-100 px-6 py-4 space-y-3 bg-white">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm font-medium text-slate-600">Features</a>
            <a href="#templates" onClick={() => setMobileMenu(false)} className="block text-sm font-medium text-slate-600">Templates</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-sm font-medium text-slate-600">Pricing</a>
            <button onClick={() => onNavigate('signin')} className="block text-sm font-medium text-slate-600">Sign In</button>
            <button onClick={() => onNavigate('signup')} className="block px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold">Get Started</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 via-white to-white" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-semibold text-orange-700">Now with Orange Cash payments</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.05] mb-6">
            Build web apps
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">with your words</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Ebnili turns your ideas into production-ready web apps. Just describe what you want,
            and our AI generates the code instantly. Preview, iterate, and export.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => onNavigate('builder')}
              className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-orange-500 transition-all hover:scale-105 shadow-lg shadow-slate-900/10"
            >
              Start Building Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#features"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              <Eye size={18} />
              See How It Works
            </a>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-1.5"><Check size={15} className="text-green-500" /> No credit card needed</div>
            <div className="flex items-center gap-1.5"><Check size={15} className="text-green-500" /> 3 free generations</div>
            <div className="flex items-center gap-1.5"><Check size={15} className="text-green-500" /> Export to ZIP</div>
          </div>
        </div>
      </section>

      {/* Logos / Social Proof */}
      <section className="py-12 px-6 border-y border-slate-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-6">Trusted by builders everywhere</p>
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1,2,3,4,5].map(s => <Star key={s} size={20} className="text-orange-400 fill-orange-400" />)}
          </div>
          <p className="text-sm text-slate-500 mt-3">Loved by 1,000+ creators across Egypt and the MENA region</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need to ship</h2>
            <p className="text-lg text-slate-500">Powerful features designed for speed and creativity</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="group p-7 rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all bg-white">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon size={24} className="text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Templates Showcase */}
      <section id="templates" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Start from a template</h2>
            <p className="text-lg text-slate-500">Or describe your own from scratch</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {templates.map((template, i) => {
              const Icon = template.icon;
              return (
                <div key={i} className="group p-6 rounded-2xl bg-white border border-slate-100 hover:shadow-lg transition-all cursor-pointer text-center">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <p className="font-semibold text-slate-900">{template.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-500">From idea to app in three steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Describe', desc: 'Type what you want to build in plain language or pick a template.' },
              { step: '02', title: 'Preview', desc: 'Watch the AI generate your app with live side-by-side preview.' },
              { step: '03', title: 'Export', desc: 'Download as ZIP, copy code, or share with your team.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-5xl font-bold text-orange-100 mb-3">{item.step}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-slate-500">Start free. Upgrade when you need more.</p>
            <div className="inline-flex items-center gap-1 mt-6 p-1 rounded-lg bg-white border border-slate-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                Yearly <span className="text-orange-500">-20%</span>
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const price = billingCycle === 'yearly' ? Math.round(tier.price * 12 * 0.8) : tier.price;
              return (
                <div
                  key={tier.id}
                  className={`relative p-7 rounded-2xl bg-white border-2 transition-all ${
                    tier.popular ? 'border-orange-500 shadow-xl shadow-orange-500/10 scale-105' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold">
                      MOST POPULAR
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
                    <Icon size={24} className={tier.popular ? 'text-orange-500' : 'text-slate-400'} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-bold text-slate-900">{price}</span>
                    <span className="text-sm text-slate-400">EGP{billingCycle === 'yearly' && tier.price > 0 ? '/yr' : '/mo'}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check size={16} className={tier.popular ? 'text-orange-500' : 'text-slate-400'} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onNavigate('builder')}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      tier.popular
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {tier.cta}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-slate-500">
              Pay easily via <span className="font-semibold text-orange-600">Orange Cash</span> to {ORANGE_CASH_NUMBER}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'What is Ebnili?', a: 'Ebnili is an AI-powered web app builder. You describe what you want in plain language, and it generates production-ready code instantly.' },
              { q: 'How many free generations do I get?', a: 'Every new account gets 3 free AI generations. No credit card required to start.' },
              { q: 'How do payments work?', a: 'We use Orange Cash for payments. Transfer to our wallet number, enter your receipt code, and your subscription is activated instantly.' },
              { q: 'Can I export my projects?', a: 'Yes! You can copy the code, share a link, or download your project as a ZIP file.' },
              { q: 'What templates are available?', a: 'We offer e-commerce, landing page, and analytics dashboard templates, plus a blank canvas for custom projects.' },
            ].map((faq, i) => (
              <div key={i} className="p-5 rounded-xl border border-slate-100 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="font-semibold text-slate-900">{faq.q}</h3>
                  <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <p className="text-sm text-slate-500 leading-relaxed mt-2">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl font-bold mb-4">Ready to build something amazing?</h2>
              <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
                Join thousands of creators using Ebnili to turn ideas into apps.
              </p>
              <button
                onClick={() => onNavigate('builder')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all hover:scale-105"
              >
                Get Started for Free
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">Ebnili</span>
            <span className="text-xs text-slate-400">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <Twitter size={18} className="hover:text-slate-900 cursor-pointer transition-colors" />
            <Github size={18} className="hover:text-slate-900 cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}
