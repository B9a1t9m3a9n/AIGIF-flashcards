import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import StudentDashboard from "@/pages/student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import FlashcardLearning from "@/pages/flashcard-learning";
import RecordingFeedback from "@/pages/recording-feedback";
import FlashcardCreator from "@/pages/flashcard-creator";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={StudentDashboard} />
      <ProtectedRoute path="/teacher" component={TeacherDashboard} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/flashcards/:setId" component={FlashcardLearning} />
      <ProtectedRoute path="/practice/:flashcardId" component={RecordingFeedback} />
      <ProtectedRoute path="/create" component={FlashcardCreator} />
      {/* Added routes to match bottom navigation */}
      <ProtectedRoute 
        path="/flashcards" 
        component={() => <StudentDashboard active="cards" />} 
      />
      <ProtectedRoute 
        path="/practice" 
        component={() => <StudentDashboard active="practice" />} 
      />
      <ProtectedRoute 
        path="/progress" 
        component={() => <StudentDashboard active="progress" />} 
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
