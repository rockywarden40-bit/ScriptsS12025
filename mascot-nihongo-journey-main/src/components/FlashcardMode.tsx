import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCw, Check, X, ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';

interface FlashcardItem {
  char: string;
  romaji: string;
  example?: string;
  exampleRomaji?: string;
  meaning?: string;
}

interface FlashcardModeProps {
  items: FlashcardItem[];
  type: 'hiragana' | 'katakana' | 'kanji';
  sectionColor: string;
  mascotImage: string;
  onComplete: () => void;
  onExit: () => void;
}

export const FlashcardMode = ({
  items,
  type,
  sectionColor,
  mascotImage,
  onComplete,
  onExit,
}: FlashcardModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<string[]>([]);
  const [shuffledItems, setShuffledItems] = useState(items);

  const currentCard = shuffledItems[currentIndex];
  const progress = ((currentIndex + 1) / shuffledItems.length) * 100;

  const playSound = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnow = () => {
    if (!knownCards.includes(currentCard.char)) {
      setKnownCards([...knownCards, currentCard.char]);
    }
    goToNext();
  };

  const handleDontKnow = () => {
    goToNext();
  };

  const goToNext = () => {
    setIsFlipped(false);
    if (currentIndex < shuffledItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const shuffleCards = () => {
    setShuffledItems([...shuffledItems].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards([]);
  };

  const isKanji = type === 'kanji';

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onExit} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit
        </Button>
        <div className="flex items-center gap-2">
          <img src={mascotImage} alt="Mascot" className="w-8 h-8 object-contain" />
          <span className="text-sm font-medium">Flashcards</span>
        </div>
        <Button variant="ghost" onClick={shuffleCards} size="sm">
          <Shuffle className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Card {currentIndex + 1} of {shuffledItems.length}</span>
          <span>{knownCards.length} mastered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="perspective-1000 w-full max-w-md">
          <Card
            onClick={handleFlip}
            className={`relative h-80 cursor-pointer transition-all duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{ 
              borderColor: sectionColor,
              borderWidth: '2px',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center p-6 backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-sm text-muted-foreground mb-4">
                {isKanji ? 'What does this mean?' : 'What is the romaji?'}
              </p>
              <div 
                className="text-8xl font-bold mb-4 transition-transform hover:scale-105"
                style={{ color: sectionColor }}
              >
                {currentCard.char}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  playSound(currentCard.char);
                }}
              >
                <Volume2 className="h-5 w-5" style={{ color: sectionColor }} />
              </Button>
              <p className="text-xs text-muted-foreground mt-4">Tap to reveal</p>
            </div>

            {/* Back */}
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center p-6 rotate-y-180"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="text-4xl font-bold mb-2" style={{ color: sectionColor }}>
                {currentCard.char}
              </div>
              <p className="text-2xl font-bold mb-4">
                {isKanji ? currentCard.meaning : currentCard.romaji}
              </p>
              {currentCard.example && (
                <div className="text-center bg-background/50 rounded-lg p-3 mt-2">
                  <p className="text-lg">{currentCard.example}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentCard.exampleRomaji}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="border-muted-foreground/30"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleDontKnow}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <X className="h-4 w-4 mr-2" />
          Don't Know
        </Button>

        <Button
          onClick={handleKnow}
          variant="outline"
          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
        >
          <Check className="h-4 w-4 mr-2" />
          Know It
        </Button>

        <Button
          variant="outline"
          onClick={goToNext}
          disabled={currentIndex === shuffledItems.length - 1}
          className="border-muted-foreground/30"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
