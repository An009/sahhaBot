'use client';

import { useState, useCallback, useRef } from 'react';
import { type Language } from '@/lib/i18n';

export interface NotificationState {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number;
  timestamp: number;
}

export interface NotificationOptions {
  type?: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const idCounter = useRef(0);

  const addNotification = useCallback((options: NotificationOptions) => {
    const id = `notification-${++idCounter.current}`;
    const notification: NotificationState = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      action: options.action,
      autoClose: options.autoClose ?? true,
      duration: options.duration ?? 5000,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification if autoClose is enabled
    if (notification.autoClose && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Specialized notification methods
  const showAnalysisComplete = useCallback((
    language: Language,
    onViewResults: () => void,
    severity: 'low' | 'moderate' | 'high' | 'emergency' = 'moderate'
  ) => {
    const getTitle = (lang: Language) => {
      switch (lang) {
        case 'ar': return 'تم إكمال التحليل الطبي';
        case 'da': return 'كمل التحليل الطبي';
        case 'fr': return 'Analyse médicale terminée';
        default: return 'Medical Analysis Complete';
      }
    };

    const getMessage = (lang: Language) => {
      switch (lang) {
        case 'ar': return 'تم تحليل الأعراض بنجاح. النتائج جاهزة للمراجعة.';
        case 'da': return 'تحللو الأعراض مزيان. النتائج جاهزين للمراجعة.';
        case 'fr': return 'Vos symptômes ont été analysés avec succès. Les résultats sont prêts.';
        default: return 'Your symptoms have been successfully analyzed. Results are ready for review.';
      }
    };

    const getActionLabel = (lang: Language) => {
      switch (lang) {
        case 'ar': return 'عرض النتائج';
        case 'da': return 'شوف النتائج';
        case 'fr': return 'Voir les résultats';
        default: return 'View Results';
      }
    };

    const getNotificationType = (sev: string) => {
      switch (sev) {
        case 'emergency':
        case 'high':
          return 'warning' as const;
        case 'moderate':
          return 'info' as const;
        case 'low':
          return 'success' as const;
        default:
          return 'info' as const;
      }
    };

    return addNotification({
      type: getNotificationType(severity),
      title: getTitle(language),
      message: getMessage(language),
      action: {
        label: getActionLabel(language),
        onClick: onViewResults
      },
      autoClose: false // Don't auto-close analysis results
    });
  }, [addNotification]);

  const showError = useCallback((
    language: Language,
    error: string,
    retry?: () => void
  ) => {
    const getTitle = (lang: Language) => {
      switch (lang) {
        case 'ar': return 'حدث خطأ';
        case 'da': return 'وقع خطأ';
        case 'fr': return 'Une erreur s\'est produite';
        default: return 'An Error Occurred';
      }
    };

    const getRetryLabel = (lang: Language) => {
      switch (lang) {
        case 'ar': return 'إعادة المحاولة';
        case 'da': return 'عاود المحاولة';
        case 'fr': return 'Réessayer';
        default: return 'Retry';
      }
    };

    return addNotification({
      type: 'error',
      title: getTitle(language),
      message: error,
      action: retry ? {
        label: getRetryLabel(language),
        onClick: retry
      } : undefined,
      autoClose: false // Don't auto-close errors
    });
  }, [addNotification]);

  const showSuccess = useCallback((
    language: Language,
    message: string,
    action?: { label: string; onClick: () => void }
  ) => {
    const getTitle = (lang: Language) => {
      switch (lang) {
        case 'ar': return 'تم بنجاح';
        case 'da': return 'تم مزيان';
        case 'fr': return 'Succès';
        default: return 'Success';
      }
    };

    return addNotification({
      type: 'success',
      title: getTitle(language),
      message,
      action,
      autoClose: true,
      duration: 4000
    });
  }, [addNotification]);

  const showInfo = useCallback((
    language: Language,
    title: string,
    message: string,
    action?: { label: string; onClick: () => void }
  ) => {
    return addNotification({
      type: 'info',
      title,
      message,
      action,
      autoClose: true,
      duration: 5000
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showAnalysisComplete,
    showError,
    showSuccess,
    showInfo
  };
}