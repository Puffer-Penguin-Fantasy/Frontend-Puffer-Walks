"use client";

import { useState } from 'react';
import { HelpCircle, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../hooks/useSound';
import nftImg from '../assets/puffer_nft_tutorial.png';
import profileImg from '../assets/puffer_profile_tutorial.png';
import buttonImg from '../assets/gameframe/button.png';

export function Footer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { playClick } = useSound();

  const steps = [
    {
      title: "Purchase an NFT",
      description: "Own an Arctic Penguin NFT to unlock exclusive perks like profile customization and sponsored reward claims.",
      content: <img src={nftImg} alt="NFT" className="w-full h-48 object-cover rounded-2xl" />
    },
    {
      title: "Edit Your Profile",
      description: "Personalize your identity! Change your name and avatar to stand out on the global leaderboards.",
      content: <img src={profileImg} alt="Profile" className="w-full h-48 object-cover rounded-2xl" />
    },
    {
      title: "Connect Fitbit",
      description: "Sync your steps automatically via Fitbit to notarize your progress on Move.",
      content: (
        <div className="w-full h-48 bg-black rounded-2xl overflow-hidden shadow-lg">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/f_rN68VnE70" 
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
    <footer className="w-full py-16 px-6 border-t border-white/5 bg-black/20 backdrop-blur-md mt-auto flex flex-col items-center">
      <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center md:items-start space-y-2">
          <span className="text-sm font-xirod text-white tracking-widest uppercase opacity-80">Puffer Walks</span>
          <p className="text-[10px] text-white/30 tracking-tight text-center md:text-left font-medium uppercase">
            © 2026 Puffer Walks Protocol. ALL RIGHTS RESERVED.
          </p>
        </div>

        <button 
          onClick={() => { playClick(); setIsOpen(true); }}
          className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10 active:scale-90 border border-white/5 shadow-xl"
          title="How to Play"
        >
          <HelpCircle size={22} />
        </button>
      </div>

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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 pb-12 z-[2001] max-h-[90vh] overflow-y-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-10" />
              <div className="max-w-xl mx-auto flex flex-col">
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</span>
                    <button onClick={() => { playClick(); setIsOpen(false); }} className="text-black/20 hover:text-black transition-colors"><X size={24} /></button>
                  </div>
                  {steps[currentStep].content}
                </div>

                <div className="space-y-4 text-center">
                  <h2 className="text-3xl font-bold font-xirod text-black tracking-tight uppercase leading-none">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-gray-500 text-base leading-relaxed max-w-sm mx-auto">
                    {steps[currentStep].description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 mt-12">
                   <button 
                    disabled={currentStep === 0}
                    onClick={prevStep}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${currentStep === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
                   >
                     <ChevronLeft size={24} />
                   </button>

                   <button
                        onClick={nextStep}
                        className="flex-1 h-14 text-black font-xirod text-xs hover:opacity-90 transition-all flex items-center justify-center"
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </footer>
  );
}
