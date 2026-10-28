
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pencil, CheckCircle2, XCircle, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import { fetchCreatorProfile, updateCreatorProfile, verifyInstagram, deleteAccount, getUserId, type CreatorProfile as ApiCreatorProfile } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import CreatorLayout from '@/layouts/CreatorLayout';
import GuestLockedView from '@/components/creator/GuestLockedView';
import Images from '@/assets/bg31.png';
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const [profile, setProfile] = useState<ApiCreatorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE to confirm permanent account deletion.",
        variant: "destructive"
      });
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount(deleteReason || "User requested self-service erasure via Profile");
      toast({
        title: "Account Permanently Deleted",
        description: "Your personal data has been scrubbed under the DPDP Act 2023.",
      });
      setShowDeleteModal(false);
      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to process account deletion request",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!getUserId()) {
      setLoadingProfile(false);
      return;
    }
    const getProfileData = async () => {
      try {
        const data = await fetchCreatorProfile();
        setProfile(data);
        setNickname(data.nickname || "");
        setBio(data.bio || "");
        setPhone(data.phone || "");
        setInstagramUsername(data.instagram_username || "");
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

  const handleSave = async () => {
    try {
      await updateCreatorProfile({ nickname, bio, phone, instagram_username: instagramUsername });
      if (profile) {
        // Refetch profile to get the latest verification status
        const updatedProfile = await fetchCreatorProfile();
        setProfile(updatedProfile);
        setNickname(updatedProfile.nickname || "");
        setBio(updatedProfile.bio || "");
        setPhone(updatedProfile.phone || "");
        setInstagramUsername(updatedProfile.instagram_username || "");
      }
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast({
        title: "Profile Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleVerify = async () => {
    if (!instagramUsername) {
      toast({ title: "Instagram username cannot be empty.", variant: "destructive" });
      return;
    }
    setIsVerifying(true);
    try {
      const result = await verifyInstagram(instagramUsername);
      if (result.exists) {
        toast({ title: "Instagram account verified!", description: "Your Instagram account has been successfully linked." });
        const updatedProfile = await fetchCreatorProfile();
        setProfile(updatedProfile);
      } else {
        toast({ title: "Verification Failed", description: "This Instagram account could not be found.", variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Verification Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setNickname(profile.nickname || "");
      setBio(profile.bio || "");
      setPhone(profile.phone || "");
      setInstagramUsername(profile.instagram_username || "");
    }
    setIsEditing(false);
  };
  
  const handleDisconnectInstagram = async () => {
    try {
      await updateCreatorProfile({ instagram_username: "" });
      if (profile) {
        const updatedProfile = { ...profile, instagram_username: "", instagram_verified: false };
        setProfile(updatedProfile);
        setInstagramUsername("");
      }
      toast({
        title: "Instagram Disconnected",
        description: "Your Instagram account has been unlinked.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast({
        title: "Failed to Disconnect",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };


  if (!getUserId()) {
    return (
      <CreatorLayout>
        <GuestLockedView
          title="Creator Identity & Socials"
          subtitle="Verified Channels & Audience Insights"
          description="Sign in to link your Instagram, YouTube channels, and manage your public creator profile."
          returnUrl="/creator/profile"
          icon={<Pencil className="w-8 h-8 text-orange-500" />}
        />
      </CreatorLayout>
    );
  }

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
    <CreatorLayout>
      <div className="flex flex-col space-y-4">

        <div
          className="relative h-48 w-full rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url(${Images})` }}
        >
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={() => { /* Logic to upload banner */ }}>
              <Pencil className="h-5 w-5 text-white" />
            </Button>
          </div>
          <div className="absolute inset-x-0 -bottom-12 flex justify-center">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>
                {profile.username ? profile.username.charAt(0).toUpperCase() : "C"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="pt-12 text-center">
          <h2 className="text-2xl font-bold">{profile.username}</h2>
          <p className="text-muted-foreground">@{profile.nickname || 'nickname'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Public Identity</CardTitle>
              {!isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-5 w-5 text-gray-500" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                {isEditing ? (
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                ) : (
                  <p className="text-muted-foreground">{nickname}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={150}
                    className="h-24"
                  />
                ) : (
                  <p className="text-muted-foreground">{bio}</p>
                )}
                {isEditing && (
                  <p className="text-sm text-muted-foreground text-right">
                    {bio.length}/150
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Social Connection</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              {profile.instagram_verified ? (
                <div className="w-full text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-semibold">@{profile.instagram_username}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Your account is verified.</p>
                  <Button variant="outline" size="sm" onClick={handleDisconnectInstagram}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-center text-muted-foreground">
                    Connect your Instagram account to verify your creator status and access campaigns.
                  </p>
                  <div className="w-full space-y-2">
                    <Label htmlFor="instagramUser">Instagram Username</Label>
                    <Input 
                      id="instagramUser" 
                      placeholder="@username" 
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value.replace('@', ''))}
                    />
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleVerify} disabled={isVerifying}>
                    <img src="https://img.icons8.com/color/16/000000/instagram-new.png" alt="instagram" className="mr-2" />
                    {isVerifying ? "Verifying..." : "Verify & Connect"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Private Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              ) : (
                <p className="text-muted-foreground">{phone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>Discard</Button>
            <Button onClick={handleSave}>Save Profile</Button>
          </div>
        )}

        {/* Danger Zone: DPDP Act 2023 Account Erasure */}
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-red-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Account Privacy & DPDP Erasure
                </CardTitle>
                <CardDescription className="text-xs text-red-700/80 mt-1">
                  Exercise your right to erasure under India's Digital Personal Data Protection Act, 2023.
                </CardDescription>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-xs font-semibold gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Deleting your account immediately and permanently overwrites your personal identifiers (name, email, phone, Instagram handle, and PAN) with pseudonymized hashes in our active database. Blockchain ledger transactions on Base L2 remain immutable by mathematical design.
            </p>
          </CardContent>
        </Card>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-white border-zinc-200 text-zinc-900 sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <DialogTitle className="text-lg font-bold text-zinc-900">Permanently Delete Account?</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-zinc-500 leading-relaxed">
                This action is permanent and cannot be undone. All your personal data, profile settings, and social links will be scrubbed under India's DPDP Act, 2023.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="deleteReason" className="text-xs font-semibold text-zinc-700">Optional Reason for Leaving</Label>
                <Input
                  id="deleteReason"
                  placeholder="Tell us why you are leaving (optional)"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-900">
                <p className="font-semibold text-xs">Please type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:</p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="h-9 bg-white border-red-300 font-mono text-xs uppercase"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                className="bg-red-600 hover:bg-red-700 text-xs font-bold"
              >
                {isDeleting ? "Scrubbing Data..." : "Confirm Permanent Deletion"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CreatorLayout>
  );
};

export default Profile;
