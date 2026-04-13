import React from 'react';

export function useSound() {
  const playClick = React.useCallback(() => {
    const audio = new Audio('/gameaudio/click.wav');
    audio.play().catch(err => console.error("Error playing sound:", err));
  }, []);

  return { playClick };
}
