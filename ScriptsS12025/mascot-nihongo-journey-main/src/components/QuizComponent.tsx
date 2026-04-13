import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProgress } from '@/hooks/useProgress';
import { toast } from 'sonner';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  character?: string;
  type: 'multiple-choice' | 'audio';
}

interface QuizComponentProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  mascotImage: string;
  mascotName: string;
  sectionColor: string;
  sectionType?: 'hiragana' | 'katakana' | 'kanji';
}

export const QuizComponent = ({ 
  questions, 
  onComplete, 
  mascotImage, 
  mascotName,
  sectionColor,
  sectionType = 'hiragana'
}: QuizComponentProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const { completeQuiz, recordCorrectAnswer } = useProgress();

  const handleAnswer = useCallback((answer: string) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    const correct = answer === questions[currentQuestion].correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      if (questions[currentQuestion].character) {
        recordCorrectAnswer(sectionType, questions[currentQuestion].character!);
      }
      if (streak >= 4) {
        toast.success('🔥 Hot streak! +5 bonus XP');
      }
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        const finalScore = Math.round((score + (correct ? 1 : 0)) / questions.length * 100);
        setQuizComplete(true);
        completeQuiz(sectionType, finalScore);
        onComplete(finalScore);
      }
    }, 1200);
  }, [showFeedback, questions, currentQuestion, score, streak, sectionType, completeQuiz, recordCorrectAnswer, onComplete]);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (quizComplete) {
    const finalScore = Math.round((score / questions.length) * 100);
    const getMessage = () => {
      if (finalScore >= 90) return { text: 'Sugoi! Perfect!', emoji: '🌟' };
      if (finalScore >= 70) return { text: 'Yatta! Great Job!', emoji: '🎉' };
      if (finalScore >= 50) return { text: 'Ganbatte! Keep Going!', emoji: '💪' };
      return { text: 'Practice Makes Perfect!', emoji: '🌸' };
    };
    const message = getMessage();

    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 p-6 animate-fade-in">
        <img 
          src={mascotImage} 
          alt={mascotName}
          className={`w-32 h-32 object-contain ${finalScore >= 70 ? 'mascot-happy' : 'mascot-thinking'}`}
        />
        <Card className="bg-card/80 backdrop-blur-sm border-2 p-8 text-center max-w-md w-full" style={{ borderColor: sectionColor }}>
          <div className="text-5xl mb-4">{message.emoji}</div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: sectionColor }}>
            {message.text}
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-4xl font-bold">{finalScore}%</p>
            <p className="text-muted-foreground">
              {score} out of {questions.length} correct
            </p>
            <div className="flex justify-center gap-1 mt-4">
              {Array.from({ length: questions.length }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < score ? 'bg-green-500' : 'bg-red-500/50'}`}
                />
              ))}
            </div>
          </div>
          <Button 
            onClick={() => onComplete(finalScore)}
            className="font-semibold"
            style={{ backgroundColor: sectionColor }}
          >
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Question {currentQuestion + 1} of {questions.length}</span>
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <span className="text-xs text-orange-400 font-medium animate-pulse">
                🔥 x{streak}
              </span>
            )}
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" style={{ backgroundColor: `${sectionColor}20` }} />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <img 
              src={mascotImage} 
              alt={mascotName}
              className={`w-20 h-20 object-contain transition-all duration-300 ${
                showFeedback ? (isCorrect ? 'mascot-happy' : 'mascot-sad') : 'mascot-thinking'
              }`}
            />
            <Card className="flex-1 bg-card/80 backdrop-blur-sm border-2 p-6" style={{ borderColor: sectionColor }}>
              <p className="text-xl font-medium">{questions[currentQuestion].question}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions[currentQuestion].options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={showFeedback}
                variant="outline"
                className={`h-16 text-lg font-medium transition-all duration-300 ${
                  showFeedback && option === questions[currentQuestion].correctAnswer
                    ? 'border-green-500 bg-green-500/20 scale-105'
                    : showFeedback && option === selectedAnswer
                    ? 'border-red-500 bg-red-500/20 shake'
                    : 'hover:scale-105'
                }`}
                style={{ 
                  borderColor: showFeedback && option === questions[currentQuestion].correctAnswer 
                    ? 'rgb(34, 197, 94)' 
                    : showFeedback && option === selectedAnswer
                    ? 'rgb(239, 68, 68)'
                    : sectionColor 
                }}
              >
                {option}
              </Button>
            ))}
          </div>

          {showFeedback && (
            <div className="text-center animate-fade-in">
              <p className="text-lg font-medium" style={{ color: isCorrect ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
                {isCorrect ? '✓ Correct! Sugoi!' : `✗ The answer was: ${questions[currentQuestion].correctAnswer}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
