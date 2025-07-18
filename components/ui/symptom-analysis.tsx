'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GlassCard } from '@/components/ui/glass-card';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Heart, 
  Copy, 
  Check,
  Volume2,
  VolumeX,
  Info
} from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';
import { type SymptomAnalysis } from '@/lib/ai-service';

interface SymptomAnalysisDisplayProps {
  analysis: SymptomAnalysis;
  language: Language;
  symptoms: string;
}

export function SymptomAnalysisDisplay({ 
  analysis, 
  language, 
  symptoms 
}: SymptomAnalysisDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isRTL = language === 'ar' || language === 'da';

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'moderate':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const handleCopy = async () => {
    const analysisText = `
${getTranslation(language, 'symptoms')}: ${symptoms}

${getTranslation(language, 'analysis')}:
- ${getTranslation(language, 'severity')}: ${getTranslation(language, `severity.${analysis.severity}`)}
- ${analysis.possibleConditions.join(', ')}

${getTranslation(language, 'recommendations')}:
${analysis.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

${analysis.warning ? `⚠️ ${analysis.warning}` : ''}
${analysis.additionalInfo ? `ℹ️ ${analysis.additionalInfo}` : ''}
    `.trim();

    try {
      await navigator.clipboard.writeText(analysisText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      const textToSpeak = `
        ${analysis.possibleConditions.join('. ')}. 
        ${getTranslation(language, 'recommendations')}: 
        ${analysis.recommendations.join('. ')}.
        ${analysis.warning || ''}
        ${analysis.additionalInfo || ''}
      `;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Set language for speech synthesis
      switch (language) {
        case 'ar':
        case 'da':
          utterance.lang = 'ar-SA';
          break;
        case 'fr':
          utterance.lang = 'fr-FR';
          break;
        default:
          utterance.lang = 'en-US';
      }

      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <MotionWrapper animation="slideUp" delay={100}>
        <GlassCard className="p-6">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h2 className="text-xl font-bold text-gray-900">
                  {getTranslation(language, 'analysis')}
                </h2>
                <p className="text-sm text-gray-600">
                  {analysis.source === 'api' ? 'تحليل متقدم' : getTranslation(language, 'offline')}
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className={`relative transition-all duration-200 ${
                    copied ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="text-sm">
                      {copied ? '✓' : getTranslation(language, 'copy') || 'Copy'}
                    </span>
                  </div>
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSpeak}
                className={isPlaying ? 'bg-blue-50 border-blue-200' : ''}
              >
                {isPlaying ? (
                  <VolumeX className="h-4 w-4 text-blue-600" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </GlassCard>
      </MotionWrapper>

      {/* Severity Badge */}
      <MotionWrapper animation="slideUp" delay={200}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Badge 
            className={`${getSeverityColor(analysis.severity)} flex items-center gap-2 px-4 py-2 text-sm font-medium`}
          >
            {getSeverityIcon(analysis.severity)}
            {getTranslation(language, `severity.${analysis.severity}`)}
          </Badge>
          
          {analysis.confidence && (
            <Badge variant="outline" className="px-3 py-1">
              {Math.round(analysis.confidence * 100)}% {getTranslation(language, 'confidence') || 'Confidence'}
            </Badge>
          )}
        </div>
      </MotionWrapper>

      {/* Warning Alert */}
      {analysis.warning && (
        <MotionWrapper animation="slideUp" delay={300}>
          <GlassCard className="border-orange-200/50 bg-orange-50/80">
            <CardContent className="p-4">
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className={`text-orange-800 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                  {analysis.warning}
                </p>
              </div>
            </CardContent>
          </GlassCard>
        </MotionWrapper>
      )}

      {/* Possible Conditions */}
      <MotionWrapper animation="slideUp" delay={400}>
        <GlassCard>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <Heart className="h-5 w-5 text-blue-600" />
              {getTranslation(language, 'possibleConditions') || 'Possible Conditions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.possibleConditions.map((condition, index) => (
              <div 
                key={index}
                className={`p-4 bg-blue-50/50 rounded-lg border border-blue-100 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{condition}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Recommendations */}
      <MotionWrapper animation="slideUp" delay={500}>
        <GlassCard>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <CheckCircle className="h-5 w-5 text-green-600" />
              {getTranslation(language, 'recommendations')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <div 
                key={index}
                className={`p-4 bg-green-50/50 rounded-lg border border-green-100 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-800 leading-relaxed">{recommendation}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Additional Information */}
      {analysis.additionalInfo && (
        <MotionWrapper animation="slideUp" delay={600}>
          <GlassCard className="border-blue-200/50 bg-blue-50/30">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-blue-800 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                <Info className="h-5 w-5" />
                {getTranslation(language, 'additionalInfo') || 'Additional Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-blue-700 leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                {analysis.additionalInfo}
              </p>
            </CardContent>
          </GlassCard>
        </MotionWrapper>
      )}

      {/* Urgency Information */}
      <MotionWrapper animation="slideUp" delay={700}>
        <GlassCard className="border-gray-200/50 bg-gray-50/30">
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock className="h-5 w-5 text-gray-600" />
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-sm font-medium text-gray-700">
                  {getTranslation(language, 'urgency') || 'Urgency Level'}
                </p>
                <p className="text-gray-600">{analysis.urgency}</p>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Source Information */}
      <MotionWrapper animation="slideUp" delay={800}>
        <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-xs text-gray-500">
            {analysis.source === 'api' ? 
              'تم التحليل باستخدام الذكاء الاصطناعي المتقدم' : 
              getTranslation(language, 'offline')
            } • {new Date(analysis.timestamp).toLocaleString()}
          </p>
        </div>
      </MotionWrapper>
    </div>
  );
}