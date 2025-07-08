// Supabase functionality has been removed as requested
// This file is kept for potential future use but all exports have been removed

export type SymptomSubmission = {
  id: string;
  symptoms: string;
  language: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  severity?: string;
  analysis?: string;
  recommendations?: string[];
  created_at: string;
  synced: boolean;
};

export type HealthcareFacility = {
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
};