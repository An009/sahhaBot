'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Languages, Check } from 'lucide-react';
import { languages, type Language } from '@/lib/i18n';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = (language: Language) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  const getLanguageFlag = (lang: Language) => {
    switch (lang) {
      case 'ar':
        return '🇸🇦';
      case 'fr':
        return '🇫🇷';
      case 'da':
        return '🇲🇦';
      default:
        return '🌐';
    }
  };

  const getLanguageLabel = (lang: Language) => {
    return languages[lang];
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 h-10 px-3 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-300 hover-lift"
        >
          <Languages className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {getLanguageFlag(currentLanguage)} {getLanguageLabel(currentLanguage)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-1"
        sideOffset={8}
      >
        {Object.entries(languages).map(([lang, label], index) => (
          <MotionWrapper key={lang} animation="slideLeft" delay={index * 50}>
            <DropdownMenuItem
              onClick={() => handleLanguageSelect(lang as Language)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 focus:bg-blue-50 ${
                currentLanguage === lang ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getLanguageFlag(lang as Language)}</span>
                <span className="font-medium">{label}</span>
              </div>
              
              {currentLanguage === lang && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-blue-200 text-blue-800">
                    نشط
                  </Badge>
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
              )}
            </DropdownMenuItem>
          </MotionWrapper>
        ))}
        
        {/* Language Info */}
        <div className="border-t border-gray-200 mt-2 pt-2">
          <div className="px-3 py-2">
            <p className="text-xs text-gray-500 text-center">
              {currentLanguage === 'ar' 
                ? 'اختر لغتك المفضلة'
                : currentLanguage === 'fr'
                ? 'Choisissez votre langue'
                : 'اختار اللغة ديالك'
              }
            </p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}