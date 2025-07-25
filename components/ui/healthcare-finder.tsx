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

// --- NEW IMPORTS FOR MAP ---
// Ensure you have installed 'leaflet' and 'react-leaflet':
// npm install leaflet react-leaflet
// or
// yarn add leaflet react-leaflet
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Essential Leaflet CSS
import L from 'leaflet'; // Import Leaflet itself for custom icons

// Fix for default Leaflet icon issue with Webpack/React
// Without this, default marker icons may not show up.
// Corrected typo from '_get IconUrl' to '_getIconUrl'
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
// --- END NEW IMPORTS FOR MAP ---

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

  // --- MODIFICATION: useEffect to trigger data load on userLocation/filters change ---
  useEffect(() => {
    if (userLocation) {
      loadNearbyFacilities();
    }
  }, [userLocation, searchRadius, facilityType]); // Removed searchQuery from dependencies here
  // Rationale: searchQuery filters already loaded data, no need to re-fetch from API

  const loadNearbyFacilities = async () => {
    if (!userLocation) {
      setError(
        language === 'ar' 
          ? 'خطأ: الموقع غير متاح. يرجى السماح بالوصول إلى موقعك.'
          : language === 'fr'
          ? 'Erreur: Localisation non disponible. Veuillez autoriser l\'accès à votre position.'
          : 'خطأ: الموقع ما متوفرش. خاصك تسمح بالوصول للموقع ديالك.'
      );
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
          radius: parseInt(searchRadius),
          type: facilityType === 'all' ? 'hospital|clinic|pharmacy' : facilityType
        }),
      });

      if (!response.ok) {
        // Attempt to parse error message from response body
        const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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
    } catch (err: any) {
      console.error('Error loading facilities:', err);
      setError(
        err.message || 
        (language === 'ar' 
          ? 'خطأ في تحميل المرافق الصحية. يرجى المحاولة مرة أخرى.'
          : language === 'fr'
          ? 'Erreur lors du chargement des établissements de santé. Veuillez réessayer.'
          : 'خطأ في تحميل المستشفيات. عاود المحاولة.'
        )
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
    
    // Using Google Maps for directions as it's common and reliable
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.location.latitude},${facility.location.longitude}`;
    window.open(url, '_blank');
  };

  const callFacility = (phone: string) => {
    if (typeof window === 'undefined') return;
    window.open(`tel:${phone}`, '_self');
  };

  // --- MODIFICATION: Filtering now applies to the 'facilities' state which is already loaded ---
  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // --- END MODIFICATION ---

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
                onClick={loadNearbyFacilities} // Still trigger re-fetch when filter button is clicked
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

      {/* --- NEW SECTION: Interactive Map Display --- */}
      {userLocation && (
        <MotionWrapper animation="slideUp" delay={200}>
          <GlassCard className="h-[400px] w-full relative overflow-hidden">
            <MapContainer 
              center={[userLocation.latitude, userLocation.longitude]} 
              zoom={13} 
              scrollWheelZoom={true} // Allow zooming with mouse wheel
              className="h-full w-full rounded-lg z-0"
              // Add a key to force remount on userLocation change, preventing map issues
              key={`${userLocation.latitude}-${userLocation.longitude}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Marker for user's current location */}
              <Marker position={[userLocation.latitude, userLocation.longitude]}>
                <Popup>
                  {getTranslation(language, 'yourLocation')}
                </Popup>
              </Marker>
              {/* Markers for healthcare facilities */}
              {filteredFacilities.map(facility => (
                <Marker key={facility.id} position={[facility.location.latitude, facility.location.longitude]}>
                  <Popup>
                    <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      <h4 className="font-bold text-gray-900">{facility.name}</h4>
                      <p className="text-sm text-gray-700">{facility.address}</p>
                      {facility.distance && (
                        <p className="text-xs text-blue-600 mt-1">
                          {formatDistance(facility.distance)}
                        </p>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => openDirections(facility)}
                        className={`p-0 h-auto mt-2 ${isRTL ? 'justify-end' : 'justify-start'}`}
                      >
                        <Navigation className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {language === 'ar' ? 'اتجاهات' : language === 'fr' ? 'Directions' : 'اتجاهات'}
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            )}
            <p className={`absolute bottom-4 ${isRTL ? 'right-4' : 'left-4'} text-xs text-gray-400 z-10 bg-white/70 px-2 py-1 rounded-md`}>
                {getTranslation(language, 'mapAttribution')}
            </p>
          </GlassCard>
        </MotionWrapper>
      )}
      {/* --- END NEW SECTION --- */}

      {/* Error State */}
      {error && (
        <MotionWrapper animation="slideUp" delay={200}>
          <GlassCard className="border-red-200 bg-red-50/80">
            <CardContent className="p-4">
              <div className={`flex items-start gap-3 text-red-800 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </CardContent>
          </GlassCard>
        </MotionWrapper>
      )}

      {/* Loading State for List */}
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
              <MotionWrapper key={facility.id} animation="slideUp" delay={300 + index * 50}> {/* Adjusted delay for faster animation */}
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