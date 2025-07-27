'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, Send, Volume2, VolumeX } from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';
import { AdvancedSpeechRecognition } from '@/lib/speech-recognition';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { GlassCard } from '@/components/ui/glass-card';

interface SymptomInputProps {
  language: Language;
  onSubmit: (symptoms: string) => void;
  onEmergency: () => void;
  isLoading: boolean;
}

export function SymptomInput({ language, onSubmit, onEmergency, isLoading }: SymptomInputProps) {
  const [symptoms, setSymptoms] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<AdvancedSpeechRecognition | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isBrowser, setIsBrowser] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize browser environment check
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Initialize speech recognition only in browser
  useEffect(() => {
    if (!isBrowser) return;

    const recognition = new AdvancedSpeechRecognition();
    setSpeechRecognition(recognition);

    // Listen for interim results
    const handleInterimResult = (event: CustomEvent) => {
      setInterimText(event.detail.text);
    };

    // Listen for final segments
    const handleSegment = (event: CustomEvent) => {
      const segment = event.detail;
      setSymptoms(prev => {
        const newText = prev + (prev ? ' ' : '') + segment.text;
        // Clear interim text when we get final result
        setInterimText('');
        return newText;
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('speechInterim', handleInterimResult as EventListener);
      window.addEventListener('speechSegment', handleSegment as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('speechInterim', handleInterimResult as EventListener);
        window.removeEventListener('speechSegment', handleSegment as EventListener);
      }
    };
  }, [isBrowser]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Prevent unwanted characters and ensure clean input
    const cleanValue = value
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E\s]/g, '') // Allow Arabic, Latin, and common punctuation
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trimStart(); // Remove leading spaces
    
    setSymptoms(cleanValue);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent unwanted key combinations
    if (e.ctrlKey && !['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      return;
    }
    
    // Handle Enter key for submission
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (symptoms.trim() && !isLoading) {
        handleSubmit();
      }
    }
  };

  const toggleListening = async () => {
    if (!isBrowser || !speechRecognition) return;

    try {
      if (isListening) {
        speechRecognition.stopRecognition();
        setIsListening(false);
        setInterimText('');
      } else {
        const languageCode = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'ar-MA';
        await speechRecognition.startRecognition(languageCode);
        setIsListening(true);
      }
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsListening(false);
      setInterimText('');
    }
  };

  const speakText = (text: string) => {
    if (!isBrowser || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'ar-SA';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = () => {
    if (symptoms.trim() && !isLoading) {
      onSubmit(symptoms.trim());
    }
  };

  const isRTL = language === 'ar' || language === 'da';
  const displayText = symptoms + (interimText ? ` ${interimText}` : '');
  const canSubmit = symptoms.trim().length > 0 && !isLoading;

  return (
    <div className="space-y-6 relative max-w-4xl mx-auto">
      <MotionWrapper animation="slideUp" delay={100}>
        <GlassCard className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className={`flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Mic className="h-5 w-5 text-white" />
              </div>
              {getTranslation(language, 'describeSymptoms')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Text Input Area */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={displayText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === 'ar' 
                    ? 'صف الأعراض التي تشعر بها بالتفصيل...'
                    : language === 'fr'
                    ? 'Décrivez vos symptômes en détail...'
                    : 'وصف الأعراض اللي كتحس بيها بالتفصيل...'
                }
                className={`min-h-[120px] max-h-[300px] resize-none transition-all duration-300 
                  ${isRTL ? 'text-right' : 'text-left'} 
                  ${interimText ? 'border-blue-300 bg-blue-50/50' : ''}
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  text-base leading-relaxed p-4 rounded-xl
                  border-2 border-gray-200 hover:border-gray-300
                  bg-white/80 backdrop-blur-sm`}
                dir={isRTL ? 'rtl' : 'ltr'}
                disabled={isLoading}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              
              {/* Character count and status */}
              <div className={`absolute bottom-3 ${isRTL ? 'left-3' : 'right-3'} flex items-center gap-2`}>
                {interimText && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {language === 'ar' ? 'يستمع...' : 'Listening...'}
                  </Badge>
                )}
                <span className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
                  {symptoms.length}/2000
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Speech Recognition Button */}
              {isBrowser && speechRecognition?.isSupported() && (
                <MotionWrapper animation="scale" delay={200}>
                  <Button
                    variant={isListening ? "destructive" : "outline"}
                    size="lg"
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`flex items-center gap-2 transition-all duration-300 hover-lift
                      ${isListening ? 'animate-pulse bg-red-500 hover:bg-red-600' : 'hover:bg-blue-50'}
                      ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                    {isListening 
                      ? getTranslation(language, 'listening')
                      : getTranslation(language, 'speakSymptoms')
                    }
                  </Button>
                </MotionWrapper>
              )}

              {/* Text-to-Speech Button */}
              {isBrowser && symptoms && (
                <MotionWrapper animation="scale" delay={300}>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => speakText(symptoms)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 hover-lift hover:bg-green-50
                      ${isSpeaking ? 'bg-green-100 border-green-300' : ''}
                      ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                    {isSpeaking ? 'إيقاف' : 'استمع'}
                  </Button>
                </MotionWrapper>
              )}

              {/* Submit Button */}
              <MotionWrapper animation="scale" delay={400}>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  size="lg"
                  className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600
                    hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover-lift
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isLoading
                    ? getTranslation(language, 'analyzing')
                    : getTranslation(language, 'symptoms')
                  }
                </Button>
              </MotionWrapper>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Emergency Button */}
      <MotionWrapper animation="slideUp" delay={500}>
        <GlassCard className="border-red-200 bg-red-50/80">
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                <h3 className="font-semibold text-red-800 mb-1">
                  {language === 'ar' ? 'حالة طوارئ؟' : language === 'fr' ? 'Urgence?' : 'حالة طوارئ؟'}
                </h3>
                <p className="text-sm text-red-600">
                  {language === 'ar' 
                    ? 'اتصل فوراً بخدمات الطوارئ'
                    : language === 'fr'
                    ? 'Appelez immédiatement les services d\'urgence'
                    : 'عيط دغيا لخدمات الطوارئ'
                  }
                </p>
              </div>
              <Button
                variant="destructive"
                size="lg"
                onClick={onEmergency}
                className={`flex items-center gap-2 bg-red-600 hover:bg-red-700 
                  animate-pulse-glow hover-lift ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Phone className="h-4 w-4" />
                150
              </Button>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Input Guidelines */}
      <MotionWrapper animation="fadeIn" delay={600}>
        <GlassCard variant="subtle" className="bg-blue-50/50">
          <CardContent className="p-4">
            <div className={`text-sm text-blue-700 space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h4 className="font-medium mb-2">
                {language === 'ar' ? 'نصائح لوصف أفضل:' : 'Tips for better description:'}
              </h4>
              <ul className={`space-y-1 ${isRTL ? 'list-none' : 'list-disc list-inside'}`}>
                <li>{language === 'ar' ? '• اذكر متى بدأت الأعراض' : '• Mention when symptoms started'}</li>
                <li>{language === 'ar' ? '• صف شدة الألم (1-10)' : '• Describe pain intensity (1-10)'}</li>
                <li>{language === 'ar' ? '• اذكر الأعراض المصاحبة' : '• Mention accompanying symptoms'}</li>
                <li>{language === 'ar' ? '• أذكر أي أدوية تتناولها' : '• Mention any medications you take'}</li>
              </ul>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>
    </div>
  );
}