'use client';

import { useState, useEffect } from 'react';
import { ParticleSystem } from '@/components/ui/particle-system';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { GlassCard } from '@/components/ui/glass-card';
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
    <div className={`min-h-screen relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      <AnimatedBackground variant="gradient" />
      <ParticleSystem particleCount={40} connectionDistance={100} mouseInfluence={80} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <MotionWrapper animation="fadeIn" delay={100}>
          <header className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MotionWrapper animation="scale" delay={200}>
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg hover-lift hover-glow">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </MotionWrapper>
              <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                <MotionWrapper animation="slideUp" delay={300}>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {getTranslation(language, 'appName')}
                  </h1>
                </MotionWrapper>
                <MotionWrapper animation="slideUp" delay={400}>
                  <p className="text-gray-600 text-sm mt-1">
                    {getTranslation(language, 'welcome')}
                  </p>
                </MotionWrapper>
              </div>
            </div>
            
            <MotionWrapper animation="slideLeft" delay={500}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <GlassCard variant="subtle" className="px-3 py-2">
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-green-600 animate-pulse" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm text-gray-700 font-medium">
                      {isOnline ? 'متصل' : getTranslation(language, 'offline')}
                    </span>
                  </div>
                </GlassCard>
                <LanguageSelector 
                  currentLanguage={language} 
                  onLanguageChange={setLanguage} 
                />
              </div>
            </MotionWrapper>
          </header>
        </MotionWrapper>

        {/* Navigation */}
        <MotionWrapper animation="slideUp" delay={600}>
          <nav className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex gap-2 p-1 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
              <Button
                variant={currentStep === 'input' ? 'default' : 'ghost'}
                onClick={() => setCurrentStep('input')}
                className={`flex items-center gap-2 transition-all duration-300 ${
                  currentStep === 'input' 
                    ? 'bg-white shadow-lg hover-lift' 
                    : 'hover:bg-white/20'
                } ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Heart className="h-4 w-4" />
                {getTranslation(language, 'symptoms')}
              </Button>
              
              <Button
                variant={currentStep === 'analysis' ? 'default' : 'ghost'}
                onClick={() => setCurrentStep('analysis')}
                disabled={!analysis}
                className={`flex items-center gap-2 transition-all duration-300 ${
                  currentStep === 'analysis' 
                    ? 'bg-white shadow-lg hover-lift' 
                    : 'hover:bg-white/20'
                } ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Shield className="h-4 w-4" />
                {getTranslation(language, 'analysis')}
              </Button>
              
              <Button
                variant={currentStep === 'facilities' ? 'default' : 'ghost'}
                onClick={() => setCurrentStep('facilities')}
                className={`flex items-center gap-2 transition-all duration-300 ${
                  currentStep === 'facilities' 
                    ? 'bg-white shadow-lg hover-lift' 
                    : 'hover:bg-white/20'
                } ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <MapPin className="h-4 w-4" />
                {getTranslation(language, 'findHealthcare')}
              </Button>
            </div>
          </nav>
        </MotionWrapper>

        {/* Main Content */}
        <main className="space-y-8">
          <MotionWrapper animation="fadeIn" delay={700}>
            {currentStep === 'input' && (
              <SymptomInput
                language={language}
                onSubmit={handleSymptomSubmit}
                onEmergency={handleEmergency}
                isLoading={isLoading}
              />
            )}
          </MotionWrapper>

          <MotionWrapper animation="slideUp" delay={300}>
            {currentStep === 'analysis' && analysis && (
              <SymptomAnalysisDisplay
                analysis={analysis}
                language={language}
                symptoms={symptoms}
              />
            )}
          </MotionWrapper>

          <MotionWrapper animation="slideUp" delay={300}>
            {currentStep === 'facilities' && (
              <HealthcareFinder
                language={language}
                userLocation={userLocation}
              />
            )}
          </MotionWrapper>

          {/* Offline Indicator */}
          <MotionWrapper animation="slideUp" delay={800}>
            {!isOnline && (
              <GlassCard className="border-orange-200/50 bg-orange-50/80">
                <CardContent className="p-4">
                  <div className={`flex items-center gap-2 text-orange-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <WifiOff className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-medium">
                      {getTranslation(language, 'syncWhenOnline')}
                    </span>
                  </div>
                </CardContent>
              </GlassCard>
            )}
          </MotionWrapper>
        </main>

        {/* Footer */}
        <MotionWrapper animation="fadeIn" delay={1000}>
          <footer className={`mt-16 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
            <GlassCard variant="subtle" className="p-4">
              <p className="text-sm text-gray-600 font-medium">
                ⚠️ هذا التطبيق للمساعدة الطبية الأولية فقط. في حالة الطوارئ، اتصل بـ 150
              </p>
            </GlassCard>
          </footer>
        </MotionWrapper>
      </div>
    </div>
  );
}