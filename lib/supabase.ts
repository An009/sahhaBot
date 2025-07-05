import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

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

export async function submitSymptoms(submission: Omit<SymptomSubmission, 'id' | 'created_at' | 'synced'>) {
  try {
    const { data, error } = await supabase
      .from('symptom_submissions')
      .insert([{
        ...submission,
        created_at: new Date().toISOString(),
        synced: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    // Store offline if submission fails
    await storeOfflineSubmission(submission);
    throw error;
  }
}

export async function getNearbyFacilities(latitude: number, longitude: number, radius = 50) {
  const { data, error } = await supabase
    .from('healthcare_facilities')
    .select('*')
    .gte('location->latitude', latitude - radius/111)
    .lte('location->latitude', latitude + radius/111)
    .gte('location->longitude', longitude - radius/111)
    .lte('location->longitude', longitude + radius/111);

  if (error) throw error;
  return data;
}

async function storeOfflineSubmission(submission: any) {
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    const dbName = 'sahhabot-offline';
    const request = indexedDB.open(dbName, 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('submissions')) {
        db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['submissions'], 'readwrite');
      const store = transaction.objectStore('submissions');
      store.add({
        ...submission,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        synced: false
      });
    };
  }
}