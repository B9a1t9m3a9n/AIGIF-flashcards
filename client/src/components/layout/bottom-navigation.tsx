import { Link } from "wouter";
import { HomeIcon, LayersIcon, MicIcon, BarChartIcon } from "lucide-react";

type BottomNavigationProps = {
  active: "home" | "cards" | "practice" | "progress";
};

export default function BottomNavigation({ active }: BottomNavigationProps) {
  const items = [
    {
      id: "home",
      label: "Home",
      icon: HomeIcon,
      path: "/"
    },
    {
      id: "cards",
      label: "Cards",
      icon: LayersIcon,
      path: "/flashcards" // Updated to a valid route for flashcards
    },
    {
      id: "practice",
      label: "Practice",
      icon: MicIcon,
      path: "/practice" // Updated to a valid route for practice
    },
    {
      id: "progress",
      label: "Progress",
      icon: BarChartIcon,
      path: "/progress" // Updated to a valid route for progress
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 py-2 px-6 z-30">
      <div className="flex justify-between items-center">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <Link 
              key={item.id} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-16 py-2 ${isActive ? 'text-primary' : 'text-neutral-400'}`}
            >
              <item.icon 
                className={`h-6 w-6`}
              />
              <span 
                className={`text-xs font-medium mt-1`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
