import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { useCurrentUser } from '../context/CurrentUserContext';
import { useLanguage } from '../context/LanguageContext';

// ── Simple markdown renderer ──────────────────────────────────────────────────
function MarkdownText({ text }) {
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, i) => {
    // Bold: **text**
    const parseBold = (str) => {
      const parts = str.split(/\*\*(.*?)\*\*/g);
      return parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
    };

    const trimmed = line.trim();

    if (trimmed === '') {
      elements.push(<div key={i} className="h-2" />);
    } else if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      elements.push(
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="text-green-600 font-bold mt-0.5 shrink-0">•</span>
          <span>{parseBold(trimmed.replace(/^[•\-]\s+/, ''))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="text-green-700 font-bold shrink-0 min-w-[1rem]">{num}.</span>
          <span>{parseBold(trimmed.replace(/^\d+\.\s+/, ''))}</span>
        </div>
      );
    } else if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      elements.push(
        <p key={i} className="font-black text-green-800 mt-2 mb-1">
          {parseBold(trimmed.replace(/^#+\s+/, ''))}
        </p>
      );
    } else {
      elements.push(<p key={i} className="my-0.5">{parseBold(trimmed)}</p>);
    }
  });

  return <div className="text-sm leading-relaxed">{elements}</div>;
}

// ── Quick suggestion chips ────────────────────────────────────────────────────
const CHIPS = [
  'Which machine is best for my farm?',
  'ਮੇਰੇ ਖੇਤ ਲਈ ਕਿਹੜੀ ਮਸ਼ੀਨ ਚੰਗੀ ਹੈ?',
  'Can I sell my parali? How much?',
  'ਪਰਾਲੀ ਦਾ ਕੀ ਭਾਅ ਮਿਲੇਗਾ?',
  'What is PM-PRANAM incentive?',
];

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-green-500"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function ChatbotWidget() {
  const { currentUser } = useCurrentUser();
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: `**Sat Sri Akal, ${currentUser.name}! 🌾**\n\nI am AgriBot — your AI Crop Residue Advisor. You can chat with me in **English, ਪੰਜਾਬੀ (Punjabi), or हिंदी (Hindi)**.\n\nI have full context of your farm plots and nearby machines & buyers!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll on every new message or loading state change
  useEffect(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [messages, loading]);

  // Also scroll when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, [isOpen]);

  // Show scroll-to-bottom button
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  };

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    inputRef.current?.focus();

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    // Build history for API: all turns except system greeting
    const historyForApi = messages
      .filter(m => m.role === 'user' || m.role === 'model')
      .map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: historyForApi,
          user_id: currentUser.id,
          farm_id: 'farm_1'
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'model',
        text: data.reply || 'Sorry, I could not generate a response. Please try again.',
        model: data.model_used
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'model',
        text: 'Network error — please check that the backend server is running.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(); };

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #86efac; border-radius: 4px; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Open button */}
        {!isOpen && (
          <button
            onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 300); }}
            className="neo-btn bg-[#15803D] text-white px-5 py-3 shadow-[5px_5px_0px_#0F172A] flex items-center gap-2 text-sm font-black hover:scale-105 transition-transform"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            ASK AGRIBOT AI
          </button>
        )}

        {/* Chat window */}
        {isOpen && (
          <div className="w-[360px] sm:w-[420px] h-[580px] flex flex-col border-4 border-[#0F172A] shadow-[8px_8px_0px_#0F172A] bg-white overflow-hidden rounded-none relative">

            {/* Header */}
            <div className="bg-[#15803D] text-white px-4 py-3 border-b-4 border-[#0F172A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="font-black text-sm uppercase leading-none">AgriBot AI Advisor</p>
                  <p className="text-[10px] text-green-200 font-semibold">Powered by Gemini · Speaks All Languages</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="neo-btn bg-yellow-400 text-black p-1.5 hover:bg-yellow-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              onWheel={(e) => e.stopPropagation()}
              data-lenis-prevent
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAF5] chat-scroll"
              style={{ minHeight: 0 }}
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {m.role === 'model' && (
                    <div className="w-6 h-6 bg-green-600 border-2 border-black flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-3 py-2.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] ${
                      m.role === 'user'
                        ? 'bg-[#EAB308] text-[#0F172A] font-semibold text-sm'
                        : 'bg-white text-[#1e293b]'
                    }`}
                  >
                    {m.role === 'model' ? <MarkdownText text={m.text} /> : m.text}
                    {m.model && (
                      <p className="text-[9px] text-gray-400 mt-1.5 font-mono">via {m.model}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 bg-green-600 border-2 border-black flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />

              {/* Scroll to bottom button — inside the scrollable area, sticky to bottom-right */}
              {showScrollBtn && (
                <button
                  onClick={scrollToBottom}
                  className="sticky bottom-2 ml-auto flex bg-green-600 text-white border-2 border-black p-1.5 shadow-[2px_2px_0px_black] hover:bg-green-700 z-10"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick chips */}
            {messages.length <= 2 && !loading && (
              <div className="px-3 py-2 border-t-2 border-dashed border-green-200 bg-[#F0FDF4] flex gap-1.5 overflow-x-auto shrink-0">
                {CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(chip)}
                    className="shrink-0 text-[10px] font-bold bg-white border-2 border-[#15803D] text-[#15803D] px-2 py-1 hover:bg-[#15803D] hover:text-white transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-white border-t-4 border-[#0F172A] flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask in English, Punjabi (ਪੰਜਾਬੀ), or Hindi (हिंदी)..."
                className="neo-input text-xs py-2.5 flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`neo-btn p-2.5 border-2 border-black transition-colors ${
                  loading || !input.trim()
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-[#15803D] text-white hover:bg-green-700'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
