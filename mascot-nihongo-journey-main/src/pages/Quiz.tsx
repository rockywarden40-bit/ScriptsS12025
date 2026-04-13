import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MascotBubble } from '@/components/MascotBubble';
import { hankoData } from '@/data/hanko';
import { hiraganaData } from '@/data/hiragana';
import { katakanaData } from '@/data/katakana';
import { kanjiData } from '@/data/kanji';
import { ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import foxSensei from '@/assets/fox-sensei.png';
import gamerCat from '@/assets/gamer-cat.png';
import samuraiRaccoon from '@/assets/samurai-raccoon.png';

interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options?: string[];
  type: 'multiple' | 'typing';
  char: string;
}

export default function Quiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'hanko';
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [mascotTalking, setMascotTalking] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, [section]);

  const generateQuestions = () => {
    let data;
    if (section === 'hanko') {
      data = hankoData;
    } else if (section === 'hiragana') {
      data = hiraganaData;
    } else if (section === 'katakana') {
      data = katakanaData;
    } else {
      data = kanjiData;
    }

    // Shuffle and take 15 random items
    const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 15);
    
    const quizQuestions: QuizQuestion[] = shuffled.map((item, idx) => {
      const isTyping = idx % 3 === 0; // Every 3rd question is typing
      
      if (section === 'hanko' && 'kanji' in item) {
        // Hanko questions
        if (isTyping) {
          return {
            question: `Type the meaning of this Hanko stamp:`,
            correctAnswer: item.meaning.toLowerCase(),
            type: 'typing',
            char: item.kanji,
          };
        } else {
          const wrongOptions = hankoData
            .filter(h => h.kanji !== item.kanji)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(h => h.meaning);
          
          return {
            question: `What does this Hanko stamp mean?`,
            correctAnswer: item.meaning,
            options: [...wrongOptions, item.meaning].sort(() => Math.random() - 0.5),
            type: 'multiple',
            char: item.kanji,
          };
        }
      } else if (section === 'kanji' && 'meaning' in item) {
        // Kanji questions
        if (isTyping) {
          return {
            question: `What does this Kanji mean? ${item.char}`,
            correctAnswer: item.meaning.toLowerCase(),
            type: 'typing',
            char: item.char,
          };
        } else {
          const wrongOptions = kanjiData
            .filter(k => k.char !== item.char)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(k => k.meaning);
          
          return {
            question: `What does this Kanji mean? ${item.char}`,
            correctAnswer: item.meaning,
            options: [...wrongOptions, item.meaning].sort(() => Math.random() - 0.5),
            type: 'multiple',
            char: item.char,
          };
        }
      } else {
        // Hiragana/Katakana questions
        if (isTyping) {
          return {
            question: `Type the romaji for: ${item.char}`,
            correctAnswer: item.romaji.toLowerCase(),
            type: 'typing',
            char: item.char,
          };
        } else {
          const wrongOptions = data
            .filter(c => c.char !== item.char)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(c => c.romaji);
          
          return {
            question: `What is the romaji for: ${item.char}`,
            correctAnswer: item.romaji,
            options: [...wrongOptions, item.romaji].sort(() => Math.random() - 0.5),
            type: 'multiple',
            char: item.char,
          };
        }
      }
    });

    setQuestions(quizQuestions);
  };

  const handleSubmit = () => {
    if (answered) return;

    const currentQ = questions[currentQuestion];
    const answer = currentQ.type === 'typing' ? userAnswer.toLowerCase().trim() : selectedOption;
    const correct = answer === currentQ.correctAnswer.toLowerCase();

    setIsCorrect(correct);
    setMascotTalking(true);

    if (correct) {
      setScore(score + 1);
      toast.success('Correct! 🎉');
    } else {
      toast.error(`Wrong! The answer was: ${currentQ.correctAnswer}`);
      setWrongAnswers([...wrongAnswers, currentQ.char]);
    }

    setAnswered(true);

    setTimeout(() => {
      setMascotTalking(false);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setUserAnswer('');
        setSelectedOption('');
        setAnswered(false);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const getMascotImage = () => {
    if (section === 'hanko') return foxSensei;
    if (section === 'hiragana') return foxSensei; // Using Fox Sensei for Hira-chan
    if (section === 'katakana') return gamerCat;
    return samuraiRaccoon;
  };

  const getMascotName = () => {
    if (section === 'hanko') return 'Sensei Kitsu';
    if (section === 'hiragana') return 'Hira-chan';
    if (section === 'katakana') return 'NekoTron';
    return 'Raku';
  };

  const getMascotReaction = () => {
    if (isCorrect) {
      const happyMessages = [
        "Excellent work! 🎉",
        "Perfect! You're doing great! ⭐",
        "Amazing! Keep it up! 🌟",
        "Wonderful! You got it! 💫",
      ];
      return happyMessages[Math.floor(Math.random() * happyMessages.length)];
    } else {
      const encouragingMessages = [
        "Don't worry! Keep practicing! 💪",
        "Almost there! Try again! 🌸",
        "That's okay! Learning takes time! 📚",
        "Good effort! You'll get it next time! ✨",
      ];
      return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
    }
  };

  const accuracy = Math.round((score / questions.length) * 100);

  const getSectionColor = () => {
    if (section === 'hanko') return 'text-hanko-red';
    if (section === 'hiragana') return 'text-sakura-pink';
    if (section === 'katakana') return 'text-neon-magenta';
    return 'text-neon-purple';
  };

  const getSectionBg = () => {
    if (section === 'hanko') return 'bg-hanko-red';
    if (section === 'hiragana') return 'bg-sakura-pink';
    if (section === 'katakana') return 'bg-neon-magenta';
    return 'bg-neon-purple';
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading quiz...</p>
      </div>
    );
  }

  if (showResult) {
    const encouragementMessage = accuracy >= 80 
      ? "Outstanding! You're a true student! 🌟" 
      : accuracy >= 60 
      ? "Great effort! Keep practicing! 💪"
      : "Good start! More practice will help! 📚";

    return (
      <div className="min-h-screen bg-background py-8 sm:py-12 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 sm:mb-8 font-japanese">
              Quiz Complete! 🎉
            </h1>
            
            <div className="mb-6 sm:mb-8">
              <MascotBubble 
                mascotImage={getMascotImage()} 
                mascotName={getMascotName()}
              >
                <p className="text-base sm:text-lg">{encouragementMessage}</p>
              </MascotBubble>
            </div>
            
            <div className="text-center space-y-4 sm:space-y-6">
              <div>
                <p className="text-lg sm:text-xl text-muted-foreground mb-2">Your Score</p>
                <p className={`text-5xl sm:text-6xl font-bold ${getSectionColor()}`}>
                  {score}/{questions.length}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2">
                  {accuracy}% Accuracy
                </p>
              </div>

              {wrongAnswers.length > 0 && (
                <div className="pt-4 sm:pt-6 border-t border-border">
                  <p className="text-lg sm:text-xl text-muted-foreground mb-3 sm:mb-4">
                    Characters to review:
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                    {wrongAnswers.map((char, idx) => (
                      <span key={idx} className="text-2xl sm:text-3xl font-bold text-destructive">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto touch-manipulation"
                >
                  Back to Home
                </Button>
                <Button
                  size="lg"
                  onClick={() => {
                    setCurrentQuestion(0);
                    setScore(0);
                    setShowResult(false);
                    setWrongAnswers([]);
                    generateQuestions();
                  }}
                  className={`${getSectionBg()} text-white hover:opacity-90 w-full sm:w-auto touch-manipulation`}
                >
                  Retake Quiz
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 relative z-10">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mb-6 sm:mb-8 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h2 className={`text-xl sm:text-2xl font-bold ${getSectionColor()} capitalize font-japanese`}>
              {section} Quiz
            </h2>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} / {questions.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getSectionBg()} transition-all duration-300`}
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {mascotTalking && answered && (
          <div className="mb-6">
            <MascotBubble 
              mascotImage={getMascotImage()} 
              mascotName={getMascotName()}
              isTalking={true}
            >
              <p className="text-base sm:text-lg">{getMascotReaction()}</p>
            </MascotBubble>
          </div>
        )}

        {!mascotTalking && (
          <div className="mb-6 flex justify-center">
            <img 
              src={getMascotImage()} 
              alt={getMascotName()}
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain animate-gentle-bounce"
            />
          </div>
        )}

        <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary p-6 sm:p-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <p className="text-base sm:text-xl text-muted-foreground mb-3 sm:mb-4">
                {currentQ.question}
              </p>
              {section === 'hanko' ? (
                <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-hanko-red rounded-lg flex items-center justify-center shadow-lg transform rotate-2 mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-hanko-red to-red-800 rounded-lg opacity-80"></div>
                  <span className="relative text-2xl sm:text-3xl font-bold text-white font-japanese">
                    {currentQ.char}
                  </span>
                </div>
              ) : (
                <p className={`text-5xl sm:text-7xl font-bold ${getSectionColor()} mb-6 sm:mb-8`}>
                  {currentQ.char}
                </p>
              )}
            </div>

            {currentQ.type === 'multiple' && currentQ.options ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {currentQ.options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant={selectedOption === option ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => setSelectedOption(option)}
                    disabled={answered}
                    className="text-base sm:text-lg py-4 sm:py-6 touch-manipulation"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <div>
                <Input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && userAnswer.trim()) {
                      handleSubmit();
                    }
                  }}
                  placeholder="Type your answer..."
                  disabled={answered}
                  className="text-base sm:text-lg py-4 sm:py-6 text-center"
                />
              </div>
            )}

            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={
                answered || 
                (currentQ.type === 'typing' && !userAnswer.trim()) ||
                (currentQ.type === 'multiple' && !selectedOption)
              }
              className={`w-full ${getSectionBg()} text-white hover:opacity-90 touch-manipulation`}
            >
              {answered ? (
                <>
                  {userAnswer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase() || 
                   selectedOption === currentQ.correctAnswer ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  ) : (
                    <X className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  )}
                  Next Question
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
