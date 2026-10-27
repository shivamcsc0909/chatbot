import React, { useState } from 'react';
import { Send, CheckCircle2, User, Mail, Phone, MessageSquare, Sparkles } from 'lucide-react';
import { submitLead } from '../services/api';

export default function LeadForm({ defaultCategory = 'Luxury Concierge Inquiry', onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: defaultCategory,
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || (!formData.email.trim() && !formData.phone.trim())) {
      setError('Please provide your name and either an email or phone number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await submitLead(formData);
      if (res.success) {
        setSubmitted(true);
        if (onSuccess) onSuccess(formData);
      } else {
        setError(res.error || 'Failed to submit details. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 rounded-xl bg-gold-950/40 border border-gold-500/30 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-gold-400 mx-auto" />
        <h4 className="font-luxury text-lg text-gold-200">Inquiry Received</h4>
        <p className="text-xs text-zinc-300">
          Our senior lifestyle editorial concierge has received your details and will connect with you discreetly.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-obsidian-850/90 border border-gold-500/30 space-y-3 shadow-lg my-2">
      <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider">
        <Sparkles className="w-4 h-4" />
        <span>Direct Lifestyle Concierge Connect</span>
      </div>
      <p className="text-xs text-zinc-300">
        Leave your contact details below and our editorial team will personally assist your request:
      </p>

      {error && (
        <div className="p-2 text-xs bg-red-950/60 border border-red-500/30 text-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              required
              placeholder="Your Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-obsidian-900 border border-zinc-700/80 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-gold-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-obsidian-900 border border-zinc-700/80 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-gold-400"
            />
          </div>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="tel"
              placeholder="Phone / WhatsApp"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-obsidian-900 border border-zinc-700/80 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-gold-400"
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <textarea
              rows={2}
              placeholder="Specific destinations, dates, brands, or requirements..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-obsidian-900 border border-zinc-700/80 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-gold-400 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-obsidian-950 hover:brightness-110 rounded-lg transition duration-200 shadow-md disabled:opacity-50"
        >
          {loading ? (
            <span>Connecting with Concierge...</span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit VIP Inquiry</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
