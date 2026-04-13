import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Volume2, Pencil } from 'lucide-react';
import { useState } from 'react';

interface CharacterCardProps {
  char: string;
  romaji: string;
  example: string;
  exampleRomaji: string;
  accentColor?: 'cyan' | 'magenta' | 'purple';
}

export const CharacterCard = ({ 
  char, 
  romaji, 
  example, 
  exampleRomaji,
  accentColor = 'cyan'
}: CharacterCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const playSound = () => {
    const utterance = new SpeechSynthesisUtterance(romaji);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  };

  const playExampleSound = () => {
    const utterance = new SpeechSynthesisUtterance(example);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  };

  const colorClass = {
    cyan: 'border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.3)]',
    magenta: 'border-neon-magenta shadow-[0_0_20px_rgba(255,0,255,0.3)]',
    purple: 'border-neon-purple shadow-[0_0_20px_rgba(138,43,226,0.3)]',
  }[accentColor];

  const textColorClass = {
    cyan: 'text-neon-cyan',
    magenta: 'text-neon-magenta',
    purple: 'text-neon-purple',
  }[accentColor];

  return (
    <Card className={`bg-card/80 backdrop-blur-sm border-2 ${colorClass} p-4 sm:p-6 hover:scale-105 transition-all duration-300`}>
      <div className="text-center space-y-3 sm:space-y-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className={`text-6xl sm:text-7xl font-bold ${textColorClass} cursor-pointer hover:scale-110 transition-transform touch-manipulation`}>
              {char}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">How to Write {char}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className={`text-9xl font-bold ${textColorClass} text-center`}>
                {char}
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-foreground">{romaji}</p>
                <p className="text-sm text-muted-foreground">
                  Stroke Order: Write this character following the standard stroke order from top to bottom, left to right.
                </p>
                <Button onClick={playSound} variant="outline" size="sm" className="w-full">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Hear Pronunciation
                </Button>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-2">Practice Area:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`aspect-square border-2 border-dashed ${colorClass} rounded-lg flex items-center justify-center text-4xl text-muted-foreground/20`}>
                      {char}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <div className="text-xl sm:text-2xl font-semibold text-foreground">
          {romaji}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={playSound}
          className="w-full touch-manipulation"
        >
          <Volume2 className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Play Sound</span>
          <span className="sm:hidden">Sound</span>
        </Button>
        
        <div className="pt-3 sm:pt-4 border-t border-border space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground">Example:</p>
          <p className="text-lg sm:text-xl font-bold text-foreground">{example}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">{exampleRomaji}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={playExampleSound}
            className="w-full touch-manipulation"
          >
            <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="text-xs sm:text-sm">Hear Example</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
