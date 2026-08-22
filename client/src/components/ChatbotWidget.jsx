import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { useCurrentUser } from '../context/CurrentUserContext';
import API_BASE_URL from '../config/api';

// ── Simple markdown renderer ──────────────────────────────────────────────────
function MarkdownText({ text }) {
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, i) => {
    // Bold: **text**
    const parseBold = (str) => {
      const parts = str.split(/\*\*(.*?)\*\*/g);
      return parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p));
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
      const rest = trimmed.replace(/^\d+\.\s+/, '');
      elements.push(
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="text-green-700 font-bold shrink-0">{num}.</span>
          <span>{parseBold(rest)}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="my-0.5 leading-relaxed">
          {parseBold(trimmed)}
        </p>
      );
    }
  });

  return <div className="text-xs space-y-0.5">{elements}</div>;
}

// ── Quick suggestion chips ────────────────────────────────────────────────────
const CHIPS = [
  'Which machine is best for my farm?',
  'ਮੇਰੇ ਖੇਤ ਲਈ ਕਿਹੜੀ ਮਸ਼ੀਨ ਚੰਗੀ ਹੈ?',
  'Can I sell my parali? How much?',
  'ਪਰਾਲੀ ਦਾ ਕੀ ਭਾਅ ਮਿਲੇਗਾ?',
  'What is PM-PRANAM incentive?'
];

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
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
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: `Namaste${currentUser?.name ? `, ${currentUser.name}` : ''}! 👋\n\nI am AgriBot — your AI Crop Residue Advisor. Ask me anything in **English, ਪੰਜਾਬੀ (Punjabi), or हिंदी (Hindi)** about nearby seeders, stubble buyers, or submit your land details!`
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
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    // Build history for API: all turns except system greeting
    const historyForApi = messages
      .filter((m) => m.role === 'user' || m.role === 'model')
      .map((m) => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: historyForApi,
          user_id: currentUser?.id,
          farm_id: 'farm_1'
        })
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: data.reply || 'Sorry, I could not generate a response. Please try again.',
          model: data.model_used
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Network error — please check that the backend server is running.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

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
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 300);
            }}
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
                        ? 'bg-[#15803D] text-white font-semibold text-xs ml-auto'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    {m.role === 'user' ? <p>{m.text}</p> : <MarkdownText text={m.text} />}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-600 border-2 border-black flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border-2 border-black shadow-[2px_2px_0px_#000] px-3 py-2">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Scroll-to-bottom floating button */}
            {showScrollBtn && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-28 right-4 bg-white border-2 border-black shadow-[2px_2px_0px_#000] p-1.5 rounded-full text-gray-700 hover:bg-yellow-100 z-10"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {/* Quick chips (only when idle) */}
            {!loading && (
              <div className="px-3 py-2 bg-yellow-50 border-t-2 border-black flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
                {CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(chip)}
                    className="shrink-0 text-[10px] font-bold bg-white border border-black px-2 py-1 hover:bg-yellow-200 transition-colors whitespace-nowrap shadow-[1px_1px_0px_#000]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input form */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-white border-t-4 border-[#0F172A] flex gap-2 shrink-0 items-center"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in English, ਪੰਜਾਬੀ, or हिंदी..."
                className="flex-1 text-xs border-2 border-[#0F172A] px-3 py-2 outline-none font-medium bg-gray-50 focus:bg-white focus:border-green-600"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="neo-btn bg-[#15803D] text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
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
