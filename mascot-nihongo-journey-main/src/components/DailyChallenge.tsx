import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Gift, Check, Clock } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { hiraganaData } from '@/data/hiragana';
import { katakanaData } from '@/data/katakana';
import { kanjiData } from '@/data/kanji';

interface DailyChallengeProps {
  onStartChallenge: (type: 'hiragana' | 'katakana' | 'kanji') => void;
}

export const DailyChallenge = ({ onStartChallenge }: DailyChallengeProps) => {
  const { progress, addXP, unlockBadge } = useProgress();
  const [dailyChallenge, setDailyChallenge] = useState<{
    type: 'hiragana' | 'katakana' | 'kanji';
    completed: boolean;
    target: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const today = new Date().toDateString();
    const savedChallenge = localStorage.getItem('daily-challenge');
    
    if (savedChallenge) {
      const parsed = JSON.parse(savedChallenge);
      if (parsed.date === today) {
        setDailyChallenge(parsed);
      } else {
        generateNewChallenge(today);
      }
    } else {
      generateNewChallenge(today);
    }
  }, []);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);

  const generateNewChallenge = (today: string) => {
    const types: Array<'hiragana' | 'katakana' | 'kanji'> = ['hiragana', 'katakana', 'kanji'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const challenge = {
      date: today,
      type: randomType,
      completed: false,
      target: randomType === 'kanji' ? 5 : 10,
    };
    
    localStorage.setItem('daily-challenge', JSON.stringify(challenge));
    setDailyChallenge(challenge);
  };

  const handleCompleteChallenge = () => {
    if (!dailyChallenge) return;
    
    const updated = { ...dailyChallenge, completed: true };
    localStorage.setItem('daily-challenge', JSON.stringify({ ...updated, date: new Date().toDateString() }));
    setDailyChallenge(updated);
    
    addXP(50);
    unlockBadge('daily-challenger');
  };

  if (!dailyChallenge) return null;

  const typeColors = {
    hiragana: 'from-primary/20 to-primary/5 border-primary/30',
    katakana: 'from-secondary/20 to-secondary/5 border-secondary/30',
    kanji: 'from-accent/20 to-accent/5 border-accent/30',
  };

  const typeLabels = {
    hiragana: 'Hiragana',
    katakana: 'Katakana',
    kanji: 'Kanji',
  };

  return (
    <Card className={`bg-gradient-to-br ${typeColors[dailyChallenge.type]} border p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Daily Challenge</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {timeLeft}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Practice <span className="font-bold">{dailyChallenge.target}</span> {typeLabels[dailyChallenge.type]} characters
          </p>
          <div className="flex items-center gap-1 text-accent">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-bold">+50 XP</span>
          </div>
        </div>

        {dailyChallenge.completed ? (
          <div className="flex items-center justify-center gap-2 py-2 bg-green-500/20 rounded-lg text-green-400">
            <Check className="h-5 w-5" />
            <span className="font-medium">Completed!</span>
          </div>
        ) : (
          <Button
            onClick={() => onStartChallenge(dailyChallenge.type)}
            className="w-full"
            variant="outline"
          >
            Start Challenge
          </Button>
        )}
      </div>
    </Card>
  );
};
