import { useState, useEffect, useCallback } from "react";

type UseSpeechOptions = {
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  continuous?: boolean;
};

type UseSpeechReturn = {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  hasRecognitionSupport: boolean;
};

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);

  // Check if browser supports speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasRecognitionSupport(true);
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = options.continuous ?? false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let interimTranscriptText = '';
        let finalTranscriptText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptText += transcript;
          } else {
            interimTranscriptText += transcript;
          }
        }
        
        if (interimTranscriptText) {
          setInterimTranscript(interimTranscriptText);
        }
        
        if (finalTranscriptText) {
          setTranscript(prev => prev + finalTranscriptText + ' ');
          options.onResult?.(prev => prev + finalTranscriptText + ' ');
          setInterimTranscript('');
        }
      };
      
      recognitionInstance.onend = () => {
        if (isListening) {
          setIsListening(false);
          options.onEnd?.();
        }
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [options.onEnd, options.onResult, options.continuous]);
  
  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript("");
      setInterimTranscript("");
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  }, [recognition, isListening]);
  
  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);
  
  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);
  
  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  };
}

// Helper function to speak text using the Web Speech API
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  
  useEffect(() => {
    // Clean up utterance when component unmounts
    return () => {
      if (utterance) {
        window.speechSynthesis.cancel();
      }
    };
  }, [utterance]);
  
  const speak = useCallback((text: string, options: SpeechSynthesisUtterance = new SpeechSynthesisUtterance()) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create new utterance and configure it
    const newUtterance = new SpeechSynthesisUtterance(text);
    newUtterance.rate = options.rate || 1;
    newUtterance.pitch = options.pitch || 1;
    newUtterance.volume = options.volume || 1;
    newUtterance.lang = options.lang || 'en-US';
    
    // Optional: get a child-friendly voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes("Female") || 
      voice.name.includes("Google") || 
      voice.name.includes("US English")
    );
    
    if (preferredVoice) {
      newUtterance.voice = preferredVoice;
    }
    
    // Set up event handlers
    newUtterance.onstart = () => setIsSpeaking(true);
    newUtterance.onend = () => setIsSpeaking(false);
    newUtterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
    };
    
    // Store the utterance and speak
    setUtterance(newUtterance);
    window.speechSynthesis.speak(newUtterance);
  }, []);
  
  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);
  
  return { speak, cancel, isSpeaking };
}
