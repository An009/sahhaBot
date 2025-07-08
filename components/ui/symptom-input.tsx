'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SpeechRecognitionComponent } from '@/components/ui/speech-recognition';
import { AlertTriangle, Mic, Send, Loader2 } from 'lucide-react';
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
    <div className="space-y-6">
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

          {/* Help Text */}
          <div className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="mb-2">
              {language === 'ar' 
                ? 'للحصول على تحليل دقيق، يرجى تقديم معلومات مفصلة حول:'
                : language === 'fr'
                ? 'Pour une analyse précise, veuillez fournir des informations détaillées sur:'
                : 'باش نعطيوك تحليل مزيان، عطينا معلومات مفصلة على:'
              }
            </p>
            <ul className={`list-disc ${isRTL ? 'list-inside' : 'ml-4'} space-y-1`}>
              <li>
                {language === 'ar' 
                  ? 'الأعراض الحالية وشدتها'
                  : language === 'fr'
                  ? 'Symptômes actuels et leur intensité'
                  : 'الأعراض اللي عندك دابا و قداش قوية'
                }
              </li>
              <li>
                {language === 'ar' 
                  ? 'متى بدأت الأعراض'
                  : language === 'fr'
                  ? 'Quand les symptômes ont commencé'
                  : 'إمتى بداو الأعراض'
                }
              </li>
              <li>
                {language === 'ar' 
                  ? 'أي عوامل مؤثرة أو محفزة'
                  : language === 'fr'
                  ? 'Facteurs déclenchants ou aggravants'
                  : 'أي حاجة خلات الأعراض تزيد'
                }
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}