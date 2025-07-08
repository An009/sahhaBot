import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Types for request and response
interface HealthcareFacilitiesRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  type?: string;
}

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
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    amenity?: string;
    healthcare?: string;
    'addr:full'?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    phone?: string;
    'opening_hours'?: string;
    emergency?: string;
    'emergency:phone'?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Rate limiting function
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 20; // Max 20 requests per minute for location services

  const clientData = rateLimitStore.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (clientData.count >= maxRequests) {
    return false;
  }
  
  clientData.count++;
  return true;
}

// Input validation function
function validateInput(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }

  if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
    return { isValid: false, error: 'Latitude must be a number between -90 and 90' };
  }

  if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
    return { isValid: false, error: 'Longitude must be a number between -180 and 180' };
  }

  if (data.radius !== undefined) {
    if (typeof data.radius !== 'number' || data.radius < 100 || data.radius > 50000) {
      return { isValid: false, error: 'Radius must be a number between 100 and 50000 meters' };
    }
  }

  if (data.type !== undefined) {
    if (typeof data.type !== 'string') {
      return { isValid: false, error: 'Type must be a string' };
    }
  }

  return { isValid: true };
}

// Create Overpass API query
function createOverpassQuery(latitude: number, longitude: number, radius: number, type: string): string {
  // Convert radius from meters to degrees (approximate)
  const radiusDegrees = radius / 111000; // Rough conversion: 1 degree ≈ 111km
  
  // Define the bounding box
  const south = latitude - radiusDegrees;
  const west = longitude - radiusDegrees;
  const north = latitude + radiusDegrees;
  const east = longitude + radiusDegrees;

  // Build query based on type
  let amenityFilter = '';
  if (type.includes('hospital')) {
    amenityFilter += 'node["amenity"="hospital"](' + south + ',' + west + ',' + north + ',' + east + ');';
    amenityFilter += 'way["amenity"="hospital"](' + south + ',' + west + ',' + north + ',' + east + ');';
  }
  if (type.includes('clinic')) {
    amenityFilter += 'node["amenity"="clinic"](' + south + ',' + west + ',' + north + ',' + east + ');';
    amenityFilter += 'way["amenity"="clinic"](' + south + ',' + west + ',' + north + ',' + east + ');';
    amenityFilter += 'node["healthcare"="centre"](' + south + ',' + west + ',' + north + ',' + east + ');';
    amenityFilter += 'way["healthcare"="centre"](' + south + ',' + west + ',' + north + ',' + east + ');';
  }
  if (type.includes('pharmacy')) {
    amenityFilter += 'node["amenity"="pharmacy"](' + south + ',' + west + ',' + north + ',' + east + ');';
    amenityFilter += 'way["amenity"="pharmacy"](' + south + ',' + west + ',' + north + ',' + east + ');';
  }

  return `
    [out:json][timeout:25];
    (
      ${amenityFilter}
    );
    out center meta;
  `;
}

// Transform Overpass data to HealthcareFacility
function transformOverpassData(elements: OverpassElement[]): HealthcareFacility[] {
  return elements
    .filter(element => element.lat && element.lon && element.tags?.name)
    .map(element => {
      const tags = element.tags!;
      
      // Determine facility type
      let facilityType: 'hospital' | 'clinic' | 'pharmacy' | 'emergency' = 'clinic';
      if (tags.amenity === 'hospital') {
        facilityType = 'hospital';
      } else if (tags.amenity === 'pharmacy') {
        facilityType = 'pharmacy';
      } else if (tags.healthcare === 'centre' || tags.amenity === 'clinic') {
        facilityType = 'clinic';
      }

      // Build address
      let address = tags['addr:full'] || '';
      if (!address) {
        const parts = [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city']
        ].filter(Boolean);
        address = parts.join(', ') || 'Address not available';
      }

      // Determine services based on type and tags
      const services: string[] = [];
      if (facilityType === 'hospital') {
        services.push('Emergency Care', 'Inpatient Care', 'Surgery', 'Diagnostics');
      } else if (facilityType === 'pharmacy') {
        services.push('Prescription Medications', 'Over-the-counter drugs', 'Health consultations');
      } else if (facilityType === 'clinic') {
        services.push('General Practice', 'Consultations', 'Basic Diagnostics');
      }

      // Check for emergency services
      const hasEmergencyServices = tags.emergency === 'yes' || 
                                 facilityType === 'hospital' || 
                                 !!tags['emergency:phone'];

      return {
        id: `osm-${element.type}-${element.id}`,
        name: tags.name,
        type: facilityType,
        address,
        phone: tags.phone || tags['emergency:phone'],
        location: {
          latitude: element.lat!,
          longitude: element.lon!
        },
        services,
        hours: tags['opening_hours'] || 'Hours not available',
        emergency_services: hasEmergencyServices
      };
    })
    .slice(0, 20); // Limit to 20 results
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Parse and validate request body
    let requestData: HealthcareFacilitiesRequest;
    try {
      requestData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Validate input data
    const validation = validateInput(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    const { latitude, longitude, radius = 5000, type = 'hospital|clinic|pharmacy' } = requestData;

    // Create Overpass API query
    const query = createOverpassQuery(latitude, longitude, radius, type);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Make request to Overpass API
      const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SahhaBot/1.0 (Medical Assistant App)'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!overpassResponse.ok) {
        console.error(`Overpass API error: ${overpassResponse.status}`);
        return NextResponse.json(
          { error: 'Healthcare facilities service is temporarily unavailable' },
          { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }

      // Parse response
      const overpassData: OverpassResponse = await overpassResponse.json();
      
      if (!overpassData.elements || !Array.isArray(overpassData.elements)) {
        console.error('Invalid response structure from Overpass API');
        return NextResponse.json(
          { error: 'Invalid response from healthcare facilities service' },
          { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }

      // Transform data
      let facilities = transformOverpassData(overpassData.elements);
      
      // Filter by actual distance and sort by proximity
      facilities = facilities
        .map(facility => ({
          ...facility,
          distance: calculateDistance(
            latitude, 
            longitude, 
            facility.location.latitude, 
            facility.location.longitude
          )
        }))
        .filter(facility => facility.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .map(({ distance, ...facility }) => facility); // Remove distance from final result

      console.log(`Found ${facilities.length} healthcare facilities within ${radius}m`);

      return NextResponse.json(facilities, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timeout after 30 seconds');
        return NextResponse.json(
          { error: 'Healthcare facilities request timed out. Please try again.' },
          { 
            status: 408,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }

      // Handle network errors
      console.error('Network error calling Overpass API:', error);
      return NextResponse.json(
        { error: 'Network error. Please check your connection and try again.' },
        { 
          status: 503,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in healthcare facilities:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}