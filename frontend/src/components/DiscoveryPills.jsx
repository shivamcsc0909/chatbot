import React from 'react';
import { Compass, Sparkles, Building2, Utensils, Gem, ShieldCheck, HeartPulse, Palette, Briefcase } from 'lucide-react';

const CATEGORIES = [
  { label: 'Luxury Travel', icon: Compass, prompt: 'Where should I go for my next luxury holiday?' },
  { label: 'Hotels & Resorts', icon: Building2, prompt: 'Can you recommend luxury hotels in Asia?' },
  { label: 'Fine Dining', icon: Utensils, prompt: 'Can you recommend Michelin-starred restaurants?' },
  { label: 'Fashion & Beauty', icon: Sparkles, prompt: 'What are the latest luxury fashion trends?' },
  { label: 'Watches & Jewellery', icon: Gem, prompt: 'Where can I discover exceptional jewellery and luxury watches?' },
  { label: 'Wellness & Spas', icon: HeartPulse, prompt: 'Where can I find the best luxury spas and wellness retreats?' },
  { label: 'Art & Culture', icon: Palette, prompt: 'What luxury cultural experiences and events should I explore?' },
  { label: 'Brand Partnerships', icon: Briefcase, prompt: 'What is the Away In Style Brand Partnership Membership (Chic, Luxe, Icon)?' }
];

const BUDGET_TIERS = [
  { label: 'Considered Luxury', desc: 'Curated boutique elegance' },
  { label: 'Premium Experiences', desc: '5-star signature stays' },
  { label: 'Ultra-Luxury', desc: 'Private islands & bespoke villas' },
  { label: 'Flexible Options', desc: 'Show all possibilities' }
];

export default function DiscoveryPills({ onSelectQuery, onSelectBudget }) {
  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-gold-400 font-semibold mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          Where would you like to begin your discovery?
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectQuery(cat.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-obsidian-800 hover:bg-gold-500/20 border border-gold-500/20 hover:border-gold-400 text-zinc-200 hover:text-gold-200 rounded-full transition-all duration-200 shadow-sm"
              >
                <Icon className="w-3 h-3 text-gold-400" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800/80">
        <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-2">
          Your Preferred Budget
        </p>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_TIERS.map((tier, idx) => (
            <button
              key={idx}
              onClick={() => onSelectQuery(`I'm looking for recommendations with a budget preference of "${tier.label}".`)}
              className="text-left px-2.5 py-1.5 bg-obsidian-850 hover:bg-obsidian-700 border border-zinc-800 hover:border-gold-500/40 rounded-lg text-xs transition"
            >
              <div className="font-medium text-zinc-200">{tier.label}</div>
              <div className="text-[10px] text-zinc-400">{tier.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
