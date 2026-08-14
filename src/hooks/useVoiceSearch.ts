import { useState, useEffect, useRef, useCallback } from 'react';
import {
  playGoogleVoiceStartSound,
  playGoogleVoiceStopSound,
  playGoogleVoiceErrorSound,
} from '../lib/googleVoiceSound';

// Declaration for Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface UseVoiceSearchOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}) {
  const { onResult, onError, lang = 'en-US' } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isStartingRef = useRef<boolean>(false);

  // Keep callback references stable to prevent re-triggering effects
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    isStartingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      const errMsg = 'Voice search is not supported in this browser.';
      setSpeechError(errMsg);
      onErrorRef.current?.(errMsg);
      playGoogleVoiceErrorSound();
      return;
    }

    if (isStartingRef.current) {
      return; // Prevent duplicate concurrent start calls
    }

    // Stop any existing recognition instance cleanly
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    setSpeechError(null);
    setTranscript('');
    isStartingRef.current = true;

    // Play Google voice mode activation chime immediately on gesture
    playGoogleVoiceStartSound();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        isStartingRef.current = false;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        onResultRef.current?.(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        isStartingRef.current = false;
        setIsListening(false);
        // Ignore aborted error when manually stopped
        if (event.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition error:', event.error);
        playGoogleVoiceErrorSound();
        let msg = 'Voice recognition error.';
        if (event.error === 'no-speech') {
          msg = 'No speech detected. Please speak louder or try again.';
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          msg = 'Microphone access denied. Please allow microphone permissions.';
        } else if (event.error === 'network') {
          msg = 'Network connection issue during voice search.';
        }
        setSpeechError(msg);
        onErrorRef.current?.(msg);
      };

      recognition.onend = () => {
        isStartingRef.current = false;
        setIsListening((prev) => {
          if (prev) {
            playGoogleVoiceStopSound();
          }
          return false;
        });
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start recognition:', err);
      isStartingRef.current = false;
      setIsListening(false);
      playGoogleVoiceErrorSound();
      const msg = 'Unable to start voice search.';
      setSpeechError(msg);
      onErrorRef.current?.(msg);
    }
  }, [lang]);

  const toggleListening = useCallback(() => {
    if (isListening || isStartingRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    speechError,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    setSpeechError,
  };
}
