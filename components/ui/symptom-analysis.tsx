'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Heart, 
  Shield, 
  Volume2,
  VolumeX,
  Copy,
  Share2
} from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';
import { type SymptomAnalysis } from '@/lib/ai-service';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { GlassCard } from '@/components/ui/glass-card';

interface SymptomAnalysisDisplayProps {
  analysis: SymptomAnalysis;
  language: Language;
  symptoms: string;
}

export function SymptomAnalysisDisplay({ analysis, language, symptoms }: SymptomAnalysisDisplayProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          label: language === 'ar' ? 'طوارئ' : language === 'fr' ? 'Urgence' : 'طوارئ',
          bgClass: 'border-red-500 bg-red-50/80'
        };
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: AlertTriangle,
          label: language === 'ar' ? 'عالي' : language === 'fr' ? 'Élevé' : 'عالي',
          bgClass: 'border-orange-500 bg-orange-50/80'
        };
      case 'moderate':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          label: language === 'ar' ? 'متوسط' : language === 'fr' ? 'Modéré' : 'متوسط',
          bgClass: 'border-yellow-500 bg-yellow-50/80'
        };
      default:
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          label: language === 'ar' ? 'منخفض' : language === 'fr' ? 'Faible' : 'منخفض',
          bgClass: 'border-green-500 bg-green-50/80'
        };
    }
  };

  const severityConfig = getSeverityConfig(analysis.severity);
  const SeverityIcon = severityConfig.icon;
  const isRTL = language === 'ar' || language === 'da';

  const speakAnalysis = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `
      ${getTranslation(language, 'severity')}: ${severityConfig.label}.
      ${analysis.possibleConditions.join(', ')}.
      ${getTranslation(language, 'recommendations')}: ${analysis.recommendations.join('. ')}.
    `;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'ar-SA';
    utterance.rate = 0.8;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = async (text: string, section: string) => {
    if (typeof window === 'undefined' || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareAnalysis = async () => {
    if (typeof window === 'undefined') return;

    const shareText = `
تحليل الأعراض:
الأعراض: ${symptoms}
الحالات المحتملة: ${analysis.possibleConditions.join(', ')}
التوصيات: ${analysis.recommendations.join(', ')}
مستوى الخطورة: ${severityConfig.label}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تحليل الأعراض - SahhaBot',
          text: shareText
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      copyToClipboard(shareText, 'full');
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Header with Severity */}
      <MotionWrapper animation="slideUp" delay={100}>
        <GlassCard className={severityConfig.bgClass}>
          <CardHeader className="pb-4">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-3 rounded-xl ${severityConfig.color}`}>
                  <SeverityIcon className="h-6 w-6" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <CardTitle className="text-xl mb-1">
                    {getTranslation(language, 'analysis')}
                  </CardTitle>
                  <Badge className={`${severityConfig.color} font-medium`}>
                    {getTranslation(language, 'severity')}: {severityConfig.label}
                  </Badge>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={speakAnalysis}
                  className="hover-lift"
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareAnalysis}
                  className="hover-lift"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </GlassCard>
      </MotionWrapper>

      {/* Original Symptoms */}
      <MotionWrapper animation="slideUp" delay={200}>
        <GlassCard>
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center gap-2 text-lg ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <Heart className="h-5 w-5 text-blue-600" />
              {getTranslation(language, 'symptoms')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <p className={`text-gray-700 leading-relaxed p-4 bg-gray-50 rounded-xl border-l-4 border-blue-500 
                ${isRTL ? 'text-right border-r-4 border-l-0' : 'text-left'}`}>
                {symptoms}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(symptoms, 'symptoms')}
                className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} opacity-70 hover:opacity-100`}
              >
                {copiedSection === 'symptoms' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Possible Conditions */}
      <MotionWrapper animation="slideUp" delay={300}>
        <GlassCard>
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center gap-2 text-lg ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <Shield className="h-5 w-5 text-purple-600" />
              {language === 'ar' ? 'الحالات المحتملة' : language === 'fr' ? 'Conditions possibles' : 'الحالات المحتملة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="grid gap-3">
                {analysis.possibleConditions.map((condition, index) => (
                  <MotionWrapper key={index} animation="slideLeft" delay={400 + index * 100}>
                    <div className={`flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 hover-lift
                      ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                      <span className={`text-gray-800 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                        {condition}
                      </span>
                    </div>
                  </MotionWrapper>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(analysis.possibleConditions.join('\n'), 'conditions')}
                className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} opacity-70 hover:opacity-100`}
              >
                {copiedSection === 'conditions' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Recommendations */}
      <MotionWrapper animation="slideUp" delay={400}>
        <GlassCard>
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center gap-2 text-lg ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <CheckCircle className="h-5 w-5 text-green-600" />
              {getTranslation(language, 'recommendations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <MotionWrapper key={index} animation="slideRight" delay={500 + index * 100}>
                    <div className={`flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200 hover-lift
                      ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-gray-800 leading-relaxed">
                        {recommendation}
                      </span>
                    </div>
                  </MotionWrapper>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(analysis.recommendations.join('\n'), 'recommendations')}
                className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} opacity-70 hover:opacity-100`}
              >
                {copiedSection === 'recommendations' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Analysis Metadata */}
      <MotionWrapper animation="fadeIn" delay={600}>
        <GlassCard variant="subtle" className="bg-gray-50/80">
          <CardContent className="p-4">
            <div className={`flex items-center justify-between text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {analysis.confidence && (
                  <span>
                    {language === 'ar' ? 'الثقة:' : 'Confidence:'} {Math.round(analysis.confidence * 100)}%
                  </span>
                )}
                <span>
                  {language === 'ar' ? 'المصدر:' : 'Source:'} {analysis.source === 'api' ? 'AI' : 'Offline'}
                </span>
              </div>
              <span>
                {new Date(analysis.timestamp).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </span>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Warning Message */}
      {analysis.warning && (
        <MotionWrapper animation="slideUp" delay={700}>
          <GlassCard className="border-amber-200 bg-amber-50/80">
            <CardContent className="p-4">
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 font-medium">
                  {analysis.warning}
                </p>
              </div>
            </CardContent>
          </GlassCard>
        </MotionWrapper>
      )}

      {/* Disclaimer */}
      <MotionWrapper animation="fadeIn" delay={800}>
        <GlassCard variant="subtle" className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <p className={`text-sm text-blue-700 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
              ⚠️ {language === 'ar' 
                ? 'هذا التحليل للمساعدة الأولية فقط وليس بديلاً عن الاستشارة الطبية المتخصصة'
                : language === 'fr'
                ? 'Cette analyse est uniquement à des fins d\'aide initiale et ne remplace pas une consultation médicale spécialisée'
                : 'هاد التحليل غير للمساعدة الأولى فقط وماشي بديل على الاستشارة الطبية المتخصصة'
              }
            </p>
          </CardContent>
        </GlassCard>
      </MotionWrapper>
    </div>
  );
}