import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import foxSensei from '@/assets/fox-sensei.png';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  const handleStartJourney = () => {
    localStorage.setItem('tutorial-started', 'true');
    navigate('/');
  };

  const handleSkipTutorial = () => {
    localStorage.setItem('tutorial-completed', 'true');
    localStorage.setItem('hiragana-unlocked', 'true');
    localStorage.setItem('katakana-unlocked', 'true');
    localStorage.setItem('kanji-unlocked', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold glow-text bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-scale-in">
            Konichiwa Helper
          </h1>
          <p className="text-xl text-muted-foreground mt-4">
            Your Journey to Japanese Mastery Begins Here
          </p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <img 
              src={foxSensei} 
              alt="Fox Sensei"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain mascot-idle mx-auto sm:mx-0"
            />
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div>
                <p className="text-base sm:text-lg font-semibold text-primary mb-2 font-japanese">Fox Sensei</p>
                <p className="text-base sm:text-lg text-foreground leading-relaxed mb-2 sm:mb-3">
                  Welcome, new traveler! I'm your guide on this incredible journey through Japanese! 🐱✨
                </p>
                <p className="text-sm sm:text-base text-foreground leading-relaxed mb-2 sm:mb-3">
                  You'll learn <strong>Hiragana</strong> (basic characters), <strong>Katakana</strong> (foreign words), and <strong>Kanji</strong> (complex characters). 
                  Plus, use our translator to practice!
                </p>
                <p className="text-sm sm:text-base text-foreground leading-relaxed">
                  Start with <strong className="text-primary">Hiragana</strong> first, and explore at your own pace! 🎌
                </p>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4">
                <ArrowRight className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                <p className="text-lg sm:text-xl font-bold text-primary">
                  Click here to start learning!
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleStartJourney}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 
                       text-primary-foreground font-semibold text-base sm:text-lg px-6 sm:px-8 
                       py-4 sm:py-6 shadow-lg touch-manipulation w-full sm:w-auto"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Start Learning!
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleSkipTutorial}
            className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 touch-manipulation w-full sm:w-auto 
                       border-primary/30 hover:bg-primary/10"
          >
            Skip to All Sections
          </Button>
        </div>
      </div>
    </div>
  );
}
