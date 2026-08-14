import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, AlertTriangle, Sparkles } from 'lucide-react';
import { useCurrentUser } from '../context/CurrentUserContext';

export default function ChatbotWidget() {
  const { currentUser } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Sat Sri Akal ${currentUser.name}! I am your AI Crop Residue Advisor. Ask me anything about nearby seeders, stubble buyers, or submit your land details!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          user_id: currentUser.id,
          farm_id: 'farm_1'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: 'bot', text: data.reply, sanity_warning: data.sanity_warning }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Error connecting to advice engine. Please try again.' }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Network connection issue. Please check backend API server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="neo-btn bg-[#15803D] text-white p-4 shadow-[5px_5px_0px_#0F172A] flex items-center space-x-2 text-base font-black hover:scale-105 transition-transform"
        >
          <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          <span>ASK AI STUBBLE ADVISOR</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] neo-box-static bg-white flex flex-col shadow-[8px_8px_0px_#0F172A] border-4 border-[#0F172A]">
          {/* Header */}
          <div className="bg-[#15803D] text-white p-3 border-b-4 border-[#0F172A] flex items-center justify-between">
            <div className="flex items-center space-x-2 font-black">
              <Bot className="w-6 h-6 text-yellow-300" />
              <span className="uppercase text-sm">AI Stubble & Residue Advisor</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="neo-btn bg-yellow-400 text-black p-1 hover:bg-yellow-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#FAF9F5]">
            {messages.map((m, index) => (
              <div
                key={index}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 text-xs font-semibold neo-box-static ${
                    m.sender === 'user'
                      ? 'bg-[#EAB308] text-black border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                      : 'bg-white text-[#0F172A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 border-2 border-black p-2 text-xs font-bold animate-pulse">
                  Analyzing farm data & nearby listings...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={sendMessage} className="p-2 bg-white border-t-4 border-[#0F172A] flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about seeders, buyers, or type acreage..."
              className="neo-input text-xs py-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="neo-btn bg-[#15803D] text-white p-2 border-2 border-black"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
