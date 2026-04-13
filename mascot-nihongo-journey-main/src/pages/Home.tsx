import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HiraganaTab } from '@/components/HiraganaTab';
import { KatakanaTab } from '@/components/KatakanaTab';
import { KanjiTab } from '@/components/KanjiTab';
import { TranslatorTab } from '@/components/TranslatorTab';
import { BeginnerGuide } from '@/components/BeginnerGuide';
import { ProgressPanel } from '@/components/ProgressPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { DailyChallenge } from '@/components/DailyChallenge';
import { ArrowLeft, Languages, Settings, Trophy } from 'lucide-react';
import hanaFox from '@/assets/hana-fox.png';
import kataCat from '@/assets/kata-cat.png';
import kanjiCrane from '@/assets/kanji-crane.png';
import { useProgress } from '@/hooks/useProgress';

type ActiveSection = 'home' | 'hiragana' | 'katakana' | 'kanji';

const Home = () => {
  const [showGuide, setShowGuide] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [showTranslator, setShowTranslator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { progress } = useProgress();

  const handleSectionClick = (section: ActiveSection) => {
    setActiveSection(section);
    setShowTranslator(false);
  };

  const handleBackToHome = () => {
    setActiveSection('home');
  };

  const handleTranslatorClick = () => {
    setShowTranslator(true);
    setActiveSection('home');
  };

  const learningBlocks = [
    {
      id: 'hiragana' as const,
      title: 'ひらがな',
      subtitle: 'Hiragana',
      description: 'The foundation of Japanese writing',
      mascot: hanaFox,
      mascotName: 'Hana the Fox',
      gradient: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/30',
      hoverBorder: 'hover:border-primary',
      textColor: 'text-primary',
      mastered: progress.masteredCharacters.hiragana.length,
      total: 46,
    },
    {
      id: 'katakana' as const,
      title: 'カタカナ',
      subtitle: 'Katakana',
      description: 'For foreign words and emphasis',
      mascot: kataCat,
      mascotName: 'Kata the Cat',
      gradient: 'from-secondary/20 to-secondary/5',
      borderColor: 'border-secondary/30',
      hoverBorder: 'hover:border-secondary',
      textColor: 'text-secondary',
      mastered: progress.masteredCharacters.katakana.length,
      total: 46,
    },
    {
      id: 'kanji' as const,
      title: '漢字',
      subtitle: 'Kanji',
      description: 'Beautiful characters with meaning',
      mascot: kanjiCrane,
      mascotName: 'Kanji the Crane',
      gradient: 'from-accent/20 to-accent/5',
      borderColor: 'border-accent/30',
      hoverBorder: 'hover:border-accent',
      textColor: 'text-accent',
      mastered: progress.masteredCharacters.kanji.length,
      total: 50,
    },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-card relative overflow-hidden flex flex-col">
      {showGuide && activeSection === 'home' && !showTranslator && (
        <BeginnerGuide onClose={() => setShowGuide(false)} />
      )}

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Header */}
      <header className="border-b border-primary/20 bg-card/30 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeSection !== 'home' && (
                <Button
                  variant="ghost"
                  onClick={handleBackToHome}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </Button>
              )}
              {activeSection === 'home' && !showTranslator && (
                <ProgressPanel compact />
              )}
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-center glow-text bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Konichiwa Helper
            </h1>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant={showTranslator ? "default" : "outline"}
                onClick={handleTranslatorClick}
                size="sm"
                className={showTranslator ? 'bg-primary text-primary-foreground' : 'border-primary/30 hover:border-primary'}
              >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Translator</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
        {showTranslator && (
          <div className="h-full animate-fade-in">
            <TranslatorTab />
          </div>
        )}

        {!showTranslator && activeSection === 'home' && (
          <div className="h-full flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-full max-w-md">
              <DailyChallenge onStartChallenge={(type) => setActiveSection(type)} />
            </div>

            <p className="text-muted-foreground text-center">
              Choose your learning path
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
              {learningBlocks.map((block, index) => (
                <Card
                  key={block.id}
                  onClick={() => handleSectionClick(block.id)}
                  className={`
                    relative cursor-pointer p-5
                    bg-gradient-to-br ${block.gradient}
                    border-2 ${block.borderColor} ${block.hoverBorder}
                    transition-all duration-300 ease-out
                    hover:scale-105 hover:shadow-xl hover:shadow-primary/10
                    group
                    ${index === 0 ? 'hiragana-block' : ''}
                  `}
                >
                  <div className="flex justify-center mb-3">
                    <img
                      src={block.mascot}
                      alt={block.mascotName}
                      className="w-20 h-20 md:w-24 md:h-24 object-contain mascot-idle drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  <div className="text-center">
                    <h2 className={`text-2xl md:text-3xl font-bold ${block.textColor} mb-1`}>
                      {block.title}
                    </h2>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {block.subtitle}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {block.description}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <Trophy className="h-3 w-3" />
                      <span className={block.textColor}>{block.mastered}</span>
                      <span className="text-muted-foreground">/ {block.total}</span>
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-t from-primary/5 to-transparent" />
                </Card>
              ))}
            </div>
          </div>
        )}

        {!showTranslator && activeSection === 'hiragana' && (
          <div className="h-full animate-fade-in">
            <HiraganaTab />
          </div>
        )}

        {!showTranslator && activeSection === 'katakana' && (
          <div className="h-full animate-fade-in">
            <KatakanaTab />
          </div>
        )}

        {!showTranslator && activeSection === 'kanji' && (
          <div className="h-full animate-fade-in">
            <KanjiTab />
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
