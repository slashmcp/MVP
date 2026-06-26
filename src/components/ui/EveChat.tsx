'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Paperclip, X, CheckCircle, AlertCircle, Users, Building2, Briefcase, FileText, Lock } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UploadResult {
  type: 'candidates' | 'clients' | 'jobs' | 'placements' | 'unknown';
  count: number;
  importedCount: number;
  summary: string;
  preview: any[];
  fileName: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  candidates: <Users size={14} className="text-blue-400" />,
  clients: <Building2 size={14} className="text-purple-400" />,
  jobs: <Briefcase size={14} className="text-amber-400" />,
  placements: <CheckCircle size={14} className="text-emerald-400" />,
  unknown: <FileText size={14} className="text-text-muted" />,
};

const TYPE_COLORS: Record<string, string> = {
  candidates: 'border-blue-500/30 bg-blue-500/5',
  clients: 'border-purple-500/30 bg-purple-500/5',
  jobs: 'border-amber-500/30 bg-amber-500/5',
  placements: 'border-emerald-500/30 bg-emerald-500/5',
  unknown: 'border-surface-highlight bg-surface-overlay',
};

export function EveChat() {
  const { isDemoMode, hasOAuth } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, uploadResult]);

  const handleFileSelect = useCallback((file: File) => {
    setPendingFile(file);
    setUploadResult(null);
    setError(null);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const processUpload = async (importData: boolean) => {
    if (!pendingFile) return;
    
    // Gate the import functionality behind OAuth
    if (importData && !hasOAuth) {
      alert('Please sign in with your workspace account to import data into the CRM.');
      window.location.href = '/login';
      return;
    }

    setIsUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append('file', pendingFile);
    fd.append('autoImport', String(importData));

    try {
      const res = await fetch('/api/chat/upload', { method: 'POST', body: fd });
      
      let json;
      try {
        json = await res.json();
      } catch (e) {
        throw new Error(`Server returned an invalid response (Status ${res.status}).`);
      }

      if (!res.ok) throw new Error(json.error || 'Upload failed');

      setUploadResult(json);
      setPendingFile(null);

      // Add a system message to chat
      const typeLabel = json.type.charAt(0).toUpperCase() + json.type.slice(1);
      const chatMsg = importData && json.importedCount > 0
        ? `📎 **${json.fileName}** — Detected **${typeLabel}** (${json.count} record${json.count !== 1 ? 's' : ''} found, **${json.importedCount} imported** into the CRM). ${json.summary}`
        : `📎 **${json.fileName}** — Detected **${typeLabel}** (${json.count} record${json.count !== 1 ? 's' : ''} found). ${json.summary}`;

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: chatMsg,
      }]);
    } catch (err: any) {
      setError(err.message || 'Failed to process file.');
      setPendingFile(null);
    } finally {
      setIsUploading(false);
    }
  };

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
            } catch { /* ignore partial chunks */ }
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
    // Bold: **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    // Links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;

    const combined = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
    let match;

    while ((match = combined.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      if (match[0].startsWith('**')) {
        parts.push(<strong key={match.index} className="font-semibold text-white">{match[2]}</strong>);
      } else {
        parts.push(
          <a key={match.index} href={match[4]} target="_blank" rel="noopener noreferrer"
            className="text-emerald-500 hover:text-emerald-400 underline font-medium">
            {match[3]}
          </a>
        );
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) parts.push(text.substring(lastIndex));

    return parts.length > 0
      ? parts.map((p, i) => typeof p === 'string' ? <span key={i} className="whitespace-pre-wrap">{p}</span> : p)
      : <span className="whitespace-pre-wrap">{text}</span>;
  };

  const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif';

  if (isDemoMode) {
    return (
      <div className="flex flex-col h-full bg-surface dark:bg-[#0A0A0A] items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-highlight flex items-center justify-center mb-4">
          <Lock size={24} className="text-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Eve is Resting</h3>
        <p className="text-sm text-text-secondary max-w-xs">
          Eve's AI capabilities are disabled in Demo Mode to protect the CRM sandbox. 
          Please sign in with your workspace account to wake her up.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full bg-surface dark:bg-[#0A0A0A] relative transition-colors ${isDragging ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-500/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-emerald-500/10 backdrop-blur-sm pointer-events-none">
          <Paperclip size={40} className="text-emerald-400 mb-2 animate-bounce" />
          <p className="text-emerald-400 font-semibold text-base">Drop file to analyse</p>
          <p className="text-text-muted text-xs mt-1">PDF, DOCX, CSV, TXT, PNG, JPG...</p>
        </div>
      )}

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && !pendingFile && !uploadResult && (
          <div className="text-center text-text-muted mt-8 text-sm space-y-2">
            <p className="font-medium text-text-secondary">Eve is ready.</p>
            <p className="text-xs opacity-70">Ask anything or drop a file to auto-import records.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs">
              {['Candidate CVs', 'Client lists', 'Job specs', 'Spreadsheets', 'Screenshots'].map(label => (
                <span key={label} className="px-2 py-1 rounded-full border border-surface-highlight text-text-muted">{label}</span>
              ))}
            </div>
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

        {/* Upload result card */}
        {uploadResult && (
          <div className={`rounded-xl border p-3 text-sm ${TYPE_COLORS[uploadResult.type]}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-text-primary">
                {TYPE_ICONS[uploadResult.type]}
                <span className="capitalize">{uploadResult.type}</span>
                <span className="text-text-muted font-normal">— {uploadResult.count} record{uploadResult.count !== 1 ? 's' : ''}</span>
              </div>
              <button onClick={() => setUploadResult(null)} className="text-text-muted hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            {uploadResult.importedCount > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-2">
                <CheckCircle size={12} />
                <span>{uploadResult.importedCount} record{uploadResult.importedCount !== 1 ? 's' : ''} imported into the CRM</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex justify-center mt-2">
            <span className="text-xs text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 flex items-center gap-1.5">
              <AlertCircle size={12} />
              {error}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending file preview */}
      {pendingFile && !isUploading && (
        <div className="px-3 pb-2">
          <div className="bg-surface-overlay border border-surface-highlight rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Paperclip size={14} className="text-emerald-400" />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-text-primary text-sm font-medium truncate">{pendingFile.name}</p>
              <p className="text-text-muted text-xs">{(pendingFile.size / 1024).toFixed(1)} KB • Eve will classify this automatically</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => processUpload(true)}
                  className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Analyse & Import
                </button>
                <button
                  onClick={() => processUpload(false)}
                  className="text-xs bg-surface hover:bg-surface-highlight text-text-secondary px-3 py-1.5 rounded-lg border border-surface-highlight transition-colors"
                >
                  Analyse Only
                </button>
                <button
                  onClick={() => setPendingFile(null)}
                  className="text-xs text-text-muted hover:text-white px-2 py-1.5 transition-colors ml-auto"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploading state */}
      {isUploading && (
        <div className="px-3 pb-2">
          <div className="bg-surface-overlay border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
            <Loader2 size={16} className="animate-spin text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-text-primary text-sm font-medium">Analysing file...</p>
              <p className="text-text-muted text-xs">Eve is reading and classifying your data</p>
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-surface-highlight flex gap-2 items-center bg-surface-overlay relative z-10">
        <input
          type="file"
          ref={fileInputRef}
          accept={ACCEPTED_TYPES}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isStreaming}
          title="Upload file (PDF, DOCX, CSV, TXT, PNG, JPG...)"
          className="p-2 text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <Paperclip size={18} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Eve or drop a file..."
          className="flex-grow bg-surface border border-surface-highlight rounded-full px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-emerald-500 transition-colors"
          disabled={isStreaming || isUploading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming || isUploading}
          className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-400 disabled:opacity-50 transition-colors flex items-center justify-center flex-shrink-0"
        >
          <Send size={16} className="-ml-0.5 mt-0.5" />
        </button>
      </form>
    </div>
  );
}
