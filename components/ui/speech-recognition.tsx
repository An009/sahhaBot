'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Download, 
  Play, 
  Pause, 
  Square, 
  Users, 
  Clock, 
  Volume2,
  Settings,
  FileText,
  Film,
  Code,
  Edit3,
  Trash2,
  Copy
} from 'lucide-react';
import { AdvancedSpeechRecognition, type TranscriptionSession, type SpeechSegment } from '@/lib/speech-recognition';
import { getTranslation, type Language } from '@/lib/i18n';

interface SpeechRecognitionProps {
  language: Language;
  onTranscriptUpdate?: (transcript: string) => void;
}

export function SpeechRecognitionComponent({ language, onTranscriptUpdate }: SpeechRecognitionProps) {
  const [speechRecognition] = useState(() => new AdvancedSpeechRecognition());
  const [isListening, setIsListening] = useState(false);
  const [currentSession, setCurrentSession] = useState<TranscriptionSession | null>(null);
  const [segments, setSegments] = useState<SpeechSegment[]>([]);
  const [interimText, setInterimText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ar-MA');
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [sessionStats, setSessionStats] = useState({
    duration: 0,
    wordCount: 0,
    speakerCount: 0
  });

  const segmentsRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    setIsSupported(speechRecognition.isSupported());
    
    // Setup event listeners
    const handleSegment = (event: CustomEvent) => {
      const segment = event.detail as SpeechSegment;
      setSegments(prev => [...prev, segment]);
      updateSessionStats();
      
      // Auto-scroll to latest segment
      setTimeout(() => {
        if (segmentsRef.current) {
          segmentsRef.current.scrollTop = segmentsRef.current.scrollHeight;
        }
      }, 100);
    };

    const handleInterim = (event: CustomEvent) => {
      setInterimText(event.detail.text);
    };

    window.addEventListener('speechSegment', handleSegment as EventListener);
    window.addEventListener('speechInterim', handleInterim as EventListener);

    return () => {
      window.removeEventListener('speechSegment', handleSegment as EventListener);
      window.removeEventListener('speechInterim', handleInterim as EventListener);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentSession) {
      updateSessionStats();
    }
  }, [segments, currentSession]);

  const updateSessionStats = () => {
    if (!currentSession) return;
    
    const wordCount = segments.reduce((count, segment) => {
      return count + segment.text.split(' ').length;
    }, 0);
    
    const duration = currentSession.endTime 
      ? currentSession.endTime - currentSession.startTime
      : Date.now() - currentSession.startTime;
    
    setSessionStats({
      duration: Math.round(duration / 1000),
      wordCount,
      speakerCount: currentSession.speakers.length
    });
  };

  const startRecognition = async () => {
    try {
      const session = await speechRecognition.startRecognition(selectedLanguage);
      setCurrentSession(session);
      setIsListening(true);
      setSegments([]);
      setInterimText('');
      
      // Start audio level monitoring
      startAudioLevelMonitoring();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      alert('Failed to start speech recognition. Please check microphone permissions.');
    }
  };

  const stopRecognition = () => {
    const session = speechRecognition.stopRecognition();
    if (session) {
      setCurrentSession(session);
    }
    setIsListening(false);
    setInterimText('');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const startAudioLevelMonitoring = () => {
    const updateLevel = () => {
      // Simulate audio level (in real implementation, get from audio context)
      setAudioLevel(Math.random() * 100);
      
      if (isListening) {
        animationRef.current = requestAnimationFrame(updateLevel);
      }
    };
    updateLevel();
  };

  const handleEditSegment = (segmentId: string, currentText: string) => {
    setEditingSegment(segmentId);
    setEditText(currentText);
  };

  const saveEditedSegment = () => {
    if (!editingSegment) return;
    
    setSegments(prev => prev.map(segment => 
      segment.id === editingSegment 
        ? { ...segment, text: editText }
        : segment
    ));
    
    setEditingSegment(null);
    setEditText('');
  };

  const deleteSegment = (segmentId: string) => {
    setSegments(prev => prev.filter(segment => segment.id !== segmentId));
  };

  const copySegmentText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportTranscription = (format: 'txt' | 'srt' | 'json') => {
    if (!currentSession) return;
    
    const updatedSession = { ...currentSession, segments };
    let content = '';
    let filename = '';
    let mimeType = '';
    
    switch (format) {
      case 'txt':
        content = speechRecognition.exportToTXT(updatedSession);
        filename = `transcription-${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;
      case 'srt':
        content = speechRecognition.exportToSRT(updatedSession);
        filename = `transcription-${Date.now()}.srt`;
        mimeType = 'text/plain';
        break;
      case 'json':
        content = speechRecognition.exportToJSON(updatedSession);
        filename = `transcription-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFullTranscript = () => {
    return segments.map(segment => segment.text).join(' ');
  };

  useEffect(() => {
    if (onTranscriptUpdate) {
      onTranscriptUpdate(getFullTranscript());
    }
  }, [segments, onTranscriptUpdate]);

  if (!isSupported) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <MicOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Speech Recognition Not Supported</h3>
          <p className="text-gray-600">
            Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isRTL = language === 'ar' || language === 'da';

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Mic className="h-5 w-5" />
            Advanced Speech Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <label className="text-sm font-medium">Language:</label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar-MA">🇲🇦 Moroccan Arabic (Darija)</SelectItem>
                <SelectItem value="ar-SA">🇸🇦 Arabic (Standard)</SelectItem>
                <SelectItem value="fr-FR">🇫🇷 French</SelectItem>
                <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Controls */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={isListening ? stopRecognition : startRecognition}
              variant={isListening ? 'destructive' : 'default'}
              size="lg"
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? 'Stop Recording' : 'Start Recording'}
            </Button>

            {/* Audio Level Indicator */}
            {isListening && (
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Volume2 className="h-4 w-4 text-green-600" />
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Session Stats */}
          {currentSession && (
            <div className={`flex items-center gap-6 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock className="h-4 w-4" />
                <span>{sessionStats.duration}s</span>
              </div>
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText className="h-4 w-4" />
                <span>{sessionStats.wordCount} words</span>
              </div>
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Users className="h-4 w-4" />
                <span>{sessionStats.speakerCount} speakers</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Transcription */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Play className="h-5 w-5" />
            Live Transcription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={segmentsRef}
            className="max-h-96 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg"
          >
            {segments.map((segment) => (
              <div key={segment.id} className="group relative">
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Badge variant="outline" className="text-xs">
                    {segment.speaker}
                  </Badge>
                  <div className="flex-1">
                    {editingSegment === segment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Button size="sm" onClick={saveEditedSegment}>
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingSegment(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                          {segment.text}
                        </p>
                        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>{new Date(segment.startTime).toLocaleTimeString()}</span>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(segment.confidence * 100)}%
                          </Badge>
                        </div>
                        
                        {/* Edit Controls */}
                        <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <div className={`flex gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSegment(segment.id, segment.text)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copySegmentText(segment.text)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSegment(segment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Interim Results */}
            {interimText && (
              <div className={`flex items-start gap-3 opacity-60 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Badge variant="outline" className="text-xs">
                  {currentSession?.speakers[0] || 'Speaker 1'}
                </Badge>
                <p className={`text-sm italic ${isRTL ? 'text-right' : 'text-left'}`}>
                  {interimText}
                </p>
              </div>
            )}
            
            {segments.length === 0 && !interimText && (
              <div className="text-center text-gray-500 py-8">
                <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start speaking to see transcription...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      {segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Download className="h-5 w-5" />
              Export Transcription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => exportTranscription('txt')}
                className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <FileText className="h-4 w-4" />
                Text (.txt)
              </Button>
              <Button
                variant="outline"
                onClick={() => exportTranscription('srt')}
                className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Film className="h-4 w-4" />
                Subtitles (.srt)
              </Button>
              <Button
                variant="outline"
                onClick={() => exportTranscription('json')}
                className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Code className="h-4 w-4" />
                JSON (.json)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}