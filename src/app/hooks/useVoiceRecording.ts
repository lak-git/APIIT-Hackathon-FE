import { useState, useRef, useCallback, useEffect } from 'react';
import '../../../src/types/speech.d.ts';

export interface UseVoiceRecordingResult {
    isRecording: boolean;
    transcript: string;
    isSupported: boolean;
    error: string | null;
    startRecording: () => void;
    stopRecording: () => void;
    clearTranscript: () => void;
}

export function useVoiceRecording(): UseVoiceRecordingResult {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Check browser support
    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const startRecording = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
            return;
        }

        setError(null);

        // Get the SpeechRecognition constructor
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript + ' ';
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            setTranscript(prev => {
                // Append final transcripts, show interim in real-time
                if (finalTranscript) {
                    return prev + finalTranscript;
                }
                // For interim results, we show the previous final + current interim
                return prev + interimTranscript;
            });
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone access and try again.');
            } else if (event.error === 'no-speech') {
                setError('No speech detected. Please try again.');
            } else {
                setError(`Error: ${event.error}`);
            }
            setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };

        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (e) {
            console.error('Failed to start speech recognition:', e);
            setError('Failed to start speech recognition. Please try again.');
        }
    }, [isSupported]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const clearTranscript = useCallback(() => {
        setTranscript('');
        setError(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    return {
        isRecording,
        transcript,
        isSupported,
        error,
        startRecording,
        stopRecording,
        clearTranscript,
    };
}
