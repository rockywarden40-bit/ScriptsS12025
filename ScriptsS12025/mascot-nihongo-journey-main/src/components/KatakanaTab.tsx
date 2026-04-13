import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Layers, BookOpen, Trophy, Check, X } from 'lucide-react';
import { katakanaData } from '@/data/katakana';
import { MiniExercise } from '@/components/MiniExercise';
import { QuizComponent } from '@/components/QuizComponent';
import { FlashcardMode } from '@/components/FlashcardMode';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { useProgress } from '@/hooks/useProgress';
import kataCat from '@/assets/kata-cat.png';
import { toast } from 'sonner';

type ViewMode = 'learn' | 'flashcards' | 'exercise-match' | 'exercise-choose' | 'quiz';

export const KatakanaTab = () => {
  const [selectedChar, setSelectedChar] = useState<typeof katakanaData[0] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('learn');
  const [showTip, setShowTip] = useState(true);
  const { progress } = useProgress();

  const playSound = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!progress.settings.soundEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const generateQuizQuestions = () => {
    return katakanaData
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map(item => {
        const wrongAnswers = katakanaData
          .filter(k => k.char !== item.char)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(k => k.romaji);
        
        return {
          question: `What is the romaji for "${item.char}"?`,
          options: [item.romaji, ...wrongAnswers].sort(() => Math.random() - 0.5),
          correctAnswer: item.romaji,
          character: item.char,
          type: 'multiple-choice' as const
        };
      });
  };

  if (viewMode === 'flashcards') {
    return (
      <FlashcardMode
        items={katakanaData}
        type="katakana"
        sectionColor="hsl(var(--secondary))"
        mascotImage={kataCat}
        onComplete={() => {
          toast.success('Flashcard session complete!');
          setViewMode('learn');
        }}
        onExit={() => setViewMode('learn')}
      />
    );
  }

  if (viewMode === 'exercise-match') {
    return (
      <MiniExercise
        items={katakanaData.slice(0, 10)}
        mascotImage={kataCat}
        exerciseType="match"
        sectionColor="hsl(var(--secondary))"
        onComplete={() => setViewMode('exercise-choose')}
      />
    );
  }

  if (viewMode === 'exercise-choose') {
    return (
      <MiniExercise
        items={katakanaData.slice(10, 20)}
        mascotImage={kataCat}
        exerciseType="choose"
        sectionColor="hsl(var(--secondary))"
        onComplete={() => setViewMode('quiz')}
      />
    );
  }

  if (viewMode === 'quiz') {
    return (
      <QuizComponent
        questions={generateQuizQuestions()}
        mascotImage={kataCat}
        mascotName="Kata"
        sectionColor="hsl(var(--secondary))"
        sectionType="katakana"
        onComplete={() => setViewMode('learn')}
      />
    );
  }

  const masteredChars = progress.masteredCharacters.katakana;
  const tips = [
    "Katakana is used for foreign words! Like コーヒー (kōhī - coffee) ☕",
    "Many English words become Japanese with Katakana! 🌍",
    "Katakana looks more angular than Hiragana 📐",
    "Practice spotting Katakana in Japanese ads! 📺"
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <div className="h-full flex flex-col">
      {selectedChar && (
        <CharacterDetailModal
          character={selectedChar}
          type="katakana"
          sectionColor="hsl(var(--secondary))"
          onClose={() => setSelectedChar(null)}
        />
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary/20 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img 
            src={kataCat} 
            alt="Kata the Cat"
            className="w-12 h-12 object-contain mascot-idle"
          />
          <div>
            <p className="font-semibold text-secondary">Kata the Cat</p>
            <p className="text-xs text-muted-foreground">
              {masteredChars.length}/{katakanaData.length} mastered
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode('flashcards')}
            className="border-secondary/40 hover:bg-secondary/20"
          >
            <Layers className="h-4 w-4 mr-1" />
            Flashcards
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode('exercise-match')}
            className="border-secondary/40 hover:bg-secondary/20"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Practice
          </Button>
          <Button
            size="sm"
            onClick={() => setViewMode('quiz')}
            className="bg-secondary/80 hover:bg-secondary text-secondary-foreground"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Quiz
          </Button>
        </div>
      </div>

      {showTip && (
        <div className="mx-4 mt-4 bg-secondary/10 border border-secondary/30 rounded-lg p-3 flex items-center gap-3 animate-fade-in">
          <img 
            src={kataCat} 
            alt="Kata"
            className="w-10 h-10 object-contain mascot-talking"
          />
          <p className="text-sm flex-1">
            <span className="font-semibold text-secondary">Kata's Tip:</span> {randomTip}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTip(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {katakanaData.map((item, index) => {
            const isMastered = masteredChars.includes(item.char);
            return (
              <Card
                key={index}
                className={`relative bg-card/50 backdrop-blur-sm border-secondary/20 hover:border-secondary/40 
                           transition-all duration-300 cursor-pointer group overflow-hidden fade-in-smooth
                           ${isMastered ? 'ring-1 ring-green-500/30' : ''}`}
                style={{ animationDelay: `${index * 0.02}s` }}
                onClick={() => setSelectedChar(item)}
              >
                {isMastered && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-green-400" />
                  </div>
                )}
                <div className="p-3 flex flex-col items-center justify-center space-y-2">
                  <div className="text-4xl font-bold text-secondary group-hover:scale-110 transition-transform duration-300">
                    {item.char}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.romaji}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-secondary/20"
                    onClick={(e) => playSound(item.char, e)}
                  >
                    <Volume2 className="h-3 w-3 text-secondary" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
