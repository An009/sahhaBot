'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Navigation, 
  Search,
  Filter,
  Hospital,
  Pill,
  Stethoscope,
  AlertTriangle
} from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { GlassCard } from '@/components/ui/glass-card';

interface HealthcareFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'emergency';
  address: string;
  phone?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  services: string[];
  hours: string;
  emergency_services: boolean;
  distance?: number;
}

interface HealthcareFinderProps {
  language: Language;
  userLocation: { latitude: number; longitude: number } | null;
}

export function HealthcareFinder({ language, userLocation }: HealthcareFinderProps) {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState('5000');
  const [facilityType, setFacilityType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isRTL = language === 'ar' || language === 'da';

  useEffect(() => {
    if (userLocation) {
      loadNearbyFacilities();
    }
  }, [userLocation, searchRadius, facilityType]);

  const loadNearbyFacilities = async () => {
    if (!userLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/healthcare-facilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: parseInt(searchRadius),
          type: facilityType === 'all' ? 'hospital|clinic|pharmacy' : facilityType
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Calculate distances and sort by proximity
      const facilitiesWithDistance = data.map((facility: HealthcareFacility) => ({
        ...facility,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          facility.location.latitude,
          facility.location.longitude
        )
      })).sort((a: HealthcareFacility, b: HealthcareFacility) => 
        (a.distance || 0) - (b.distance || 0)
      );

      setFacilities(facilitiesWithDistance);
    } catch (error) {
      console.error('Error loading facilities:', error);
      setError(
        language === 'ar' 
          ? 'خطأ في تحميل المرافق الصحية. يرجى المحاولة مرة أخرى.'
          : language === 'fr'
          ? 'Erreur lors du chargement des établissements de santé. Veuillez réessayer.'
          : 'خطأ في تحميل المستشفيات. عاود المحاولة.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)} م`;
    } else {
      return `${(distance / 1000).toFixed(1)} كم`;
    }
  };

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return Hospital;
      case 'pharmacy':
        return Pill;
      case 'emergency':
        return AlertTriangle;
      default:
        return Stethoscope;
    }
  };

  const getFacilityTypeLabel = (type: string) => {
    switch (type) {
      case 'hospital':
        return language === 'ar' ? 'مستشفى' : language === 'fr' ? 'Hôpital' : 'مستشفى';
      case 'clinic':
        return language === 'ar' ? 'عيادة' : language === 'fr' ? 'Clinique' : 'عيادة';
      case 'pharmacy':
        return language === 'ar' ? 'صيدلية' : language === 'fr' ? 'Pharmacie' : 'صيدلية';
      case 'emergency':
        return language === 'ar' ? 'طوارئ' : language === 'fr' ? 'Urgences' : 'طوارئ';
      default:
        return type;
    }
  };

  const openDirections = (facility: HealthcareFacility) => {
    if (typeof window === 'undefined') return;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.location.latitude},${facility.location.longitude}`;
    window.open(url, '_blank');
  };

  const callFacility = (phone: string) => {
    if (typeof window === 'undefined') return;
    window.open(`tel:${phone}`, '_self');
  };

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userLocation) {
    return (
      <MotionWrapper animation="slideUp" delay={100}>
        <GlassCard className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {getTranslation(language, 'locationRequired')}
            </h3>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'يرجى السماح بالوصول إلى موقعك لإيجاد المرافق الصحية القريبة'
                : language === 'fr'
                ? 'Veuillez autoriser l\'accès à votre localisation pour trouver les établissements de santé à proximité'
                : 'خاصك تسمح بالوصول للموقع ديالك باش نلقاو المستشفيات القريبة'
              }
            </p>
          </CardContent>
        </GlassCard>
      </MotionWrapper>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Search and Filters */}
      <MotionWrapper animation="slideUp" delay={100}>
        <GlassCard>
          <CardHeader className="pb-4">
            <CardTitle className={`flex items-center gap-2 text-xl ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <MapPin className="h-6 w-6 text-blue-600" />
              {getTranslation(language, 'nearbyFacilities')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className={`absolute top-3 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={
                  language === 'ar' 
                    ? 'البحث عن مستشفى أو صيدلية...'
                    : language === 'fr'
                    ? 'Rechercher un hôpital ou une pharmacie...'
                    : 'قلب على مستشفى أو صيدلية...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? 'pr-10 text-right' : 'pl-10'} h-12 text-base`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Filters */}
            <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <Select value={facilityType} onValueChange={setFacilityType}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={language === 'ar' ? 'نوع المرفق' : 'Type d\'établissement'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === 'ar' ? 'جميع المرافق' : language === 'fr' ? 'Tous les établissements' : 'جميع المرافق'}
                    </SelectItem>
                    <SelectItem value="hospital">
                      {language === 'ar' ? 'مستشفيات' : language === 'fr' ? 'Hôpitaux' : 'مستشفيات'}
                    </SelectItem>
                    <SelectItem value="clinic">
                      {language === 'ar' ? 'عيادات' : language === 'fr' ? 'Cliniques' : 'عيادات'}
                    </SelectItem>
                    <SelectItem value="pharmacy">
                      {language === 'ar' ? 'صيدليات' : language === 'fr' ? 'Pharmacies' : 'صيدليات'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select value={searchRadius} onValueChange={setSearchRadius}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={language === 'ar' ? 'نطاق البحث' : 'Rayon de recherche'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1 كم</SelectItem>
                    <SelectItem value="5000">5 كم</SelectItem>
                    <SelectItem value="10000">10 كم</SelectItem>
                    <SelectItem value="25000">25 كم</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={loadNearbyFacilities}
                disabled={isLoading}
                className="h-12 px-6 hover-lift"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </GlassCard>
      </MotionWrapper>

      {/* Error State */}
      {error && (
        <MotionWrapper animation="slideUp" delay={200}>
          <GlassCard className="border-red-200 bg-red-50/80">
            <CardContent className="p-4">
              <div className={`flex items-center gap-3 text-red-800 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </CardContent>
          </GlassCard>
        </MotionWrapper>
      )}

      {/* Loading State */}
      {isLoading && (
        <MotionWrapper animation="fadeIn" delay={200}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <GlassCard key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </GlassCard>
            ))}
          </div>
        </MotionWrapper>
      )}

      {/* Facilities List */}
      {!isLoading && filteredFacilities.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFacilities.map((facility, index) => {
            const FacilityIcon = getFacilityIcon(facility.type);
            
            return (
              <MotionWrapper key={facility.id} animation="slideUp" delay={300 + index * 100}>
                <GlassCard className="h-full hover-lift transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-2 rounded-lg ${
                          facility.type === 'hospital' ? 'bg-red-100 text-red-600' :
                          facility.type === 'pharmacy' ? 'bg-green-100 text-green-600' :
                          facility.type === 'emergency' ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <FacilityIcon className="h-5 w-5" />
                        </div>
                        <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                            {facility.name}
                          </h3>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {getFacilityTypeLabel(facility.type)}
                          </Badge>
                        </div>
                      </div>
                      
                      {facility.emergency_services && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                          {language === 'ar' ? 'طوارئ' : '24/7'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Address */}
                    <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 line-clamp-2">
                        {facility.address}
                      </span>
                    </div>

                    {/* Distance */}
                    {facility.distance && (
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Navigation className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">
                          {formatDistance(facility.distance)}
                        </span>
                      </div>
                    )}

                    {/* Hours */}
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 line-clamp-1">
                        {facility.hours}
                      </span>
                    </div>

                    {/* Services */}
                    {facility.services.length > 0 && (
                      <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="flex flex-wrap gap-1">
                          {facility.services.slice(0, 3).map((service, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {facility.services.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{facility.services.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className={`flex gap-2 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDirections(facility)}
                        className="flex-1 hover-lift"
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        {language === 'ar' ? 'اتجاهات' : language === 'fr' ? 'Directions' : 'اتجاهات'}
                      </Button>
                      
                      {facility.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => callFacility(facility.phone!)}
                          className="flex-1 hover-lift"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          {language === 'ar' ? 'اتصال' : language === 'fr' ? 'Appeler' : 'اتصال'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </GlassCard>
              </MotionWrapper>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredFacilities.length === 0 && !error && (
        <MotionWrapper animation="fadeIn" delay={300}>
          <GlassCard className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {language === 'ar' ? 'لم يتم العثور على مرافق' : language === 'fr' ? 'Aucun établissement trouvé' : 'ما لقيناش مرافق'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'جرب توسيع نطاق البحث أو تغيير نوع المرفق'
                  : language === 'fr'
                  ? 'Essayez d\'élargir le rayon de recherche ou de changer le type d\'établissement'
                  : 'جرب توسيع نطاق البحث أو بدل نوع المرفق'
                }
              </p>
            </CardContent>
          </GlassCard>
        </MotionWrapper>
      )}
    </div>
  );
}