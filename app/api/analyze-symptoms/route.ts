import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { symptoms, language } = await request.json();
    
    // In a real application, this would call Cohere API
    // For now, returning mock analysis
    
    const analysis = {
      severity: 'moderate',
      possibleConditions: ['Common cold', 'Flu', 'Viral infection'],
      recommendations: [
        'Rest and stay hydrated',
        'Take paracetamol for fever',
        'Monitor temperature',
        'Seek medical help if symptoms persist'
      ],
      urgency: 'Monitor closely and seek medical advice if symptoms worsen'
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    );
  }
}