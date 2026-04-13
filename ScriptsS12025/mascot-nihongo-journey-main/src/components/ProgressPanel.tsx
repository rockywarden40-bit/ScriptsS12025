import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Star, Trophy, Zap, Target, Award } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

const badgeInfo: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  'perfect-score': { icon: <Star className="h-3 w-3" />, label: 'Perfect Score', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  'week-streak': { icon: <Flame className="h-3 w-3" />, label: '7 Day Streak', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  'hiragana-master': { icon: <Trophy className="h-3 w-3" />, label: 'Hiragana Master', color: 'bg-primary/20 text-primary border-primary/30' },
  'katakana-master': { icon: <Trophy className="h-3 w-3" />, label: 'Katakana Master', color: 'bg-secondary/20 text-secondary border-secondary/30' },
  'kanji-master': { icon: <Trophy className="h-3 w-3" />, label: 'Kanji Master', color: 'bg-accent/20 text-accent border-accent/30' },
  'first-quiz': { icon: <Target className="h-3 w-3" />, label: 'First Quiz', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

export const ProgressPanel = ({ compact = false }: { compact?: boolean }) => {
  const { progress, getLevelProgress, getXPForNextLevel } = useProgress();

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/30">
        <div className="flex items-center gap-1.5 text-accent">
          <Zap className="h-4 w-4" />
          <span className="font-bold text-sm">{progress.level}</span>
        </div>
        <div className="w-16">
          <Progress value={getLevelProgress()} className="h-1.5" />
        </div>
        {progress.streak > 0 && (
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="h-4 w-4" />
            <span className="text-xs font-medium">{progress.streak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-xl font-bold">{progress.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{progress.xp} XP</p>
          <p className="text-xs text-muted-foreground">{getXPForNextLevel()} to next</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Level {progress.level}</span>
          <span>Level {progress.level + 1}</span>
        </div>
        <Progress value={getLevelProgress()} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
            <Flame className="h-4 w-4" />
            <span className="font-bold">{progress.streak}</span>
          </div>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <Target className="h-4 w-4" />
            <span className="font-bold">
              {progress.completedQuizzes.hiragana + progress.completedQuizzes.katakana + progress.completedQuizzes.kanji}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Quizzes Done</p>
        </div>
      </div>

      {progress.badges.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-1">
            <Award className="h-4 w-4" /> Badges
          </p>
          <div className="flex flex-wrap gap-2">
            {progress.badges.map(badge => {
              const info = badgeInfo[badge];
              if (!info) return null;
              return (
                <Badge key={badge} variant="outline" className={`${info.color} text-xs`}>
                  {info.icon}
                  <span className="ml-1">{info.label}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Characters Mastered</p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
            <p className="font-bold text-primary">{progress.masteredCharacters.hiragana.length}</p>
            <p className="text-muted-foreground">Hiragana</p>
          </div>
          <div className="bg-secondary/10 rounded-lg p-2 border border-secondary/20">
            <p className="font-bold text-secondary">{progress.masteredCharacters.katakana.length}</p>
            <p className="text-muted-foreground">Katakana</p>
          </div>
          <div className="bg-accent/10 rounded-lg p-2 border border-accent/20">
            <p className="font-bold text-accent">{progress.masteredCharacters.kanji.length}</p>
            <p className="text-muted-foreground">Kanji</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
