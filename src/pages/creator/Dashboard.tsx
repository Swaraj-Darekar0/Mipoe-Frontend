import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import CampaignCard from "@/components/creator/CampaignCard";
import QuickStats from "@/components/creator/QuickStats";
import { Button } from "@/components/ui/button";
import { fetchCreatorCampaigns, Campaign, getCreatorNotifications, deleteCreatorNotification, Notification as ApiNotification, getWalletBalance, getUserId, getCachedCreatorCampaigns } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import Notifications, { DisplayNotification } from "@/components/creator/Notifications";
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle, XCircle, DollarSign, ArrowUpRight, Sparkles, Loader2 } from 'lucide-react';
import { PortalPageHeader } from "@/components/ui/PortalPrimitives";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const CreatorDashboard = () => {
  const cachedCampaigns = getCachedCreatorCampaigns();
  const [yourCampaigns, setYourCampaigns] = useState<Campaign[]>(() => cachedCampaigns || []);
  const [loading, setLoading] = useState(() => !cachedCampaigns);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [activeSubmissions, setActiveSubmissions] = useState<number>(() => {
    if (!cachedCampaigns) return 0;
    return cachedCampaigns.reduce((acc, campaign) => {
      return acc + (campaign.submitted_clips?.length || 0) + (campaign.accepted_clips?.length || 0);
    }, 0);
  });
  const navigate = useNavigate();
  const creatorId = getUserId();
  const { toast } = useToast();

  const [processedNotifications, setProcessedNotifications] = useState<DisplayNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const processNotifications = (apiNotifications: ApiNotification[]): DisplayNotification[] => {
    const twentyFourHoursAgo = new Date(Date.now() - CACHE_DURATION_MS);
    return apiNotifications
      .filter(notif => new Date(notif.timestamp) > twentyFourHoursAgo)
      .map(notif => {
        let displayMessage = notif.message;
        let icon: React.ReactNode = <Bell className="h-4 w-4 text-ink" />;
        let colorClass = "bg-black/[0.03] border-black/10";
        switch (notif.type) {
          case 'clip_approved': 
            icon = <CheckCircle className="h-4 w-4 text-emerald-700" />; 
            colorClass = "bg-emerald-50 border-emerald-500/25";
            break;
          case 'clip_rejected': 
            icon = <XCircle className="h-4 w-4 text-rose-700" />; 
            colorClass = "bg-rose-50 border-rose-500/25";
            break;
          case 'earning_payout': 
            displayMessage = `Payout of ₹${notif.amount?.toFixed(2)} is deposited into your wallet.`; 
            icon = <DollarSign className="h-4 w-4 text-emerald-700" />; 
            colorClass = "bg-emerald-50 border-emerald-500/25";
            break;
          case 'withdrawal_initiated': 
            displayMessage = `Successfully initiated withdrawal of ₹${notif.amount?.toFixed(2)}.`; 
            icon = <ArrowUpRight className="h-4 w-4 text-lava" />; 
            colorClass = "bg-lava/10 border-lava/25";
            break;
        }
        return { ...notif, id: notif.id || `${notif.type}-${notif.timestamp}-${notif.clip_id || ''}`, displayMessage, icon, colorClass };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  useEffect(() => {
    if (!creatorId) {
      navigate('/creator/campaigns', { replace: true });
      return;
    }
    if (!cachedCampaigns) setLoading(true);
    const dataFetches = Promise.all([fetchCreatorCampaigns(), getWalletBalance()])
      .then(([yours, walletRes]) => {
        setYourCampaigns(yours);
        setWalletBalance(walletRes.balance);

        const totalActiveSubmissions = yours.reduce((acc, campaign) => {
            return acc + (campaign.submitted_clips?.length || 0) + (campaign.accepted_clips?.length || 0);
        }, 0);
        setActiveSubmissions(totalActiveSubmissions);
      })
      .catch((err: unknown) => {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      })
      .finally(() => {
        setLoading(false);
      });

    const notificationFetches = async () => {
      if (!creatorId) { setNotificationsLoading(false); return; }
      try {
        const response = await getCreatorNotifications(creatorId);
        setProcessedNotifications(processNotifications(response.notifications || []));
      } catch (err: any) {
        console.error("Error fetching notifications:", err);
        setNotificationsError(err.message || 'Failed to load recent activities.');
      } finally {
        setNotificationsLoading(false);
      }
    };

    Promise.all([dataFetches, notificationFetches()]).finally(() => setLoading(false));
    
  }, [creatorId, toast]);

  const handleCardClick = (id: number) => navigate(`/creator/dashboard/${id}`);

  const handleDismissNotification = async (notificationId: string) => {
    try {
      await deleteCreatorNotification(notificationId);
      setProcessedNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      toast({
        title: "Notification dismissed",
        description: "The notification was deleted from your history."
      });
    } catch (err: any) {
      console.error("Failed to dismiss notification:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to dismiss notification"
      });
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex justify-center items-center h-64 rounded-2xl border border-black/10 bg-white">
          <div className="text-slate font-mono text-xs uppercase tracking-wider flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-lava" />
            Loading Hub...
          </div>
        </div>
      </CreatorLayout>
    );
  }

  if (error) {
    return (
      <CreatorLayout>
        <div className="text-rose-700 text-center p-6 bg-rose-50 rounded-2xl border border-rose-500/25 font-medium text-sm">{error}</div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="01 // CREATOR WORKSPACE"
          title="Creator"
          highlighted="Hub"
          accent="creator"
          subtitle="Track your verified views, active submissions, and escrow brand briefs."
        />

        {!creatorId && (
          <div className="bg-white border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-lava/10 border border-lava/25 text-lava flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-ink">Browsing Creator Hub in Guest Mode</p>
                <p className="text-xs text-slate">Explore open campaigns and reward rates. Sign in anytime to claim slots and withdraw instant UPI earnings.</p>
              </div>
            </div>
            <Button
              variant="creator"
              size="sm"
              onClick={() => navigate('/login?role=creator&redirect=/creator/dashboard')}
              className="shrink-0"
            >
              Sign In with Google →
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <QuickStats currentEarnings={walletBalance} activeSubmissions={activeSubmissions} loading={loading} />
          </div>
          <div className="lg:col-span-1">
            <Notifications processedNotifications={processedNotifications} loading={notificationsLoading} error={notificationsError} onDismiss={handleDismissNotification} />
          </div>
        </div>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-black/10 pb-3">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-xs font-bold text-steel uppercase tracking-widest">02 //</span>
              <h2 className="text-xl font-bold font-display text-ink tracking-tight">Your Joined Campaigns</h2>
            </div>
            {yourCampaigns.length > 0 && (
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-lava bg-lava/10 px-2.5 py-1 rounded-full border border-lava/25">
                {yourCampaigns.length} Active
              </span>
            )}
          </div>

          {yourCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {yourCampaigns.map(camp => {
                const isEnded = Boolean(
                  camp.is_deadline_ended ||
                  (camp.deadline && new Date(camp.deadline) < new Date(new Date().setHours(0, 0, 0, 0)))
                );
                return (
                  <div
                    key={camp.id}
                    onClick={() => {
                      if (!isEnded) {
                        handleCardClick(camp.id);
                      }
                    }}
                    className={isEnded ? "cursor-default select-none" : "cursor-pointer"}
                    title={isEnded ? "Campaign deadline has ended. You cannot open this campaign." : "Click to view campaign"}
                  >
                    <CampaignCard
                      {...camp}
                      is_deadline_ended={isEnded}
                      earned={camp.earned}
                      submitted={true}
                      hideStatusActions={true}
                      total_view_count={camp.total_view_count}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-white rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
              <div className="size-12 rounded-xl bg-lava/10 text-lava flex items-center justify-center mx-auto mb-3 border border-lava/25">
                <Sparkles size={20} />
              </div>
              <p className="font-display text-ink font-bold text-base">You haven't joined any campaigns yet.</p>
              <p className="text-slate text-xs mt-1 max-w-md mx-auto">Explore high-payout brand campaigns and start earning for your content today.</p>
              <Button variant="creator" onClick={() => navigate('/creator/campaigns')} className="mt-5">
                Explore Campaigns
              </Button>
            </div>
          )}
        </section>
      </div>
    </CreatorLayout>
  );
};

export default CreatorDashboard;

