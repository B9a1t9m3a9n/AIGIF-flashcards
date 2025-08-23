import { Card, CardContent } from "@/components/ui/card";
import { TrendingUpIcon, CheckCircleIcon, ClockIcon } from "lucide-react";

type ProgressMetric = {
  value: string | number;
  label: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
};

type ProgressOverviewProps = {
  progress?: {
    totalFlashcards: number;
    masteredFlashcards: number;
    masteredPercentage: number;
  };
  progressBySet?: Array<{
    setId: number;
    title: string;
    totalWords: number;
    masteredWords: number;
    progressPercentage: number;
  }>;
};

export default function ProgressOverview({ progress, progressBySet }: ProgressOverviewProps) {
  const defaultProgress = {
    totalFlashcards: 0,
    masteredFlashcards: 0,
    masteredPercentage: 0
  };

  const currentProgress = progress || defaultProgress;

  // Define progress metrics
  const progressMetrics: ProgressMetric[] = [
    {
      value: "48",
      label: "Daily Streak",
      icon: TrendingUpIcon,
      bgColor: "bg-primary-light/20",
      iconColor: "text-primary"
    },
    {
      value: `${Math.round(currentProgress.masteredPercentage)}%`,
      label: "Accuracy",
      icon: CheckCircleIcon,
      bgColor: "bg-secondary-light/20",
      iconColor: "text-secondary"
    },
    {
      value: "32m",
      label: "Today's Time",
      icon: ClockIcon,
      bgColor: "bg-accent-light/20",
      iconColor: "text-accent-dark"
    }
  ];

  return (
    <section className="px-4 pt-4 pb-6">
      <h2 className="text-xl font-bold text-neutral-800 mb-4">Your Progress</h2>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-neutral-600">Completed Words</span>
            <span className="text-sm font-bold text-primary">{currentProgress.masteredPercentage}%</span>
          </div>
          
          <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${currentProgress.masteredPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-neutral-500">
            <span>{currentProgress.masteredFlashcards} words</span>
            <span>of {currentProgress.totalFlashcards} words</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-3 gap-3">
        {progressMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-3 text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${metric.bgColor} mb-2`}>
                <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-neutral-800">{metric.value}</h3>
              <p className="text-xs text-neutral-600">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
