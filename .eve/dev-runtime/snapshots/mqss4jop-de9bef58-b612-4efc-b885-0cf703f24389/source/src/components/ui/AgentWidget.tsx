'use client';

import { useState, useEffect } from 'react';
import { Bot, Moon, Sparkles, X } from 'lucide-react';
import Draggable from 'react-draggable';
import { Rnd } from 'react-rnd';
import { useRef } from 'react';
import { EveChat } from './EveChat';

export function AgentWidget() {
  const isAwake = true;
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const nodeRef = useRef(null);

  return (
    <>
    <Draggable nodeRef={nodeRef} bounds="body" handle=".drag-handle">
      <div 
        ref={nodeRef}
        className="fixed bottom-6 right-6 z-[200]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Widget Button */}
      <div 
        onClick={() => isAwake && setIsOpen(!isOpen)}
        className={`drag-handle relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 cursor-grab active:cursor-grabbing ${
          isAwake ? 'bg-emerald-500 hover:bg-emerald-400 hover:scale-110' : 'bg-surface border border-surface-overlay hover:bg-surface-hover grayscale opacity-80'
        }`}
      >
        {/* Glow effect when awake */}
        {isAwake && !isOpen && (
          <div className="absolute inset-0 w-full h-full bg-emerald-500/40 blur-[20px] rounded-full pointer-events-none animate-pulse" />
        )}
        
        {/* Sleeping 'Zzz' particles */}
        {!isAwake && (
          <>
            <span className="absolute -top-4 right-1 text-xs text-text-muted font-bold animate-bounce [animation-delay:0.1s]">Z</span>
            <span className="absolute -top-6 right-3 text-sm text-text-muted font-bold animate-bounce [animation-delay:0.3s]">z</span>
            <span className="absolute -top-8 right-6 text-[10px] text-text-muted font-bold animate-bounce [animation-delay:0.5s]">z</span>
          </>
        )}

        <div className="relative z-10 text-white flex flex-col items-center justify-center">
          {isOpen ? (
            <X size={28} className="text-white" />
          ) : (
            <Bot size={28} className={isAwake ? 'text-white' : 'text-text-muted'} />
          )}
        </div>
      </div>

      {/* Tooltip */}
      <div className={`absolute bottom-full right-0 mb-4 whitespace-nowrap bg-surface-overlay border border-surface-highlight text-text-secondary px-4 py-2 rounded-lg text-sm shadow-xl transition-all duration-200 pointer-events-none flex items-center gap-2 ${
        isHovered && !isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        {isAwake ? (
          <>
            <Sparkles size={14} className="text-emerald-400" />
            <span>Eve is <strong className="text-white font-medium">Online</strong></span>
          </>
        ) : (
          <>
            <Moon size={14} className="text-text-muted" />
            <span>Eve is <strong className="text-white font-medium">Sleeping</strong> (Offline)</span>
          </>
        )}
        
        {/* Little triangle arrow pointing down */}
        <div className="absolute top-full right-6 -mt-[1px] border-[6px] border-transparent border-t-surface-highlight"></div>
        <div className="absolute top-full right-6 -mt-[2px] border-[6px] border-transparent border-t-surface-overlay"></div>
      </div>
    </div>
    </Draggable>

    {/* Chat Popup Window (Independent from button) */}
    {isOpen && isAwake && typeof window !== 'undefined' && (
      <Rnd
        default={{
          x: Math.max(20, window.innerWidth - 400),
          y: Math.max(20, window.innerHeight - 620),
          width: Math.min(380, window.innerWidth - 40),
          height: Math.min(600, window.innerHeight - 40),
        }}
        minWidth={320}
        minHeight={400}
        bounds="window"
        dragHandleClassName="drag-handle"
        className="z-[201]"
        style={{ position: 'fixed' }}
      >
        <div className="w-full h-full bg-surface rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.15)] border border-surface-highlight flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="drag-handle bg-surface-overlay px-4 py-3 border-b border-surface-highlight flex justify-between items-center z-10 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2 pointer-events-none">
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20">
                <Sparkles size={12} className="text-emerald-400" />
              </div>
              <span className="text-text-primary font-medium text-sm">Eve Chat</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="flex-grow bg-white dark:bg-[#0A0A0A] relative overflow-hidden min-h-0">
            <EveChat />
          </div>
        </div>
      </Rnd>
    )}
    </>
  );
}
