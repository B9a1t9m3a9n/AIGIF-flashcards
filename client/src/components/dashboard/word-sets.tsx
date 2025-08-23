import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { FlashcardSet } from "@shared/schema";

// Using a loose type that matches what we need for display
type WordSetDisplay = {
  id: number;
  title: string;
  description?: string | null;
  wordCount?: number | null;
  coverImage?: string | null;
  progressPercentage?: number;
  [key: string]: any; // Allow additional properties without causing errors
};

type WordSetsProps = {
  sets?: Array<WordSetDisplay>;
};

export default function WordSets({ sets }: WordSetsProps) {
  const [, navigate] = useLocation();
  
  const handleSetClick = (setId: number) => {
    navigate(`/flashcards/${setId}`);
  };

  // Handle empty state
  if (!sets || sets.length === 0) {
    return (
      <section className="px-4 pb-6">
        <h2 className="text-xl font-bold text-neutral-800 mb-4">Word Sets</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-neutral-500">No word sets available.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="px-4 pb-6">
      <h2 className="text-xl font-bold text-neutral-800 mb-4">Word Sets</h2>
      
      <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {sets.map((set) => {
          // Calculate progress percentage (defaulting to 0 if not provided)
          const progressPercentage = set.progressPercentage || 0;
          
          // Calculate stroke-dasharray and stroke-dashoffset for the progress ring
          const radius = 12;
          const circumference = 2 * Math.PI * radius;
          const strokeDasharray = circumference;
          const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
          
          return (
            <Card 
              key={set.id} 
              className="flex-shrink-0 w-40 overflow-hidden cursor-pointer"
              onClick={() => handleSetClick(set.id)}
            >
              <div 
                className="h-24 bg-primary-light flex items-center justify-center" 
                style={{
                  backgroundImage: set.coverImage ? `url(${set.coverImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!set.coverImage && (
                  <span className="text-white font-bold text-2xl opacity-70">
                    {set.title.charAt(0)}
                  </span>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-bold text-neutral-800 text-sm" title={set.title}>
                  {set.title.length > 15 ? `${set.title.substring(0, 15)}...` : set.title}
                </h3>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-neutral-500">{set.wordCount} words</span>
                  <div className="relative w-8 h-8">
                    <svg className="progress-ring w-8 h-8">
                      <circle 
                        className="text-neutral-200" 
                        strokeWidth="3" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r={radius} 
                        cx="16" 
                        cy="16" 
                      />
                      <circle 
                        className="text-primary" 
                        strokeWidth="3" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r={radius} 
                        cx="16" 
                        cy="16" 
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
