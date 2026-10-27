import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Sparkles, User, ExternalLink, 
  RotateCcw, ShieldCheck, ChevronDown, Check, Compass, 
  PhoneCall, HeartHandshake, Bot, Headphones, HelpCircle, ArrowRight,
  ListFilter, CheckCircle2
} from 'lucide-react';
import { sendChatMessage, fetchMessages, getVisitorId } from '../services/api';
import { analyzeUserQuery, LUXURY_FAQS } from '../data/luxuryFaqs';
import DiscoveryPills from './DiscoveryPills';
import LeadForm from './LeadForm';

export default function ConciergeWidget({ autoOpen = true }) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      message: "Welcome to Away In Style. I am your AI Lifestyle Concierge — here to help you discover exceptional luxury hotels, destinations, Michelin fine dining, fashion, wellness retreats, and brand partnership opportunities.\n\nWhere would you like to begin your next discovery?",
      citations: [
        { title: 'Explore Luxury Editorial', url: 'https://www.awayinstyle.com/', category: 'Editorial' }
      ],
      suggested_questions: [
        "What is Away In Style?",
        "Where should I go for my next luxury holiday?",
        "Can you recommend Michelin-starred restaurants?",
        "What is the Away In Style Brand Partnership Membership?"
      ],
      fallback_required: false,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [visitorMode, setVisitorMode] = useState('bot'); // 'bot' or 'live'
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, showLeadModal]);

  // Initial load and polling for live messages
  useEffect(() => {
    loadChatHistory();

    // Poll every 4s for live admin takeover messages
    pollTimerRef.current = setInterval(() => {
      pollLatestMessages();
    }, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const loadChatHistory = async () => {
    try {
      const data = await fetchMessages(0);
      if (data && data.messages && data.messages.length > 0) {
        setMessages(data.messages);
        setHasInteracted(true);
      }
      if (data && data.visitor) {
        setVisitorMode(data.visitor.mode || 'bot');
      }
    } catch (e) {
      // silent
    }
  };

  const pollLatestMessages = async () => {
    try {
      const lastId = messages.length > 0 && typeof messages[messages.length - 1].id === 'number'
        ? messages[messages.length - 1].id
        : 0;

      const data = await fetchMessages(lastId);
      if (data && data.messages && data.messages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = data.messages.filter(m => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
      }
      if (data && data.visitor && data.visitor.mode !== visitorMode) {
        setVisitorMode(data.visitor.mode);
      }
    } catch (e) {
      // silent
    }
  };

  const handleSend = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setInputMessage('');
    setHasInteracted(true);

    const userMsg = {
      id: 'temp_' + Date.now(),
      sender: 'visitor',
      message: text,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // 1. Analyze query with 50 FAQs intelligence engine
    const analysis = analyzeUserQuery(text);

    // 2. Safe background sync to backend
    try {
      sendChatMessage(text, window.location.pathname).catch(() => {});
    } catch (e) {
      // silent
    }

    // 3. Render immediate accurate response
    setTimeout(() => {
      if (analysis) {
        if (analysis.type === 'exact' || analysis.type === 'single_match') {
          const faq = analysis.faq;
          const intro = analysis.type === 'exact'
            ? ""
            : `Here is our editorial concierge guidance regarding "${faq.question}":\n\n`;

          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              sender: 'bot',
              message: `${intro}${faq.answer}`,
              citations: [{ title: faq.question, url: faq.url, category: faq.category }],
              suggested_questions: faq.followUps || [],
              disambiguation_options: [],
              fallback_required: false,
              category: faq.category,
              created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        } else if (analysis.type === 'disambiguation') {
          // Multiple matching questions
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              sender: 'bot',
              message: `I found several topics matching your keywords "${text}". Which of these would you like to explore?`,
              citations: [],
              suggested_questions: [],
              disambiguation_options: analysis.matchedFaqs.map(f => f.question),
              fallback_required: false,
              category: 'Disambiguation',
              created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } else {
        // Fallback with luxury suggestions
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'bot',
            message: "Away In Style is an independent luxury lifestyle media platform founded in Hong Kong in 2009. We cover luxury travel, Michelin fine dining, fashion, wellness retreats, and brand partnerships.\n\nPlease choose one of our featured questions below or leave your contact details for our concierge team:",
            citations: [{ title: 'Away In Style Lifestyle', url: 'https://www.awayinstyle.com/', category: 'Platform Information' }],
            suggested_questions: [
              "What is Away In Style?",
              "Where should I go for my next luxury holiday?",
              "Can you recommend Michelin-starred restaurants?",
              "What is the Away In Style Brand Partnership Membership?"
            ],
            disambiguation_options: [],
            fallback_required: true,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
      setLoading(false);
    }, 200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 text-gold-200 border border-gold-400/40 rounded-full shadow-2xl hover:scale-105 hover:border-gold-400 transition-all duration-300 gold-glow"
          aria-label="Open Away In Style Lifestyle Concierge"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gold-600 via-gold-400 to-gold-200 flex items-center justify-center text-obsidian-950 font-bold shadow-inner">
              <Sparkles className="w-5 h-5 text-obsidian-950" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-obsidian-900 rounded-full animate-pulse" />
          </div>

          <div className="text-left pr-1">
            <div className="text-[10px] uppercase tracking-widest text-gold-400 font-semibold font-serif">
              Away In Style
            </div>
            <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
              <span>Lifestyle Concierge</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-gold-500/20 text-gold-300 rounded font-normal">AI + Live</span>
            </div>
          </div>
        </button>
      )}

      {/* Main Luxury Concierge Window */}
      {isOpen && (
        <div className="w-[390px] sm:w-[460px] h-[670px] max-h-[88vh] bg-obsidian-950/95 border border-gold-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-obsidian-900 via-obsidian-850 to-obsidian-900 border-b border-gold-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gold-500 via-gold-400 to-gold-200 flex items-center justify-center text-obsidian-950 font-bold shadow-md">
                  <Sparkles className="w-4 h-4 text-obsidian-950" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-obsidian-900 rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-luxury text-base font-bold text-gold-200 tracking-wide">
                    Away In Style
                  </h3>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-gold-500/20 text-gold-300 rounded border border-gold-500/30">
                    AI Concierge
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                  {visitorMode === 'live' ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <Headphones className="w-3 h-3" /> Senior Agent Live in Chat
                    </span>
                  ) : (
                    <span>AI Lifestyle Concierge • Online</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowLeadModal(!showLeadModal)}
                title="Connect with Editorial Concierge"
                className="p-1.5 text-zinc-400 hover:text-gold-300 hover:bg-obsidian-800 rounded-lg transition"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-obsidian-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Agent Takeover Banner */}
          {visitorMode === 'live' && (
            <div className="px-4 py-1.5 bg-emerald-950/40 border-b border-emerald-500/30 text-[11px] text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Direct Concierge Live Session Active
              </span>
              <span className="text-[10px] text-zinc-400">Agent Connected</span>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg, idx) => {
              const isVisitor = msg.sender === 'visitor';
              const isAgent = msg.sender === 'agent';
              const isSystem = msg.sender === 'system';

              if (isSystem) {
                return (
                  <div key={idx} className="my-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 text-center italic">
                    {msg.message}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-1.5 max-w-[94%]">
                    {!isVisitor && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-1 ${
                        isAgent ? 'bg-emerald-600 text-white' : 'bg-gold-500 text-obsidian-950 font-bold'
                      }`}>
                        {isAgent ? <Headphones className="w-3.5 h-3.5" /> : <Sparkles className="w-3 h-3 text-obsidian-950" />}
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl ${
                        isVisitor
                          ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-obsidian-950 font-semibold rounded-br-none shadow-md'
                          : isAgent
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 rounded-bl-none shadow-md'
                          : 'bg-obsidian-850 border border-gold-500/20 text-zinc-200 rounded-bl-none shadow-md'
                      }`}
                    >
                      {/* Sender label for Agent */}
                      {isAgent && (
                        <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Senior Concierge Executive
                        </div>
                      )}

                      <div className="whitespace-pre-wrap leading-relaxed text-[12.5px]">
                        {msg.message}
                      </div>

                      {/* Disambiguation Option Buttons (When multiple questions match) */}
                      {msg.disambiguation_options && msg.disambiguation_options.length > 0 && !isVisitor && (
                        <div className="mt-3 pt-2.5 border-t border-gold-500/20 space-y-2">
                          <p className="text-[10.5px] uppercase tracking-wider text-gold-400 font-semibold flex items-center gap-1">
                            <ListFilter className="w-3.5 h-3.5 text-gold-400" />
                            Select specific question:
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {msg.disambiguation_options.map((opt, oidx) => (
                              <button
                                key={oidx}
                                onClick={() => handleSend(opt)}
                                className="w-full text-left px-3 py-2 rounded-lg bg-obsidian-900 hover:bg-gold-500/20 border border-gold-500/30 hover:border-gold-400 text-gold-200 hover:text-gold-100 text-[12px] font-medium transition flex items-center justify-between group shadow-sm"
                              >
                                <span className="line-clamp-2">{opt}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-gold-400 group-hover:translate-x-1 transition shrink-0 ml-1.5" />
                              </button>
                            ))}

                            <button
                              onClick={() => setShowLeadModal(true)}
                              className="w-full text-left px-3 py-1.5 rounded-lg bg-obsidian-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] transition flex items-center justify-between mt-1"
                            >
                              <span>Other / Connect with Editorial Team directly</span>
                              <PhoneCall className="w-3 h-3 text-zinc-400" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Article Citations / Links */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gold-500/15 space-y-1.5">
                          <div className="text-[10px] uppercase font-semibold text-gold-400 tracking-wider flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Relevant Stories & Editorial
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((cit, cidx) => (
                              <a
                                key={cidx}
                                href={cit.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-obsidian-900/90 hover:bg-gold-500/20 border border-gold-500/30 rounded text-[11px] text-gold-300 hover:text-gold-100 transition"
                              >
                                <span>{cit.title || 'Explore Story'}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clickable Suggested Follow-up Question Chips */}
                      {msg.suggested_questions && msg.suggested_questions.length > 0 && !isVisitor && (
                        <div className="mt-3 pt-2.5 border-t border-gold-500/15 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-gold-400" />
                            Suggested Next Questions:
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {msg.suggested_questions.map((q, qidx) => (
                              <button
                                key={qidx}
                                onClick={() => handleSend(q)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-obsidian-900/80 hover:bg-gold-500/20 border border-gold-500/30 hover:border-gold-400 text-gold-200 hover:text-gold-100 text-[11.5px] transition flex items-center justify-between group shadow-sm"
                              >
                                <span className="line-clamp-1">{q}</span>
                                <ArrowRight className="w-3 h-3 text-gold-400 group-hover:translate-x-0.5 transition shrink-0 ml-1 opacity-70" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inline Fallback Form Trigger */}
                      {msg.fallback_required && (
                        <div className="mt-3 pt-2">
                          <LeadForm
                            defaultCategory="Concierge Request"
                            onSuccess={() => {
                              msg.fallback_required = false;
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[9px] text-zinc-500 mt-1 px-2">
                    {msg.created_at || ''}
                  </span>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs italic pl-8">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Away In Style Concierge is curating recommendations...</span>
              </div>
            )}

            {/* Quick Discovery Category Pills */}
            {!hasInteracted && messages.length <= 1 && (
              <div className="pt-2">
                <DiscoveryPills
                  onSelectQuery={(q) => handleSend(q)}
                />
              </div>
            )}

            {/* Expandable Manual Lead Form */}
            {showLeadModal && (
              <div className="p-2 border-t border-gold-500/20">
                <LeadForm
                  onSuccess={() => setShowLeadModal(false)}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer & Input Bar */}
          <div className="p-3 bg-obsidian-900 border-t border-gold-500/20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  visitorMode === 'live'
                    ? "Type message to live concierge agent..."
                    : "Ask about luxury hotels, Michelin dining, fashion, wellness..."
                }
                className="flex-1 px-3.5 py-2.5 text-xs bg-obsidian-950 border border-zinc-700/70 focus:border-gold-400 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition shadow-inner"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 bg-gradient-to-tr from-gold-600 via-gold-400 to-gold-300 text-obsidian-950 rounded-xl font-bold hover:brightness-110 disabled:opacity-40 transition shadow-md"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-gold-500/60" /> Verified Editorial Concierge
              </span>
              <span>Away In Style © 2026</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
