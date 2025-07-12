'use client';

import { useState } from 'react';
import { MotionWrapper } from './motion-wrapper';
import { GlassCard } from './glass-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SpeechRecognitionComponent } from '@/components/ui/speech-recognition';
import { AlertTriangle, Mic, Send, Loader2, Heart } from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';

interface SymptomInputProps {
  language: Language;
  onSubmit: (symptoms: string) => void;
  onEmergency: () => void;
  isLoading: boolean;
}

export function SymptomInput({ language, onSubmit, onEmergency, isLoading }: SymptomInputProps) {
  const [symptoms, setSymptoms] = useState('');
  const [showSpeechRecognition, setShowSpeechRecognition] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const handleSubmit = () => {
    if (symptoms.trim()) {
      onSubmit(symptoms.trim());
    }
  };

  const handleSymptomsChange = (value: string) => {
    setSymptoms(value);
    setWordCount(value.trim().split(/\s+/).filter(word => word.length > 0).length);
  };

  const handleTranscriptUpdate = (transcript: string) => {
    setSymptoms(transcript);
    setWordCount(transcript.trim().split(/\s+/).filter(word => word.length > 0).length);
  };

  const isRTL = language === 'ar' || language === 'da';

  return (
    <div className="space-y-6 relative">
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            {getTranslation(language, 'describeSymptoms')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Speech Recognition Toggle */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant={showSpeechRecognition ? 'default' : 'outline'}
              onClick={() => setShowSpeechRecognition(!showSpeechRecognition)}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Mic className="h-4 w-4" />
              {getTranslation(language, 'speakSymptoms')}
            </Button>
            
            {wordCount > 0 && (
              <Badge variant="secondary">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </Badge>
            )}
          </div>

          {/* Speech Recognition Component */}
          {showSpeechRecognition && (
            <SpeechRecognitionComponent
              language={language}
              onTranscriptUpdate={handleTranscriptUpdate}
            />
          )}

          {/* Text Input */}
          <div className="space-y-2">
            <Textarea
              value={symptoms}
              onChange={(e) => handleSymptomsChange(e.target.value)}
              placeholder={
                language === 'ar' 
                  ? 'صف أعراضك بالتفصيل... مثال: أشعر بصداع شديد وحمى منذ يومين'
                  : language === 'fr'
                  ? 'Décrivez vos symptômes en détail... Exemple: J\'ai un mal de tête sévère et de la fièvre depuis deux jours'
                  : 'وصف الأعراض ديالك بالتفصيل... مثال: عندي صداع قوي و سخانة من يومين'
              }
              className={`min-h-32 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            
            <div className={`flex justify-between text-sm text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>{symptoms.length}/2000 characters</span>
              {symptoms.length > 1800 && (
                <span className="text-orange-600">
                  Approaching character limit
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={handleSubmit}
              disabled={!symptoms.trim() || isLoading}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isLoading ? getTranslation(language, 'analyzing') || 'Analyzing...' : 'Analyze Symptoms'}
            </Button>

            <Button
              variant="destructive"
              onClick={onEmergency}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <AlertTriangle className="h-4 w-4" />
              {getTranslation(language, 'emergency')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <MotionWrapper animation="slideUp" delay={200}>
        <GlassCard hover glow className="backdrop-blur-lg">
          <CardHeader>
            <CardTitle className={`${isRTL ? 'text-right' : 'text-left'} text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}>
              {getTranslation(language, 'describeSymptoms')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={getTranslation(language, 'describeSymptoms')}
                className={`min-h-32 resize-none bg-white/50 backdrop-blur-sm border-white/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ${isRTL ? 'text-right' : 'text-left'}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <MotionWrapper animation="scale" delay={300}>
                  <SpeechRecognition
                    language={language}
                    onResult={(text) => setSymptoms(prev => prev + ' ' + text)}
                    className="h-8 w-8 hover-lift"
                  />
                </MotionWrapper>
              </div>
            </div>
            
            <MotionWrapper animation="slideUp" delay={400}>
              <Button
                onClick={handleSubmit}
                disabled={!symptoms.trim() || isLoading}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg hover-lift transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {getTranslation(language, 'analyzing')}
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    {getTranslation(language, 'symptoms')}
                  </>
                )}
              </Button>
            </MotionWrapper>
          </CardContent>
        </GlassCard>
      </MotionWrapper>
    </div>
  );
}