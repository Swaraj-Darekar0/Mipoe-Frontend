import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import CampaignCard from "@/components/creator/CampaignCard";
import QuickStats from "@/components/creator/QuickStats";
import { Button } from "@/components/ui/button";
import { fetchCreatorCampaigns, Campaign, getCreatorNotifications, Notification as ApiNotification, getWalletBalance, getUserId } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import Notifications, { DisplayNotification } from "@/components/creator/Notifications";
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle, XCircle, DollarSign, ArrowUpRight } from 'lucide-react';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

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
            icon = <CheckCircle className="h-4 w-4 text-green-500" />; 
            colorClass = "bg-green-500/10 border-green-500/20";
            break;
          case 'clip_rejected': 
            icon = <XCircle className="h-4 w-4 text-red-500" />; 
            colorClass = "bg-red-500/10 border-red-500/20";
            break;
          case 'earning_payout': 
            displayMessage = `Payout of ₹${notif.amount?.toFixed(2)} is deposited into your wallet.`; 
            icon = <DollarSign className="h-4 w-4 text-blue-500" />; 
            colorClass = "bg-blue-500/10 border-blue-500/20";
            break;
          case 'withdrawal_initiated': 
            displayMessage = `Successfully initiated withdrawal of ₹${notif.amount?.toFixed(2)}.`; 
            icon = <ArrowUpRight className="h-4 w-4 text-purple-500" />; 
            colorClass = "bg-purple-500/10 border-purple-500/20";
            break;
        }
        return { ...notif, id: `${notif.type}-${notif.timestamp}-${notif.clip_id || ''}`, displayMessage, icon, colorClass };
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

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex justify-center items-center h-64"><div className="text-gray-400">Loading Hub...</div></div>
      </CreatorLayout>
    );
  }

  if (error) {
    return (
      <CreatorLayout>
        <div className="text-red-500 text-center p-4">{error}</div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-4xl font-bold text-white">Hub</h1>
          <p className="text-gray-400 mt-2">Welcome back! Here's a summary of your creator activity.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <QuickStats currentEarnings={walletBalance} activeSubmissions={activeSubmissions} loading={loading} />
          </div>
          <div className="lg:col-span-1">
             <Notifications processedNotifications={processedNotifications} loading={notificationsLoading} error={notificationsError} />
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-6 font-display text-white">Your Campaigns</h2>
          {yourCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {yourCampaigns.map(camp => (
                <div key={camp.id} onClick={() => handleCardClick(camp.id)} className="cursor-pointer">
                  <CampaignCard {...camp} submitted={true} hideStatusActions={true} total_view_count={camp.total_view_count} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-6 bg-[#18181B] rounded-lg border border-white/10">
                <p className="text-gray-400">You haven't joined any campaigns yet.</p>
                <Button onClick={() => navigate('/creator/campaigns')} variant="default" className="mt-4">
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
