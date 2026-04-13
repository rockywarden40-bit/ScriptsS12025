import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MascotBubble } from '@/components/MascotBubble';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { kanjiData } from '@/data/kanji';
import samuraiRaccoon from '@/assets/samurai-raccoon.png';
import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';

export default function Kanji() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const charsPerPage = 4;
  const totalPages = Math.ceil(kanjiData.length / charsPerPage);
  const currentPage = Math.floor(currentIndex / charsPerPage);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('kanji-intro-seen');
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleStartLearning = () => {
    localStorage.setItem('kanji-intro-seen', 'true');
    setShowIntro(false);
  };

  const handleNext = () => {
    if (currentIndex < kanjiData.length - charsPerPage) {
      setCurrentIndex(currentIndex + charsPerPage);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - charsPerPage);
    }
  };

  const handleFinish = () => {
    const progress = Math.round(((currentIndex + charsPerPage) / kanjiData.length) * 100);
    localStorage.setItem('kanji-progress', progress.toString());
    navigate('/quiz?section=kanji');
  };

  const playSound = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  };

  const isLastPage = currentPage === totalPages - 1;
  const currentChars = kanjiData.slice(currentIndex, currentIndex + charsPerPage);

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
            <h1 className="text-5xl font-bold text-neon-purple text-center mb-8">
              Learn Basic Kanji
            </h1>
            
            <MascotBubble 
              mascotImage={samuraiRaccoon} 
              mascotName="Samurai Raccoon"
            >
              <p className="mb-4">
                Greetings, warrior of knowledge! I am Samurai Raccoon, and I will teach you the way of Kanji. ⚔️
              </p>
              <p className="mb-4">
                <strong>What is Kanji?</strong> Kanji (漢字) are Chinese characters adopted into Japanese writing. 
                Unlike Hiragana and Katakana which represent sounds, Kanji represents meanings and ideas!
              </p>
              <p className="mb-4">
                Each Kanji has at least two readings: <strong>On-yomi</strong> (Chinese reading, usually in Katakana) 
                and <strong>Kun-yomi</strong> (Japanese reading, usually in Hiragana). Don't worry, we'll start with 
                the most basic and essential Kanji!
              </p>
              <p>
                Kanji may seem difficult, but with discipline and practice, you will master them. 
                Remember: even a journey of a thousand miles begins with a single step! 🎌
              </p>
            </MascotBubble>

            <div className="text-center">
              <Button 
                size="lg"
                onClick={handleStartLearning}
                className="bg-neon-purple text-background hover:bg-neon-purple/90 text-lg px-8 py-6"
              >
                Begin Training!
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold text-neon-purple">
                Kanji - Page {currentPage + 1} of {totalPages}
              </h1>
              <div className="text-muted-foreground">
                Characters {currentIndex + 1}-{Math.min(currentIndex + charsPerPage, kanjiData.length)} of {kanjiData.length}
              </div>
            </div>

            <MascotBubble 
              mascotImage={samuraiRaccoon} 
              mascotName="Samurai Raccoon"
            >
              <p>
                Study each Kanji carefully. Learn both the On-reading and Kun-reading. 
                The example will show you how it's used in a real word. Take your time, young warrior! 🗡️
              </p>
            </MascotBubble>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {currentChars.map((kanji, idx) => (
                 <Card 
                  key={idx} 
                  className="bg-card/80 backdrop-blur-sm border-2 border-neon-purple shadow-[0_0_20px_rgba(138,43,226,0.3)] p-4 sm:p-6 hover:scale-105 transition-all duration-300"
                >
                  <div className="text-center space-y-2 sm:space-y-3">
                    <div className="text-5xl sm:text-6xl font-bold text-neon-purple">
                      {kanji.char}
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground">
                      {kanji.meaning}
                    </div>
                    <div className="pt-2 sm:pt-3 border-t border-border space-y-1 sm:space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">On-reading:</p>
                        <p className="text-sm font-bold text-foreground">{kanji.readings.on}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Kun-reading:</p>
                        <p className="text-sm font-bold text-foreground">{kanji.readings.kun}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => playSound(kanji.example)}
                      className="w-full touch-manipulation"
                    >
                      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="text-xs sm:text-sm">Play Sound</span>
                    </Button>
                    <div className="pt-2 sm:pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Example:</p>
                      <p className="text-base sm:text-lg font-bold text-foreground mb-1">{kanji.example}</p>
                      <p className="text-xs text-muted-foreground">{kanji.exampleReading}</p>
                    </div>
                  </div>
                </Card>
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
                  className="bg-neon-purple text-background hover:bg-neon-purple/90"
                >
                  Take Quiz!
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="bg-neon-purple text-background hover:bg-neon-purple/90"
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
