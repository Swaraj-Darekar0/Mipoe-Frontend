import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import CampaignCard from "@/components/creator/CampaignCard";
import QuickStats from "@/components/creator/QuickStats";
import { Button } from "@/components/ui/button";
import { fetchCreatorCampaigns, Campaign, getCreatorNotifications, deleteCreatorNotification, Notification as ApiNotification, getWalletBalance, getUserId } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import Notifications, { DisplayNotification } from "@/components/creator/Notifications";
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle, XCircle, DollarSign, ArrowUpRight, Sparkles } from 'lucide-react';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const CreatorDashboard = () => {
  const [yourCampaigns, setYourCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [activeSubmissions, setActiveSubmissions] = useState<number>(0);
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
        let icon: React.ReactNode = <Bell className="h-4 w-4" />;
        let colorClass = "bg-blue-500/10 border-blue-500/20";
        switch (notif.type) {
          case 'clip_approved': 
            icon = <CheckCircle className="h-4 w-4 text-emerald-600" />; 
            colorClass = "bg-emerald-50 border-emerald-200";
            break;
          case 'clip_rejected': 
            icon = <XCircle className="h-4 w-4 text-rose-600" />; 
            colorClass = "bg-rose-50 border-rose-200";
            break;
          case 'earning_payout': 
            displayMessage = `Payout of ₹${notif.amount?.toFixed(2)} is deposited into your wallet.`; 
            icon = <DollarSign className="h-4 w-4 text-blue-600" />; 
            colorClass = "bg-blue-50 border-blue-200";
            break;
          case 'withdrawal_initiated': 
            displayMessage = `Successfully initiated withdrawal of ₹${notif.amount?.toFixed(2)}.`; 
            icon = <ArrowUpRight className="h-4 w-4 text-purple-600" />; 
            colorClass = "bg-purple-50 border-purple-200";
            break;
        }
        return { ...notif, id: notif.id || `${notif.type}-${notif.timestamp}-${notif.clip_id || ''}`, displayMessage, icon, colorClass };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  useEffect(() => {
    setLoading(true);
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
        <div className="flex justify-center items-center h-64">
          <div className="text-zinc-500 font-medium text-sm flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            Loading Hub...
          </div>
        </div>
      </CreatorLayout>
    );
  }

  if (error) {
    return (
      <CreatorLayout>
        <div className="text-rose-600 text-center p-6 bg-rose-50 rounded-2xl border border-rose-200 font-medium text-sm">{error}</div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
              Creator Hub
            </h1>
            <span className="bg-pink-100 text-pink-700 p-1.5 rounded-full">
              <Sparkles className="size-4" />
            </span>
          </div>
          <p className="text-zinc-500 text-sm sm:text-base max-w-xl">
            Welcome back! Track your performance, active submissions, and active brand campaigns.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <QuickStats currentEarnings={walletBalance} activeSubmissions={activeSubmissions} loading={loading} />
          </div>
          <div className="lg:col-span-1">
             <Notifications processedNotifications={processedNotifications} loading={notificationsLoading} error={notificationsError} onDismiss={handleDismissNotification} />
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold font-display text-zinc-900 tracking-tight">Your Joined Campaigns</h2>
            {yourCampaigns.length > 0 && (
              <span className="text-xs font-mono font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                {yourCampaigns.length} Active
              </span>
            )}
          </div>

          {yourCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {yourCampaigns.map(camp => (
                <div key={camp.id} onClick={() => handleCardClick(camp.id)} className="cursor-pointer">
                  <CampaignCard {...camp} submitted={true} hideStatusActions={true} total_view_count={camp.total_view_count} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
              <div className="size-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3 border border-orange-200">
                <Sparkles size={20} />
              </div>
              <p className="text-zinc-800 font-semibold text-base">You haven't joined any campaigns yet.</p>
              <p className="text-zinc-500 text-xs mt-1 max-w-md mx-auto">Explore high-payout brand campaigns and start earning for your content today.</p>
              <Button onClick={() => navigate('/creator/campaigns')} className="mt-5 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-all">
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

