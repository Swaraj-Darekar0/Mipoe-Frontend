import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Wallet as WalletIcon, Send, CheckCircle2, Clock, XCircle, Copy, TrendingUp, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchCreatorProfile, updateCreatorProfile, fetchCreatorCampaigns, deleteClip, getWalletBalance, getWithdrawalHistory, type CreatorProfile as ApiCreatorProfile, Campaign, SubmittedClipData, AcceptedClipData } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Trash2, Pencil } from "lucide-react";

const getClipStatus = (clip: SubmittedClipData | AcceptedClipData) => {
  if ('media_id' in clip && clip.media_id !== undefined) {
    return "accepted";
  } else if ('is_deleted_by_admin' in clip && clip.is_deleted_by_admin) {
    return "rejected";
  } else {
    return "pending";
  }
};

const CLIP_STATUS = {
  pending: {
    label: "In Review",
    color: "bg-yellow-100 text-yellow-700",
    icon: "⏳",
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-100 text-green-700",
    icon: "✅",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: "❌",
  },
};

// Removed dummyProfile as it's no longer needed since we fetch live data

// Kept dummyCampaigns if still used for initial state or placeholder
// const dummyCampaigns = [
//   {
//     id: 1,
//     name: "Myntra Summer Shorts",
//     clips: [
//       {
//         id: 11,
//         thumbnail:
//           "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=360&q=80",
//         date: "2024-06-10",
//         status: "accepted",
//       },
//       {
//         id: 12,
//         thumbnail:
//           "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=360&q=80",
//         date: "2024-06-12",
//         status: "notAccepted",
//       },
//     ],
//   },
//   {
//     id: 2,
//     name: "BoAt #BassHeadz",
//     clips: [
//       {
//         id: 21,
//         thumbnail:
//           "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=360&q=80",
//         date: "2024-05-28",
//         status: "notAccepted",
//       },
//     ],
//   },
// ];

