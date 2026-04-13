import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MascotBubble } from '@/components/MascotBubble';
import { CharacterCard } from '@/components/CharacterCard';
import { Button } from '@/components/ui/button';
import { katakanaData } from '@/data/katakana';
import gamerCat from '@/assets/gamer-cat.png';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Katakana() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const charsPerPage = 5;
  const totalPages = Math.ceil(katakanaData.length / charsPerPage);
  const currentPage = Math.floor(currentIndex / charsPerPage);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('katakana-intro-seen');
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleStartLearning = () => {
    localStorage.setItem('katakana-intro-seen', 'true');
    setShowIntro(false);
  };

  const handleNext = () => {
    if (currentIndex < katakanaData.length - charsPerPage) {
      setCurrentIndex(currentIndex + charsPerPage);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - charsPerPage);
    }
  };

  const handleFinish = () => {
    const progress = Math.round(((currentIndex + charsPerPage) / katakanaData.length) * 100);
    localStorage.setItem('katakana-progress', progress.toString());
    navigate('/quiz?section=katakana');
  };

  const isLastPage = currentPage === totalPages - 1;
  const currentChars = katakanaData.slice(currentIndex, currentIndex + charsPerPage);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {showIntro ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <h1 className="text-5xl font-bold text-neon-magenta text-center mb-8">
              Learn Katakana
            </h1>
            
            <MascotBubble 
              mascotImage={gamerCat} 
              mascotName="Neon Cat"
            >
              <p className="mb-4">
                Yo! What's up? I'm Neon Cat, your guide to the cyberpunk world of Katakana! 🎮
              </p>
              <p className="mb-4">
                <strong>What is Katakana?</strong> Katakana (カタカナ) is the second Japanese alphabet. 
                Like Hiragana, it has 46 basic characters, but it looks more angular and sharp!
              </p>
              <p className="mb-4">
                Katakana is mainly used for foreign words, company names, technical terms, 
                and to add emphasis (like ALL CAPS in English). Think "camera" (カメラ), 
                "computer" (コンピューター), or "pizza" (ピザ)!
              </p>
              <p>
                It's super useful in modern Japan since there are tons of English loanwords. 
                Ready to level up? Let's go! ⚡
              </p>
            </MascotBubble>

            <div className="text-center">
              <Button 
                size="lg"
                onClick={handleStartLearning}
                className="bg-neon-magenta text-background hover:bg-neon-magenta/90 text-lg px-8 py-6"
              >
                Let's Game!
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold text-neon-magenta">
                Katakana - Page {currentPage + 1} of {totalPages}
              </h1>
              <div className="text-muted-foreground">
                Characters {currentIndex + 1}-{Math.min(currentIndex + charsPerPage, katakanaData.length)} of {katakanaData.length}
              </div>
            </div>

            <MascotBubble 
              mascotImage={gamerCat} 
              mascotName="Neon Cat"
            >
              <p>
                These characters might look similar to Hiragana, but don't get confused! 
                Focus on the sharper, more angular shapes. The examples are all foreign words - pretty cool, right? 🎯
              </p>
            </MascotBubble>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {currentChars.map((char, idx) => (
                <CharacterCard
                  key={idx}
                  char={char.char}
                  romaji={char.romaji}
                  example={char.example}
                  exampleRomaji={char.exampleRomaji}
                  accentColor="magenta"
                />
              ))}
            </div>

            <div className="flex justify-between items-center pt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {isLastPage ? (
                <Button
                  size="lg"
                  onClick={handleFinish}
                  className="bg-neon-magenta text-background hover:bg-neon-magenta/90"
                >
                  Take Quiz!
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="bg-neon-magenta text-background hover:bg-neon-magenta/90"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
