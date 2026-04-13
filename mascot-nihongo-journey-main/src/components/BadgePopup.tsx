import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BadgePopupProps {
  badge: string;
  onClose: () => void;
}

export const BadgePopup = ({ badge, onClose }: BadgePopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const badgeInfo: Record<string, { emoji: string; title: string; description: string }> = {
    'hanko-hero': {
      emoji: '🎴',
      title: 'Hanko Hero',
      description: 'Mastered the art of Japanese seals!'
    },
    'hiragana-guardian': {
      emoji: '🌸',
      title: 'Hiragana Guardian',
      description: 'Conquered all Hiragana characters!'
    },
    'katakana-knight': {
      emoji: '⚡',
      title: 'Katakana Knight',
      description: 'Dominated Katakana like a pro!'
    },
    'kanji-challenger': {
      emoji: '🗡️',
      title: 'Kanji Challenger',
      description: 'Faced the mighty Kanji and prevailed!'
    },
    'perfect-quiz': {
      emoji: '🏆',
      title: 'Perfect Quiz Master',
      description: 'Achieved 100% on a quiz!'
    },
  };

  const info = badgeInfo[badge] || badgeInfo['perfect-quiz'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className={`bg-card/95 border-2 border-soft-gold shadow-[0_0_40px_rgba(255,215,0,0.5)] p-8 max-w-md w-full relative ${isVisible ? 'animate-scale-in' : ''}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2"
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="text-center space-y-4">
          <div className="text-8xl mb-4 animate-pulse-glow">
            {info.emoji}
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-soft-gold" />
            <h2 className="text-2xl font-bold text-soft-gold font-japanese">
              Badge Unlocked!
            </h2>
            <Trophy className="w-6 h-6 text-soft-gold" />
          </div>
          <h3 className="text-3xl font-bold text-foreground">
            {info.title}
          </h3>
          <p className="text-lg text-muted-foreground">
            {info.description}
          </p>
          <Button
            onClick={onClose}
            className="mt-6 bg-soft-gold text-background hover:bg-soft-gold/90"
            size="lg"
          >
            Awesome!
          </Button>
        </div>
      </Card>
    </div>
  );
};
