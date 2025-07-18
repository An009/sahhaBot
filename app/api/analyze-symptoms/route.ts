import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Types for request and response
interface SymptomAnalysisRequest {
  symptoms: string;
  patientAge?: number;
  patientGender?: string;
  language?: string;
}

interface SymptomAnalysisResponse {
  analysis: {
    possibleConditions: string[];
    recommendedActions: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
    confidence: number;
    severity?: string;
    warning?: string;
  };
}

interface CohereResponse {
  generations: Array<{
    text: string;
  }>;
}

// Rate limiting function
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 requests per minute

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

  if (!data.symptoms || typeof data.symptoms !== 'string' || data.symptoms.trim().length === 0) {
    return { isValid: false, error: 'Symptoms description is required' };
  }

  if (data.symptoms.length > 2000) {
    return { isValid: false, error: 'Symptoms description is too long (max 2000 characters)' };
  }

  if (data.patientAge !== undefined) {
    if (typeof data.patientAge !== 'number' || data.patientAge < 0 || data.patientAge > 150) {
      return { isValid: false, error: 'Patient age must be a number between 0 and 150' };
    }
  }

  if (data.patientGender !== undefined) {
    if (typeof data.patientGender !== 'string' || !['male', 'female', 'other'].includes(data.patientGender.toLowerCase())) {
      return { isValid: false, error: 'Patient gender must be male, female, or other' };
    }
  }

  return { isValid: true };
}

// Create medical analysis prompt
function createMedicalPrompt(symptoms: string, age?: number, gender?: string, language: string = 'en'): string {
  const ageText = age ? ` The patient is ${age} years old.` : '';
  const genderText = gender ? ` The patient's gender is ${gender}.` : '';
  
  const languageInstructions = getLanguageInstructions(language);
  const medicalContext = getMedicalContext(language);

  return `You are a medical AI assistant specialized in providing comprehensive medical guidance. Analyze the following symptoms and provide a detailed, structured medical assessment.

Patient Information:${ageText}${genderText}
Symptoms: ${symptoms}

${medicalContext}

Please provide a comprehensive analysis in the following JSON format:
{
  "possibleConditions": ["detailed condition 1 with explanation", "detailed condition 2 with explanation", "detailed condition 3 with explanation"],
  "recommendedActions": ["detailed action 1 with rationale", "detailed action 2 with rationale", "detailed action 3 with rationale", "detailed action 4 with rationale", "detailed action 5 with rationale"],
  "urgencyLevel": "low|medium|high",
  "confidence": 0.85,
  "warning": "Important safety information if applicable",
  "additionalInfo": "Detailed explanation of the analysis, potential complications, and when to seek immediate care"
}

Important guidelines:
- Provide detailed, comprehensive explanations for each condition and recommendation
- Include specific timeframes for when to seek care (e.g., "within 24 hours", "immediately")
- Explain the reasoning behind each recommendation
- If symptoms suggest emergency conditions, set urgencyLevel to "high" and include detailed emergency protocols
- Confidence should be between 0.1 and 1.0 based on symptom specificity
- Provide 3-5 detailed possible conditions and 5-7 comprehensive recommended actions
- ${languageInstructions}
- Use appropriate medical terminology for the target language
- Be culturally sensitive and appropriate for Moroccan healthcare context when applicable
- Include preventive measures and lifestyle recommendations where relevant

Respond only with the JSON object, no additional text.`;
}

// Get language-specific instructions
function getLanguageInstructions(language: string): string {
  switch (language) {
    case 'ar':
    case 'da':
      return 'يجب أن تكون جميع الاستجابات باللغة العربية مع استخدام المصطلحات الطبية المناسبة. استخدم اللهجة المغربية (الدارجة) عند الضرورة للوضوح.';
    case 'fr':
      return 'Toutes les réponses doivent être en français avec une terminologie médicale appropriée. Utilisez un langage clair et accessible tout en maintenant la précision médicale.';
    default:
      return 'All responses must be in English with appropriate medical terminology. Use clear, accessible language while maintaining medical accuracy.';
  }
}

