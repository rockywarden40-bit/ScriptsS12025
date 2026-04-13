import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LevelUpPopupProps {
  level: number;
  onClose: () => void;
}

export const LevelUpPopup = ({ level, onClose }: LevelUpPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className={`bg-card/95 border-2 border-neon-cyan shadow-[0_0_40px_rgba(0,255,255,0.5)] p-8 max-w-md w-full relative ${isVisible ? 'animate-scale-in' : ''}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2"
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-20 h-20 text-neon-cyan animate-pulse-glow" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-purple bg-clip-text text-transparent font-japanese">
            Level Up!
          </h2>
          <div className="text-7xl font-bold text-neon-cyan">
            {level}
          </div>
          <p className="text-lg text-muted-foreground">
            You've reached level {level}!
          </p>
          <p className="text-sm text-foreground">
            Keep going, you're doing amazing! 🌟
          </p>
          <Button
            onClick={onClose}
            className="mt-6 bg-neon-cyan text-background hover:bg-neon-cyan/90"
            size="lg"
          >
            Continue Journey
          </Button>
        </div>
      </Card>
    </div>
  );
};
