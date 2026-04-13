import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import hanaFox from '@/assets/hana-fox.png';

export const TranslatorTab = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showRomaji, setShowRomaji] = useState(true);
  const [showHint, setShowHint] = useState(true);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text to translate');
      return;
    }

    setIsTranslating(true);
    
    // Simulate translation - in a real app, you'd call an API
    setTimeout(() => {
      // Simple mock translation
      const mockTranslation = `${inputText}の日本語訳`;
      setOutputText(mockTranslation);
      setIsTranslating(false);
      toast.success('Translation complete!');
    }, 800);
  };

  const playSound = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <img 
            src={hanaFox} 
            alt="Hana"
            className="w-12 h-12 object-contain mascot-idle"
          />
          <div>
            <p className="font-semibold text-primary">Translation Tool</p>
            <p className="text-xs text-muted-foreground">English ⇄ Japanese</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="romaji-mode"
            checked={showRomaji}
            onCheckedChange={setShowRomaji}
          />
          <Label htmlFor="romaji-mode" className="text-sm cursor-pointer">
            Show Rōmaji
          </Label>
        </div>
      </div>

      {showHint && (
        <div className="mx-4 mt-4 bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-3 animate-fade-in">
          <img 
            src={hanaFox} 
            alt="Hana"
            className="w-10 h-10 object-contain mascot-talking"
          />
          <p className="text-sm flex-1">
            <span className="font-semibold text-primary">Hana says:</span> Type something in English to translate it to Japanese! 🌸
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHint(false)}
            className="text-xs"
          >
            Got it!
          </Button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto">
      <Card className="w-full max-w-4xl bg-card/50 backdrop-blur-sm border-primary/20 p-6">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center glow-text">English → Japanese Translator</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">English</label>
              <Textarea
                placeholder="Enter English text..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px] bg-background/50 border-primary/20 focus:border-primary/40 
                           transition-colors resize-none"
              />
            </div>

            {/* Output */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center justify-between">
                <span>Japanese</span>
                {outputText && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => playSound(outputText)}
                    className="h-8 hover:bg-primary/20"
                  >
                    <Volume2 className="h-4 w-4 text-primary mr-1" />
                    Listen
                  </Button>
                )}
              </label>
              <Textarea
                  placeholder="Translation will appear here..."
                  value={outputText}
                  readOnly
                  className="min-h-[200px] bg-background/50 border-primary/20 resize-none"
                />
                {showRomaji && outputText && (
                  <p className="text-xs text-muted-foreground italic">
                    Rōmaji: {inputText}no nihongo yaku
                  </p>
                )}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleTranslate}
              disabled={isTranslating}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 
                         transition-all duration-300 shadow-lg hover:shadow-xl
                         hover:shadow-primary/20 text-primary-foreground font-semibold"
            >
              {isTranslating ? (
                'Translating...'
              ) : (
                <>
                  Translate
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Note: This is a demo translator. For accurate translations, integrate with a translation API.
          </p>
        </div>
      </Card>
    </div>
    </div>
  );
};
