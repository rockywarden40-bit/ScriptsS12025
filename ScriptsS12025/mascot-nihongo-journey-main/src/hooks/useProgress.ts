import { useState, useEffect, useCallback } from 'react';

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastPractice: string | null;
  completedQuizzes: {
    hiragana: number;
    katakana: number;
    kanji: number;
  };
  masteredCharacters: {
    hiragana: string[];
    katakana: string[];
    kanji: string[];
  };
  badges: string[];
  totalTimeSpent: number;
  settings: {
    soundEnabled: boolean;
    animationsEnabled: boolean;
  };
}

const defaultProgress: UserProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  lastPractice: null,
  completedQuizzes: {
    hiragana: 0,
    katakana: 0,
    kanji: 0,
  },
  masteredCharacters: {
    hiragana: [],
    katakana: [],
    kanji: [],
  },
  badges: [],
  totalTimeSpent: 0,
  settings: {
    soundEnabled: true,
    animationsEnabled: true,
  },
};

const XP_PER_LEVEL = 100;
const XP_PER_CORRECT = 10;
const XP_PER_QUIZ = 25;
const STREAK_BONUS = 5;

export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress>(defaultProgress);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('konichiwa-progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgress({ ...defaultProgress, ...parsed });
      } catch (e) {
        console.error('Failed to load progress:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('konichiwa-progress', JSON.stringify(progress));
    }
  }, [progress, isLoaded]);

  const addXP = useCallback((amount: number) => {
    setProgress(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      const leveledUp = newLevel > prev.level;
      
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
      };
    });
  }, []);

  const recordCorrectAnswer = useCallback((section: 'hiragana' | 'katakana' | 'kanji', character: string) => {
    addXP(XP_PER_CORRECT);
    setProgress(prev => {
      const mastered = prev.masteredCharacters[section];
      if (!mastered.includes(character)) {
        return {
          ...prev,
          masteredCharacters: {
            ...prev.masteredCharacters,
            [section]: [...mastered, character],
          },
        };
      }
      return prev;
    });
  }, [addXP]);

  const completeQuiz = useCallback((section: 'hiragana' | 'katakana' | 'kanji', score: number) => {
    const today = new Date().toDateString();
    
    setProgress(prev => {
      const isNewStreak = prev.lastPractice !== today;
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
      const wasYesterday = prev.lastPractice === yesterdayStr;
      
      let newStreak = prev.streak;
      if (isNewStreak) {
        newStreak = wasYesterday || prev.streak === 0 ? prev.streak + 1 : 1;
      }

      const streakBonus = isNewStreak ? STREAK_BONUS * newStreak : 0;
      const xpGained = XP_PER_QUIZ + Math.floor(score * XP_PER_CORRECT / 100) + streakBonus;

      const newBadges = [...prev.badges];
      
      // Check for badge unlocks
      if (score >= 100 && !newBadges.includes('perfect-score')) {
        newBadges.push('perfect-score');
      }
      if (newStreak >= 7 && !newBadges.includes('week-streak')) {
        newBadges.push('week-streak');
      }
      if (prev.completedQuizzes[section] + 1 >= 5 && !newBadges.includes(`${section}-master`)) {
        newBadges.push(`${section}-master`);
      }

      return {
        ...prev,
        xp: prev.xp + xpGained,
        level: Math.floor((prev.xp + xpGained) / XP_PER_LEVEL) + 1,
        streak: newStreak,
        lastPractice: today,
        completedQuizzes: {
          ...prev.completedQuizzes,
          [section]: prev.completedQuizzes[section] + 1,
        },
        badges: newBadges,
      };
    });
  }, []);

  const unlockBadge = useCallback((badge: string) => {
    setProgress(prev => {
      if (!prev.badges.includes(badge)) {
        return { ...prev, badges: [...prev.badges, badge] };
      }
      return prev;
    });
  }, []);

  const updateSettings = useCallback((settings: Partial<UserProgress['settings']>) => {
    setProgress(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
    localStorage.removeItem('konichiwa-progress');
  }, []);

  const getXPForNextLevel = useCallback(() => {
    return XP_PER_LEVEL - (progress.xp % XP_PER_LEVEL);
  }, [progress.xp]);

  const getLevelProgress = useCallback(() => {
    return (progress.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
  }, [progress.xp]);

  return {
    progress,
    isLoaded,
    addXP,
    recordCorrectAnswer,
    completeQuiz,
    unlockBadge,
    updateSettings,
    resetProgress,
    getXPForNextLevel,
    getLevelProgress,
  };
};
