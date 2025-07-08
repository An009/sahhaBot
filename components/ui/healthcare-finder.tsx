'use client';

import { useState, useEffect } from 'react';
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
              <option value={10000}>10 km</option>
              <option value={20000}>20 km</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadNearbyFacilities}
              disabled={isLoading}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {language === 'ar' ? 'تحديث' : language === 'fr' ? 'Actualiser' : 'تحديث'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
            <div className="text-center py-8">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'لم يتم العثور على مرافق صحية في المنطقة المحددة'
                  : language === 'fr'
                  ? 'Aucun établissement de santé trouvé dans la zone spécifiée'
                  : 'ما لقيناش مستشفيات في المنطقة اللي اخترتي'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className={`text-sm text-gray-600 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {language === 'ar' 
                  ? `تم العثور على ${filteredFacilities.length} مرفق صحي`
                  : language === 'fr'
                  ? `${filteredFacilities.length} établissements trouvés`
                  : `لقينا ${filteredFacilities.length} مستشفى`
                }
              </p>
              
              {filteredFacilities.map((facility) => (
                <Card key={facility.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-shrink-0">
                        {getFacilityIcon(facility.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-start justify-between gap-4 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                            <h3 className="font-semibold text-lg">{facility.name}</h3>
                            <p className="text-gray-600 text-sm">{facility.address}</p>
                          </div>
                          
                          <div className={`flex flex-col gap-2 ${isRTL ? 'items-end' : 'items-start'}`}>
                            <Badge className={getFacilityTypeColor(facility.type)}>
                              {facility.type === 'hospital' 
                                ? (language === 'ar' ? 'مستشفى' : language === 'fr' ? 'Hôpital' : 'مستشفى')
                                : facility.type === 'clinic'
                                ? (language === 'ar' ? 'عيادة' : language === 'fr' ? 'Clinique' : 'عيادة')
                                : (language === 'ar' ? 'صيدلية' : language === 'fr' ? 'Pharmacie' : 'صيدلية')
                              }
                            </Badge>
                            
                            {facility.emergency_services && (
                              <Badge variant="destructive" className="text-xs">
                                {language === 'ar' ? 'طوارئ' : language === 'fr' ? 'Urgences' : 'طوارئ'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Services */}
                        {facility.services.length > 0 && (
                          <div className={`mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <p className="text-sm font-medium mb-1">
                              {language === 'ar' ? 'الخدمات:' : language === 'fr' ? 'Services:' : 'الخدمات:'}
                            </p>
                            <div className={`flex flex-wrap gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              {facility.services.slice(0, 3).map((service, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                              {facility.services.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{facility.services.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Hours */}
                        <div className={`flex items-center gap-2 mb-3 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Clock className="h-4 w-4" />
                          <span>{facility.hours}</span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Button
                            size="sm"
                            onClick={() => openDirections(facility)}
                            className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                          >
                            <Navigation className="h-4 w-4" />
                            {language === 'ar' ? 'الاتجاهات' : language === 'fr' ? 'Directions' : 'الاتجاهات'}
                          </Button>
                          
                          {facility.phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => callFacility(facility.phone!)}
                              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                              <Phone className="h-4 w-4" />
                              {language === 'ar' ? 'اتصال' : language === 'fr' ? 'Appeler' : 'اتصال'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}