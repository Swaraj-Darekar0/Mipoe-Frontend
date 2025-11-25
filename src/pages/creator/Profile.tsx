import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchCreatorProfile, updateCreatorProfile, fetchCreatorCampaigns, deleteClip, type CreatorProfile as ApiCreatorProfile, Campaign, SubmittedClipData, AcceptedClipData } from "@/lib/api"; // Renamed import to avoid conflict
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

const ProfileHeader = ({ profile }: { profile: ApiCreatorProfile }) => (
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
      <div className="text-2xl font-bold text-green-700 mb-1">
        ₹2750 <span className="text-sm text-gray-500 font-medium">remaining</span>
      </div>
      <Button className="w-full mt-1" size="sm" variant="default">
        Withdraw
      </Button>
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

const Profile = () => { // This is the main component to be exported
  const [profile, setProfile] = useState<ApiCreatorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const getProfileData = async () => {
      try {
        const data = await fetchCreatorProfile();
        setProfile(data);
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
      <ProfileHeader profile={profile} />
      <div className="flex-grow p-6 pt-0">
        <Tabs defaultValue="information" className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>
          <TabsContent value="information" className="mt-6">
            <InfoTab profile={profile} />
          </TabsContent>
          <TabsContent value="campaigns" className="mt-6">
            <CampaignsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
