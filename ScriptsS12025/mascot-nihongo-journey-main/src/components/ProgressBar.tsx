import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';

interface ProgressBarProps {
  hankoProgress: number;
  hiraganaProgress: number;
  katakanaProgress: number;
  kanjiProgress: number;
}

export const ProgressBar = ({ hankoProgress, hiraganaProgress, katakanaProgress, kanjiProgress }: ProgressBarProps) => {
  const totalProgress = Math.round((hankoProgress + hiraganaProgress + katakanaProgress + kanjiProgress) / 4);
  const level = Math.floor(totalProgress / 4) + 1;
  const xp = totalProgress;

  return (
    <div className="bg-card/60 backdrop-blur-sm border-2 border-primary/30 rounded-xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg sm:text-xl font-bold text-foreground font-japanese flex items-center gap-2">
          <Star className="w-5 h-5 text-soft-gold fill-soft-gold" />
          Your Journey Level: {level}
        </h3>
        <span className="text-sm text-muted-foreground font-semibold">{xp} XP</span>
      </div>
      <Progress value={totalProgress} className="h-3 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
        <div>
          <p className="text-hanko-red font-semibold mb-1">Hanko</p>
          <p className="text-muted-foreground">{hankoProgress}%</p>
        </div>
        <div>
          <p className="text-sakura-pink font-semibold mb-1">Hiragana</p>
          <p className="text-muted-foreground">{hiraganaProgress}%</p>
        </div>
        <div>
          <p className="text-neon-magenta font-semibold mb-1">Katakana</p>
          <p className="text-muted-foreground">{katakanaProgress}%</p>
        </div>
        <div>
          <p className="text-neon-purple font-semibold mb-1">Kanji</p>
          <p className="text-muted-foreground">{kanjiProgress}%</p>
        </div>
      </div>
    </div>
  );
};
