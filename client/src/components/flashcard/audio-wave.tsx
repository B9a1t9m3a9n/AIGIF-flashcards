import { useEffect, useState } from "react";

type AudioWaveProps = {
  className?: string;
  barCount?: number;
  isActive?: boolean;
};

export default function AudioWave({ 
  className = "", 
  barCount = 8,
  isActive = true
}: AudioWaveProps) {
  const [bars, setBars] = useState<number[]>([]);
  
  useEffect(() => {
    // Generate random heights for the bars
    const generateBars = () => {
      return Array.from({ length: barCount }, () => Math.floor(Math.random() * 24) + 8);
    };
    
    setBars(generateBars());
    
    if (!isActive) return;
    
    // Animate the bars by regenerating them
    const interval = setInterval(() => {
      setBars(generateBars());
    }, 100);
    
    return () => clearInterval(interval);
  }, [barCount, isActive]);
  
  return (
    <div className={`audio-wave ${className}`}>
      {bars.map((height, index) => (
        <span 
          key={index} 
          style={{ 
            height: isActive ? `${height}px` : "8px",
            animationPlayState: isActive ? "running" : "paused"
          }}
        ></span>
      ))}
    </div>
  );
}
