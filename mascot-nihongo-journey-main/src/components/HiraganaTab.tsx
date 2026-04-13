import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Layers, BookOpen, Trophy, Check } from 'lucide-react';
import { hiraganaData } from '@/data/hiragana';
import { MiniExercise } from '@/components/MiniExercise';
import { QuizComponent } from '@/components/QuizComponent';
import { FlashcardMode } from '@/components/FlashcardMode';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { useProgress } from '@/hooks/useProgress';
import hanaFox from '@/assets/hana-fox.png';
import { toast } from 'sonner';

type ViewMode = 'learn' | 'flashcards' | 'exercise-match' | 'exercise-choose' | 'quiz';

export const HiraganaTab = () => {
  const [selectedChar, setSelectedChar] = useState<typeof hiraganaData[0] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('learn');
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
    return hiraganaData
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map(item => {
        const wrongAnswers = hiraganaData
          .filter(h => h.char !== item.char)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(h => h.romaji);
        
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
        items={hiraganaData}
        type="hiragana"
        sectionColor="hsl(var(--primary))"
        mascotImage={hanaFox}
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
        items={hiraganaData.slice(0, 10)}
        mascotImage={hanaFox}
        exerciseType="match"
        sectionColor="hsl(var(--primary))"
        onComplete={() => setViewMode('exercise-choose')}
      />
    );
  }

  if (viewMode === 'exercise-choose') {
    return (
      <MiniExercise
        items={hiraganaData.slice(10, 20)}
        mascotImage={hanaFox}
        exerciseType="choose"
        sectionColor="hsl(var(--primary))"
        onComplete={() => setViewMode('quiz')}
      />
    );
  }

  if (viewMode === 'quiz') {
    return (
      <QuizComponent
        questions={generateQuizQuestions()}
        mascotImage={hanaFox}
        mascotName="Hana"
        sectionColor="hsl(var(--primary))"
        sectionType="hiragana"
        onComplete={() => setViewMode('learn')}
      />
    );
  }

  const masteredChars = progress.masteredCharacters.hiragana;

  return (
    <div className="h-full flex flex-col">
      {selectedChar && (
        <CharacterDetailModal
          character={selectedChar}
          type="hiragana"
          sectionColor="hsl(var(--primary))"
          onClose={() => setSelectedChar(null)}
        />
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img 
            src={hanaFox} 
            alt="Hana the Fox"
            className="w-12 h-12 object-contain mascot-idle"
          />
          <div>
            <p className="font-semibold text-primary">Hana the Fox</p>
            <p className="text-xs text-muted-foreground">
              {masteredChars.length}/{hiraganaData.length} mastered
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode('flashcards')}
            className="border-primary/40 hover:bg-primary/20"
          >
            <Layers className="h-4 w-4 mr-1" />
            Flashcards
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode('exercise-match')}
            className="border-primary/40 hover:bg-primary/20"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Practice
          </Button>
          <Button
            size="sm"
            onClick={() => setViewMode('quiz')}
            className="bg-primary/80 hover:bg-primary text-primary-foreground"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Quiz
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {hiraganaData.map((item, index) => {
            const isMastered = masteredChars.includes(item.char);
            return (
              <Card
                key={index}
                className={`relative bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 
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
                  <div className="text-4xl font-bold text-primary group-hover:scale-110 transition-transform duration-300">
                    {item.char}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.romaji}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-primary/20"
                    onClick={(e) => playSound(item.char, e)}
                  >
                    <Volume2 className="h-3 w-3 text-primary" />
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
