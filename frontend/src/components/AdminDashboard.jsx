import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, MessageSquare, ShieldAlert, Radio, Send, RefreshCw, 
  Search, CheckCircle, Smartphone, Globe, Clock, Sparkles, 
  Database, FileText, ArrowRight, UserCheck, Shield, ChevronRight
} from 'lucide-react';
import { 
  getAdminStats, getAdminVisitors, fetchVisitorMessages, 
  setVisitorMode, sendAdminMessage, adminLogin 
} from '../services/api';

const CANNED_RESPONSES = [
  "Hello, this is the Senior Editorial Concierge team at Away In Style. How may I assist you with your luxury plans today?",
  "I have verified this directly with our editorial destination team. Would you like me to reserve or arrange a personalized introduction for you?",
  "Regarding the Away In Style Brand Partnership (Chic, Luxe, Icon), our partnerships director can share our current media kit and campaign calendar. Could you confirm your best contact email?",
  "We are currently curating an exclusive bespoke itinerary for this destination. Please let us know your preferred dates and group size.",
  "Thank you for your inquiry. A senior member of our team will follow up with you directly within 24 hours."
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [adminToken, setAdminToken] = useState('demo_token');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AwayInStyle2026!');
  const [loginError, setLoginError] = useState('');

  const [stats, setStats] = useState({
    total_visitors: 0,
    total_messages: 0,
    captured_leads: 0,
    knowledge_chunks: 50,
    live_takeover_sessions: 0
  });

  const [visitors, setVisitors] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const transcriptEndRef = useRef(null);

  // Load stats and visitors
  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadDashboard(false);
        if (selectedVisitor) {
          loadTranscript(selectedVisitor.visitor_uuid, false);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedVisitor, autoRefresh]);

  const loadDashboard = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const statsRes = await getAdminStats(adminToken);
      if (statsRes.success) setStats(statsRes.stats);

      const visRes = await getAdminVisitors(adminToken);
      if (visRes.success) {
        setVisitors(visRes.visitors);
        if (!selectedVisitor && visRes.visitors.length > 0) {
          setSelectedVisitor(visRes.visitors[0]);
          loadTranscript(visRes.visitors[0].visitor_uuid, false);
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadTranscript = async (uuid, scroll = true) => {
    try {
      const res = await fetchVisitorMessages(uuid, 0);
      if (res.success) {
        setTranscript(res.messages);
        if (scroll) {
          setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSelectVisitor = (v) => {
    setSelectedVisitor(v);
    loadTranscript(v.visitor_uuid, true);
  };

  const handleToggleMode = async (mode) => {
    if (!selectedVisitor) return;
    try {
      const res = await setVisitorMode(selectedVisitor.visitor_uuid, mode, adminToken);
      if (res.success) {
        setSelectedVisitor({ ...selectedVisitor, mode });
        setVisitors(visitors.map(v => v.visitor_uuid === selectedVisitor.visitor_uuid ? { ...v, mode } : v));
        loadTranscript(selectedVisitor.visitor_uuid);
      }
    } catch (e) {
      alert('Failed to update mode');
    }
  };

  const handleSendAdminReply = async (customText = null) => {
    const text = (customText || replyText).trim();
    if (!text || !selectedVisitor) return;

    setReplyText('');
    try {
      const res = await sendAdminMessage(selectedVisitor.visitor_uuid, text, adminToken);
      if (res.success) {
        // Switch to live mode in state
        setSelectedVisitor({ ...selectedVisitor, mode: 'live' });
        loadTranscript(selectedVisitor.visitor_uuid);
      }
    } catch (e) {
      alert('Error sending message: ' + e.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await adminLogin(username, password);
      if (res.success) {
        setIsAuthenticated(true);
        setAdminToken(res.token);
        loadDashboard();
      } else {
        setLoginError(res.error || 'Invalid credentials');
      }
    } catch (e) {
      setLoginError('Authentication failed. Please check credentials.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-obsidian-900 border border-zinc-800 rounded-xl">
          <div className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gold-400" /> Total Visitors
          </div>
          <div className="text-2xl font-bold text-zinc-100 mt-1">{stats.total_visitors}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Anonymous IP tracked</div>
        </div>

        <div className="p-4 bg-obsidian-900 border border-zinc-800 rounded-xl">
          <div className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Total Messages
          </div>
          <div className="text-2xl font-bold text-zinc-100 mt-1">{stats.total_messages}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">AI + Live chat total</div>
        </div>

        <div className="p-4 bg-obsidian-900 border border-emerald-500/30 rounded-xl bg-emerald-950/20">
          <div className="text-emerald-400 text-xs font-medium flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Live Takeovers
          </div>
          <div className="text-2xl font-bold text-emerald-200 mt-1">{stats.live_takeover_sessions}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Agent active in session</div>
        </div>

        <div className="p-4 bg-obsidian-900 border border-gold-500/30 rounded-xl bg-gold-950/20">
          <div className="text-gold-300 text-xs font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Captured Leads
          </div>
          <div className="text-2xl font-bold text-gold-200 mt-1">{stats.captured_leads}</div>
          <div className="text-[10px] text-gold-400/80 mt-0.5">VIP concierge inquiries</div>
        </div>

        <div className="p-4 bg-obsidian-900 border border-zinc-800 rounded-xl">
          <div className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-purple-400" /> Vector Chunks
          </div>
          <div className="text-2xl font-bold text-zinc-100 mt-1">{stats.knowledge_chunks}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">50 FAQs + Scraped</div>
        </div>
      </div>

      {/* Main Two-Column Live Takeover Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[620px]">
        {/* Left Column: Visitors List (4 cols) */}
        <div className="lg:col-span-4 bg-obsidian-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-obsidian-850">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Active Visitors</h3>
              <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full font-mono">
                {visitors.length}
              </span>
            </div>

            <button
              onClick={() => loadDashboard()}
              className="p-1.5 text-zinc-400 hover:text-gold-300 hover:bg-zinc-800 rounded transition"
              title="Refresh visitor list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Visitors Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
            {visitors.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No active visitor sessions recorded yet. Open the chatbot widget on the demo tab to test!
              </div>
            ) : (
              visitors.map((v) => {
                const isSelected = selectedVisitor?.visitor_uuid === v.visitor_uuid;
                const isLive = v.mode === 'live';

                return (
                  <div
                    key={v.visitor_uuid}
                    onClick={() => handleSelectVisitor(v)}
                    className={`p-3.5 cursor-pointer transition flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-gold-500/10 border-l-4 border-gold-400'
                        : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
                          {v.visitor_uuid.substring(0, 16)}...
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          isLive 
                            ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' 
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {isLive ? 'LIVE AGENT' : 'AI BOT'}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
                        {v.last_message || 'No messages yet'}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> {v.ip_address || '127.0.0.1'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {v.last_seen_at?.substring(11, 16) || 'Just now'}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 mt-2 ${isSelected ? 'text-gold-400' : 'text-zinc-600'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Conversation Transcript & Agent Takeover Controls (8 cols) */}
        <div className="lg:col-span-8 bg-obsidian-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
          {selectedVisitor ? (
            <>
              {/* Selected Visitor Header */}
              <div className="p-3.5 border-b border-zinc-800 bg-obsidian-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 flex items-center justify-center font-mono text-xs">
                    ID
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-mono font-bold text-zinc-200">
                        {selectedVisitor.visitor_uuid}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        IP: {selectedVisitor.ip_address}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Current Page: <span className="text-gold-300">{selectedVisitor.current_page || '/'}</span> • Browser: {selectedVisitor.user_agent?.substring(0, 30)}...
                    </p>
                  </div>
                </div>

                {/* Takeover Mode Action Buttons */}
                <div className="flex items-center gap-2">
                  {selectedVisitor.mode === 'live' ? (
                    <button
                      onClick={() => handleToggleMode('bot')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition"
                    >
                      <RefreshCw className="w-3 h-3 text-gold-400" />
                      <span>Return to AI Bot Mode</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleMode('live')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Takeover Live Chat (Force Live)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Message Transcript View */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-obsidian-950/60">
                {transcript.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 text-xs">
                    No conversation history for this visitor yet.
                  </div>
                ) : (
                  transcript.map((m, idx) => {
                    const isVisitor = m.sender === 'visitor';
                    const isAgent = m.sender === 'agent';
                    const isSystem = m.sender === 'system';

                    if (isSystem) {
                      return (
                        <div key={idx} className="my-2 py-1 px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] rounded text-center italic">
                          {m.message}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isVisitor ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-zinc-400">
                          {isVisitor ? (
                            <span className="text-gold-300 font-semibold">Visitor (Guest)</span>
                          ) : isAgent ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5" /> Live Concierge Admin
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-semibold">Away In Style AI Bot</span>
                          )}
                          <span>• {m.created_at || ''}</span>
                        </div>

                        <div
                          className={`p-3 rounded-xl max-w-[80%] text-xs leading-relaxed ${
                            isVisitor
                              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                              : isAgent
                              ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-100'
                              : 'bg-obsidian-850 border border-gold-500/20 text-zinc-300'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{m.message}</div>

                          {m.citations && m.citations.length > 0 && (
                            <div className="mt-2 pt-1 border-t border-zinc-700/60 text-[10px] text-gold-400">
                              Citations: {m.citations.map(c => c.title).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Canned Luxury Responses Drawer */}
              <div className="px-3 py-2 bg-obsidian-900 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-gold-400 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                  Quick Canned:
                </span>
                {CANNED_RESPONSES.map((resp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendAdminReply(resp)}
                    className="px-2.5 py-1 bg-obsidian-800 hover:bg-gold-500/20 text-zinc-300 hover:text-gold-200 border border-zinc-700 rounded-md truncate max-w-[180px] shrink-0 transition"
                  >
                    {resp}
                  </button>
                ))}
              </div>

              {/* Forced Agent Reply Composer */}
              <div className="p-3 bg-obsidian-850 border-t border-zinc-800 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendAdminReply();
                  }}
                  placeholder={
                    selectedVisitor.mode === 'live'
                      ? "Type live message directly to visitor (they see it immediately)..."
                      : "Type message (sending will automatically take over into live mode)..."
                  }
                  className="flex-1 px-3.5 py-2 text-xs bg-obsidian-950 border border-zinc-700 focus:border-emerald-500 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />

                <button
                  onClick={() => handleSendAdminReply()}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-40 flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Live Reply</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
              Select a visitor session from the left to view live transcript and take over.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
