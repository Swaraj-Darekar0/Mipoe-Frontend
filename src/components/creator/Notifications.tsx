

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, XCircle, MessageSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Notification as ApiNotification } from '@/lib/api';

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
        return <CheckCircle className="text-emerald-600" size={18} />;
      case 'clip_rejected':
        return <XCircle className="text-rose-600" size={18} />;
      case 'earning_payout':
        return <CheckCircle className="text-blue-600" size={18} />;
      case 'withdrawal_initiated':
        return <MessageSquare className="text-purple-600" size={18} />;
      default:
        return <Bell className="text-zinc-500" size={18} />;
    }
  };

  const getIconBgClass = (notif: DisplayNotification) => {
    if (notif.clip_thumbnail) {
      return "bg-transparent border border-zinc-200";
    }
    switch (notif.type) {
      case 'clip_approved':
        return "bg-emerald-100/80 border border-emerald-200";
      case 'clip_rejected':
        return "bg-rose-100/80 border border-rose-200";
      case 'earning_payout':
        return "bg-blue-100/80 border border-blue-200";
      case 'withdrawal_initiated':
        return "bg-purple-100/80 border border-purple-200";
      default:
        return "bg-zinc-100 border border-zinc-200";
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
        <CardHeader className='p-0 mb-4'>
          <CardTitle className="font-display text-zinc-900 text-xl font-bold tracking-tight">Notification Center</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className="flex items-center justify-center p-6">
            <Bell className="h-5 w-5 animate-bounce text-zinc-400" />
            <span className="ml-2.5 text-xs text-zinc-500 font-medium">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
        <CardHeader className='p-0 mb-4'>
          <CardTitle className="font-display text-zinc-900 text-xl font-bold tracking-tight">Notification Center</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className="text-xs text-rose-600 text-center py-4">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <CardHeader className='p-0 mb-4 flex-row items-center justify-between'>
        <CardTitle className="font-display text-zinc-900 text-xl font-bold tracking-tight">Notification Center</CardTitle>
        <span className="text-[11px] font-mono text-zinc-400">Activity</span>
      </CardHeader>
      <CardContent className='p-0 flex-1 flex flex-col justify-between'>
        {processedNotifications.length > 0 ? (
          <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1">
            {processedNotifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 relative group p-2.5 rounded-xl bg-zinc-50/70 border border-zinc-100 hover:bg-zinc-100/60 transition-colors">
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${getIconBgClass(notif)}`}>
                  {getIcon(notif)}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-zinc-800 text-xs leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: notif.displayMessage }} />
                  <p className="text-zinc-400 text-[10px] mt-0.5">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
                {onDismiss && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(notif.id);
                    }}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-700 opacity-60 hover:opacity-100 transition-all p-1 bg-transparent border-0 cursor-pointer"
                    title="Dismiss notification"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
             {processedNotifications.length > 3 && (
              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-orange-600 hover:text-orange-700 font-semibold mt-2 self-start" onClick={() => navigate('/creator/notifications')}>
                View All Activities →
              </Button>
            )}
          </div>
        ) : (
          <div className="text-xs text-zinc-400 text-center py-8">No recent activities.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default Notifications;



