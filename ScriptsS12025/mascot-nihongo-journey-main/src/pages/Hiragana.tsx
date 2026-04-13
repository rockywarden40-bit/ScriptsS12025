import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MascotBubble } from '@/components/MascotBubble';
import { CharacterCard } from '@/components/CharacterCard';
import { Button } from '@/components/ui/button';
import { hiraganaData } from '@/data/hiragana';
import foxSensei from '@/assets/fox-sensei.png';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Hiragana() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const charsPerPage = 5;
  const totalPages = Math.ceil(hiraganaData.length / charsPerPage);
  const currentPage = Math.floor(currentIndex / charsPerPage);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hiragana-intro-seen');
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleStartLearning = () => {
    localStorage.setItem('hiragana-intro-seen', 'true');
    setShowIntro(false);
  };

  const handleNext = () => {
    if (currentIndex < hiraganaData.length - charsPerPage) {
      setCurrentIndex(currentIndex + charsPerPage);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - charsPerPage);
    }
  };

  const handleFinish = () => {
    const progress = Math.round(((currentIndex + charsPerPage) / hiraganaData.length) * 100);
    localStorage.setItem('hiragana-progress', progress.toString());
    navigate('/quiz?section=hiragana');
  };

  const isLastPage = currentPage === totalPages - 1;
  const currentChars = hiraganaData.slice(currentIndex, currentIndex + charsPerPage);

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
            <h1 className="text-5xl font-bold text-neon-cyan text-center mb-8">
              Learn Hiragana
            </h1>
            
            <MascotBubble 
              mascotImage={foxSensei} 
              mascotName="Fox Sensei"
            >
              <p className="mb-4">
                Welcome, young student! I am Fox Sensei, and I will guide you through the beautiful world of Hiragana.
              </p>
              <p className="mb-4">
                <strong>What is Hiragana?</strong> Hiragana (ひらがな) is one of the three Japanese writing systems. 
                It consists of 46 basic characters, each representing a syllable sound.
              </p>
              <p className="mb-4">
                Hiragana is used for native Japanese words, grammar particles, and verb endings. 
                It's the first alphabet that Japanese children learn, and it's the perfect starting point for you too!
              </p>
              <p>
                We'll learn each character step by step. Take your time, practice the pronunciation, 
                and don't worry about making mistakes. That's how we learn! 🦊
              </p>
            </MascotBubble>

            <div className="text-center">
              <Button 
                size="lg"
                onClick={handleStartLearning}
                className="bg-neon-cyan text-background hover:bg-neon-cyan/90 text-lg px-8 py-6"
              >
                Start Learning!
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold text-neon-cyan">
                Hiragana - Page {currentPage + 1} of {totalPages}
              </h1>
              <div className="text-muted-foreground">
                Characters {currentIndex + 1}-{Math.min(currentIndex + charsPerPage, hiraganaData.length)} of {hiraganaData.length}
              </div>
            </div>

            <MascotBubble 
              mascotImage={foxSensei} 
              mascotName="Fox Sensei"
            >
              <p>
                Let's learn these characters together! Click the play button to hear each sound. 
                Practice writing them and try to remember the example words. 📝
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
                  accentColor="cyan"
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
                  className="bg-neon-cyan text-background hover:bg-neon-cyan/90"
                >
                  Take Quiz!
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="bg-neon-cyan text-background hover:bg-neon-cyan/90"
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
