"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { useSound } from '../hooks/useSound';
import nftImg from '../assets/puffer_nft_tutorial.png';
import profileImg from '../assets/puffer_profile_tutorial.png';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { playClick } = useSound();

  const steps = [
    {
      title: "Purchase an NFT",
      description: "Own an Arctic Penguin NFT to unlock exclusive perks like profile customization and sponsored reward claims.",
      content: (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img src={nftImg} alt="Purchase NFT" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <span className="text-white/80 text-sm font-medium">Step 1: Become a Holder</span>
          </div>
        </div>
      )
    },
    {
      title: "Edit Your Profile",
      description: "Personalize your identity! Change your name and avatar to stand out on the global leaderboards.",
      content: (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img src={profileImg} alt="Edit Profile" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <span className="text-white/80 text-sm font-medium">Step 2: Customize Your Look</span>
          </div>
        </div>
      )
    },
    {
      title: "Connect Fitbit",
      description: "Sync your real-world progress. Connect your Fitbit account to automatically notarize your steps on-chain.",
      content: (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/f_rN68VnE70" 
            title="How to connect Fitbit"
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      )
    }
  ];

  const nextStep = () => {
    playClick();
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    playClick();
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { playClick(); onClose(); }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#071226] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <HelpCircle size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">How to Play</h2>
                <p className="text-xs text-white/40">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>
            <button 
              onClick={() => { playClick(); onClose(); }}
              className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Carousel */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white font-xirod tracking-tighter">
                {steps[currentStep].title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-md">
                {steps[currentStep].description}
              </p>
            </div>

            <div className="relative group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {steps[currentStep].content}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <button 
                onClick={prevStep}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextStep}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-6 pt-2 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-white/10'}`}
                />
              ))}
            </div>
            <button
              onClick={currentStep === steps.length - 1 ? onClose : nextStep}
              className="px-8 py-3 bg-white text-black font-bold text-xs rounded-full hover:bg-white/90 transition-all active:scale-95"
            >
              {currentStep === steps.length - 1 ? "Start Walking" : "Next Step"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
