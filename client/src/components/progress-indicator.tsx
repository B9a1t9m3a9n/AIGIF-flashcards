import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, PaintbrushIcon, FilmIcon, RocketIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  progress: number;
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  // Define the steps in the process
  const steps = [
    { id: 1, name: "Processing prompt", icon: CheckIcon, threshold: 0 },
    { id: 2, name: "Generating frames", icon: PaintbrushIcon, threshold: 25 },
    { id: 3, name: "Composing animation", icon: FilmIcon, threshold: 50 },
    { id: 4, name: "Finalizing GIF", icon: RocketIcon, threshold: 75 }
  ];

  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden p-6 mb-10">
      <CardContent className="p-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Creating Your GIF</h3>
        
        <div className="space-y-3">
          {steps.map((step) => {
            const isActive = progress >= step.threshold;
            const isCurrentStep = 
              progress >= step.threshold && 
              progress < (steps.find(s => s.id === step.id + 1)?.threshold || 100);
            
            return (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    isActive 
                      ? "bg-primary-100 text-primary" 
                      : "bg-gray-200 text-gray-400"
                  } ${isCurrentStep ? "animate-pulse" : ""}`}
                >
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="ml-4 flex-grow">
                  <p className={`text-sm font-medium ${
                    isActive ? "text-gray-900" : "text-gray-700 opacity-50"
                  }`}>
                    {step.name}
                  </p>
                  
                  {isCurrentStep && (
                    <div className="w-full mt-2">
                      <Progress 
                        value={((progress - step.threshold) / 
                          ((steps.find(s => s.id === step.id + 1)?.threshold || 100) - step.threshold)) * 100} 
                        className="h-2.5 bg-gray-200" 
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">This may take up to 30 seconds depending on complexity</p>
        </div>
      </CardContent>
    </Card>
  );
}
