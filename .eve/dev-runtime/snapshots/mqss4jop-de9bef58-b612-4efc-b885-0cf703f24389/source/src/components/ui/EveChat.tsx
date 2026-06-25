import { useState, useRef, useEffect } from 'react';
import { useEveAgent } from 'eve/react';
import { Send, Loader2 } from 'lucide-react';

export function EveChat() {
  const { data, send, status, error } = useEveAgent();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = data?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    send({ message: input });
    setInput('');
  };

  const renderMarkdownText = (text: string) => {
    // Simple regex for markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
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
    
    return parts.length > 0 ? parts.map((p, i) => typeof p === 'string' ? <span key={i} className="whitespace-pre-wrap">{p}</span> : p) : <span className="whitespace-pre-wrap">{text}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-[#0A0A0A]">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && status !== 'streaming' && status !== 'submitted' && (
          <div className="text-center text-text-muted mt-10 text-sm">
            <p>Eve is ready and accepting messages.</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              m.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-surface-overlay text-text-primary border border-surface-highlight'
            }`}>
              {m.parts.map((part, i) => {
                if (part.type === 'text') {
                  return <div key={i} className="text-sm">{renderMarkdownText(part.text)}</div>;
                }
                if (part.type === 'dynamic-tool') {
                  return (
                    <div key={i} className="text-xs text-text-muted mt-1 italic border-l-2 border-emerald-500/30 pl-2 py-0.5">
                      Calling {part.toolName}...
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
        
        {(status === 'streaming' || status === 'submitted') && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-surface-overlay text-text-primary border border-surface-highlight rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-emerald-500" />
              <span className="text-sm">Eve is typing...</span>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex justify-center mt-2">
            <span className="text-xs text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
              Connection lost or agent error.
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
          disabled={status === 'submitted' || status === 'streaming'}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || status === 'submitted' || status === 'streaming'}
          className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-400 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          <Send size={16} className="-ml-0.5 mt-0.5" />
        </button>
      </form>
    </div>
  );
}
