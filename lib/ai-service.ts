export interface SymptomAnalysis {
  severity: 'low' | 'moderate' | 'high' | 'emergency';
  possibleConditions: string[];
  recommendations: string[];
  urgency: string;
  warning?: string;
  timestamp: string;
  source: 'api' | 'fallback';
  confidence?: number;
}

interface APIResponse {
  analysis: {
    possibleConditions: string[];
    recommendedActions: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
    confidence: number;
    warning?: string;
  };
}

export class AIService {
  private static instance: AIService;
  private offlineResponses: Map<string, Omit<SymptomAnalysis, 'timestamp' | 'source'>> = new Map();
  private cache: Map<string, SymptomAnalysis> = new Map();
  private readonly API_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRIES = 2;

  constructor() {
    this.initializeOfflineResponses();
    this.loadCacheFromStorage();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initializeOfflineResponses() {
    // Emergency conditions
    this.offlineResponses.set('chest_pain', {
      severity: 'emergency',
      possibleConditions: ['Heart attack', 'Angina', 'Pulmonary embolism', 'Aortic dissection'],
      recommendations: [
        'Call emergency services immediately (150)',
        'Chew aspirin if available and not allergic',
        'Sit upright and stay calm',
        'Do not drive yourself to hospital',
        'Loosen tight clothing'
      ],
      urgency: 'SEEK IMMEDIATE MEDICAL ATTENTION',
      warning: 'This could be life-threatening - do not delay emergency care',
      confidence: 0.9
    });

    this.offlineResponses.set('difficulty_breathing', {
      severity: 'emergency',
      possibleConditions: ['Asthma attack', 'Pneumonia', 'Heart failure', 'Allergic reaction'],
      recommendations: [
        'Call emergency services if severe (150)',
        'Sit upright and try to stay calm',
        'Use rescue inhaler if available',
        'Remove any tight clothing',
        'Seek immediate medical attention'
      ],
      urgency: 'URGENT - Seek immediate medical care',
      warning: 'Breathing difficulties can be life-threatening',
      confidence: 0.85
    });

    this.offlineResponses.set('severe_bleeding', {
      severity: 'emergency',
      possibleConditions: ['Trauma', 'Internal bleeding', 'Medication side effects'],
      recommendations: [
        'Call emergency services immediately (150)',
        'Apply direct pressure to wound if external',
        'Elevate injured area if possible',
        'Do not remove embedded objects',
        'Monitor for signs of shock'
      ],
      urgency: 'EMERGENCY - Immediate medical attention required',
      warning: 'Severe bleeding requires immediate professional care',
      confidence: 0.95
    });

    // High severity conditions
    this.offlineResponses.set('high_fever', {
      severity: 'high',
      possibleConditions: ['Severe infection', 'Meningitis', 'Sepsis', 'Heat stroke'],
      recommendations: [
        'Seek medical attention immediately if fever >39°C (102°F)',
        'Take paracetamol or ibuprofen as directed',
        'Stay hydrated with water or oral rehydration solution',
        'Use cool compresses on forehead',
        'Monitor for worsening symptoms'
      ],
      urgency: 'Seek medical care within 2-4 hours',
      warning: 'High fever can indicate serious infection',
      confidence: 0.8
    });

    this.offlineResponses.set('severe_headache', {
      severity: 'high',
      possibleConditions: ['Migraine', 'Meningitis', 'Stroke', 'Brain hemorrhage'],
      recommendations: [
        'Seek immediate medical care if sudden severe headache',
        'Rest in dark, quiet room',
        'Take paracetamol as directed',
        'Apply cold compress to head',
        'Monitor for neck stiffness or vision changes'
      ],
      urgency: 'Seek medical evaluation if severe or sudden onset',
      warning: 'Sudden severe headache may indicate serious condition',
      confidence: 0.75
    });

    // Moderate severity conditions
    this.offlineResponses.set('fever', {
      severity: 'moderate',
      possibleConditions: ['Common cold', 'Flu', 'Viral infection', 'Bacterial infection'],
      recommendations: [
        'Rest and stay hydrated',
        'Take paracetamol for fever and pain',
        'Monitor temperature regularly',
        'Seek medical help if fever persists >3 days',
        'Watch for worsening symptoms'
      ],
      urgency: 'Monitor closely, seek care if worsening',
      confidence: 0.7
    });

    this.offlineResponses.set('persistent_cough', {
      severity: 'moderate',
      possibleConditions: ['Bronchitis', 'Pneumonia', 'Asthma', 'Allergies'],
      recommendations: [
        'Stay hydrated to thin mucus',
        'Use honey for cough relief (not for children <1 year)',
        'Avoid smoke and irritants',
        'Seek medical care if cough persists >2 weeks',
        'Monitor for blood in sputum'
      ],
      urgency: 'Monitor and seek care if persistent or worsening',
      confidence: 0.65
    });

    this.offlineResponses.set('stomach_pain', {
      severity: 'moderate',
      possibleConditions: ['Gastritis', 'Food poisoning', 'Appendicitis', 'Gastroenteritis'],
      recommendations: [
        'Avoid solid foods temporarily',
        'Stay hydrated with clear fluids',
        'Apply heat pad to abdomen',
        'Seek immediate care if severe or persistent pain',
        'Monitor for fever or vomiting'
      ],
      urgency: 'Monitor closely, seek care if severe',
      warning: 'Severe abdominal pain may require immediate attention',
      confidence: 0.6
    });

    // Low severity conditions
    this.offlineResponses.set('headache', {
      severity: 'low',
      possibleConditions: ['Tension headache', 'Dehydration', 'Stress', 'Eye strain'],
      recommendations: [
        'Rest in quiet, dark room',
        'Stay hydrated with water',
        'Apply cold or warm compress',
        'Take paracetamol if needed',
        'Practice relaxation techniques'
      ],
      urgency: 'Self-care recommended',
      confidence: 0.8
    });

    this.offlineResponses.set('common_cold', {
      severity: 'low',
      possibleConditions: ['Viral upper respiratory infection', 'Common cold', 'Allergies'],
      recommendations: [
        'Get plenty of rest',
        'Stay hydrated with warm fluids',
        'Use saline nasal rinse',
        'Gargle with warm salt water',
        'Seek care if symptoms worsen or persist >10 days'
      ],
      urgency: 'Self-care with monitoring',
      confidence: 0.75
    });

    this.offlineResponses.set('minor_cuts', {
      severity: 'low',
      possibleConditions: ['Minor laceration', 'Abrasion', 'Superficial wound'],
      recommendations: [
        'Clean wound with clean water',
        'Apply antiseptic if available',
        'Cover with clean bandage',
        'Change dressing daily',
        'Seek care if signs of infection develop'
      ],
      urgency: 'Self-care appropriate',
      confidence: 0.9
    });
  }

  private async loadCacheFromStorage() {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      try {
        const cached = localStorage.getItem('sahhabot-symptom-cache');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          this.cache = new Map(Object.entries(parsedCache));
        }
      } catch (error) {
        console.error('Failed to load cache from storage:', error);
      }
    }
  }

  private async saveCacheToStorage() {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      try {
        const cacheObject = Object.fromEntries(this.cache);
        localStorage.setItem('sahhabot-symptom-cache', JSON.stringify(cacheObject));
      } catch (error) {
        console.error('Failed to save cache to storage:', error);
      }
    }
  }

  private async storeInSupabase(symptoms: string, analysis: SymptomAnalysis) {
    try {
      // Only import supabase when needed to avoid SSR issues
      const { supabase } = await import('./supabase');
      
      await supabase.from('symptom_submissions').insert([{
        symptoms,
        language: 'en', // You might want to pass this as a parameter
        analysis: JSON.stringify(analysis),
        severity: analysis.severity,
        recommendations: analysis.recommendations,
        created_at: new Date().toISOString(),
        synced: true
      }]);
      
      console.log('Successfully stored analysis in Supabase');
    } catch (error) {
      console.error('Failed to store in Supabase:', error);
      // Store offline for later sync
      await this.storeOfflineForSync(symptoms, analysis);
    }
  }

  private async storeOfflineForSync(symptoms: string, analysis: SymptomAnalysis) {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        const dbName = 'sahhabot-offline';
        const request = indexedDB.open(dbName, 1);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('pending_sync')) {
            db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
          }
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['pending_sync'], 'readwrite');
          const store = transaction.objectStore('pending_sync');
          store.add({
            symptoms,
            analysis,
            timestamp: new Date().toISOString(),
            synced: false
          });
        };
      } catch (error) {
        console.error('Failed to store offline data:', error);
      }
    }
  }

  private isOnline(): boolean {
    return typeof window !== 'undefined' ? navigator.onLine : true;
  }

  private async callAnalysisAPI(symptoms: string, language: string, retryCount = 0): Promise<SymptomAnalysis> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

    try {
      console.log(`Attempting API call (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1})`);
      
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          symptoms, 
          language,
          patientAge: undefined,
          patientGender: undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result: APIResponse = await response.json();
      
      if (!result.analysis) {
        throw new Error('Invalid API response format');
      }

      // Transform API response to our format
      const analysis: SymptomAnalysis = {
        severity: result.analysis.urgencyLevel === 'high' ? 'emergency' : 
                 result.analysis.urgencyLevel === 'medium' ? 'moderate' : 'low',
        possibleConditions: result.analysis.possibleConditions,
        recommendations: result.analysis.recommendedActions,
        urgency: result.analysis.urgencyLevel,
        warning: result.analysis.warning,
        confidence: result.analysis.confidence,
        timestamp: new Date().toISOString(),
        source: 'api'
      };

      console.log('Successfully received API response');
      
      // Cache the successful response
      const cacheKey = symptoms.toLowerCase().trim();
      this.cache.set(cacheKey, analysis);
      await this.saveCacheToStorage();
      
      // Store in Supabase (async, don't wait)
      this.storeInSupabase(symptoms, analysis).catch(console.error);
      
      return analysis;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('API request timed out');
      } else {
        console.error('API request failed:', error);
      }

      // Retry logic
      if (retryCount < this.MAX_RETRIES) {
        console.log(`Retrying API call in ${(retryCount + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return this.callAnalysisAPI(symptoms, language, retryCount + 1);
      }

      throw error;
    }
  }

  async analyzeSymptoms(symptoms: string, language: string): Promise<SymptomAnalysis> {
    const cacheKey = symptoms.toLowerCase().trim();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached analysis');
      return this.cache.get(cacheKey)!;
    }

    // Check if online and try API
    if (this.isOnline()) {
      try {
        return await this.callAnalysisAPI(symptoms, language);
      } catch (error) {
        console.error('All API attempts failed, falling back to offline analysis');
      }
    } else {
      console.log('Device is offline, using fallback analysis');
    }

    // Fallback to offline analysis
    console.log('Using fallback symptom database');
    return this.getOfflineAnalysis(symptoms);
  }

  private getOfflineAnalysis(symptoms: string): SymptomAnalysis {
    const lowerSymptoms = symptoms.toLowerCase();
    
    // Emergency keywords - highest priority
    const emergencyPatterns = [
      { keywords: ['chest pain', 'heart attack', 'cardiac'], key: 'chest_pain' },
      { keywords: ['difficulty breathing', 'can\'t breathe', 'shortness of breath', 'breathing problem'], key: 'difficulty_breathing' },
      { keywords: ['severe bleeding', 'heavy bleeding', 'blood loss'], key: 'severe_bleeding' }
    ];

    for (const pattern of emergencyPatterns) {
      if (pattern.keywords.some(keyword => lowerSymptoms.includes(keyword))) {
        const baseAnalysis = this.offlineResponses.get(pattern.key)!;
        return {
          ...baseAnalysis,
          timestamp: new Date().toISOString(),
          source: 'fallback'
        };
      }
    }

    // High severity patterns
    const highSeverityPatterns = [
      { keywords: ['high fever', 'fever 39', 'fever 40', 'very hot'], key: 'high_fever' },
      { keywords: ['severe headache', 'worst headache', 'sudden headache'], key: 'severe_headache' }
    ];

    for (const pattern of highSeverityPatterns) {
      if (pattern.keywords.some(keyword => lowerSymptoms.includes(keyword))) {
        const baseAnalysis = this.offlineResponses.get(pattern.key)!;
        return {
          ...baseAnalysis,
          timestamp: new Date().toISOString(),
          source: 'fallback'
        };
      }
    }

    // Moderate severity patterns
    const moderatePatterns = [
      { keywords: ['fever', 'temperature', 'hot'], key: 'fever' },
      { keywords: ['cough', 'coughing'], key: 'persistent_cough' },
      { keywords: ['stomach pain', 'abdominal pain', 'belly pain'], key: 'stomach_pain' }
    ];

    for (const pattern of moderatePatterns) {
      if (pattern.keywords.some(keyword => lowerSymptoms.includes(keyword))) {
        const baseAnalysis = this.offlineResponses.get(pattern.key)!;
        return {
          ...baseAnalysis,
          timestamp: new Date().toISOString(),
          source: 'fallback'
        };
      }
    }

    // Low severity patterns
    const lowSeverityPatterns = [
      { keywords: ['headache', 'head pain'], key: 'headache' },
      { keywords: ['cold', 'runny nose', 'sneezing'], key: 'common_cold' },
      { keywords: ['cut', 'scratch', 'wound'], key: 'minor_cuts' }
    ];

    for (const pattern of lowSeverityPatterns) {
      if (pattern.keywords.some(keyword => lowerSymptoms.includes(keyword))) {
        const baseAnalysis = this.offlineResponses.get(pattern.key)!;
        return {
          ...baseAnalysis,
          timestamp: new Date().toISOString(),
          source: 'fallback'
        };
      }
    }

    // Default response for unmatched symptoms
    return {
      severity: 'moderate',
      possibleConditions: ['Multiple possible conditions - professional evaluation needed'],
      recommendations: [
        'Monitor symptoms closely',
        'Stay hydrated and rest',
        'Consult healthcare provider for proper diagnosis',
        'Seek immediate help if symptoms worsen significantly',
        'Keep a record of symptom changes'
      ],
      urgency: 'Professional medical evaluation recommended',
      warning: 'This analysis is based on limited information. Professional medical advice is recommended.',
      confidence: 0.3,
      timestamp: new Date().toISOString(),
      source: 'fallback'
    };
  }

  // Method to sync offline data when connection is restored
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline()) {
      console.log('Still offline, cannot sync');
      return;
    }

    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        const dbName = 'sahhabot-offline';
        const request = indexedDB.open(dbName, 1);
        
        request.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['pending_sync'], 'readwrite');
          const store = transaction.objectStore('pending_sync');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = async () => {
            const pendingItems = getAllRequest.result;
            console.log(`Found ${pendingItems.length} items to sync`);
            
            for (const item of pendingItems) {
              try {
                await this.storeInSupabase(item.symptoms, item.analysis);
                store.delete(item.id);
                console.log(`Synced item ${item.id}`);
              } catch (error) {
                console.error(`Failed to sync item ${item.id}:`, error);
              }
            }
          };
        };
      } catch (error) {
        console.error('Failed to sync offline data:', error);
      }
    }
  }
}