// Get medical context for different languages
function getMedicalContext(language: string): string {
  switch (language) {
    case 'ar':
    case 'da':
      return `السياق الطبي: قدم تحليلاً طبياً شاملاً يتضمن:
- شرح مفصل لكل حالة محتملة مع الأعراض المرتبطة
- توصيات علاجية واضحة مع الأسباب
- إرشادات زمنية محددة لطلب الرعاية الطبية
- معلومات عن الوقاية والرعاية الذاتية
- تحذيرات مهمة حول العلامات الخطيرة`;
    case 'fr':
      return `Contexte médical: Fournissez une analyse médicale complète incluant:
- Explication détaillée de chaque condition possible avec les symptômes associés
- Recommandations thérapeutiques claires avec justifications
- Directives temporelles spécifiques pour consulter un médecin
- Informations sur la prévention et les soins personnels
- Avertissements importants sur les signes dangereux`;
    default:
      return `Medical context: Provide a comprehensive medical analysis including:
- Detailed explanation of each possible condition with associated symptoms
- Clear therapeutic recommendations with rationale
- Specific timing guidelines for seeking medical care
- Information on prevention and self-care
- Important warnings about dangerous signs`;
  }
}

// Parse Cohere response and extract JSON
function parseAnalysisResponse(text: string): SymptomAnalysisResponse['analysis'] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the parsed response structure
      if (parsed.possibleConditions && parsed.recommendedActions && parsed.urgencyLevel && parsed.confidence) {
        return {
          possibleConditions: Array.isArray(parsed.possibleConditions) ? parsed.possibleConditions : [parsed.possibleConditions],
          recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [parsed.recommendedActions],
          urgencyLevel: ['low', 'medium', 'high'].includes(parsed.urgencyLevel) ? parsed.urgencyLevel : 'medium',
          confidence: Math.min(Math.max(parsed.confidence, 0.1), 1.0),
          warning: parsed.warning || undefined
          additionalInfo: parsed.additionalInfo || undefined
        };
      }
    }
  } catch (error) {
    console.error('Failed to parse Cohere response as JSON:', error);
  }

  // Fallback response if parsing fails
  return {
    possibleConditions: ['Unable to determine specific conditions'],
    recommendedActions: [
      'Consult with a healthcare professional',
      'Monitor symptoms closely',
      'Seek immediate medical attention if symptoms worsen',
      'Keep a detailed record of symptom progression'
    ],
    urgencyLevel: 'medium',
    confidence: 0.3,
    warning: 'This analysis could not be completed properly. Please consult a healthcare provider.'
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = headers();
    const clientIp = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
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
    let requestData: SymptomAnalysisRequest;
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

    // Check for API key
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      console.error('COHERE_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Medical analysis service is temporarily unavailable' },
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

    // Create medical analysis prompt
    const prompt = createMedicalPrompt(
      requestData.symptoms,
      requestData.patientAge,
      requestData.patientGender,
      requestData.language || 'en'
    );

    // Prepare Cohere API request
    const coherePayload = {
      model: 'command',
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more consistent medical responses
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Make request to Cohere API
      const cohereResponse = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Cohere-Version': '2022-12-06'
        },
        body: JSON.stringify(coherePayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle API errors
      if (cohereResponse.status === 401) {
        console.error('Cohere API authentication failed');
        return NextResponse.json(
          { error: 'Medical analysis service authentication failed' },
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

      if (cohereResponse.status === 429) {
        console.error('Cohere API rate limit exceeded');
        return NextResponse.json(
          { error: 'Medical analysis service is busy. Please try again in a few minutes.' },
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

      if (!cohereResponse.ok) {
        const errorText = await cohereResponse.text();
        console.error(`Cohere API error: ${cohereResponse.status} - ${errorText}`);
        return NextResponse.json(
          { error: 'Medical analysis service is temporarily unavailable' },
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

      // Parse successful response
      const cohereData: CohereResponse = await cohereResponse.json();
      
      if (!cohereData.generations || !Array.isArray(cohereData.generations) || cohereData.generations.length === 0) {
        console.error('Invalid response structure from Cohere API');
        return NextResponse.json(
          { error: 'Invalid response from medical analysis service' },
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

      const generatedText = cohereData.generations[0].text.trim();
      
      // Parse the analysis from the generated text
      const analysis = parseAnalysisResponse(generatedText);
      
      // Log successful processing (without sensitive data)
      console.log(`Successfully analyzed symptoms: urgency=${analysis.urgencyLevel}, confidence=${analysis.confidence}`);

      // Return successful response
      const response: SymptomAnalysisResponse = {
        analysis: analysis
      };

      return NextResponse.json(response, {
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
          { error: 'Medical analysis request timed out. Please try again.' },
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
      console.error('Network error calling Cohere API:', error);
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
    console.error('Unexpected error in symptom analysis:', error);
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