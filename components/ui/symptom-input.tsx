'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, AlertTriangle, Send } from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';

interface SymptomInputProps {
  language: Language;
  onSubmit: (symptoms: string) => void;
  onEmergency: () => void;
  isLoading?: boolean;
}

export function SymptomInput({ language, onSubmit, onEmergency, isLoading }: SymptomInputProps) {
  const [symptoms, setSymptoms] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'ar-MA';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setSymptoms(prev => prev + finalTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSubmit = () => {
    if (symptoms.trim()) {
      onSubmit(symptoms.trim());
    }
  };

  const isRTL = language === 'ar' || language === 'da';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className={`text-xl ${isRTL ? 'text-right' : 'text-left'}`}>
          {getTranslation(language, 'describeSymptoms')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder={getTranslation(language, 'describeSymptoms')}
            className={`min-h-[120px] resize-none ${isRTL ? 'text-right' : 'text-left'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          
          {recognition && (
            <Button
              type="button"
              size="sm"
              variant={isListening ? "destructive" : "outline"}
              onClick={toggleListening}
              className="absolute bottom-2 right-2"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {isListening && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
            {getTranslation(language, 'listening')}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!symptoms.trim() || isLoading}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {getTranslation(language, 'symptoms')}
          </Button>

          <Button
            onClick={onEmergency}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {getTranslation(language, 'emergency')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}