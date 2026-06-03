import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchCreatorProfile,
  updateCreatorProfile,
  getInstagramAuthUrl,
  simulateMockMetaCallback,
  type CreatorProfile as ApiCreatorProfile
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Instagram,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Phone,
  User,
  FileText,
  Loader2,
  Lock,
  ArrowRight
} from "lucide-react";

export const CompleteProfile = () => {
  const [profile, setProfile] = useState<ApiCreatorProfile>({
    username: "",
    email: "",
    nickname: "",
    bio: "",
    phone: "",
    profile_completed: false,
    instagram_username: "",
    instagram_verified: false,
  });
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sandbox Modal states
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [mockUsername, setMockUsername] = useState("creatorxyz");

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadProfile = async () => {
    try {
      const data = await fetchCreatorProfile();
      if (data.profile_completed) {
        navigate("/creator/dashboard");
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(err.message || "Failed to load profile");
    }
  };

  useEffect(() => {
    loadProfile();

    // Check URL parameters for OAuth callbacks
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const errParam = params.get("error");
    const mockParam = params.get("mock_oauth");

    if (success === "true") {
      const username = params.get("username") || "your account";
      toast({
        title: "Instagram Linked!",
        description: `Successfully verified and connected @${username}.`
      });
      // Clear URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      loadProfile();
    } else if (errParam) {
      setError(`Rejection: ${errParam}. Please verify your Instagram account configuration.`);
      toast({
        variant: "destructive",
        title: "Instagram Connection Failed",
        description: errParam
      });
      // Clear URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (mockParam === "true") {
      setIsSandboxOpen(true);
      // Clear URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConnectInstagram = async () => {
    setAuthLoading(true);
    setError(null);
    try {
      // Step 1: Pre-save inputs to backend before redirecting
      await updateCreatorProfile({
        nickname: profile.nickname,
        bio: profile.bio,
        phone: profile.phone,
      });

      // Step 2: Fetch OAuth authorize URL
      const { url } = await getInstagramAuthUrl();
      
      // Step 3: Redirect user (this will go to Meta or Sandbox callback)
      window.location.href = url;
    } catch (err: any) {
      setAuthLoading(false);
      setError(err.message || "Failed to initiate Instagram connection.");
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: err.message || "Failed to link Instagram"
      });
    }
  };

  const handleSimulateSandbox = async (status: "success" | "failure") => {
    setSandboxLoading(true);
    try {
      if (status === "success") {
        await simulateMockMetaCallback({
          status: "success",
          username: mockUsername
        });
        toast({
          title: "Sandbox Success",
          description: `Simulated linking Instagram account @${mockUsername}.`
        });
        setIsSandboxOpen(false);
        await loadProfile();
      } else {
        try {
          await simulateMockMetaCallback({
            status: "failure",
            error_msg: "Rejection: Instagram account type is Personal. Please convert to a Creator or Business account."
          });
        } catch (backendErr: any) {
          // Expected rejection
          setError(backendErr.message || "Instagram account type is Personal.");
        }
        toast({
          variant: "destructive",
          title: "Sandbox Rejected",
          description: "Simulated personal account rejection successfully."
        });
        setIsSandboxOpen(false);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Simulation Error",
        description: err.message || "Failed to run simulation callback"
      });
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.instagram_verified) {
      setError("Please connect and verify your Instagram professional account first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateCreatorProfile({
        nickname: profile.nickname,
        bio: profile.bio,
        phone: profile.phone,
      });
      toast({
        title: "Onboarding Completed",
        description: "Welcome to Mipoe! Your profile is verified."
      });
      navigate("/creator/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding.");
      toast({
        title: "Onboarding Failed",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111114] p-4 font-sans text-white">
      <div className="bg-[#18181B] border border-white/10 p-8 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.5)] w-full max-w-lg relative overflow-hidden">
        
        {/* Decorative subtle ambient lights */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]" />

        <div className="relative space-y-6">
          <header className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl mb-2 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold font-display tracking-tight text-white">Creator Onboarding</h2>
            <p className="text-sm text-gray-400">
              Set up your profile and link your socials to unlock payouts and campaigns.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nickname / Display Name */}
            <div className="space-y-1.5">
              <label htmlFor="nickname" className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Nickname
              </label>
              <Input
                id="nickname"
                name="nickname"
                type="text"
                value={profile.nickname || ""}
                onChange={handleChange}
                placeholder="e.g., ViralVidsCreator"
                className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={profile.phone || ""}
                onChange={handleChange}
                placeholder="e.g., +91 98765 43210"
                className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Bio
              </label>
              <Textarea
                id="bio"
                name="bio"
                value={profile.bio || ""}
                onChange={handleChange}
                placeholder="Briefly describe your content niche and style..."
                className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 resize-none"
                rows={3}
                required
              />
            </div>

            {/* Social Linkage Section */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 block mb-1">
                  Social Accounts
                </label>
                <p className="text-[11px] text-gray-500">
                  A professional (Creator/Business) account linked to a FB Page is required to fetch views.
                </p>
              </div>

              {profile.instagram_verified ? (
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
                      <Instagram className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Instagram Linked</p>
                      <p className="text-xs text-emerald-300/80">@{profile.instagram_username}</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleConnectInstagram}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-4 rounded-2xl transition duration-200 shadow-lg shadow-pink-600/10 active:scale-[0.98] disabled:opacity-50"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving & Redirecting...
                      </>
                    ) : (
                      <>
                        <Instagram className="h-4 w-4" />
                        Connect Instagram
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-yellow-500 text-xs bg-yellow-500/10 p-2 border border-yellow-500/20 rounded-xl">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Onboarding is locked until social account is linked.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl flex items-start gap-2">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Onboarding Submit Button */}
            <Button
              type="submit"
              className="w-full py-6 rounded-2xl text-white bg-primary hover:bg-primary/90 font-bold transition duration-200 mt-2 flex items-center justify-center gap-2 disabled:bg-white/5 disabled:text-gray-500 disabled:border-white/5"
              disabled={loading || !profile.instagram_verified}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Complete Onboarding <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Developer Sandbox Simulation Modal */}
      {isSandboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181B] border border-white/10 p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl relative">
            <div className="absolute top-4 right-4 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-yellow-500/20">
              Sandbox Mode
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-500 font-bold text-lg">
                <Lock className="h-5 w-5" />
                <span>Simulate Meta OAuth</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                We detected that live Meta App config is missing. Use this developer interface to simulate redirects from Meta callback endpoints.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="mockUsername" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Instagram Handle
                </label>
                <Input
                  id="mockUsername"
                  type="text"
                  value={mockUsername}
                  onChange={(e) => setMockUsername(e.target.value)}
                  placeholder="creatorxyz"
                  className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-gray-600 focus:border-yellow-500/40 focus:ring-yellow-500/10"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleSimulateSandbox("success")}
                  disabled={sandboxLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {sandboxLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate Success (Creator Account)"}
                </Button>
                <Button
                  onClick={() => handleSimulateSandbox("failure")}
                  disabled={sandboxLoading}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {sandboxLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate Failure (Personal Account)"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompleteProfile;