import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSpeech, useTextToSpeech } from "@/hooks/use-speech";
import SyllableBreakdown from "@/components/flashcard/syllable-breakdown";
import AudioWave from "@/components/flashcard/audio-wave";
import { Button } from "@/components/ui/button";

export default function RecordingFeedback() {
  const { flashcardId } = useParams();
  const [, navigate] = useLocation();
  const [accuracy, setAccuracy] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  
  // Speech recognition
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript,
    hasRecognitionSupport
  } = useSpeech({
    onEnd: () => {
      setIsRecording(false);
      // Generate a random accuracy score between 50-100%
      // In a real app, this would be calculated based on actual speech analysis
      const randomAccuracy = Math.floor(Math.random() * 51) + 50;
      setAccuracy(randomAccuracy);
      generateFeedback(randomAccuracy);
    }
  });
  
  // Text-to-speech
  const { speak } = useTextToSpeech();
  
  // Fetch flashcard details
  const { data: flashcard, isLoading } = useQuery({
    queryKey: [`/api/flashcards/${flashcardId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/flashcards/${flashcardId}`, {
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error("Failed to fetch flashcard");
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching flashcard:", error);
        return null;
      }
    },
    enabled: !!flashcardId
  });
  
  // Mutation for updating pronunciation progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ pronunciationAccuracy }: { pronunciationAccuracy: number }) => {
      const res = await apiRequest(
        "POST", 
        `/api/progress/flashcard/${flashcardId}`, 
        { pronunciationAccuracy }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
  });
  
  // Generate feedback based on accuracy
  const generateFeedback = (accuracyScore: number) => {
    let feedback = "";
    
    if (accuracyScore >= 90) {
      feedback = "Excellent pronunciation! Your speech is very clear.";
    } else if (accuracyScore >= 75) {
      feedback = "Good job! Try to emphasize the syllables a bit more clearly.";
    } else if (accuracyScore >= 60) {
      feedback = "You're on the right track. Practice the pronunciation a bit more.";
    } else {
      feedback = "Let's try again. Focus on pronouncing each syllable clearly.";
    }
    
    setFeedbackText(feedback);
    
    // Save progress to the server
    if (flashcardId) {
      updateProgressMutation.mutate({ pronunciationAccuracy: accuracyScore });
    }
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopListening();
      setIsRecording(false);
    } else {
      resetTranscript();
      startListening();
      setIsRecording(true);
      // Reset feedback and accuracy
      setFeedbackText("");
      setAccuracy(0);
    }
  };
  
  // Try again
  const tryAgain = () => {
    resetTranscript();
    setFeedbackText("");
    setAccuracy(0);
  };
  
  // Pronounce the word
  useEffect(() => {
    if (flashcard && !isRecording) {
      speak(flashcard.word);
    }
  }, [flashcard, speak, isRecording]);
  
  if (isLoading || !flashcard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-hidden flex flex-col pt-14">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-30 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button className="p-2" onClick={() => navigate(`/flashcards/${flashcard.setId}`)}>
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="font-bold text-lg text-neutral-800">Pronunciation Practice</h1>
          <div className="w-9"></div>
        </div>
      </header>
      
      {/* Recording Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Word Display */}
          <div className="bg-white rounded-xl shadow-card p-6 text-center mb-6">
            <h2 className="text-3xl font-bold mb-4">{flashcard.word}</h2>
            
            {/* Syllable Breakdown */}
            <div className="flex justify-center space-x-1 mb-6">
              <SyllableBreakdown 
                syllables={flashcard.syllables as { text: string }[] || [{ text: flashcard.word }]} 
                className="text-xl font-bold" 
              />
            </div>
            
            {/* Audio Visualization */}
            {isRecording && (
              <AudioWave className="mx-auto my-4" />
            )}
            
            {/* Recording Status */}
            <div className="text-primary text-sm font-semibold mb-4">
              {isRecording ? "Listening..." : "Press button to start"}
            </div>
            
            {/* Record Button */}
            <button 
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg ${isRecording ? 'bg-error' : 'bg-primary'}`}
              onClick={toggleRecording}
              disabled={!hasRecognitionSupport}
            >
              {isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            
            {!hasRecognitionSupport && (
              <p className="text-sm text-error mt-2">
                Speech recognition is not supported in your browser.
              </p>
            )}
            
            {transcript && (
              <div className="mt-4 p-3 bg-neutral-100 rounded-lg">
                <p className="text-sm text-neutral-700">You said: "{transcript}"</p>
              </div>
            )}
          </div>
          
          {/* Feedback Section */}
          {feedbackText && (
            <div className="bg-white rounded-xl shadow-card p-4">
              <h3 className="font-semibold text-neutral-700 mb-2">Feedback</h3>
              
              {/* Accuracy Score */}
              <div className="flex items-center mb-3">
                <div className="w-24 text-sm text-neutral-600">Accuracy:</div>
                <div className="flex-1 h-2 bg-neutral-200 rounded-full">
                  <div 
                    className={`h-full rounded-full ${accuracy >= 75 ? 'bg-success' : accuracy >= 50 ? 'bg-accent' : 'bg-error'}`} 
                    style={{ width: `${accuracy}%` }}
                  ></div>
                </div>
                <div className={`ml-3 text-sm font-bold ${accuracy >= 75 ? 'text-success' : accuracy >= 50 ? 'text-accent-dark' : 'text-error'}`}>
                  {accuracy}%
                </div>
              </div>
              
              {/* Pronunciation Notes */}
              <div className="p-3 bg-neutral-100 rounded-lg text-sm text-neutral-700">
                {feedbackText}
              </div>
              
              {/* Try Again Button */}
              <Button 
                className="w-full mt-4 py-3 bg-primary text-white rounded-lg font-semibold shadow-button"
                onClick={tryAgain}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
