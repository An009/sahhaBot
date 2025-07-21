'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Info, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTranslation, type Language } from '@/lib/i18n';

export interface NotificationProps {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  language?: Language;
}

export function MedicalNotification({
  type,
  title,
  message,
  action,
  onClose,
  autoClose = false,
  duration = 5000,
  language = 'ar'
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const isRTL = language === 'ar' || language === 'da';

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  const icons = {
    success: CheckCircle,
    info: Info,
    warning: AlertTriangle,
    error: AlertTriangle
  };

  const Icon = icons[type];

  const colorClasses = {
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-orange-200 bg-orange-50 text-orange-800',
    error: 'border-red-200 bg-red-50 text-red-800'
  };

  const iconColors = {
    success: 'text-green-600',
    info: 'text-blue-600',
    warning: 'text-orange-600',
    error: 'text-red-600'
  };

  return (
    <div className={`fixed top-4 ${isRTL ? 'right-4' : 'left-4'} z-50 max-w-md animate-slideDown`}>
      <Card className={cn(
        'border-2 shadow-lg',
        colorClasses[type],
        'hover:shadow-xl transition-all duration-300'
      )}>
        <CardContent className="p-4">
          <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconColors[type])} />
            
            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h4 className="font-semibold text-sm mb-1">{title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{message}</p>
              
              {action && (
                <Button
                  onClick={action.onClick}
                  size="sm"
                  className={`mt-3 ${
                    type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    type === 'info' ? 'bg-blue-600 hover:bg-blue-700' :
                    type === 'warning' ? 'bg-orange-600 hover:bg-orange-700' :
                    'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {action.label}
                </Button>
              )}
            </div>

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className={`p-1 h-6 w-6 opacity-60 hover:opacity-100 ${isRTL ? 'mr-auto' : 'ml-auto'}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export interface AnalysisCompleteNotificationProps {
  language: Language;
  onViewResults: () => void;
  onClose?: () => void;
  estimatedReadTime?: number;
  severity?: 'low' | 'moderate' | 'high' | 'emergency';
}

export function AnalysisCompleteNotification({
  language,
  onViewResults,
  onClose,
  estimatedReadTime = 2,
  severity = 'moderate'
}: AnalysisCompleteNotificationProps) {
  const getNotificationType = (severity: string) => {
    switch (severity) {
      case 'emergency':
      case 'high':
        return 'warning';
      case 'moderate':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  };

  const getTitle = (language: Language) => {
    switch (language) {
      case 'ar':
        return 'تم إكمال التحليل الطبي';
      case 'da':
        return 'كمل التحليل الطبي';
      case 'fr':
        return 'Analyse médicale terminée';
      default:
        return 'Medical Analysis Complete';
    }
  };

  const getMessage = (language: Language, readTime: number) => {
    switch (language) {
      case 'ar':
        return `تم تحليل الأعراض بنجاح. النتائج جاهزة للمراجعة. وقت القراءة المقدر: ${readTime} دقيقة.`;
      case 'da':
        return `تحللو الأعراض مزيان. النتائج جاهزين للمراجعة. وقت القراءة: ${readTime} دقيقة.`;
      case 'fr':
        return `Vos symptômes ont été analysés avec succès. Les résultats sont prêts à être consultés. Temps de lecture estimé : ${readTime} minute${readTime > 1 ? 's' : ''}.`;
      default:
        return `Your symptoms have been successfully analyzed. Results are ready for review. Estimated reading time: ${readTime} minute${readTime > 1 ? 's' : ''}.`;
    }
  };

  const getActionLabel = (language: Language) => {
    switch (language) {
      case 'ar':
        return 'عرض النتائج';
      case 'da':
        return 'شوف النتائج';
      case 'fr':
        return 'Voir les résultats';
      default:
        return 'View Results';
    }
  };

  return (
    <MedicalNotification
      type={getNotificationType(severity)}
      title={getTitle(language)}
      message={getMessage(language, estimatedReadTime)}
      action={{
        label: getActionLabel(language),
        onClick: onViewResults
      }}
      onClose={onClose}
      language={language}
      autoClose={false}
    />
  );
}

export interface InAppBannerProps {
  language: Language;
  onViewResults: () => void;
  onDismiss?: () => void;
  severity?: 'low' | 'moderate' | 'high' | 'emergency';
}

export function AnalysisCompleteBanner({
  language,
  onViewResults,
  onDismiss,
  severity = 'moderate'
}: InAppBannerProps) {
  const isRTL = language === 'ar' || language === 'da';

  const getBannerColor = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'moderate':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getTitle = (language: Language) => {
    switch (language) {
      case 'ar':
        return 'تحليل الأعراض جاهز';
      case 'da':
        return 'تحليل الأعراض جاهز';
      case 'fr':
        return 'Analyse des symptômes prête';
      default:
        return 'Symptom Analysis Ready';
    }
  };

  const getMessage = (language: Language) => {
    switch (language) {
      case 'ar':
        return 'تم تحليل الأعراض المقدمة. انقر لعرض التوصيات والنصائح الطبية.';
      case 'da':
        return 'تحللو الأعراض اللي عطيتي. اضغط باش تشوف التوصيات والنصائح الطبية.';
      case 'fr':
        return 'Vos symptômes ont été analysés. Cliquez pour voir les recommandations et conseils médicaux.';
      default:
        return 'Your symptoms have been analyzed. Click to view medical recommendations and advice.';
    }
  };

  const getActionLabel = (language: Language) => {
    switch (language) {
      case 'ar':
        return 'عرض التحليل';
      case 'da':
        return 'شوف التحليل';
      case 'fr':
        return 'Voir l\'analyse';
      default:
        return 'View Analysis';
    }
  };

  return (
    <div className={`w-full border-2 rounded-lg p-4 mb-6 ${getBannerColor(severity)} animate-slideDown`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="p-2 bg-white/50 rounded-full">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="font-semibold text-sm">{getTitle(language)}</h3>
            <p className="text-sm opacity-90">{getMessage(language)}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            onClick={onViewResults}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-current border border-current/20"
          >
            {getActionLabel(language)}
          </Button>
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="p-1 h-8 w-8 opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export interface PulseIndicatorProps {
  language: Language;
  onClick: () => void;
  severity?: 'low' | 'moderate' | 'high' | 'emergency';
}

export function AnalysisReadyIndicator({
  language,
  onClick,
  severity = 'moderate'
}: PulseIndicatorProps) {
  const getIndicatorColor = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-500 border-red-300';
      case 'high':
        return 'bg-orange-500 border-orange-300';
      case 'moderate':
        return 'bg-blue-500 border-blue-300';
      case 'low':
        return 'bg-green-500 border-green-300';
      default:
        return 'bg-blue-500 border-blue-300';
    }
  };

  const getTooltipText = (language: Language) => {
    switch (language) {
      case 'ar':
        return 'تحليل الأعراض جاهز - انقر للعرض';
      case 'da':
        return 'تحليل الأعراض جاهز - اضغط للعرض';
      case 'fr':
        return 'Analyse des symptômes prête - cliquez pour voir';
      default:
        return 'Symptom analysis ready - click to view';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onClick}
        className={`
          relative p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300
          ${getIndicatorColor(severity)} text-white
          animate-pulse hover:animate-none hover:scale-110
          focus:outline-none focus:ring-4 focus:ring-white/30
        `}
        title={getTooltipText(language)}
        aria-label={getTooltipText(language)}
      >
        <Bell className="h-6 w-6" />
        
        {/* Pulse rings */}
        <div className={`absolute inset-0 rounded-full ${getIndicatorColor(severity)} animate-ping opacity-20`} />
        <div className={`absolute inset-0 rounded-full ${getIndicatorColor(severity)} animate-ping opacity-10 animation-delay-200`} />
        
        {/* Notification badge */}
        <div className="absolute -top-1 -right-1 h-4 w-4 bg-white rounded-full flex items-center justify-center">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      </button>
    </div>
  );
}