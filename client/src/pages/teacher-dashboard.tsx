import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, FolderIcon, ClipboardListIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherDashboard() {
  const { user, userRole } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-teacher users
  useEffect(() => {
    if (userRole === "student") {
      navigate("/");
    } else if (userRole === "admin") {
      navigate("/admin");
    }
  }, [userRole, navigate]);

  // Fetch class overview data
  const { data: classOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/teacher/class-overview"],
    enabled: !!user && userRole === "teacher",
  });

  // Fetch students data
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/teacher/students"],
    enabled: !!user && userRole === "teacher",
  });

  // Fetch flashcard sets
  const { data: flashcardSets, isLoading: setsLoading } = useQuery({
    queryKey: ["/api/flashcard-sets"],
    enabled: !!user && userRole === "teacher",
  });

  if (overviewLoading || studentsLoading || setsLoading) {
    return (
      <div className="flex flex-col h-screen bg-neutral-100 overflow-hidden">
        <Header isTeacher={true} />
        <div className="h-full overflow-y-auto pb-20 pt-14">
          <div className="p-4">
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-60 w-full mb-6" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
        <BottomNavigation active="home" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-100 overflow-hidden">
      <Header isTeacher={true} />
      <div className="h-full overflow-y-auto pb-20 pt-14">
        {/* Class Overview */}
        <section className="px-4 pt-4 pb-6">
          <h2 className="text-xl font-bold text-neutral-800 mb-4">Class Overview</h2>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-neutral-600">Class Progress</span>
                <span className="text-sm font-bold text-primary">{classOverview?.overallProgress.averageProgress || 0}%</span>
              </div>
              
              <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${classOverview?.overallProgress.averageProgress || 0}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span>Average completion</span>
                <span>{classOverview?.overallProgress.totalStudents || 0} students</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button variant="outline" className="bg-white shadow-card flex-col h-auto py-4 px-4">
              <div className="w-12 h-12 rounded-full bg-primary-light/20 flex items-center justify-center mb-2">
                <PlusIcon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">Create Flashcards</span>
            </Button>
            
            <Button variant="outline" className="bg-white shadow-card flex-col h-auto py-4 px-4">
              <div className="w-12 h-12 rounded-full bg-secondary-light/20 flex items-center justify-center mb-2">
                <ClipboardListIcon className="h-6 w-6 text-secondary" />
              </div>
              <span className="text-sm font-semibold">Assign Quiz</span>
            </Button>
          </div>
        </section>
        
        {/* Student Progress */}
        <section className="px-4 pb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-neutral-800">Student Progress</h2>
            <Button variant="link" className="text-sm font-medium text-primary p-0 h-auto">
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {students?.slice(0, 3).map((student) => (
              <Card key={student.id}>
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                      <span className="font-bold text-neutral-600">
                        {student.displayName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800">{student.displayName}</h3>
                      <p className="text-xs text-neutral-500">Last active: Today</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-neutral-600">Progress</span>
                      <span className="text-xs font-bold text-primary">
                        {/* This would be calculated from actual student progress */}
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Flashcard Sets */}
        <section className="px-4 pb-6">
          <h2 className="text-xl font-bold text-neutral-800 mb-4">Flashcard Sets</h2>
          
          <div className="space-y-3">
            {flashcardSets?.slice(0, 3).map((set) => (
              <Card key={set.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-neutral-800">{set.title}</h3>
                    <Button variant="ghost" size="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-neutral-500">{set.wordCount} words</span>
                    <Button variant="outline" size="sm" className="h-7 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border-none">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
      <BottomNavigation active="home" />
    </div>
  );
}
