import React from 'react';

// Pre-load the audio outside the hook to keep it ready as a singleton
const clickSound = typeof Audio !== 'undefined' ? new Audio('/gameaudio/click.wav') : null;
if (clickSound) {
  clickSound.preload = 'auto';
}

// Global state for sync across hook instances
let globalMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('puffer_muted') === 'true' : false;
const listeners = new Set<(muted: boolean) => void>();

export function useSound() {
  const [isMuted, setIsMutedState] = React.useState(globalMuted);

  React.useEffect(() => {
    const listener = (muted: boolean) => setIsMutedState(muted);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const toggleMute = React.useCallback(() => {
    const nextMuted = !globalMuted;
    globalMuted = nextMuted;
    localStorage.setItem('puffer_muted', String(nextMuted));
    listeners.forEach(l => l(nextMuted));
  }, []);

  const playClick = React.useCallback(() => {
    if (!clickSound || globalMuted) return;
    
    // Reset to start in case it's already playing (allows rapid clicking)
    clickSound.currentTime = 0;
    clickSound.play().catch(err => console.warn("Audio playback blocked by browser:", err));
  }, []);

  return { playClick, isMuted, toggleMute };
}
