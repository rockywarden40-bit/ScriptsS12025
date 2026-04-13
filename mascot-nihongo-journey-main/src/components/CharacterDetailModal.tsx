import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, X, Check, BookOpen } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

interface CharacterDetailModalProps {
  character: {
    char: string;
    romaji: string;
    example?: string;
    exampleRomaji?: string;
    meaning?: string;
    readings?: { on: string; kun: string };
    exampleReading?: string;
  };
  type: 'hiragana' | 'katakana' | 'kanji';
  sectionColor: string;
  onClose: () => void;
}

export const CharacterDetailModal = ({
  character,
  type,
  sectionColor,
  onClose,
}: CharacterDetailModalProps) => {
  const { progress } = useProgress();
  const isMastered = progress.masteredCharacters[type].includes(character.char);

  const playSound = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  };

  const isKanji = type === 'kanji';

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <Card 
        className="bg-card/95 backdrop-blur-sm border-2 p-6 max-w-sm w-full relative animate-scale-in"
        style={{ borderColor: sectionColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-3 right-3"
        >
          <X className="h-5 w-5" />
        </Button>

        {isMastered && (
          <div 
            className="absolute top-3 left-3 flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: `${sectionColor}20`, color: sectionColor }}
          >
            <Check className="h-3 w-3" />
            Mastered
          </div>
        )}

        <div className="text-center pt-4">
          <div 
            className="text-8xl font-bold mb-4 transition-transform hover:scale-110"
            style={{ color: sectionColor }}
          >
            {character.char}
          </div>

          <Button
            variant="outline"
            onClick={() => playSound(character.char)}
            className="mb-4"
            style={{ borderColor: sectionColor }}
          >
            <Volume2 className="h-4 w-4 mr-2" style={{ color: sectionColor }} />
            Listen
          </Button>

          <div className="space-y-3 text-left bg-background/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Romaji</span>
              <span className="font-bold text-lg">{character.romaji || character.meaning}</span>
            </div>

            {isKanji && character.readings && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">On'yomi</span>
                  <span className="font-medium">{character.readings.on}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Kun'yomi</span>
                  <span className="font-medium">{character.readings.kun}</span>
                </div>
              </>
            )}

            {(character.example || isKanji) && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                  <BookOpen className="h-3 w-3" />
                  Example
                </div>
                <p className="text-lg font-medium">{character.example}</p>
                <p className="text-sm text-muted-foreground">
                  {character.exampleRomaji || character.exampleReading}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
