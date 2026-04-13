import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MascotBubble } from '@/components/MascotBubble';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { hankoData } from '@/data/hanko';
import foxSensei from '@/assets/fox-sensei.png';
import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';

export default function Hanko() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const stampsPerPage = 4;
  const totalPages = Math.ceil(hankoData.length / stampsPerPage);
  const currentPage = Math.floor(currentIndex / stampsPerPage);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hanko-intro-seen');
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleStartLearning = () => {
    localStorage.setItem('hanko-intro-seen', 'true');
    setShowIntro(false);
  };

  const handleNext = () => {
    if (currentIndex < hankoData.length - stampsPerPage) {
      setCurrentIndex(currentIndex + stampsPerPage);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - stampsPerPage);
    }
  };

  const handleFinish = () => {
    const progress = Math.round(((currentIndex + stampsPerPage) / hankoData.length) * 100);
    localStorage.setItem('hanko-progress', progress.toString());
    
    // Unlock Katakana
    const tutorialCompleted = localStorage.getItem('tutorial-completed');
    if (!tutorialCompleted) {
      localStorage.setItem('tutorial-completed', 'true');
    }
    
    navigate('/quiz?section=hanko');
  };

  const playSound = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  };

  const isLastPage = currentPage === totalPages - 1;
  const currentStamps = hankoData.slice(currentIndex, currentIndex + stampsPerPage);

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mb-6 sm:mb-8 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {showIntro ? (
          <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-hanko-red text-center mb-6 sm:mb-8 font-japanese">
              Learn About Hanko
            </h1>
            
            <MascotBubble 
              mascotImage={foxSensei} 
              mascotName="Sensei Kitsu"
            >
              <p className="mb-4">
                Welcome, young traveler! I am Sensei Kitsu 🦊, and I'll teach you about one of Japan's most important cultural traditions: <strong>Hanko</strong> (判子).
              </p>
              <p className="mb-4">
                <strong>What is Hanko?</strong> A Hanko is a traditional Japanese stamp or seal used instead of a signature! 
                In Japan, people use these carved stamps on official documents, contracts, bank forms, and even delivery receipts.
              </p>
              <p className="mb-4">
                Each Hanko has Kanji characters carved into it - usually a person's name or an official title. 
                The stamp leaves a red ink impression that serves as your official "signature" in Japanese society.
              </p>
              <p className="mb-4">
                Understanding Hanko will teach you important Kanji characters while learning about Japanese culture! 
                You'll see stamps for names, approval words, and official titles. 🎌
              </p>
              <p>
                Let's explore these beautiful red seals together! Each one tells a story. Ready to begin?
              </p>
            </MascotBubble>

            <div className="text-center">
              <Button 
                size="lg"
                onClick={handleStartLearning}
                className="bg-hanko-red text-white hover:bg-hanko-red/90 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 touch-manipulation"
              >
                Start Learning!
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-hanko-red font-japanese">
                Hanko - Page {currentPage + 1} of {totalPages}
              </h1>
              <div className="text-sm text-muted-foreground">
                Stamps {currentIndex + 1}-{Math.min(currentIndex + stampsPerPage, hankoData.length)} of {hankoData.length}
              </div>
            </div>

            <MascotBubble 
              mascotImage={foxSensei} 
              mascotName="Sensei Kitsu"
            >
              <p>
                Study each Hanko seal carefully! Learn the Kanji, meaning, and how it's used in Japanese society. 
                These stamps are essential in daily Japanese life! 🏮
              </p>
            </MascotBubble>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {currentStamps.map((stamp, idx) => (
                <Card 
                  key={idx} 
                  className="bg-card/80 backdrop-blur-sm border-2 border-hanko-red shadow-[0_0_20px_rgba(220,38,38,0.3)] p-4 sm:p-6 hover:scale-105 transition-all duration-300"
                >
                  <div className="text-center space-y-3 sm:space-y-4">
                    {/* Hanko Stamp Style */}
                    <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-hanko-red rounded-lg flex items-center justify-center shadow-lg transform rotate-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-hanko-red to-red-800 rounded-lg opacity-80"></div>
                      <span className="relative text-3xl sm:text-4xl font-bold text-white font-japanese writing-mode-vertical">
                        {stamp.kanji}
                      </span>
                    </div>
                    
                    <div className="text-lg sm:text-xl font-bold text-foreground">
                      {stamp.meaning}
                    </div>
                    
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                      <p className="font-semibold text-xs uppercase tracking-wide mb-1">Pronunciation:</p>
                      <p className="font-japanese">{stamp.pronunciation}</p>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => playSound(stamp.pronunciation)}
                      className="w-full touch-manipulation"
                    >
                      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="text-xs sm:text-sm">Play Sound</span>
                    </Button>

                    <div className="pt-3 border-t border-border space-y-2 text-left">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Description:</p>
                        <p className="text-xs sm:text-sm">{stamp.description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Usage:</p>
                        <p className="text-xs sm:text-sm">{stamp.usage}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 sm:pt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>

              {isLastPage ? (
                <Button
                  size="lg"
                  onClick={handleFinish}
                  className="bg-hanko-red text-white hover:bg-hanko-red/90 touch-manipulation"
                >
                  Take Quiz!
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="bg-hanko-red text-white hover:bg-hanko-red/90 touch-manipulation"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
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
