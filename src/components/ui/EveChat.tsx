'use client';

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function EveChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);
    setError(null);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Request failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.text }
                      : m
                  )
                );
              }
            } catch {}
          }
        }
      }
    } catch {
      setError('Connection lost or agent error.');
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  };

  const renderMarkdownText = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 underline font-medium">
          {match[1]}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0
      ? parts.map((p, i) => typeof p === 'string' ? <span key={i} className="whitespace-pre-wrap">{p}</span> : p)
      : <span className="whitespace-pre-wrap">{text}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-[#0A0A0A]">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center text-text-muted mt-10 text-sm">
            <p>Eve is ready and accepting messages.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              m.role === 'user'
                ? 'bg-emerald-500 text-white'
                : 'bg-surface-overlay text-text-primary border border-surface-highlight'
            }`}>
              <div className="text-sm">
                {m.content ? renderMarkdownText(m.content) : (
                  m.role === 'assistant' && isStreaming
                    ? <Loader2 size={14} className="animate-spin text-emerald-500" />
                    : null
                )}
              </div>
            </div>
          </div>
        ))}

        {error && (
          <div className="flex justify-center mt-2">
            <span className="text-xs text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
              {error}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-surface-highlight flex gap-2 items-center bg-surface-overlay relative z-10">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Eve..."
          className="flex-grow bg-surface border border-surface-highlight rounded-full px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-emerald-500 transition-colors"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-400 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          <Send size={16} className="-ml-0.5 mt-0.5" />
        </button>
      </form>
    </div>
  );
}
