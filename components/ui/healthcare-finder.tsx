'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { getTranslation, type Language } from '@/lib/i18n';
import type { HealthcareFacility } from '@/lib/supabase';

interface HealthcareFinderProps {
  language: Language;
  userLocation?: { latitude: number; longitude: number };
}

export function HealthcareFinder({ language, userLocation }: HealthcareFinderProps) {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLocation) {
      loadNearbyFacilities();
    }
  }, [userLocation]);

  const loadNearbyFacilities = async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      // Mock data for demonstration - in real app, this would come from Supabase
      const mockFacilities: HealthcareFacility[] = [
        {
          id: '1',
          name: 'مستشفى محمد الخامس',
          type: 'hospital',
          address: 'شارع الحسن الثاني، الرباط',
          phone: '+212 5 37 77 77 77',
          location: { latitude: 34.0209, longitude: -6.8417 },
          services: ['طوارئ', 'جراحة', 'طب عام'],
          hours: '24/7',
          emergency_services: true
        },
        {
          id: '2',
          name: 'عيادة الأطلس',
          type: 'clinic',
          address: 'حي الرياض، الرباط',
          phone: '+212 5 37 88 88 88',
          location: { latitude: 34.0189, longitude: -6.8347 },
          services: ['طب عام', 'طب الأطفال'],
          hours: '8:00 - 20:00',
          emergency_services: false
        },
        {
          id: '3',
          name: 'صيدلية النور',
          type: 'pharmacy',
          address: 'شارع الزرقطوني، الرباط',
          phone: '+212 5 37 99 99 99',
          location: { latitude: 34.0199, longitude: -6.8387 },
          services: ['أدوية', 'استشارة صيدلانية'],
          hours: '8:00 - 22:00',
          emergency_services: false
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate distances and sort
      const facilitiesWithDistance = mockFacilities.map(facility => ({
        ...facility,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          facility.location.latitude,
          facility.location.longitude
        )
      })).sort((a, b) => a.distance - b.distance);

      setFacilities(facilitiesWithDistance);
    } catch (err) {
      setError('حدث خطأ في تحميل المرافق الصحية');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'hospital': return '🏥';
      case 'clinic': return '🏥';
      case 'pharmacy': return '💊';
      case 'emergency': return '🚨';
      default: return '🏥';
    }
  };

  const getFacilityColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-blue-100 text-blue-800';
      case 'clinic': return 'bg-green-100 text-green-800';
      case 'pharmacy': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openDirections = (facility: HealthcareFacility) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.location.latitude},${facility.location.longitude}`;
    window.open(url, '_blank');
  };

  const isRTL = language === 'ar' || language === 'da';

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            جاري البحث عن المرافق الصحية القريبة...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={loadNearbyFacilities} className="mt-4">
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className={`${isRTL ? 'text-right' : 'text-left'}`}>
          {getTranslation(language, 'nearbyFacilities')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-2xl">{getFacilityIcon(facility.type)}</span>
                  <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                    <h3 className="font-semibold text-lg">{facility.name}</h3>
                    <p className="text-sm text-gray-600">{facility.address}</p>
                  </div>
                </div>
                <div className={`flex flex-col items-end gap-2 ${isRTL ? 'items-start' : ''}`}>
                  <Badge className={getFacilityColor(facility.type)}>
                    {facility.type}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {(facility as any).distance?.toFixed(1)} km
                  </span>
                </div>
              </div>

              <div className={`flex items-center gap-4 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="h-4 w-4" />
                  <span>{facility.hours}</span>
                </div>
                {facility.emergency_services && (
                  <Badge variant="destructive" className="text-xs">
                    طوارئ
                  </Badge>
                )}
              </div>

              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDirections(facility)}
                  className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Navigation className="h-4 w-4" />
                  الاتجاهات
                </Button>
                {facility.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`tel:${facility.phone}`, '_self')}
                    className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Phone className="h-4 w-4" />
                    اتصال
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}