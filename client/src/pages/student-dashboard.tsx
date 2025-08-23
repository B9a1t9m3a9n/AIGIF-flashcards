import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ProgressOverview from "@/components/dashboard/progress-overview";
import RecentActivity from "@/components/dashboard/recent-activity";
import WordSets from "@/components/dashboard/word-sets";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

type StudentDashboardProps = {
  active?: "home" | "cards" | "practice" | "progress";
};

export default function StudentDashboard({ active = "home" }: StudentDashboardProps) {
  const { user, userRole } = useAuth();
  const [, navigate] = useLocation();

  // Redirect users based on role
  useEffect(() => {
    if (userRole === "teacher") {
      navigate("/teacher");
    } else if (userRole === "admin") {
      navigate("/admin");
    }
  }, [userRole, navigate]);

  // Define types for the progress data
  type ProgressData = {
    overall: {
      totalFlashcards: number;
      masteredFlashcards: number;
      masteredPercentage: number;
    };
    progressBySet: Array<{
      setId: number;
      title: string;
      totalWords: number;
      masteredWords: number;
      progressPercentage: number;
    }>;
    assignedSets: Array<{
      id: number;
      title: string;
      description: string | null;
      wordCount: number | null;
      coverImage: string | null;
      createdById: number | null;
      isPreloaded: boolean | null;
      createdAt: Date; 
      progressPercentage?: number;
    }>;
  };

  // Define types for the activities data
  type ActivityData = Array<{
    id: number;
    createdAt: Date;
    userId: number;
    activityType: string;
    description: string;
    pointsEarned: number | null;
    accuracy: number | null;
  }>;

  // Fetch student progress data
  const { data: progress, isLoading: progressLoading } = useQuery<ProgressData>({
    queryKey: ["/api/progress"],
    enabled: !!user,
  });

  // Fetch student activities
  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityData>({
    queryKey: ["/api/activities"],
    enabled: !!user,
  });

  // Content to display based on active tab
  const renderContent = () => {
    // Create default empty objects to avoid TypeScript errors
    const defaultProgress = {
      totalFlashcards: 0,
      masteredFlashcards: 0,
      masteredPercentage: 0
    };
    
    const defaultProgressBySet: Array<{
      setId: number;
      title: string;
      totalWords: number;
      masteredWords: number;
      progressPercentage: number;
    }> = [];
    
    // For now, we'll show the same content for different tabs
    // In a real app, we'd show different components based on the active tab
    switch (active) {
      case "home":
        return (
          <>
            <ProgressOverview 
              progress={progress?.overall || defaultProgress} 
              progressBySet={progress?.progressBySet || defaultProgressBySet} 
            />
            <RecentActivity activities={activities || []} />
            <WordSets sets={progress?.assignedSets || []} />
          </>
        );
      case "cards":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-neutral-800 mb-4">Flashcards</h2>
            <WordSets sets={progress?.assignedSets || []} />
          </div>
        );
      case "practice":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-neutral-800 mb-4">Practice</h2>
            <p className="text-center p-8 text-neutral-500">
              Select a flashcard set from Home to start practicing.
            </p>
          </div>
        );
      case "progress":
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-neutral-800 mb-4">Your Progress</h2>
            <ProgressOverview 
              progress={progress?.overall || defaultProgress} 
              progressBySet={progress?.progressBySet || defaultProgressBySet} 
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (progressLoading || activitiesLoading) {
    return (
      <div className="flex flex-col h-screen bg-neutral-100 overflow-hidden">
        <Header />
        <div className="h-full overflow-y-auto pb-20 pt-14">
          <div className="p-4">
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-60 w-full mb-6" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <BottomNavigation active={active} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-100 overflow-hidden">
      <Header />
      <div className="h-full overflow-y-auto pb-20 pt-14">
        {renderContent()}
      </div>
      <BottomNavigation active={active} />
    </div>
  );
}
