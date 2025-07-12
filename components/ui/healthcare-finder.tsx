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
      <MotionWrapper animation="slideUp" delay={100}>
        <GlassCard variant="subtle">
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {userLocation ? (
                <>
                  <div className="p-2 bg-green-100 rounded-full">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">Location detected</span>
                    <p className="text-xs text-green-600">
                      {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 bg-orange-100 rounded-full">
                    <MapPin className="h-4 w-4 text-orange-600 animate-pulse" />
                  </div>
                  <span className="text-sm font-medium text-orange-700">
                    {getTranslation(language, 'locationRequired')}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Results */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'جاري البحث عن المرافق الصحية...'
                  : language === 'fr'
                  ? 'Recherche d\'établissements de santé...'
                  : 'كنقلب على المستشفيات...'
                }
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-700">
                {language === 'ar' ? 'خطأ في التحميل' : language === 'fr' ? 'Erreur de chargement' : 'خطأ في التحميل'}
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadNearbyFacilities} variant="outline">
                {language === 'ar' ? 'إعادة المحاولة' : language === 'fr' ? 'Réessayer' : 'إعادة المحاولة'}
              </Button>
            </div>
          ) : filteredFacilities.length === 0 ? (
      <MotionWrapper animation="slideUp" delay={400}>
        <GlassCard hover glow className="backdrop-blur-lg">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-lg font-semibold text-gray-800 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <Building2 className="h-5 w-5 text-blue-600" />
              {getTranslation(language, 'nearbyFacilities')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <MotionWrapper animation="fadeIn">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <span className="text-sm text-gray-600 font-medium">Loading facilities...</span>
                  </div>
                </div>
              </MotionWrapper>
            ) : error ? (
              <MotionWrapper animation="slideUp">
                <div className="text-center py-12">
                  <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-3">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                  <Button
                    onClick={loadNearbyFacilities}
                    variant="outline"
                    size="sm"
                    className="hover-lift"
                  >
                    Try Again
                  </Button>
                </div>
              </MotionWrapper>
            ) : facilities.length === 0 ? (
              <MotionWrapper animation="fadeIn">
                <div className="text-center py-12">
                  <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">No facilities found in your area</p>
                </div>
              </MotionWrapper>
            ) : (
              <div className="space-y-4">
                {facilities.map((facility, index) => (
                  <MotionWrapper key={facility.id} animation="slideUp" delay={500 + index * 100}>
                    <GlassCard 
                      variant="subtle" 
                      hover 
                      className="p-4 hover:shadow-lg transition-all duration-300"
                    >
                      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h3 className="font-semibold text-gray-900">{facility.name}</h3>
                            <Badge 
                              variant={getFacilityTypeVariant(facility.type)}
                              className="shadow-sm"
                            >
                              {facility.type}
                            </Badge>
                            {facility.emergency_services && (
                              <Badge variant="destructive" className="text-xs animate-pulse">
                                Emergency
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span>{facility.address}</span>
                            </div>
                            
                            {facility.phone && (
                              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Phone className="h-4 w-4 text-green-500" />
                                <span>{facility.phone}</span>
                              </div>
                            )}
                            
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Clock className="h-4 w-4 text-orange-500" />
                              <span>{facility.hours}</span>
                            </div>
                          </div>
                          
                          {facility.services.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-2 font-medium">Services:</p>
                              <div className="flex flex-wrap gap-1">
                                {facility.services.slice(0, 3).map((service, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs shadow-sm">
                                    {service}
                                  </Badge>
                                ))}
                                {facility.services.length > 3 && (
                                  <Badge variant="secondary" className="text-xs shadow-sm">
                                    +{facility.services.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => window.open(`tel:${facility.phone}`, '_self')}
                            disabled={!facility.phone}
                            className="whitespace-nowrap bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-sm hover-lift"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.location.latitude},${facility.location.longitude}`;
                              window.open(url, '_blank');
                            }}
                            className="whitespace-nowrap hover-lift border-blue-200 hover:bg-blue-50"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Directions
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  </MotionWrapper>
                ))}
              </div>
            )}
          </CardContent>
        </GlassCard>
      </MotionWrapper>
    </div>
  );
}