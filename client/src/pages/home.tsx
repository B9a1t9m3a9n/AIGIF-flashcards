import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Gif } from "@shared/schema";
import Header from "@/components/header";
import GeneratorForm from "@/components/generator-form";
import ProgressIndicator from "@/components/progress-indicator";
import GifGrid from "@/components/gif-grid";
import Footer from "@/components/footer";

export default function Home() {
  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  // Fetch all generated GIFs
  const { data: gifs = [], refetch } = useQuery<Gif[]>({
    queryKey: ["/api/gifs"],
  });

  // Update progress state periodically when generating
  const updateProgress = () => {
    if (isGenerating) {
      // Simulate progress steps: 0, 25, 50, 75, 100
      setGenerationProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 25;
      });
    }
  };

  // Start generation (called from GeneratorForm)
  const handleStartGeneration = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate progress updates
    const interval = setInterval(() => {
      updateProgress();
    }, 750);
    
    // Clear interval when done
    return () => clearInterval(interval);
  };

  // End generation (called from GeneratorForm after successful generation)
  const handleGenerationComplete = () => {
    setIsGenerating(false);
    setGenerationProgress(100);
    
    // Reset progress after a delay
    setTimeout(() => {
      setGenerationProgress(0);
    }, 1000);
    
    // Refresh the GIF list
    refetch();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-5xl flex-grow">
        <Header />
        
        {/* Generator Form */}
        <GeneratorForm 
          onStartGeneration={handleStartGeneration}
          onGenerationComplete={handleGenerationComplete}
        />
        
        {/* Progress Indicator (only show when generating) */}
        {isGenerating && (
          <ProgressIndicator progress={generationProgress} />
        )}
        
        {/* Results Section */}
        <GifGrid gifs={gifs} />
      </div>
      
      <Footer />
    </div>
  );
}
