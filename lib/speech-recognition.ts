export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  timestamp: number;
  duration: number;
  speaker?: string;
  language: string;
  isFinal: boolean;
}

export interface SpeechSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
  confidence: number;
}

export interface TranscriptionSession {
  id: string;
  segments: SpeechSegment[];
  startTime: number;
  endTime?: number;
  language: string;
  totalDuration: number;
  speakers: string[];
}

export class AdvancedSpeechRecognition {
  private recognition: SpeechRecognition | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isListening = false;
  private currentSession: TranscriptionSession | null = null;
  private segmentCounter = 0;
  private noiseGate = -50; // dB threshold for noise gate
  private lastSpeechTime = 0;
  private silenceTimeout = 2000; // ms
  private currentSpeaker = 'Speaker 1';
  private speakerChangeThreshold = 3000; // ms

  // Language configurations with Moroccan Darija support
  private languageConfigs = {
    'ar-MA': {
      name: 'Moroccan Arabic (Darija)',
      code: 'ar-MA',
      fallback: 'ar-SA',
      customVocabulary: [
        'واخا', 'بزاف', 'شوية', 'دابا', 'غير', 'كيفاش', 'فين', 'علاش',
        'مزيان', 'لا باس', 'الله يعطيك الصحة', 'بسلامة', 'إن شاء الله'
      ]
    },
    'ar-SA': {
      name: 'Arabic (Standard)',
      code: 'ar-SA',
      fallback: 'en-US'
    },
    'fr-FR': {
      name: 'French',
      code: 'fr-FR',
      fallback: 'en-US'
    },
    'en-US': {
      name: 'English (US)',
      code: 'en-US',
      fallback: null
    }
  };

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private async setupAudioProcessing(stream: MediaStream) {
    if (!this.audioContext) return;

    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // Create analyser for volume detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create noise gate processor
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      // Connect audio nodes
      source.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      // Process audio for noise gate and volume detection
      this.processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Calculate RMS volume
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const volume = 20 * Math.log10(rms);
        
        // Update speech detection
        if (volume > this.noiseGate) {
          this.lastSpeechTime = Date.now();
        }
      };
      
    } catch (error) {
      console.error('Failed to setup audio processing:', error);
    }
  }

  private initializeSpeechRecognition(language: string): boolean {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return false;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    const config = this.languageConfigs[language as keyof typeof this.languageConfigs];
    
    // Configure recognition
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    this.recognition.lang = config?.code || language;
    
    // Enhanced settings for better accuracy
    if ('webkitSpeechRecognition' in window) {
      (this.recognition as any).webkitGrammars = this.createGrammar(config?.customVocabulary || []);
    }

    return true;
  }

  private createGrammar(vocabulary: string[]): any {
    if (!('webkitSpeechGrammarList' in window)) return null;
    
    const SpeechGrammarList = (window as any).webkitSpeechGrammarList;
    const grammarList = new SpeechGrammarList();
    
    // Create grammar for custom vocabulary
    const grammar = `#JSGF V1.0; grammar vocabulary; public <vocabulary> = ${vocabulary.join(' | ')};`;
    grammarList.addFromString(grammar, 1);
    
    return grammarList;
  }

  async startRecognition(language: string = 'ar-MA'): Promise<TranscriptionSession> {
    if (this.isListening) {
      throw new Error('Recognition already in progress');
    }

    try {
      // Request microphone permission with enhanced constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      // Setup audio processing
      await this.setupAudioProcessing(this.mediaStream);

      // Initialize speech recognition
      if (!this.initializeSpeechRecognition(language)) {
        throw new Error('Failed to initialize speech recognition');
      }

      // Create new session
      this.currentSession = {
        id: `session-${Date.now()}`,
        segments: [],
        startTime: Date.now(),
        language,
        totalDuration: 0,
        speakers: [this.currentSpeaker]
      };

      this.segmentCounter = 0;
      this.isListening = true;

      // Setup recognition event handlers
      this.setupRecognitionHandlers();

      // Start recognition
      this.recognition!.start();

      return this.currentSession;

    } catch (error) {
      this.cleanup();
      throw new Error(`Failed to start recognition: ${error}`);
    }
  }

  private setupRecognitionHandlers() {
    if (!this.recognition || !this.currentSession) return;

    this.recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const lastResult = results[results.length - 1];
      
      if (lastResult) {
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence || 0.8;
        const isFinal = lastResult.isFinal;
        
        // Detect speaker changes based on silence duration
        const now = Date.now();
        const timeSinceLastSpeech = now - this.lastSpeechTime;
        
        if (timeSinceLastSpeech > this.speakerChangeThreshold && this.currentSession!.segments.length > 0) {
          this.switchSpeaker();
        }

        // Create or update segment
        if (isFinal) {
          this.addSegment(transcript, confidence, now);
        } else {
          this.updateInterimResult(transcript, confidence);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific errors
      switch (event.error) {
        case 'network':
          this.handleNetworkError();
          break;
        case 'not-allowed':
          this.handlePermissionError();
          break;
        case 'no-speech':
          this.handleNoSpeechError();
          break;
        default:
          this.handleGenericError(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart recognition for continuous listening
        setTimeout(() => {
          if (this.isListening && this.recognition) {
            this.recognition.start();
          }
        }, 100);
      }
    };
  }

  private addSegment(text: string, confidence: number, timestamp: number) {
    if (!this.currentSession) return;

    const segment: SpeechSegment = {
      id: `segment-${++this.segmentCounter}`,
      text: this.enhanceTranscript(text),
      startTime: timestamp - (text.length * 50), // Estimate start time
      endTime: timestamp,
      speaker: this.currentSpeaker,
      confidence
    };

    this.currentSession.segments.push(segment);
    this.currentSession.totalDuration = timestamp - this.currentSession.startTime;
    
    // Trigger event for real-time updates
    this.dispatchSegmentEvent(segment);
  }

  private updateInterimResult(text: string, confidence: number) {
    // Dispatch interim result event
    const event = new CustomEvent('speechInterim', {
      detail: {
        text: this.enhanceTranscript(text),
        confidence,
        speaker: this.currentSpeaker
      }
    });
    window.dispatchEvent(event);
  }

  private enhanceTranscript(text: string): string {
    // Add punctuation and formatting
    let enhanced = text.trim();
    
    // Capitalize first letter
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
    
    // Add periods for sentence endings
    if (!enhanced.match(/[.!?]$/)) {
      enhanced += '.';
    }
    
    // Handle common Darija expressions
    enhanced = enhanced.replace(/واخا/g, 'واخا')
                    .replace(/بزاف/g, 'بزاف')
                    .replace(/دابا/g, 'دابا');
    
    return enhanced;
  }

  private switchSpeaker() {
    if (!this.currentSession) return;
    
    const speakerCount = this.currentSession.speakers.length;
    this.currentSpeaker = `Speaker ${speakerCount + 1}`;
    
    if (!this.currentSession.speakers.includes(this.currentSpeaker)) {
      this.currentSession.speakers.push(this.currentSpeaker);
    }
  }

  private dispatchSegmentEvent(segment: SpeechSegment) {
    const event = new CustomEvent('speechSegment', { detail: segment });
    window.dispatchEvent(event);
  }

  private handleNetworkError() {
    console.error('Network error during speech recognition');
    // Implement offline fallback if needed
  }

  private handlePermissionError() {
    console.error('Microphone permission denied');
    throw new Error('Microphone access is required for speech recognition');
  }

  private handleNoSpeechError() {
    console.warn('No speech detected');
    // Continue listening
  }

  private handleGenericError(error: string) {
    console.error('Speech recognition error:', error);
  }

  stopRecognition(): TranscriptionSession | null {
    if (!this.isListening || !this.currentSession) return null;

    this.isListening = false;
    
    if (this.recognition) {
      this.recognition.stop();
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.totalDuration = this.currentSession.endTime - this.currentSession.startTime;

    const session = this.currentSession;
    this.cleanup();
    
    return session;
  }

  private cleanup() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    this.recognition = null;
    this.currentSession = null;
    this.isListening = false;
  }

  // Export functions
  exportToTXT(session: TranscriptionSession): string {
    let output = `Transcription Session: ${session.id}\n`;
    output += `Date: ${new Date(session.startTime).toLocaleString()}\n`;
    output += `Duration: ${Math.round(session.totalDuration / 1000)}s\n`;
    output += `Language: ${session.language}\n`;
    output += `Speakers: ${session.speakers.join(', ')}\n\n`;

    session.segments.forEach(segment => {
      const timestamp = new Date(segment.startTime).toLocaleTimeString();
      output += `[${timestamp}] ${segment.speaker}: ${segment.text}\n`;
    });

    return output;
  }

  exportToSRT(session: TranscriptionSession): string {
    let output = '';
    
    session.segments.forEach((segment, index) => {
      const startTime = this.formatSRTTime(segment.startTime - session.startTime);
      const endTime = this.formatSRTTime(segment.endTime - session.startTime);
      
      output += `${index + 1}\n`;
      output += `${startTime} --> ${endTime}\n`;
      output += `${segment.text}\n\n`;
    });

    return output;
  }

  private formatSRTTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  exportToJSON(session: TranscriptionSession): string {
    return JSON.stringify(session, null, 2);
  }

  // Utility methods
  getAvailableLanguages(): typeof this.languageConfigs {
    return this.languageConfigs;
  }

  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  getCurrentSession(): TranscriptionSession | null {
    return this.currentSession;
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}