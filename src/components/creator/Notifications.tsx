import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, XCircle, MessageSquare, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Notification as ApiNotification } from "@/lib/api";

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

const Notifications: React.FC<NotificationsProps> = ({
  processedNotifications,
  loading,
  error,
  onDismiss,
}) => {
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
      case "clip_approved":
        return <CheckCircle className="text-emerald-700" size={16} />;
      case "clip_rejected":
        return <XCircle className="text-rose-700" size={16} />;
      case "earning_payout":
        return <CheckCircle className="text-emerald-700" size={16} />;
      case "withdrawal_initiated":
        return <MessageSquare className="text-lava" size={16} />;
      default:
        return <Bell className="text-slate" size={16} />;
    }
  };

  const getIconBgClass = (notif: DisplayNotification) => {
    if (notif.clip_thumbnail) {
      return "bg-white border border-black/10";
    }
    switch (notif.type) {
      case "clip_approved":
      case "earning_payout":
        return "bg-emerald-50 border border-emerald-500/25";
      case "clip_rejected":
        return "bg-rose-50 border border-rose-500/25";
      case "withdrawal_initiated":
        return "bg-lava/10 border border-lava/25";
      default:
        return "bg-black/[0.04] border border-black/10";
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl bg-white text-ink border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex flex-col h-full">
        <CardHeader className="p-0 mb-4 space-y-0.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
            02 // ACTIVITY LOG
          </p>
          <CardTitle className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink">
            Notification Center
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex items-center justify-center py-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-lava shrink-0" />
            <span className="font-mono text-xs text-slate">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl bg-white text-ink border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex flex-col h-full">
        <CardHeader className="p-0 mb-4 space-y-0.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
            02 // ACTIVITY LOG
          </p>
          <CardTitle className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink">
            Notification Center
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg bg-rose-50 border border-rose-500/25 text-xs text-rose-700 text-center py-4 px-3 break-words">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl bg-white text-ink border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex flex-col h-full min-w-0">
      <CardHeader className="p-0 mb-3.5 flex-row items-start justify-between gap-2 space-y-0 min-w-0">
        <div className="min-w-0 space-y-0.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
            02 // ACTIVITY LOG
          </p>
          <CardTitle className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink truncate">
            Notification Center
          </CardTitle>
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-steel shrink-0 pt-0.5">
          Activity
        </span>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col justify-between min-w-0">
        {processedNotifications.length > 0 ? (
          <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 min-w-0">
            {processedNotifications.slice(0, 3).map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-2.5 relative p-2.5 rounded-lg bg-black/[0.03] border border-black/[0.06] hover:border-black/15 transition-colors duration-150 min-w-0"
              >
                <div
                  className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${getIconBgClass(
                    notif
                  )}`}
                >
                  {getIcon(notif)}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p
                    className="text-charcoal text-xs leading-relaxed font-medium break-words [overflow-wrap:anywhere]"
                    dangerouslySetInnerHTML={{ __html: notif.displayMessage }}
                  />
                  <p className="font-mono text-[10px] tabular-nums text-steel mt-1 truncate">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(notif.id);
                    }}
                    className="absolute top-2 right-2 text-steel hover:text-ink hover:bg-black/[0.06] transition-colors duration-150 p-1 rounded-md bg-transparent border-0 cursor-pointer"
                    title="Dismiss notification"
                    aria-label="Dismiss notification"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}

            {processedNotifications.length > 3 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto font-mono text-[11px] font-bold uppercase tracking-wider text-lava hover:text-lava/80 mt-1 self-start"
                onClick={() => navigate("/creator/notifications")}
              >
                View All Activities →
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-black/[0.02] border border-dashed border-black/10 font-mono text-xs text-steel text-center py-8 px-3">
            No recent activities.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Notifications;
