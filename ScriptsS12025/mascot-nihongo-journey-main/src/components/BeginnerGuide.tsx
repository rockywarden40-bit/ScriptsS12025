import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import hanaFox from '@/assets/hana-fox.png';

export const BeginnerGuide = ({ onClose }: { onClose: () => void }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenGuide');
    if (!hasSeenGuide) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenGuide', 'true');
    setShow(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary p-6 md:p-8 max-w-lg w-full relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute top-3 right-3"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center gap-4 mb-6">
          <img 
            src={hanaFox} 
            alt="Hana the Fox"
            className="w-28 h-28 object-contain mascot-idle"
          />
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
              Welcome! ようこそ 🌸
            </h2>
            <p className="text-muted-foreground">
              I'm Hana! Let me guide your Japanese journey.
            </p>
          </div>
        </div>

        {/* Arrow pointing to Hiragana block */}
        <div className="bg-primary/10 rounded-lg p-4 mb-6 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-bounce-gentle">👉</div>
            <div>
              <p className="font-semibold text-foreground">Start with Hiragana!</p>
              <p className="text-sm text-muted-foreground">
                It's the first step to reading Japanese. Click the pink block to begin!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-6 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-primary">①</span>
            <span>Hiragana - Basic alphabet</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-secondary">②</span>
            <span>Katakana - Foreign words</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-accent">③</span>
            <span>Kanji - Meaning characters</span>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleClose}
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold group"
          >
            Let's Start!
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
