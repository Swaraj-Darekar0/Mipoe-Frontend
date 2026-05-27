

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, XCircle, MessageSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Notification as ApiNotification } from '@/lib/api';

// This is a re-usable interface that describes a processed notification ready for display
export interface DisplayNotification extends ApiNotification {
  displayMessage: string;
  icon: React.ReactNode;
  colorClass: string;
}

interface NotificationsProps {
  processedNotifications: DisplayNotification[];
  loading: boolean;
  error: string | null;
  onDismiss?: (notificationId: string) => void;
}

const Notifications = ({ processedNotifications, loading, error, onDismiss }: NotificationsProps) => {
  const navigate = useNavigate();

  const getIcon = (notif: DisplayNotification) => {
    if (notif.clip_thumbnail) {
      return (
        <img
          src={notif.clip_thumbnail}
          alt="Clip thumbnail"
          className="w-full h-full object-cover rounded-full"
        />
      );
    }
    switch (notif.type) {
      case 'clip_approved':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'clip_rejected':
        return <XCircle className="text-red-400" size={20} />;
      case 'earning_payout':
        return <CheckCircle className="text-blue-400" size={20} />;
      case 'withdrawal_initiated':
        return <MessageSquare className="text-purple-400" size={20} />;
      default:
        return <Bell className="text-gray-400" size={20} />;
    }
  };

  const getIconBgClass = (notif: DisplayNotification) => {
    if (notif.clip_thumbnail) {
      return "bg-transparent border border-[#262626]";
    }
    switch (notif.type) {
      case 'clip_approved':
        return "bg-green-900/50";
      case 'clip_rejected':
        return "bg-red-900/50";
      case 'earning_payout':
        return "bg-blue-900/50";
      case 'withdrawal_initiated':
        return "bg-purple-900/50";
      default:
        return "bg-gray-700";
    }
  };

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
              <div key={notif.id} className="flex items-start gap-3 relative group">
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${getIconBgClass(notif)}`}>
                  {getIcon(notif)}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-snow text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: notif.displayMessage }} />
                  <p className="text-dusty-grey text-xs">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
                {onDismiss && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(notif.id);
                    }}
                    className="absolute top-0 right-0 text-dusty-grey hover:text-snow opacity-50 hover:opacity-100 transition-all p-1 bg-transparent border-0 cursor-pointer"
                    title="Dismiss notification"
                  >
                    <X size={14} />
                  </button>
                )}
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


