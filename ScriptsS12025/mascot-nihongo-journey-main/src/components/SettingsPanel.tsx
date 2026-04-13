import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RotateCcw,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsPanel = ({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  onToggleDarkMode 
}: SettingsPanelProps) => {
  const { progress, updateSettings, resetProgress } = useProgress();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="bg-card/95 backdrop-blur-sm border-2 border-border p-6 max-w-md w-full relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-3 right-3"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-yellow-400" />}
              <div>
                <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Toggle theme</p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={onToggleDarkMode}
            />
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {progress.settings.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="sound" className="font-medium">Sound Effects</Label>
                <p className="text-xs text-muted-foreground">Audio feedback</p>
              </div>
            </div>
            <Switch
              id="sound"
              checked={progress.settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="animations" className="font-medium">Animations</Label>
                <p className="text-xs text-muted-foreground">Particle effects</p>
              </div>
            </div>
            <Switch
              id="animations"
              checked={progress.settings.animationsEnabled}
              onCheckedChange={(checked) => updateSettings({ animationsEnabled: checked })}
            />
          </div>

          <Separator className="bg-border/50" />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Progress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your XP, streaks, badges, and mastered characters. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetProgress}>
                  Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Konichiwa Helper v2.0 • Made with 💮
          </p>
        </div>
      </Card>
    </div>
  );
};
