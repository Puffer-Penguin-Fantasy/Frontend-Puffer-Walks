"use client";

import { useState } from 'react';
import { HelpCircle, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../hooks/useSound';
import nftImg from '../assets/tradeport.png';
import profileImg from '../assets/editprofile.png';
import buttonImg from '../assets/gameframe/button.png';

export function Footer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { playClick } = useSound();

  const steps = [
    {
      title: "Purchase an NFT",
      description: "Own an Arctic Penguin NFT to unlock exclusive perks like profile customization and sponsored reward claims.",
      content: <img src={nftImg} alt="NFT" className="w-full h-64 object-contain rounded-2xl bg-gray-50" />
    },
    {
      title: "Edit Your Profile",
      description: "Personalize your identity! Change your name and avatar to stand out on the global leaderboards.",
      content: <img src={profileImg} alt="Profile" className="w-full h-64 object-contain rounded-2xl bg-gray-50" />
    },
    {
      title: "Connect Fitbit",
      description: "Sync your steps automatically via Fitbit to notarize your progress on Move.",
      content: (
        <div className="w-full h-64 bg-black rounded-2xl overflow-hidden shadow-lg">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/UA_ih7qp64c" 
            title="Fitbit"
            frameBorder="0" 
            allowFullScreen
          />
        </div>
      )
    }
  ];

  const nextStep = () => { playClick(); if (currentStep < steps.length - 1) setCurrentStep(c => c + 1); else setIsOpen(false); };
  const prevStep = () => { playClick(); if (currentStep > 0) setCurrentStep(c => c - 1); };

  return (
    <>
      <button 
        onClick={() => { playClick(); setIsOpen(true); }}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all hover:bg-white/10 active:scale-90 border border-white/5 shadow-2xl z-[1500]"
        title="How to Play"
      >
        <HelpCircle size={22} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { playClick(); setIsOpen(false); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 35, stiffness: 400, duration: 0.2 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 pb-10 z-[2001] max-h-[85vh] overflow-y-auto shadow-[0_-15px_40px_rgba(0,0,0,0.3)]"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
              <div className="max-w-3xl mx-auto w-full flex flex-col md:flex-row gap-8 md:items-stretch h-full">
                {/* Visual Content (Left on Desktop) */}
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="flex justify-between items-center mb-4 md:hidden">
                    <span className="text-[9px] font-bold text-black/30 tracking-[0.1em]">Step {currentStep + 1} of {steps.length}</span>
                    <button onClick={() => { playClick(); setIsOpen(false); }} className="text-black/10 hover:text-black transition-colors"><X size={20} /></button>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {steps[currentStep].content}
                  </div>
                </div>

                {/* Info & Controls (Right on Desktop) */}
                <div className="w-full md:w-1/2 flex flex-col justify-between">
                  <div className="hidden md:flex justify-between items-center mb-8">
                    <span className="text-[9px] font-bold text-black/30 tracking-[0.1em]">Step {currentStep + 1} of {steps.length}</span>
                    <button onClick={() => { playClick(); setIsOpen(false); }} className="text-black/10 hover:text-black transition-colors"><X size={20} /></button>
                  </div>

                    <div className="space-y-4 text-center md:text-left flex-1 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold font-xirod text-black tracking-tight leading-loose">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                      {steps[currentStep].description}
                    </p>
                    {currentStep === 0 && (
                      <button 
                        onClick={() => {
                          playClick();
                          setIsOpen(false);
                          window.dispatchEvent(new CustomEvent('restart-puffer-tour'));
                        }}
                        className="mt-4 text-blue-600 text-xs font-bold hover:underline underline-offset-4 decoration-blue-600/30 transition-all"
                      >
                        Take Interactive Tour →
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-4 mt-8 md:mt-0">
                    <button 
                      disabled={currentStep === 0}
                      onClick={prevStep}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${currentStep === 0 ? 'bg-gray-50 text-gray-200 cursor-not-allowed' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <button
                      onClick={nextStep}
                      className="w-full max-w-[200px] h-12 text-black font-xirod text-[11px] hover:opacity-90 transition-all flex items-center justify-center"
                      style={{
                        backgroundImage: `url(${buttonImg})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      {currentStep === steps.length - 1 ? "Got it" : "Next"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
