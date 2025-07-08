'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Clock, AlertCircle, Navigation, Hospital, Pill, Stethoscope } from 'lucide-react';
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
  const [selectedType, setSelectedType] = useState<string>('hospital|clinic|pharmacy');

  const isRTL = language === 'ar' || language === 'da';

  const facilityTypes = [
    { key: 'hospital|clinic|pharmacy', label: 'الكل', icon: Hospital },
    { key: 'hospital', label: 'مستشفيات', icon: Hospital },
    { key: 'clinic', label: 'عيادات', icon: Stethoscope },
    { key: 'pharmacy', label: 'صيدليات', icon: Pill }
  ];

  const loadNearbyFacilities = async () => {
    if (!userLocation) {
      setError('الموقع غير متاح');
      return;
    }

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
          radius: 10000, // 10km radius
          type: selectedType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحميل المرافق الصحية');
      }

      const facilitiesData: HealthcareFacility[] = await response.json();
      setFacilities(facilitiesData);
      
      if (facilitiesData.length === 0) {
        setError('لم يتم العثور على مرافق صحية قريبة');
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      setError(error instanceof Error ? error.message : 'خطأ في تحميل المرافق الصحية');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) {
      loadNearbyFacilities();
    }
  }, [userLocation, selectedType]);

  const getDirections = (facility: HealthcareFacility) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.location.latitude},${facility.location.longitude}`;
    window.open(url, '_blank');
  };

  const callFacility = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const getFacilityIcon = (type: HealthcareFacility['type']) => {
    switch (type) {
      case 'hospital':
        return Hospital;
      case 'pharmacy':
        return Pill;
      case 'clinic':
        return Stethoscope;
      default:
        return Hospital;
    }
  };

  const getFacilityTypeLabel = (type: HealthcareFacility['type']) => {
    switch (type) {
      case 'hospital':
        return 'مستشفى';
      case 'pharmacy':
        return 'صيدلية';
      case 'clinic':
        return 'عيادة';
      case 'emergency':
        return 'طوارئ';
      default:
        return 'مرفق صحي';
    }
  };

  const getBadgeColor = (type: HealthcareFacility['type']) => {
    switch (type) {
      case 'hospital':
        return 'bg-red-100 text-red-800';
      case 'pharmacy':
        return 'bg-green-100 text-green-800';
      case 'clinic':
        return 'bg-blue-100 text-blue-800';
      case 'emergency':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!userLocation) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            يرجى السماح بالوصول إلى الموقع للعثور على المرافق الصحية القريبة
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Hospital className="h-5 w-5" />
            {getTranslation(language, 'nearbyFacilities')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {facilityTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <Button
                  key={type.key}
                  variant={selectedType === type.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type.key)}
                  className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <IconComponent className="h-4 w-4" />
                  {type.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري البحث عن المرافق الصحية...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className={`flex items-center gap-2 text-red-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button 
              onClick={loadNearbyFacilities} 
              variant="outline" 
              size="sm" 
              className="mt-4"
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Facilities List */}
      {!isLoading && !error && facilities.length > 0 && (
        <div className="space-y-4">
          {facilities.map((facility) => {
            const IconComponent = getFacilityIcon(facility.type);
            return (
              <Card key={facility.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <IconComponent className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">{facility.name}</h3>
                        <Badge className={getBadgeColor(facility.type)}>
                          {getFacilityTypeLabel(facility.type)}
                        </Badge>
                        {facility.emergency_services && (
                          <Badge className="bg-red-100 text-red-800">
                            طوارئ
                          </Badge>
                        )}
                      </div>
                      
                      <div className={`space-y-2 text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <MapPin className="h-4 w-4" />
                          <span>{facility.address}</span>
                        </div>
                        
                        {facility.phone && (
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Phone className="h-4 w-4" />
                            <span>{facility.phone}</span>
                          </div>
                        )}
                        
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Clock className="h-4 w-4" />
                          <span>{facility.hours}</span>
                        </div>
                      </div>

                      {facility.services.length > 0 && (
                        <div className={`mt-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p className="text-sm font-medium text-gray-700 mb-1">الخدمات:</p>
                          <div className={`flex flex-wrap gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            {facility.services.slice(0, 3).map((service, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {facility.services.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{facility.services.length - 3} أخرى
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button
                      onClick={() => getDirections(facility)}
                      size="sm"
                      className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <Navigation className="h-4 w-4" />
                      الاتجاهات
                    </Button>
                    
                    {facility.phone && (
                      <Button
                        onClick={() => callFacility(facility.phone!)}
                        variant="outline"
                        size="sm"
                        className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <Phone className="h-4 w-4" />
                        اتصال
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && facilities.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Hospital className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              لم يتم العثور على مرافق صحية في المنطقة المحددة
            </p>
            <Button onClick={loadNearbyFacilities} variant="outline" className="mt-4">
              البحث مرة أخرى
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}