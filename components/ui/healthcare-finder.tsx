'use client';

import { useState, useEffect } from 'react';
import { MotionWrapper } from './motion-wrapper';
import { GlassCard } from './glass-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Navigation, 
  Hospital, 
  Building2, 
  Cross,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Filter
} from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';
import type { HealthcareFacility } from '@/lib/supabase';

interface HealthcareFinderProps {
  language: Language;
  userLocation: { latitude: number; longitude: number } | null;
}

export function HealthcareFinder({ language, userLocation }: HealthcareFinderProps) {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchRadius, setSearchRadius] = useState(5000);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userLocation) {
      loadNearbyFacilities();
    }
  }, [userLocation, selectedType, searchRadius]);

  const loadNearbyFacilities = async () => {
    if (!userLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      const typeFilter = selectedType === 'all' ? 'hospital|clinic|pharmacy' : selectedType;
      
      const response = await fetch('/api/healthcare-facilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: searchRadius,
          type: typeFilter
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load healthcare facilities');
      }

      const facilitiesData = await response.json();
      setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error loading facilities:', error);
      setError(error instanceof Error ? error.message : 'Failed to load facilities');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFacilities = facilities.filter(facility => {
    if (!searchQuery) return true;
    return facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           facility.address.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Hospital className="h-5 w-5 text-red-600" />;
      case 'clinic':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'pharmacy':
        return <Cross className="h-5 w-5 text-green-600" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-600" />;
    }
  };

  const getFacilityTypeColor = (type: string) => {
    switch (type) {
      case 'hospital':
        return 'bg-red-100 text-red-800';
      case 'clinic':
        return 'bg-blue-100 text-blue-800';
      case 'pharmacy':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openDirections = (facility: HealthcareFacility) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.location.latitude},${facility.location.longitude}`;
    window.open(url, '_blank');
  };

  const callFacility = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const isRTL = language === 'ar' || language === 'da';

  if (!userLocation) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {getTranslation(language, 'locationRequired')}
          </h3>
          <p className="text-gray-600">
            {language === 'ar' 
              ? 'يرجى السماح بالوصول إلى الموقع للعثور على المرافق الصحية القريبة'
              : language === 'fr'
              ? 'Veuillez autoriser l\'accès à la localisation pour trouver les établissements de santé à proximité'
              : 'خاصك تسمح بالوصول للموقع باش نلقاو ليك المستشفيات القريبة'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <MapPin className="h-5 w-5" />
            {getTranslation(language, 'nearbyFacilities')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <Input
            placeholder={
              language === 'ar' 
                ? 'البحث عن مرفق صحي...'
                : language === 'fr'
                ? 'Rechercher un établissement de santé...'
                : 'قلب على مستشفى...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={isRTL ? 'text-right' : 'text-left'}
            dir={isRTL ? 'rtl' : 'ltr'}
          />

          {/* Filter Buttons */}
          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Filter className="h-4 w-4" />
              {language === 'ar' ? 'الكل' : language === 'fr' ? 'Tous' : 'الكل'}
            </Button>
            <Button
              variant={selectedType === 'hospital' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('hospital')}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Hospital className="h-4 w-4" />
              {language === 'ar' ? 'مستشفيات' : language === 'fr' ? 'Hôpitaux' : 'مستشفيات'}
            </Button>
            <Button
              variant={selectedType === 'clinic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('clinic')}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Building2 className="h-4 w-4" />
              {language === 'ar' ? 'عيادات' : language === 'fr' ? 'Cliniques' : 'عيادات'}
            </Button>
            <Button
              variant={selectedType === 'pharmacy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('pharmacy')}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Cross className="h-4 w-4" />
              {language === 'ar' ? 'صيدليات' : language === 'fr' ? 'Pharmacies' : 'صيدليات'}
            </Button>
          </div>

          {/* Radius Control */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <label className="text-sm font-medium">
              {language === 'ar' ? 'نطاق البحث:' : language === 'fr' ? 'Rayon de recherche:' : 'نطاق البحث:'}
            </label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value={1000}>1 km</option>
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}