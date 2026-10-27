import React, { useState } from 'react';
import { 
  Sparkles, Compass, Shield, Radio, Database, Users, 
  Code, ExternalLink, Globe, Layers, ChevronRight, Star, 
  MapPin, CheckCircle2, Copy, Headphones, MessageSquare
} from 'lucide-react';
import ConciergeWidget from './components/ConciergeWidget';
import AdminDashboard from './components/AdminDashboard';
import ScraperManager from './components/ScraperManager';
import LeadsCRM from './components/LeadsCRM';

export default function App() {
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'admin' | 'knowledge' | 'leads' | 'embed'
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- Away In Style AI Concierge Chatbot Embed Script -->
<script 
  src="https://skyblue-mandrill-216177.hostingersite.com/assets/index.js" 
  data-api-endpoint="https://skyblue-mandrill-216177.hostingersite.com/api" 
  async>
</script>
<link rel="stylesheet" href="https://skyblue-mandrill-216177.hostingersite.com/assets/index.css" />`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-zinc-100 flex flex-col font-sans selection:bg-gold-500/30 selection:text-gold-200">
      {/* Top Luxury Navigation Bar */}
      <header className="border-b border-gold-500/20 bg-obsidian-950/90 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gold-600 via-gold-400 to-gold-200 flex items-center justify-center text-obsidian-950 font-bold shadow-md">
              <Sparkles className="w-5 h-5 text-obsidian-950" />
            </div>
            <div>
              <h1 className="font-luxury text-xl font-bold tracking-wider gold-text-gradient leading-none">
                Away In Style
              </h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">
                AI Lifestyle Concierge & Live Platform
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-400/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-gold-400" />
              <span>Lifestyle Chatbot</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Live Agent Takeover</span>
            </button>

            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'knowledge'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-400/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>Scraper & Vectors</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'leads'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-400/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>VIP Leads CRM</span>
            </button>

            <button
              onClick={() => setActiveTab('embed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'embed'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-400/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-gold-400" />
              <span>Embed Code</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'demo' && (
          <div className="space-y-8">
            {/* Hero Luxury Introduction Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-gold-500/20 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 p-8 sm:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-2xl space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-[11px] uppercase tracking-widest text-gold-300 font-serif">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                  Independent Luxury Lifestyle Media Platform • Est. 2009
                </div>

                <h2 className="font-luxury text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 leading-tight">
                  Away In Style <br />
                  <span className="gold-text-gradient italic">AI Lifestyle Concierge</span>
                </h2>

                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
                  Welcome to the Away In Style Concierge Platform. Test natural language inquiries for luxury hotels, Michelin gastronomy, fashion, wellness retreats, and brand memberships.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                  <div className="px-3.5 py-2 rounded-lg bg-obsidian-850 border border-zinc-800 text-zinc-300 flex items-center gap-2 shadow">
                    <CheckCircle2 className="w-4 h-4 text-gold-400" />
                    <span>50 Pre-seeded Luxury FAQs</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-lg bg-obsidian-850 border border-zinc-800 text-zinc-300 flex items-center gap-2 shadow">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Live Admin Force Takeover</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-lg bg-obsidian-850 border border-zinc-800 text-zinc-300 flex items-center gap-2 shadow">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>Anonymous IP & UUID (Tawk.to Style)</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-lg bg-obsidian-850 border border-zinc-800 text-zinc-300 flex items-center gap-2 shadow">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Fallback VIP Lead Capture</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial Showcase Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-luxury text-2xl font-bold text-zinc-100">
                  Featured Editorial Stories
                </h3>
                <a
                  href="https://www.awayinstyle.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gold-400 hover:text-gold-200 flex items-center gap-1 transition"
                >
                  <span>Visit awayinstyle.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="group bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-gold-500/40 transition duration-300 shadow-lg">
                  <div className="h-40 bg-gradient-to-br from-zinc-800 via-obsidian-800 to-obsidian-950 p-4 flex flex-col justify-end">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gold-500/30 text-gold-300 border border-gold-500/40 rounded w-fit mb-1 font-semibold">
                      Luxury Travel & Resorts
                    </span>
                    <h4 className="font-luxury text-lg font-bold text-zinc-100 group-hover:text-gold-300 transition">
                      Niyama Private Islands Maldives — Exclusive Sanctuaries
                    </h4>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Secluded water pavilions, underwater dining, and world-class surfing along the pristine Dhaalu Atoll.
                    </p>
                    <div className="text-[11px] text-gold-400 font-medium">
                      Ask the Concierge widget on bottom-right to plan your escape →
                    </div>
                  </div>
                </div>

                <div className="group bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-gold-500/40 transition duration-300 shadow-lg">
                  <div className="h-40 bg-gradient-to-br from-zinc-800 via-obsidian-800 to-obsidian-950 p-4 flex flex-col justify-end">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gold-500/30 text-gold-300 border border-gold-500/40 rounded w-fit mb-1 font-semibold">
                      Gastronomy
                    </span>
                    <h4 className="font-luxury text-lg font-bold text-zinc-100 group-hover:text-gold-300 transition">
                      Best Michelin-Starred Dining in Bangkok (2026)
                    </h4>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      From innovative Thai tasting menus to intimate Japanese omakase led by acclaimed master chefs.
                    </p>
                    <div className="text-[11px] text-gold-400 font-medium">
                      Ask the Concierge for Michelin table recommendations →
                    </div>
                  </div>
                </div>

                <div className="group bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-gold-500/40 transition duration-300 shadow-lg">
                  <div className="h-40 bg-gradient-to-br from-zinc-800 via-obsidian-800 to-obsidian-950 p-4 flex flex-col justify-end">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gold-500/30 text-gold-300 border border-gold-500/40 rounded w-fit mb-1 font-semibold">
                      Brand Partnerships
                    </span>
                    <h4 className="font-luxury text-lg font-bold text-zinc-100 group-hover:text-gold-300 transition">
                      Brand Membership Tiers: Chic, Luxe & Icon Packages
                    </h4>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Connect your luxury hospitality, timepiece, or fashion brand with high-net-worth global readers.
                    </p>
                    <div className="text-[11px] text-gold-400 font-medium">
                      Ask the Concierge about brand partnership opportunities →
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Luxury Concierge Widget */}
            <ConciergeWidget autoOpen={false} />
          </div>
        )}

        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'knowledge' && <ScraperManager />}
        {activeTab === 'leads' && <LeadsCRM />}
        
        {activeTab === 'embed' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 bg-obsidian-900 border border-zinc-800 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-gold-400" />
                <h3 className="font-luxury text-xl font-bold text-zinc-100">
                  Embed on Any External Website
                </h3>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Paste this single script tag into your WordPress, Shopify, Webflow, or custom HTML/PHP site before <code className="text-gold-300">&lt;/body&gt;</code>:
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-200">Copy Embed Code:</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-gold-400 hover:text-gold-200 text-xs font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-obsidian-950 border border-zinc-800 rounded-lg text-xs font-mono text-gold-200 overflow-x-auto">
                  {embedCode}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-obsidian-950 py-4 text-center text-xs text-zinc-500">
        Away In Style Lifestyle Concierge • Built with PHP Backend + React Frontend + Vector RAG
      </footer>
    </div>
  );
}
