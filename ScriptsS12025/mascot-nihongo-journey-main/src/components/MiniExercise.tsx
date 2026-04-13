import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

interface ExerciseItem {
  char: string;
  romaji: string;
  audio?: string;
}

interface MiniExerciseProps {
  items: ExerciseItem[];
  mascotImage: string;
  exerciseType: 'match' | 'choose';
  sectionColor: string;
  onComplete: () => void;
}

export const MiniExercise = ({ 
  items, 
  mascotImage, 
  exerciseType, 
  sectionColor,
  onComplete 
}: MiniExerciseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentItem = items[currentIndex];
  const options = exerciseType === 'match' 
    ? [currentItem, ...items.filter((_, i) => i !== currentIndex).sort(() => Math.random() - 0.5).slice(0, 3)]
        .sort(() => Math.random() - 0.5)
    : [currentItem, ...items.filter((_, i) => i !== currentIndex).sort(() => Math.random() - 0.5).slice(0, 3)]
        .sort(() => Math.random() - 0.5);

  const playSound = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const handleAnswer = (answer: ExerciseItem) => {
    const correct = answer.romaji === currentItem.romaji;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowFeedback(false);
      } else {
        onComplete();
      }
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 space-y-8">
      <div className="flex items-center gap-4">
        <img 
          src={mascotImage} 
          alt="Mascot"
          className={`w-16 h-16 object-contain transition-all duration-300 ${
            showFeedback ? (isCorrect ? 'mascot-happy' : 'mascot-sad') : 'mascot-thinking'
          }`}
        />
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Progress</p>
          <p className="text-lg font-bold">{currentIndex + 1} / {items.length}</p>
        </div>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm border-2 p-12 text-center" style={{ borderColor: sectionColor }}>
        {exerciseType === 'match' ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">Listen and match:</p>
            <Button
              variant="ghost"
              onClick={() => playSound(currentItem.char)}
              className="mb-4"
            >
              <Volume2 className="h-8 w-8" style={{ color: sectionColor }} />
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">Choose the correct character for:</p>
            <p className="text-5xl font-bold mb-4">{currentItem.char}</p>
          </>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 max-w-md w-full">
        {options.map((option, index) => (
          <Button
            key={index}
            onClick={() => !showFeedback && handleAnswer(option)}
            disabled={showFeedback}
            variant="outline"
            className={`h-20 text-2xl font-medium transition-all duration-300 ${
              showFeedback && option.romaji === currentItem.romaji
                ? 'border-green-500 bg-green-500/20'
                : 'hover:scale-105'
            }`}
            style={{ borderColor: sectionColor }}
          >
            {exerciseType === 'match' ? option.char : option.romaji}
          </Button>
        ))}
      </div>

      {showFeedback && (
        <p className="text-lg font-medium animate-fade-in" style={{ color: isCorrect ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
          {isCorrect ? '✓ Correct!' : '✗ Try again!'}
        </p>
      )}
    </div>
  );
};
