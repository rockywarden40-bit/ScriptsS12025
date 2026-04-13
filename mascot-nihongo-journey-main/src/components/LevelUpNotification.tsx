import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Star, PartyPopper } from 'lucide-react';

interface LevelUpNotificationProps {
  level: number;
  onClose: () => void;
}

export const LevelUpNotification = ({ level, onClose }: LevelUpNotificationProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className={`bg-gradient-to-br from-accent/30 to-primary/30 border-2 border-accent p-8 text-center max-w-sm w-full transition-all duration-500 ${show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-accent/20 animate-ping" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center animate-bounce">
                <Zap className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="h-5 w-5 text-accent animate-pulse" />
              <PartyPopper className="h-5 w-5 text-primary animate-pulse" />
              <Star className="h-5 w-5 text-accent animate-pulse" />
            </div>

            <h2 className="text-3xl font-bold text-accent mb-2">Level Up!</h2>
            <p className="text-6xl font-bold text-foreground mb-4">{level}</p>
            <p className="text-muted-foreground mb-6">
              Amazing progress! Keep learning! 🌸
            </p>

            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold px-8"
            >
              Continue Learning
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
