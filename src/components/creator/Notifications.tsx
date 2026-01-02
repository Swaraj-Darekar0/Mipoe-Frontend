

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Notification as ApiNotification } from '@/lib/api';

// This is a re-usable interface that describes a processed notification ready for display
export interface DisplayNotification extends ApiNotification {
  id: string;
  displayMessage: string;
  icon: React.ReactNode;
  colorClass: string;
}

interface NotificationsProps {
  processedNotifications: DisplayNotification[];
  loading: boolean;
  error: string | null;
}

const Notifications = ({ processedNotifications, loading, error }: NotificationsProps) => {
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'submission_approved':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'submission_rejected':
        return <XCircle className="text-red-400" size={20} />;
      case 'new_message':
        return <MessageSquare className="text-blue-400" size={20} />;
      default:
        return <Bell className="text-gray-400" size={20} />;
    }
  };

  const getIconBgClass = (type: string) => {
    switch (type) {
      case 'submission_approved':
        return "bg-green-900/50";
      case 'submission_rejected':
        return "bg-red-900/50";
      case 'new_message':
        return "bg-blue-900/50";
      default:
        return "bg-gray-700";
    }
  }

  if (loading) {
    return (
      <Card className="bg-raisin-black border border-[#262626] rounded-xl p-6 flex flex-col">
        <CardHeader className='p-0 mb-4'>
          <CardTitle className="font-display text-snow text-[22px] font-bold leading-tight tracking-[-0.015em]">Notifications Center</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className="flex items-center justify-center p-4">
            <Bell className="h-6 w-6 animate-bounce text-dusty-grey" />
            <span className="ml-2 text-dusty-grey">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-raisin-black border border-[#262626] rounded-xl p-6 flex flex-col">
        <CardHeader className='p-0 mb-4'>
          <CardTitle className="font-display text-snow text-[22px] font-bold leading-tight tracking-[-0.015em]">Notifications Center</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className="text-sm text-red-500 text-center py-4">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-raisin-black border border-[#262626] rounded-xl p-6 flex flex-col">
      <CardHeader className='p-0 mb-4'>
        <CardTitle className="font-display text-snow text-[22px] font-bold leading-tight tracking-[-0.015em]">Notification Center</CardTitle>
      </CardHeader>
      <CardContent className='p-0 flex-1 flex flex-col'>
        {processedNotifications.length > 0 ? (
          <div className="flex flex-col gap-4 overflow-y-auto pr-2 flex-1">
            {processedNotifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${getIconBgClass(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <p className="text-snow text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: notif.displayMessage }} />
                  <p className="text-dusty-grey text-xs">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
             {processedNotifications.length > 3 && (
              <Button variant="link" size="sm" className="p-0 h-auto text-primary hover:text-primary/80 mt-2" onClick={() => navigate('/creator/notifications')}>
                View All Activities
              </Button>
            )}
          </div>
        ) : (
          <div className="text-sm text-dusty-grey text-center py-4">No recent activities.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default Notifications;

