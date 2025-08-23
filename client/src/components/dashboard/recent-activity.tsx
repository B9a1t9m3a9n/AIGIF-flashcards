import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardIcon, Edit2Icon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UserActivity } from "@shared/schema";

type RecentActivityProps = {
  activities?: UserActivity[];
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  // Handle empty state
  if (!activities || activities.length === 0) {
    return (
      <section className="px-4 pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neutral-800">Recent Activity</h2>
          <Button variant="link" className="text-sm font-medium text-primary p-0 h-auto">See all</Button>
        </div>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-neutral-500 mb-4">No recent activities yet.</p>
            <Button>Start Learning</Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="px-4 pb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-neutral-800">Recent Activity</h2>
        <Button variant="link" className="text-sm font-medium text-primary p-0 h-auto">See all</Button>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity) => {
          // Determine the icon based on activity type
          const getIcon = (type: string) => {
            switch (type) {
              case 'completed_set':
                return ClipboardIcon;
              case 'practice_session':
                return Edit2Icon;
              default:
                return ClipboardIcon;
            }
          };
          
          // Determine the background color
          const getBgColor = (type: string) => {
            switch (type) {
              case 'completed_set':
                return 'bg-primary-light/20';
              case 'practice_session':
                return 'bg-secondary-light/20';
              default:
                return 'bg-accent-light/20';
            }
          };
          
          // Determine the text color
          const getTextColor = (type: string) => {
            switch (type) {
              case 'completed_set':
                return 'text-primary';
              case 'practice_session':
                return 'text-secondary';
              default:
                return 'text-accent-dark';
            }
          };
          
          // Determine the badge content and style
          const getBadge = (activity: UserActivity) => {
            if (activity.pointsEarned) {
              return {
                text: `+${activity.pointsEarned} XP`,
                bgColor: 'bg-success/20',
                textColor: 'text-success'
              };
            }
            if (activity.accuracy) {
              return {
                text: `${activity.accuracy}% Accuracy`,
                bgColor: 'bg-accent/20',
                textColor: 'text-accent-dark'
              };
            }
            return null;
          };
          
          const badge = getBadge(activity);
          const Icon = getIcon(activity.activityType);
          const bgColor = getBgColor(activity.activityType);
          const textColor = getTextColor(activity.activityType);
          
          return (
            <Card key={activity.id}>
              <CardContent className="p-4 flex items-center">
                <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center mr-3`}>
                  <Icon className={`h-5 w-5 ${textColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-800">{activity.description}</h3>
                  <p className="text-xs text-neutral-500">
                    {activity.createdAt 
                      ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) 
                      : "Recently"}
                  </p>
                </div>
                {badge && (
                  <div className="ml-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bgColor} ${badge.textColor}`}>
                      {badge.text}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
