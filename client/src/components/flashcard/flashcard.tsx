import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flashcard as FlashcardType } from "@shared/schema";

type FlashcardProps = {
  flashcard: FlashcardType;
  className?: string;
  autoflip?: boolean;
  flipDelay?: number;
};

export default function Flashcard({ 
  flashcard, 
  className = "", 
  autoflip = false,
  flipDelay = 3000
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Auto-flip functionality
  useEffect(() => {
    if (autoflip) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, flipDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoflip, flipDelay]);
  
  // Reset flip state when flashcard changes
  useEffect(() => {
    setIsFlipped(false);
  }, [flashcard]);
  
  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };
  
  return (
    <div 
      className={`flash-card ${isFlipped ? 'flipped' : ''} ${className}`}
      onClick={toggleFlip}
    >
      <div className="flash-card-inner h-full">
        {/* Front Side - Word */}
        <Card className="flash-card-front">
          <CardContent className="flex flex-col items-center justify-between p-4 h-full">
            <div className="text-sm text-neutral-500">Tap to flip</div>
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-4xl font-bold text-neutral-800">{flashcard.word}</h2>
            </div>
            <div className="text-xs text-primary font-semibold">Word</div>
          </CardContent>
        </Card>
        
        {/* Back Side - Definition & GIF */}
        <Card className="flash-card-back">
          <CardContent className="flex flex-col p-4 h-full">
            <div className="mb-2 text-sm text-neutral-500 text-center">Meaning</div>
            <div className="flex-1 flex items-center justify-center">
              {flashcard.gifUrl ? (
                <div className="w-full aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={flashcard.gifUrl} 
                    alt={flashcard.word} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-square rounded-lg bg-neutral-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-neutral-300">{flashcard.word.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-neutral-600 text-center">
              {flashcard.definition || `A word meaning "${flashcard.word}"`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
