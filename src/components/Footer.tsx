"use client";

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useSound } from '../hooks/useSound';
import { HowToPlayModal } from './HowToPlayModal';

export function Footer() {
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const { playClick } = useSound();

  return (
    <footer className="w-full py-12 px-6 border-t border-white/5 bg-black/20 backdrop-blur-md mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center md:items-start space-y-2">
          <span className="text-sm font-xirod text-white tracking-widest uppercase">Puffer Walks</span>
          <p className="text-xs text-white/40 tracking-tight text-center md:text-left">
            Notarized fitness battles on the Movement Network. 
            <br />
            © 2026 Puffer Walks Protocol.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => { playClick(); setIsHowToPlayOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-lg"
          >
            <HelpCircle size={18} />
            <span>How to Play</span>
          </button>
        </div>
      </div>

      <HowToPlayModal 
        isOpen={isHowToPlayOpen} 
        onClose={() => setIsHowToPlayOpen(false)} 
      />
    </footer>
  );
}
