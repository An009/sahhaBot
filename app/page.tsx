'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/ui/language-selector';
import { SymptomInput } from '@/components/ui/symptom-input';
import { SymptomAnalysisDisplay } from '@/components/ui/symptom-analysis';
import { HealthcareFinder } from '@/components/ui/healthcare-finder';
import { Heart, MapPin, Wifi, WifiOff, Shield } from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';
import { AIService, type SymptomAnalysis } from '@/lib/ai-service';

export default function Home() {
  const [language, setLanguage] = useState<Language>('ar');
  const [currentStep, setCurrentStep] = useState<'input' | 'analysis' | 'facilities'>('input');
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }

    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSymptomSubmit = async (symptomText: string) => {
    setSymptoms(symptomText);
    setIsLoading(true);
    
    try {
      const aiService = AIService.getInstance();
      const result = await aiService.analyzeSymptoms(symptomText, language);
      setAnalysis(result);
      setCurrentStep('analysis');
    } catch (error) {
      console.error('Analysis error:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergency = () => {
    // In a real app, this would trigger emergency services
    window.open('tel:150', '_self'); // Morocco emergency number
  };

  const isRTL = language === 'ar' || language === 'da';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 bg-blue-600 rounded-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
              <h1 className="text-2xl font-bold text-gray-900">
                {getTranslation(language, 'appName')}
              </h1>
              <p className="text-gray-600 text-sm">
                {getTranslation(language, 'welcome')}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm text-gray-600">
                {isOnline ? 'متصل' : getTranslation(language, 'offline')}
              </span>
            </div>
            <LanguageSelector 
              currentLanguage={language} 
              onLanguageChange={setLanguage} 
            />
          </div>
        </header>

        {/* Navigation */}
        <nav className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant={currentStep === 'input' ? 'default' : 'outline'}
            onClick={() => setCurrentStep('input')}
            className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Heart className="h-4 w-4" />
            {getTranslation(language, 'symptoms')}
          </Button>
          
          <Button
            variant={currentStep === 'analysis' ? 'default' : 'outline'}
            onClick={() => setCurrentStep('analysis')}
            disabled={!analysis}
            className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Shield className="h-4 w-4" />
            {getTranslation(language, 'analysis')}
          </Button>
          
          <Button
            variant={currentStep === 'facilities' ? 'default' : 'outline'}
            onClick={() => setCurrentStep('facilities')}
            className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <MapPin className="h-4 w-4" />
            {getTranslation(language, 'findHealthcare')}
          </Button>
        </nav>

        {/* Main Content */}
        <main className="space-y-8">
          {currentStep === 'input' && (
            <SymptomInput
              language={language}
              onSubmit={handleSymptomSubmit}
              onEmergency={handleEmergency}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'analysis' && analysis && (
            <SymptomAnalysisDisplay
              analysis={analysis}
              language={language}
              symptoms={symptoms}
            />
          )}

          {currentStep === 'facilities' && (
            <HealthcareFinder
              language={language}
              userLocation={userLocation}
            />
          )}

          {/* Offline Indicator */}
          {!isOnline && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 text-orange-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">
                    {getTranslation(language, 'syncWhenOnline')}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Footer */}
        <footer className={`mt-16 text-center text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
          <p>
            ⚠️ هذا التطبيق للمساعدة الطبية الأولية فقط. في حالة الطوارئ، اتصل بـ 150
          </p>
        </footer>
      </div>
    </div>
  );
}