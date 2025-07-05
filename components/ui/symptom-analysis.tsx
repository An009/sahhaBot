'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Heart, Volume2, VolumeX, CheckCircle } from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';
import type { SymptomAnalysis } from '@/lib/ai-service';

interface SymptomAnalysisProps {
  analysis: SymptomAnalysis;
  language: Language;
  symptoms: string;
}

export function SymptomAnalysisDisplay({ analysis, language, symptoms }: SymptomAnalysisProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'moderate': return <Heart className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'ar-SA';
      utterance.rate = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    }
  };

  const isRTL = language === 'ar' || language === 'da';

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {/* Severity Badge */}
      <Card className={`${analysis.severity === 'emergency' ? 'border-red-500 bg-red-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge className={`${getSeverityColor(analysis.severity)} flex items-center gap-1`}>
              {getSeverityIcon(analysis.severity)}
              {getTranslation(language, `severity.${analysis.severity}`)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => speakText(analysis.urgency)}
              className="flex items-center gap-1"
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="mb-4">
              <h3 className="font-semibold text-sm text-gray-600 mb-2">
                {getTranslation(language, 'symptoms')}
              </h3>
              <p className="text-gray-800">{symptoms}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-sm text-gray-600 mb-2">
                {getTranslation(language, 'analysis')}
              </h3>
              <p className="text-gray-800 font-medium">{analysis.urgency}</p>
            </div>

            {analysis.warning && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{analysis.warning}</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold text-sm text-gray-600 mb-2">
                {getTranslation(language, 'recommendations')}
              </h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-800">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}