const ProfileHeader = ({ profile, walletBalance }: { profile: ApiCreatorProfile; walletBalance: number }) => (
  <div className="bg-white rounded-xl shadow-lg px-4 py-5 sm:px-8 mb-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <img
        src={"https://via.placeholder.com/150"}
        alt="Profile"
        className="w-20 h-20 rounded-full object-cover bg-gray-200 ring-2 ring-blue-200"
      />
      <div>
        <div className="font-bold text-2xl text-gray-800 truncate">
          {profile.username}
        </div>
        <div className="text-gray-500 text-sm mt-1 truncate">
          @{profile.nickname}
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="text-gray-700 font-semibold text-lg">
        Wallet Balance
      </div>
      <div className="text-2xl font-bold text-green-700 mb-2">
        ₹{walletBalance.toLocaleString('en-IN')} <span className="text-sm text-gray-500 font-medium">remaining</span>
      </div>
      <div className="flex gap-2">
        <Link to="/creator/wallet">
          <Button size="sm" variant="default" className="gap-2">
            <WalletIcon className="w-4 h-4" />
            Wallet
          </Button>
        </Link>
        <Link to="/creator/withdrawals">
          <Button size="sm" variant="outline" className="gap-2">
            <Send className="w-4 h-4" />
            Withdrawals
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

const InfoTab = ({ profile }: { profile: ApiCreatorProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname);
  const [bio, setBio] = useState(profile.bio);
  const [phone, setPhone] = useState(profile.phone); // Changed from phoneNumber to phone
  const { toast } = useToast();

  useEffect(() => {
    setNickname(profile.nickname);
    setBio(profile.bio);
    setPhone(profile.phone); // Changed from setPhoneNumber to setPhone
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateCreatorProfile({ nickname, bio, phone }); // Changed phone_number to phone
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({
          title: "Profile Update Failed",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Update Failed",
          description: "An unknown error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancel = () => {
    setNickname(profile.nickname);
    setBio(profile.bio);
    setPhone(profile.phone); // Changed from setPhoneNumber to setPhone
    setIsEditing(false);
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Personal Information</h3>
          {!isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-5 w-5 text-gray-500" />
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-1">
            <span className="text-gray-400 w-32 font-medium">Nickname:</span>
            {isEditing ? (
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1"
              />
            ) : (
              <span className="text-gray-900 font-semibold">{profile.nickname}</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-1">
            <span className="text-gray-400 w-32 font-medium">Bio:</span>
            {isEditing ? (
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="flex-1"
              />
            ) : (
              <span className="text-gray-900">{profile.bio}</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-1">
            <span className="text-gray-400 w-32 font-medium">Email:</span>
            <span className="text-gray-900">{profile.email}</span> {/* Email is not editable */}
          </div>
          <div className="flex flex-col sm:flex-row gap-1">
            <span className="text-gray-400 w-32 font-medium">Phone:</span>
            {isEditing ? (
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1"
              />
            ) : (
              <span className="text-gray-900">{profile.phone}</span>
            )}
          </div>
          {isEditing && (
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CampaignsTab = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingClipId, setDeletingClipId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCampaigns = async () => {
      try {
        const data = await fetchCreatorCampaigns();
        // The backend now only returns campaigns the creator has participated in.
        // No further filtering is needed on the frontend.
        setCampaigns(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
          toast({
            title: "Error fetching campaigns",
            description: err.message,
            variant: "destructive",
          });
        } else {
          setError("An unknown error occurred");
          toast({
            title: "Error fetching campaigns",
            description: "An unknown error occurred",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    getCampaigns();
  }, [toast]);

  const toggleCampaign = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleDeleteClip = async (clipId: number) => {
    if (!window.confirm('Are you sure you want to delete this clip?')) return;
    try {
      await deleteClip(clipId);
      toast({
        title: "Clip Deleted",
        description: "Your clip has been successfully deleted.",
      });
      // Refresh campaigns to reflect the deletion
      const updatedCampaigns = await fetchCreatorCampaigns();
      setCampaigns(updatedCampaigns);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({
          title: "Clip Deletion Failed",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Clip Deletion Failed",
          description: "An unknown error occurred",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Your Campaigns</h3>
      {loading ? (
        <div>Loading campaigns...</div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : campaigns.length === 0 ? (
        <div className="text-gray-500">No campaigns participated yet.</div>
      ) : (
        campaigns.map(campaign => (
          <Card key={campaign.id} className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleCampaign(campaign.id)}>
                <h4 className="font-bold">{campaign.name}</h4>
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedId === campaign.id ? "rotate-180" : ""}`} />
              </div>
              {expandedId === campaign.id && (
                <div className="mt-4 border-t pt-4">
                  {/* Temporarily make clips optional to allow structural fix to proceed */}
                  {campaign.submitted_clips && campaign.submitted_clips.length > 0 || campaign.accepted_clips && campaign.accepted_clips.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[...(campaign.submitted_clips || []), ...(campaign.accepted_clips || [])].map((clip) => {
                        const status = getClipStatus(clip);
                        const statusInfo = CLIP_STATUS[status as keyof typeof CLIP_STATUS];
                        
                        return (
                        <div key={clip.id} className="relative group overflow-hidden bg-zinc-800 rounded-lg shadow-sm w-full h-32 transition-transform duration-300 group-hover:scale-105">
                          {/* <img
                            src={clip.clip_url || "https://via.placeholder.com/150"}
                            alt={`Clip Thumbnail ${clip.id}`}
                            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                          /> */}
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                              <span className="text-[10px] font-medium uppercase tracking-widest opacity-40">
                               CLIP ID: {clip.id}
                               
                              </span>
                              <Badge className={`mt-1 ${statusInfo?.color || "bg-gray-500"}`}>
                              {statusInfo?.icon} {statusInfo?.label || "Unknown"}
                            </Badge>
                          </div>
                            
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex flex-col justify-end text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {/* <p className="text-sm font-semibold truncate">{'caption' in clip ? clip.caption || "No Caption" : "N/A"}</p> */}
                            <p className="text-xs text-gray-300">Posted: {('instagram_posted_at' in clip && clip.instagram_posted_at) ? new Date(clip.instagram_posted_at).toLocaleDateString() : ('submitted_at' in clip ? new Date(clip.submitted_at).toLocaleDateString() : 'N/A')}</p>
                            <p className="text-xs text-gray-300">Views: {clip.view_count || 'N/A'}</p>
                          
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              onClick={(e) => { e.stopPropagation(); handleDeleteClip(clip.id); }}
                              disabled={deletingClipId === clip.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                           
                        </div>
                      );})}
                    </div>
                  ) : (
                    <div className="text-gray-500">No clips submitted for this campaign yet.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

const WalletTab = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <p className="text-sm text-gray-600 mb-4">Access your wallet and withdrawal features:</p>
          <div className="flex flex-col gap-3">
            <Button 
              className="w-full gap-2" 
              onClick={() => navigate("/creator/wallet")}
            >
              <WalletIcon className="w-4 h-4" />
              Go to Wallet
            </Button>
            <Button 
              className="w-full gap-2" 
              variant="outline"
              onClick={() => navigate("/creator/withdrawals")}
            >
              <Send className="w-4 h-4" />
              View Withdrawal History
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">•</span>
              <span><strong>Add Funds:</strong> Deposit money to your wallet via various payment methods</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Withdraw:</strong> Transfer earned funds to your UPI or bank account</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>View History:</strong> Track all your transactions and withdrawals</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

interface WithdrawalRecord {
  id: number;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  payout_method: 'upi' | 'bank';
  reference_id?: string;
  utr?: string;
  created_at: string;
}

interface WithdrawalStats {
  total_withdrawn: number;
  total_pending: number;
  total_failed: number;
  withdrawal_count: number;
}

const WithdrawalsTab = () => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [stats, setStats] = useState<WithdrawalStats>({
    total_withdrawn: 0,
    total_pending: 0,
    total_failed: 0,
    withdrawal_count: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await getWithdrawalHistory(undefined, 10);
      setWithdrawals(response.withdrawals);
      
      // Calculate stats
      const allWithdrawals = response.withdrawals;
      const totalWithdrawn = allWithdrawals
        .filter(w => w.status === 'success')
        .reduce((sum, w) => sum + w.amount, 0);
      const totalPending = allWithdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);
      const totalFailed = allWithdrawals
        .filter(w => w.status === 'failed')
        .reduce((sum, w) => sum + w.amount, 0);
      
      setStats({
        total_withdrawn: totalWithdrawn,
        total_pending: totalPending,
        total_failed: totalFailed,
        withdrawal_count: response.count
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load withdrawal history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Reference ID copied to clipboard'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Withdrawn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              ₹{stats.total_withdrawn.toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3 text-yellow-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-600">
              ₹{stats.total_pending.toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-600" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">
              ₹{stats.total_failed.toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {stats.withdrawal_count}
            </div>
            <p className="text-xs text-gray-500 mt-1">Withdrawals</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Withdrawals</CardTitle>
          <CardDescription>Your latest withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No withdrawals yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((withdrawal) => (
                <div 
                  key={withdrawal.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <div className="font-semibold text-gray-900">
                        ₹{withdrawal.amount.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {withdrawal.payout_method.toUpperCase()}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </Badge>
                    {withdrawal.reference_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(withdrawal.reference_id!)}
                        className="px-2 h-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Profile = () => {
  const [profile, setProfile] = useState<ApiCreatorProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfileData = async () => {
      try {
        const data = await fetchCreatorProfile();
        setProfile(data);
        
        // Fetch wallet balance
        const walletData = await getWalletBalance();
        setWalletBalance(walletData.balance);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setProfileError(err.message);
        } else {
          setProfileError("An unknown error occurred");
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    getProfileData();
  }, []);

  if (loadingProfile) {
    return <div>Loading profile...</div>;
  }

  if (profileError) {
    return <div className="text-red-500">Error: {profileError}</div>;
  }

  if (!profile) {
    return <div>Profile data not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-6 pb-0">
        <Link to="/creator/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          Back to Dashboard
        </Link>
      </div>
      <ProfileHeader profile={profile} walletBalance={walletBalance} />
      <div className="flex-grow p-6 pt-0">
        <Tabs defaultValue="information" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            {/* <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger> */}
          </TabsList>
          <TabsContent value="information" className="mt-6">
            <InfoTab profile={profile} />
          </TabsContent>
          <TabsContent value="campaigns" className="mt-6">
            <CampaignsTab />
          </TabsContent>
          <TabsContent value="wallet" className="mt-6">
            <WalletTab />
          </TabsContent>
          {/* <TabsContent value="withdrawals" className="mt-6">
            <WithdrawalsTab />
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
