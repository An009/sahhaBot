'use client';

import { useState } from 'react';
import { MotionWrapper } from './motion-wrapper';
import { GlassCard } from './glass-card';
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
          </div>
        </CardHeader>
      </Card>

      <MotionWrapper animation="slideUp" delay={400}>
        <GlassCard hover className="backdrop-blur-md">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-lg font-semibold text-gray-800 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Possible Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              {analysis.possibleConditions.map((condition, index) => (
                <MotionWrapper key={index} animation="slideLeft" delay={500 + index * 100}>
                  <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/30 transition-colors duration-200">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">{condition}</span>
                  </li>
                </MotionWrapper>
              ))}
            </ul>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      <div className="mb-4">
        <MotionWrapper animation="slideUp" delay={600}>
          <GlassCard hover glow className="backdrop-blur-lg border-green-200/30">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold text-gray-800 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                {getTranslation(language, 'recommendations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                {analysis.recommendations.map((recommendation, index) => (
                  <MotionWrapper key={index} animation="slideLeft" delay={700 + index * 100}>
                    <li className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 hover:bg-green-100/50 transition-colors duration-200">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{recommendation}</span>
                    </li>
                  </MotionWrapper>
                ))}
              </ul>
            </CardContent>
          </GlassCard>
        </MotionWrapper>
        <strong className="text-gray-900">{getTranslation(language, 'symptoms')}:</strong> {symptoms}
      </div>

      <MotionWrapper animation="slideUp" delay={800}>
        <GlassCard className="border-yellow-200/50 bg-yellow-50/80 hover:bg-yellow-100/80">
          <CardContent className="p-4">
            <div className={`flex items-start gap-3 text-yellow-800 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 animate-pulse" />
              <div>
                <p className="font-semibold text-yellow-900">Warning</p>
                <p className="text-sm mt-1 text-yellow-800">{analysis.warning}</p>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      <span className="text-sm text-blue-700 font-medium">
        {Math.round(analysis.confidence * 100)}% confidence
      </span>

      <MotionWrapper animation="fadeIn" delay={900}>
        <GlassCard variant="subtle" className="bg-gray-50/50">
          <CardContent className="p-4">
            <div className={`text-xs text-gray-500 space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                Analysis generated: {new Date(analysis.timestamp).toLocaleString()}
              </p>
              <p className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                Source: {analysis.source === 'api' ? 'AI Analysis' : 'Offline Database'}
              </p>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>
    </div>
  );
}