import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Flashcard as FlashcardModel } from "@shared/schema";
import Flashcard from "@/components/flashcard/flashcard";
import SyllableBreakdown from "@/components/flashcard/syllable-breakdown";
import { Button } from "@/components/ui/button";
import { useTextToSpeech } from "@/hooks/use-speech";

export default function FlashcardLearning() {
  const { setId } = useParams();
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Text-to-speech functionality
  const { speak, isSpeaking } = useTextToSpeech();

  // Fetch flashcards for the selected set
  const { data: flashcards, isLoading } = useQuery<FlashcardModel[]>({
    queryKey: [`/api/flashcard-sets/${setId}/flashcards`],
    enabled: !!setId,
  });

  // Fetch set info
  const { data: setInfo } = useQuery({
    queryKey: [`/api/flashcard-sets/${setId}`],
    enabled: !!setId,
  });

  // Mutation for updating flashcard progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ flashcardId, status }: { flashcardId: number, status: string }) => {
      const res = await apiRequest("POST", `/api/progress/flashcard/${flashcardId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
  });

  // Get current flashcard
  const currentFlashcard = flashcards && flashcards.length > 0 ? flashcards[currentIndex] : null;

  // Handle navigation between flashcards
  const goToNext = () => {
    if (flashcards && currentIndex < flashcards.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };

  // Mark card as learned or difficult
  const markCard = (status: string) => {
    if (currentFlashcard) {
      updateProgressMutation.mutate({ 
        flashcardId: currentFlashcard.id, 
        status 
      });
      // Move to the next card
      if (flashcards && currentIndex < flashcards.length - 1) {
        goToNext();
      }
    }
  };

  // Pronounce the current word
  useEffect(() => {
    if (currentFlashcard) {
      // Auto-speak the word when changing flashcards
      speak(currentFlashcard.word);
    }
  }, [currentFlashcard, speak]);

  // Go to pronunciation practice
  const goPractice = () => {
    if (currentFlashcard) {
      navigate(`/practice/${currentFlashcard.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col pt-14">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-30 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button className="p-2" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="font-bold text-lg text-neutral-800">
            {setInfo?.title || "Flashcards"}
          </h1>
          <div className="w-9"></div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-neutral-200">
          <div 
            className="h-full bg-primary" 
            style={{ 
              width: `${flashcards ? (currentIndex / flashcards.length) * 100 : 0}%` 
            }}
          ></div>
        </div>
      </header>
      
      {/* Flashcard Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {currentFlashcard ? (
          <>
            {/* Flashcard */}
            <Flashcard 
              flashcard={currentFlashcard} 
              className="w-full max-w-xs aspect-[4/3] mb-8"
            />
            
            {/* Pronunciation Section */}
            <div className="w-full max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-neutral-700">Pronunciation</span>
                <button 
                  className="p-1 rounded-full bg-primary/10"
                  onClick={() => speak(currentFlashcard.word)}
                  disabled={isSpeaking}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-4.242a1 1 0 010 1.414" />
                  </svg>
                </button>
              </div>
              
              {/* Syllable Breakdown */}
              <div className="bg-white rounded-xl shadow-card p-4 text-center mb-4">
                <div className="mb-2">
                  <SyllableBreakdown 
                    syllables={currentFlashcard.syllables as { text: string }[] || [{ text: currentFlashcard.word }]} 
                    className="text-xl font-bold" 
                  />
                </div>
                <Button 
                  className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold shadow-button"
                  onClick={goPractice}
                >
                  Record Your Voice
                </Button>
              </div>
              
              {/* Example Sentence */}
              <div className="bg-white rounded-xl shadow-card p-4">
                <div className="text-sm font-semibold text-neutral-700 mb-2">Example Sentence</div>
                <p className="text-neutral-600">
                  {currentFlashcard.exampleSentence ? (
                    currentFlashcard.exampleSentence.replace(
                      new RegExp(`(${currentFlashcard.word})`, 'gi'),
                      '<span class="text-primary font-semibold">$1</span>'
                    )
                  ) : (
                    `This is an example with the word "${currentFlashcard.word}".`
                  )}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-neutral-600 mb-4">No flashcards available in this set.</p>
            <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
          </div>
        )}
      </div>
      
      {/* Navigation Controls */}
      {currentFlashcard && (
        <div className="p-4 border-t border-neutral-200 bg-white flex justify-between">
          <button 
            className="w-12 h-12 rounded-full border border-neutral-300 flex items-center justify-center"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="px-4 py-2 rounded-full bg-error/10 text-error font-semibold text-sm border-none"
              onClick={() => markCard('difficult')}
            >
              Difficult
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-full bg-success/10 text-success font-semibold text-sm border-none"
              onClick={() => markCard('mastered')}
            >
              I Know This
            </Button>
          </div>
          
          <button 
            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-button"
            onClick={goToNext}
            disabled={!flashcards || currentIndex === flashcards.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
