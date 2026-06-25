"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useEveAgent } from 'eve/react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

export default function EveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const agent = useEveAgent({
    headers: async () => ({}),
  });

  const { data, status, send } = agent;
  const [inputValue, setInputValue] = useState('');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    send(inputValue);
    setInputValue('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out transform origin-bottom-right">
          {/* Header */}
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Eve</h3>
                <p className="text-xs text-indigo-200">Sourcing Agent</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800">
            {data.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-3">
                <Bot size={48} className="opacity-50" />
                <p className="text-sm text-center">Hello! I'm Eve.<br/>Ask me about candidates or clients.</p>
              </div>
            ) : (
              data.messages.map((msg: any, i: number) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-indigo-100 text-indigo-600 ml-2' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mr-2'
                    }`}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-600 shadow-sm rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {status !== 'idle' && status !== 'ready' && status !== 'error' && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] flex-row">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mr-2">
                    <Bot size={14} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 shadow-sm rounded-tl-sm">
                    <div className="flex space-x-1.5 items-center h-4">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={status !== 'idle'}
                placeholder="Ask Eve..."
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || status !== 'idle'}
                className="absolute right-1.5 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="text-center mt-2">
              <p className="text-[10px] text-slate-400">Powered by Eve</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
          isOpen 
            ? 'bg-slate-800 text-white hover:bg-slate-700' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/25'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
