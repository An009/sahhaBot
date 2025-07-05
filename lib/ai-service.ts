export interface SymptomAnalysis {
  severity: 'low' | 'moderate' | 'high' | 'emergency';
  possibleConditions: string[];
  recommendations: string[];
  urgency: string;
  warning?: string;
}

export class AIService {
  private static instance: AIService;
  private offlineResponses: Map<string, SymptomAnalysis> = new Map();

  constructor() {
    this.initializeOfflineResponses();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initializeOfflineResponses() {
    // Common symptom patterns for offline use
    this.offlineResponses.set('fever', {
      severity: 'moderate',
      possibleConditions: ['Common cold', 'Flu', 'Viral infection'],
      recommendations: [
        'Rest and stay hydrated',
        'Take paracetamol for fever',
        'Monitor temperature',
        'Seek medical help if fever persists over 3 days'
      ],
      urgency: 'Monitor closely'
    });

    this.offlineResponses.set('headache', {
      severity: 'low',
      possibleConditions: ['Tension headache', 'Dehydration', 'Stress'],
      recommendations: [
        'Rest in a quiet, dark room',
        'Stay hydrated',
        'Apply cold compress',
        'Take paracetamol if needed'
      ],
      urgency: 'Self-care recommended'
    });

    this.offlineResponses.set('chest_pain', {
      severity: 'emergency',
      possibleConditions: ['Heart attack', 'Angina', 'Pulmonary embolism'],
      recommendations: [
        'Call emergency services immediately',
        'Chew aspirin if available',
        'Sit upright and stay calm',
        'Do not drive yourself to hospital'
      ],
      urgency: 'SEEK IMMEDIATE MEDICAL ATTENTION',
      warning: 'This could be life-threatening'
    });
  }

  async analyzeSymptoms(symptoms: string, language: string): Promise<SymptomAnalysis> {
    try {
      // Try online AI analysis first
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms, language }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      throw new Error('AI service unavailable');
    } catch (error) {
      // Fallback to offline analysis
      return this.getOfflineAnalysis(symptoms);
    }
  }

  private getOfflineAnalysis(symptoms: string): SymptomAnalysis {
    const lowerSymptoms = symptoms.toLowerCase();
    
    // Emergency keywords
    const emergencyKeywords = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding'];
    for (const keyword of emergencyKeywords) {
      if (lowerSymptoms.includes(keyword)) {
        return this.offlineResponses.get('chest_pain')!;
      }
    }

    // Common symptom matching
    if (lowerSymptoms.includes('fever')) {
      return this.offlineResponses.get('fever')!;
    }
    
    if (lowerSymptoms.includes('headache')) {
      return this.offlineResponses.get('headache')!;
    }

    // Default response
    return {
      severity: 'moderate',
      possibleConditions: ['Multiple possible conditions'],
      recommendations: [
        'Monitor symptoms closely',
        'Stay hydrated and rest',
        'Consult healthcare provider if symptoms worsen',
        'Seek immediate help if you feel seriously unwell'
      ],
      urgency: 'Monitor and seek professional advice'
    };
  }
}