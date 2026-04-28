import React, { useState } from 'react';
import { AppGuidance } from '../components/AppGuidance';
import { Header } from '../components/Header';
import { NavigationDock } from '../components/NavigationDock';
import { Footer } from '../components/Footer';
import blueBackground from "../assets/blue.jpg";

// Mocking useAccount for the demo
import * as razorlabs from '@razorlabs/razorkit';

export default function GuidanceDemo() {
  // We can't easily mock useAccount if it's a real hook from a library,
  // so we might need to modify AppGuidance to accept a 'forceRun' prop or something similar.
  // For this demo, let's just trigger the event.
  
  return (
    <div 
        className="min-h-screen bg-cover bg-center bg-fixed text-foreground font-sans selection:bg-blue-600/20"
        style={{ backgroundImage: `url(${blueBackground})` }}
    >
        <Header onOpenWallet={() => {}} onOpenAdmin={() => {}} />

        <div className="container mx-auto px-4 pt-24 pb-20 max-w-6xl">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 id="step-competitions" className="text-2xl text-foreground mb-2 tracking-tight">
                        Active Competitions (Demo)
                    </h1>
                    <p className="text-muted-foreground text-sm tracking-tight">
                        This is a preview of the new app guidance system.
                    </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <input
                        id="step-join-code"
                        type="text"
                        placeholder="Enter Join Code"
                        className="w-full md:w-auto h-10 px-6 bg-muted border border-border rounded-full text-xs placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all font-bold"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-white/5 backdrop-blur-xl rounded-[20px] border border-white/10 flex items-center justify-center">
                        <span className="text-white/20">Game Card {i}</span>
                    </div>
                ))}
            </div>

            <div className="mt-20 flex flex-col items-center gap-4">
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('restart-puffer-tour'))}
                    className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all active:scale-95"
                >
                    Start Tour Preview
                </button>
                <p className="text-white/40 text-xs">Click the button above to start the walkthrough tour.</p>
            </div>
        </div>

        {/* We need to make sure AppGuidance thinks we are connected for the demo */}
        <AppGuidance />
        <NavigationDock />
        <Footer />
    </div>
  );
}
