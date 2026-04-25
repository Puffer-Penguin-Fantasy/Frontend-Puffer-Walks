import React from 'react';

// Pre-load the audio outside the hook to keep it ready as a singleton
const clickSound = typeof Audio !== 'undefined' ? new Audio('/gameaudio/click.wav') : null;
if (clickSound) {
  clickSound.preload = 'auto';
}

export function useSound() {
  const playClick = React.useCallback(() => {
    if (!clickSound) return;
    
    // Reset to start in case it's already playing (allows rapid clicking)
    clickSound.currentTime = 0;
    clickSound.play().catch(err => console.warn("Audio playback blocked by browser:", err));
  }, []);

  return { playClick };
}
