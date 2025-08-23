import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Settings, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

type HeaderProps = {
  isTeacher?: boolean;
  isAdmin?: boolean;
}

export default function Header({ isTeacher, isAdmin }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/auth');
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = () => {
    if (isAdmin) return "bg-accent";
    if (isTeacher) return "bg-secondary";
    return "bg-primary-light";
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-30 shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Avatar className={`w-10 h-10 ${getAvatarColor()} text-white`}>
            <AvatarFallback>
              {user ? getInitials(user.displayName) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <h3 className="font-bold text-sm">{user?.displayName || "User"}</h3>
            <p className="text-xs text-neutral-600">
              {isAdmin ? "Admin" : isTeacher ? "Teacher" : user?.grade || "Student"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(isTeacher || isAdmin) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/create')}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Create Cards
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-neutral-100">
                <Settings className="h-5 w-5 text-neutral-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate('/')}>
                Dashboard
              </DropdownMenuItem>
              {(isTeacher || isAdmin) && (
                <DropdownMenuItem onSelect={() => navigate('/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Flashcards
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => navigate('/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-error">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-neutral-100">
              <Settings className="h-5 w-5 text-neutral-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => navigate('/')}>
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-error">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
