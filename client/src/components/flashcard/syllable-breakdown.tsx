import { useEffect, useState } from "react";

type Syllable = {
  text: string;
  isHighlighted?: boolean;
};

type SyllableBreakdownProps = {
  syllables: Syllable[];
  className?: string;
  animate?: boolean;
  animationDelay?: number;
};

export default function SyllableBreakdown({ 
  syllables, 
  className = "", 
  animate = true,
  animationDelay = 500
}: SyllableBreakdownProps) {
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number>(-1);
  
  // Animation effect
  useEffect(() => {
    if (!animate) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const animateSyllables = () => {
      // Reset to no highlight
      setActiveSyllableIndex(-1);
      
      // Animate through each syllable
      let index = 0;
      
      const interval = setInterval(() => {
        if (index < syllables.length) {
          setActiveSyllableIndex(index);
          index++;
        } else {
          clearInterval(interval);
          timeoutId = setTimeout(animateSyllables, 2000); // Start over after 2s
        }
      }, animationDelay);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeoutId);
      };
    };
    
    // Start the animation
    const initialDelay = setTimeout(animateSyllables, 500);
    
    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timeoutId);
    };
  }, [syllables, animate, animationDelay]);
  
  return (
    <div className="flex justify-center space-x-1">
      {syllables.map((syllable, index) => (
        <div 
          key={index}
          className={`
            highlight-syllable ${className}
            ${index === activeSyllableIndex ? 'highlighted' : ''}
            ${syllable.isHighlighted ? 'highlighted' : ''}
            px-1
          `}
        >
          {syllable.text}
        </div>
      ))}
    </div>
  );
}
