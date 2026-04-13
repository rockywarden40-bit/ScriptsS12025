import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Volume2, Layers, Trophy, Check, Search, Filter } from 'lucide-react';
import { kanjiData } from '@/data/kanji';
import { QuizComponent } from '@/components/QuizComponent';
import { FlashcardMode } from '@/components/FlashcardMode';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { useProgress } from '@/hooks/useProgress';
import kanjiCrane from '@/assets/kanji-crane.png';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = 'learn' | 'flashcards' | 'quiz';

export const KanjiTab = () => {
  const [selectedKanji, setSelectedKanji] = useState<typeof kanjiData[0] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('learn');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'mastered' | 'unmastered'>('all');
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
    return kanjiData
      .sort(() => Math.random() - 0.5)
      .slice(0, 15)
      .map(item => {
        const wrongAnswers = kanjiData
          .filter(k => k.char !== item.char)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(k => k.meaning);
        
        return {
          question: `What is the meaning of "${item.char}"?`,
          options: [item.meaning, ...wrongAnswers].sort(() => Math.random() - 0.5),
          correctAnswer: item.meaning,
          character: item.char,
          type: 'multiple-choice' as const
        };
      });
  };

  const masteredChars = progress.masteredCharacters.kanji;

  const filteredKanji = kanjiData.filter(item => {
    const matchesSearch = item.char.includes(searchTerm) || 
                          item.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.readings.on.includes(searchTerm) ||
                          item.readings.kun.includes(searchTerm);
    
    if (filterBy === 'mastered') return matchesSearch && masteredChars.includes(item.char);
    if (filterBy === 'unmastered') return matchesSearch && !masteredChars.includes(item.char);
    return matchesSearch;
  });

  if (viewMode === 'flashcards') {
    const flashcardItems = kanjiData.map(k => ({
      char: k.char,
      romaji: k.meaning,
      meaning: k.meaning,
      example: k.example,
      exampleRomaji: k.exampleReading,
    }));
    
    return (
      <FlashcardMode
        items={flashcardItems}
        type="kanji"
        sectionColor="hsl(var(--accent))"
        mascotImage={kanjiCrane}
        onComplete={() => {
          toast.success('Flashcard session complete!');
          setViewMode('learn');
        }}
        onExit={() => setViewMode('learn')}
      />
    );
  }

  if (viewMode === 'quiz') {
    return (
      <QuizComponent
        questions={generateQuizQuestions()}
        mascotImage={kanjiCrane}
        mascotName="Raku"
        sectionColor="hsl(var(--accent))"
        sectionType="kanji"
        onComplete={() => setViewMode('learn')}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {selectedKanji && (
        <CharacterDetailModal
          character={{
            char: selectedKanji.char,
            romaji: selectedKanji.meaning,
            meaning: selectedKanji.meaning,
            readings: selectedKanji.readings,
            example: selectedKanji.example,
            exampleReading: selectedKanji.exampleReading,
          }}
          type="kanji"
          sectionColor="hsl(var(--accent))"
          onClose={() => setSelectedKanji(null)}
        />
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img 
            src={kanjiCrane} 
            alt="Kanji Crane"
            className="w-12 h-12 object-contain mascot-idle"
          />
          <div>
            <p className="font-semibold text-accent">Raku the Crane</p>
            <p className="text-xs text-muted-foreground">
              {masteredChars.length}/{kanjiData.length} mastered
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode('flashcards')}
            className="border-accent/40 hover:bg-accent/20"
          >
            <Layers className="h-4 w-4 mr-1" />
            Flashcards
          </Button>
          <Button
            size="sm"
            onClick={() => setViewMode('quiz')}
            className="bg-accent/80 hover:bg-accent text-accent-foreground"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Quiz
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 flex gap-3 border-b border-accent/10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search kanji, meaning, or reading..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 border-accent/20"
          />
        </div>
        <Select value={filterBy} onValueChange={(v: any) => setFilterBy(v)}>
          <SelectTrigger className="w-36 bg-background/50 border-accent/20">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="mastered">Mastered</SelectItem>
            <SelectItem value="unmastered">To Learn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {filteredKanji.map((item, index) => {
            const isMastered = masteredChars.includes(item.char);
            return (
              <Card
                key={index}
                className={`relative bg-card/50 backdrop-blur-sm border-accent/20 hover:border-accent/40 
                           transition-all duration-300 cursor-pointer group overflow-hidden fade-in-smooth
                           ${isMastered ? 'ring-1 ring-green-500/30' : ''}`}
                style={{ animationDelay: `${index * 0.02}s` }}
                onClick={() => setSelectedKanji(item)}
              >
                {isMastered && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-green-400" />
                  </div>
                )}
                <div className="p-4 flex flex-col items-center justify-center space-y-2">
                  <div className="text-5xl font-bold text-accent group-hover:scale-110 transition-transform duration-300">
                    {item.char}
                  </div>
                  <div className="text-xs text-center text-muted-foreground line-clamp-1">{item.meaning}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-accent/20"
                    onClick={(e) => playSound(item.char, e)}
                  >
                    <Volume2 className="h-3 w-3 text-accent" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        
        {filteredKanji.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No kanji found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
