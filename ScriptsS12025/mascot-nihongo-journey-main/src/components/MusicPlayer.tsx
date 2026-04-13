import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

export const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create a simple ambient tone using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playAmbient = () => {
      if (!audioRef.current) {
        // Create gentle ambient sounds
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        oscillator1.frequency.setValueAtTime(220, audioContext.currentTime); // A3
        oscillator2.frequency.setValueAtTime(329.63, audioContext.currentTime); // E4
        
        gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (isPlaying) {
          oscillator1.start();
          oscillator2.start();
        }
        
        return () => {
          oscillator1.stop();
          oscillator2.stop();
        };
      }
    };

    if (isPlaying) {
      playAmbient();
    }

    return () => {
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const savedPreference = localStorage.getItem('music-enabled');
    if (savedPreference === 'true') {
      setIsPlaying(true);
    }
  }, []);

  const toggleMusic = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    localStorage.setItem('music-enabled', newState.toString());
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMusic}
      className="fixed top-4 right-4 z-50 bg-card/50 backdrop-blur-sm hover:bg-card/80 touch-manipulation"
    >
      {isPlaying ? (
        <>
          <Volume2 className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Music On</span>
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Music Off</span>
        </>
      )}
    </Button>
  );
};
