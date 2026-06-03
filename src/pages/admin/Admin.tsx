import React, { useEffect, useState } from "react";
import { 
  fetchAdminCampaigns, 
  adminUpdateClip, 
  deleteClipAdmin, 
  Campaign, 
  SubmittedClipData, 
  AcceptedClipData,
  fetchAdminBrandsOnboarding,
  verifyBrandCompliance,
  AdminOnboardingBrand,
  approveCampaign,
  rejectCampaign
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { 
  ChevronDown, 
  Trash2, 
  XCircle, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Eye, 
  Calendar, 
  Hash, 
  MessageCircle,
  ShieldCheck,
  Building,
  Video,
  Globe,
  Instagram,
  Youtube,
  FileText,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<"clips" | "brands" | "campaigns">("clips");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clips Tab States
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [clipsError, setClipsError] = useState("");

  // Brands Tab States
  const [brands, setBrands] = useState<AdminOnboardingBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<AdminOnboardingBrand | null>(null);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingCompliance, setProcessingCompliance] = useState(false);

  // Campaigns Approval States
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCampaignRejectModal, setShowCampaignRejectModal] = useState(false);
  const [campaignRejectionReason, setCampaignRejectionReason] = useState("");
  const [processingCampaignApproval, setProcessingCampaignApproval] = useState(false);

  // Load clips data
  const loadClips = () => {
    fetchAdminCampaigns()
      .then(setCampaigns)
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setClipsError(err.message);
        } else {
          setClipsError("An unknown error occurred loading campaigns");
        }
      });
  };

  // Load onboarding brands data
  const loadBrands = async (silent = false) => {
    if (!silent) setBrandsLoading(true);
    setBrandsError("");
    try {
      const data = await fetchAdminBrandsOnboarding();
      const pendingData = data.filter(b => b.onboarding_status === "pending_verification");
      setBrands(pendingData);
      
      // Sync selected brand details
      if (selectedBrand) {
        const updated = pendingData.find(b => b.id === selectedBrand.id);
        if (updated) {
          setSelectedBrand(updated);
        } else {
          setSelectedBrand(null);
        }
      }
    } catch (err: any) {
      setBrandsError(err.message || "Failed to fetch brand onboarding requests");
    } finally {
      if (!silent) setBrandsLoading(false);
    }
  };

  useEffect(() => {
    loadClips();
    loadBrands();
  }, []);

  // Poll brands list
  useEffect(() => {
    const interval = setInterval(() => {
      loadBrands(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedBrand]);

  const toggle = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleAction = async (clipId: number, status: "accepted" | "rejected") => {
    let feedback: string | undefined;
    if (status === "rejected") {
      feedback = prompt("Provide feedback for the creator (optional)") || undefined;
    }
    try {
      await adminUpdateClip(clipId, { status, feedback });
      loadClips();
      toast({
        title: `Clip ${status === "accepted" ? "Approved" : "Rejected"}`,
        description: "Status successfully updated on the server.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Operation Failed", description: msg, variant: "destructive" });
    }
  };

  const handleDelete = async (clipId: number) => {
    if (!window.confirm('Delete this clip?')) return;
    try {
      await deleteClipAdmin(clipId);
      loadClips();
      toast({
        title: "Clip Deleted",
        description: "The clip submission has been permanently deleted.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Operation Failed", description: msg, variant: "destructive" });
    }
  };

  const handleComplianceApproval = async (brandId: number) => {
    if (!window.confirm("Approve this brand application? This will unlock full dashboard capabilities.")) return;
    setProcessingCompliance(true);
    try {
      const res = await verifyBrandCompliance(brandId, { action: "approve" });
      toast({
        title: "Brand Approved",
        description: res.msg || "The brand's compliance status was updated successfully.",
      });
      setSelectedBrand(null);
      await loadBrands(true);
    } catch (err: any) {
      toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingCompliance(false);
    }
  };

  const handleComplianceRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    if (!rejectionReason.trim()) {
      alert("Please specify a rejection reason.");
      return;
    }

    setProcessingCompliance(true);
    try {
      const res = await verifyBrandCompliance(selectedBrand.id, {
        action: "reject",
        reason: rejectionReason
      });
      toast({
        title: "Brand Rejected",
        description: res.msg || "Compliance application rejected.",
      });
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedBrand(null);
      await loadBrands(true);
    } catch (err: any) {
      toast({ title: "Rejection Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingCompliance(false);
    }
  };

  const handleCampaignApproval = async (campaignId: number) => {
    if (!window.confirm("Approve this campaign? It will be made available for creators to view and brands to fund.")) return;
    setProcessingCampaignApproval(true);
    try {
      await approveCampaign(campaignId);
      toast({
        title: "Campaign Approved",
        description: "The campaign was approved successfully.",
      });
      setSelectedCampaign(null);
      loadClips();
    } catch (err: any) {
      toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingCampaignApproval(false);
    }
  };

  const handleCampaignRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    if (!campaignRejectionReason.trim()) {
      alert("Please specify a rejection reason.");
      return;
    }
    setProcessingCampaignApproval(true);
    try {
      await rejectCampaign(selectedCampaign.id, campaignRejectionReason);
      toast({
        title: "Campaign Rejected",
        description: "The campaign has been rejected and deactivated.",
      });
      setShowCampaignRejectModal(false);
      setCampaignRejectionReason("");
      setSelectedCampaign(null);
      loadClips();
    } catch (err: any) {
      toast({ title: "Rejection Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingCampaignApproval(false);
    }
  };

  const formatUrl = (url: string) => {
    if (url.length > 50) {
      return url.substring(0, 30) + '...' + url.substring(url.length - 15);
    }
    return url;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const pendingBrandsCount = brands.length;
  const pendingCampaigns = campaigns.filter(c => c.campaign_approval === "pending_approval");
  const pendingCampaignsCount = pendingCampaigns.length;

  const renderClipsTab = () => (
    <div className="space-y-6">
      {clipsError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{clipsError}</p>
        </div>
      )}

      {campaigns.length === 0 && !clipsError && (
        <div className="text-center py-12 bg-white border rounded-xl">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 animate-pulse" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No campaigns active</h3>
          <p className="text-gray-500 text-sm">There are no campaigns to review currently.</p>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.map(camp => (
          <div key={camp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Campaign Header Toggle */}
            <button
              onClick={() => toggle(camp.id)}
              className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-bold text-gray-900">{camp.name}</h2>
                <div className="flex space-x-2">
                  {camp.submitted_clips && camp.submitted_clips.length > 0 && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 font-semibold">
                      {camp.submitted_clips.length} Pending
                    </Badge>
                  )}
                  {camp.accepted_clips && camp.accepted_clips.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold">
                      {camp.accepted_clips.length} Accepted
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedId === camp.id ? "rotate-180" : "rotate-0"}`} />
            </button>

            {/* Expanded Content */}
            {expandedId === camp.id && (
              <div className="px-6 pb-6 space-y-6 mt-4">
                {/* Submitted Pending Clips */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Pending Submission Review</h3>
                  </div>
                  
                  {camp.submitted_clips && camp.submitted_clips.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {camp.submitted_clips.map((clip: SubmittedClipData) => (
                        <div
                          key={clip.id}
                          className={`bg-amber-50/50 border border-amber-150 rounded-xl p-4 transition duration-200 ${clip.is_deleted_by_admin ? 'opacity-50 grayscale' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <a
                              href={clip.clip_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="break-all">{formatUrl(clip.clip_url)}</span>
                            </a>
                            
                            <button
                              title="Delete Clip"
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              onClick={() => handleDelete(clip.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mb-3">
                            {clip.is_deleted_by_admin ? (
                              <Badge variant="destructive">Rejected</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending Review</Badge>
                            )}
                            {clip.feedback && (
                              <p className="mt-2 p-2 bg-red-50 border border-red-100 text-xs text-red-700 rounded">
                                <strong>Feedback:</strong> {clip.feedback}
                              </p>
                            )}
                          </div>

                          {!clip.is_deleted_by_admin && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAction(clip.id, "accepted")}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleAction(clip.id, "rejected")}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic">No pending clips submitted.</p>
                  )}
                </div>

                <Separator />

                {/* Accepted Verified Clips */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Accepted Active Clips</h3>
                  </div>

                  {camp.accepted_clips && camp.accepted_clips.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {camp.accepted_clips.map((clip: AcceptedClipData) => (
                        <div
                          key={clip.id}
                          className="bg-green-50/30 border border-green-100 rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <a
                              href={clip.clip_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="break-all">{formatUrl(clip.clip_url)}</span>
                            </a>
                            
                            <button
                              title=" Delete clip permanently"
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              onClick={() => handleDelete(clip.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <Badge variant="secondary" className="bg-green-100 text-green-800 mb-3">Accepted</Badge>

                          <div className="space-y-1.5 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Submitted: {formatDate(clip.submitted_at)}</span>
                            </div>
                            {clip.media_id && (
                              <div className="flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5" />
                                <span>Media ID: {clip.media_id}</span>
                              </div>
                            )}
                            {clip.view_count !== undefined && clip.view_count !== null && (
                              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Views: {clip.view_count.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic">No accepted clips yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderBrandsTab = () => {
    const pendingBrands = brands;
    return (
      <div className="space-y-6">
        {brandsError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{brandsError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side: Brand Application List */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm h-[600px] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">Applications ({pendingBrands.length})</h2>
            
            {brandsLoading && pendingBrands.length === 0 ? (
              <div className="text-center py-20 text-gray-400">Loading applications...</div>
            ) : pendingBrands.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No pending applications received.</div>
            ) : (
              <div className="space-y-2">
                {pendingBrands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => {
                      setSelectedBrand(brand);
                      setShowRejectModal(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                      selectedBrand?.id === brand.id
                        ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                        : "border-gray-150 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-900 truncate">{brand.username}</span>
                      <span className="text-xs text-gray-400">#{brand.id}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-3">{brand.email}</p>
                    
                    <div className="flex justify-between items-center">
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Pending Review
                      </Badge>

                      {brand.pan_verification_status === "SUCCESS" && (
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> PAN Sync Ok
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        {/* Right Side: Detail Verification Card */}
        <div className="lg:col-span-2 space-y-6">
          {selectedBrand ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              
              {/* Cover Banner */}
              <div className="h-32 bg-slate-100 relative">
                {selectedBrand.banner_url ? (
                  <img src={selectedBrand.banner_url} alt="banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
                )}
                
                {/* Logo position overlay */}
                <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-xl border-2 border-white bg-white overflow-hidden shadow-md flex items-center justify-center">
                  {selectedBrand.logo_url ? (
                    <img src={selectedBrand.logo_url} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Identity Header */}
              <div className="pt-10 px-6 pb-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedBrand.username}</h3>
                    <p className="text-sm text-gray-500">{selectedBrand.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">Category</span>
                    <p className="font-bold text-indigo-600">{selectedBrand.category || "General"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
                  {selectedBrand.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedBrand.phone}</span>
                    </div>
                  )}
                  {selectedBrand.website_url && (
                    <a
                      href={selectedBrand.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-indigo-600 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Website Link</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Regulatory Compliance details */}
              <div className="p-6 space-y-6">
                
                {/* Business Verification (PAN Details) */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Regulatory Compliance Document
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">PAN Card Number (Masked PII)</span>
                      <span className="font-mono font-bold text-slate-800 text-lg tracking-widest">{selectedBrand.masked_pan || "N/A"}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">PAN Holder Registered Name</span>
                      <span className="font-semibold text-slate-800">{selectedBrand.pan_holder_name || "N/A"}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200/50">
                    <span className="text-xs text-slate-400 block mb-1">Business Registered Address</span>
                    <p className="text-sm text-slate-700 bg-white border rounded-lg p-3 whitespace-pre-wrap">{selectedBrand.business_address || "N/A"}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs text-slate-400">Cashfree PG Status:</span>
                    <Badge className={
                      selectedBrand.pan_verification_status === "SUCCESS"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-red-100 text-red-800 hover:bg-red-100"
                    }>
                      {selectedBrand.pan_verification_status || "PENDING"}
                    </Badge>
                  </div>
                </div>

                {/* Brand description / profile */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 rounded-xl p-4 border border-gray-100 whitespace-pre-wrap">
                    {selectedBrand.description || "No description provided."}
                  </p>
                </div>

                {/* Social channels */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Social Handles</h4>
                  <div className="flex gap-4">
                    {selectedBrand.instagram_url ? (
                      <a
                        href={selectedBrand.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-pink-50 border border-pink-100 text-pink-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-100 transition"
                      >
                        <Instagram className="w-4 h-4" /> Instagram Account
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No Instagram URL</span>
                    )}

                    {selectedBrand.youtube_url ? (
                      <a
                        href={selectedBrand.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition"
                      >
                        <Youtube className="w-4 h-4" /> YouTube Channel
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No YouTube URL</span>
                    )}
                  </div>
                </div>

                {/* Action status note */}
                {selectedBrand.onboarding_status !== "pending_verification" && (
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    selectedBrand.onboarding_status === "verified"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-850"
                  }`}>
                    {selectedBrand.onboarding_status === "verified" ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Compliance Verified</p>
                          <p className="text-xs text-green-700">This brand was verified and dashboard limits have been unlocked.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Compliance Rejected</p>
                          <p className="text-xs text-red-700 mt-0.5">Reason: {selectedBrand.rejection_reason || "Regulatory documents validation failed."}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Verification Control Actions */}
                {selectedBrand.onboarding_status === "pending_verification" && (
                  <div className="flex gap-4 border-t pt-6">
                    <Button
                      onClick={() => handleComplianceApproval(selectedBrand.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                      disabled={processingCompliance}
                    >
                      Approve compliance
                    </Button>
                    <Button
                      onClick={() => setShowRejectModal(true)}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold py-3"
                      disabled={processingCompliance}
                    >
                      Reject application
                    </Button>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 h-[600px] flex flex-col justify-center items-center">
              <ShieldCheck className="w-16 h-16 text-indigo-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">Compliance Review Panel</h3>
              <p className="text-gray-400 text-sm max-w-sm">
                Select a brand application from the list on the left to verify its credentials, view masked PAN documents, and manage approval status.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Reject Modal dialog form */}
      {showRejectModal && selectedBrand && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleComplianceRejection}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300"
          >
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-7 h-7" />
              <h4 className="text-lg font-bold text-gray-900">Reject Compliance Request</h4>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Specify the reason for rejecting <strong>{selectedBrand.username}</strong> onboarding request. This message will be shown to the brand dashboard.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Rejection Reason</label>
              <Textarea
                placeholder="e.g. Registered address does not match PAN holder registered records. Please resubmit business address."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowRejectModal(false)}
                disabled={processingCompliance}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={processingCompliance}
              >
                {processingCompliance ? "Processing..." : "Reject Brand"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

  const renderCampaignsTab = () => {
    const formatCategory = (category: string): string => {
      if (!category) return "General";
      return category
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" / ");
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side: Campaigns List */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm h-[600px] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">Campaigns ({pendingCampaigns.length})</h2>
            
            {pendingCampaigns.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No campaigns pending approval.</div>
            ) : (
              <div className="space-y-2">
                {pendingCampaigns.map(camp => (
                  <button
                    key={camp.id}
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setShowCampaignRejectModal(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                      selectedCampaign?.id === camp.id
                        ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                        : "border-gray-150 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-900 truncate">{camp.name}</span>
                      <span className="text-xs text-gray-400">#{camp.id}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap my-2">
                      {camp.campaign_type && (
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                          camp.campaign_type === 'clipping' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {camp.campaign_type === 'clipping' ? 'Clipping' : 'Influencer'}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-semibold uppercase tracking-wider rounded">
                        {formatCategory(camp.category)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Budget: ₹{camp.budget.toLocaleString()}</span>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Pending Approval
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Detail & Creator Dashboard Preview (Dark Theme Container) */}
          <div className="lg:col-span-2">
            {selectedCampaign ? (
              <div className="bg-[#0A0A0B] border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden h-[600px] overflow-y-auto flex flex-col">
                {/* Visual Header / Banner */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Creator Dashboard Preview</span>
                  </div>
                  <Badge className="bg-amber-500/20 border border-amber-500/30 text-amber-400 uppercase text-[10px] font-bold tracking-wider px-2.5 py-0.5">
                    Pending Approval
                  </Badge>
                </div>

                <div className="p-6 md:p-8 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
                    
                    {/* Main Preview Content */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                      
                      {/* Image Preview */}
                      <div className="w-full aspect-video bg-zinc-950 border border-zinc-800 overflow-hidden relative rounded-xl flex items-center justify-center">
                        {selectedCampaign.image_url ? (
                          <img
                            src={selectedCampaign.image_url}
                            alt={selectedCampaign.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="text-zinc-650 flex flex-col items-center gap-2 text-xs uppercase tracking-wider">
                            <AlertCircle size={32} className="opacity-40" />
                            No Preview Image Added
                          </div>
                        )}
                      </div>

                      {/* Header Title */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                              {selectedCampaign.name}
                            </h3>
                            <span className="text-xs text-zinc-505 mt-1 block">Brand ID: {selectedCampaign.brand_id}</span>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap items-center">
                            {selectedCampaign.campaign_type && (
                              <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border rounded ${
                                selectedCampaign.campaign_type === 'clipping' 
                                  ? 'border-purple-500/40 text-purple-400 bg-purple-500/10' 
                                  : 'border-pink-500/40 text-pink-400 bg-pink-500/10'
                              }`}>
                                {selectedCampaign.campaign_type === 'clipping' ? 'Clipping' : 'Influencer'}
                              </span>
                            )}
                            {selectedCampaign.category && (
                              <span className="inline-flex items-center px-2.5 py-1 border border-zinc-700 text-[10px] font-semibold uppercase tracking-widest text-zinc-300 rounded">
                                {formatCategory(selectedCampaign.category)}
                              </span>
                            )}
                          </div>
                        </div>

                        {selectedCampaign.asset_link ? (
                          <a
                            href={selectedCampaign.asset_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 text-[11px] sm:text-xs underline font-medium flex items-center gap-1 w-fit mt-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View campaign assets
                          </a>
                        ) : null}
                      </div>

                      {/* Requirements */}
                      <div className="flex flex-col gap-3 border-t border-zinc-800/80 pt-6">
                        <h4 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                          Requirements
                        </h4>
                        <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-zinc-400">
                          {selectedCampaign.requirements ? (
                            selectedCampaign.requirements.split("\n").filter((req) => req.trim() !== "").map((req, index) => (
                              <div key={index} className="flex items-start gap-2.5 leading-relaxed">
                                <span className="text-zinc-650 select-none font-bold">•</span>
                                <span>{req}</span>
                              </div>
                            ))
                          ) : (
                            <>
                              <div className="flex items-start gap-2.5">
                                <span className="text-zinc-650 select-none">•</span>
                                <span>1. Don't use bots</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="text-zinc-650 select-none">•</span>
                                <span>2. Don't portray bad the brand image</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="text-zinc-650 select-none">•</span>
                                <span>3. Adhere to all platform guidelines</span>
                              </div>
                            </>
                          )}

                          {selectedCampaign.hashtag && (
                            <div className="text-indigo-400 font-mono text-xs mt-2 bg-indigo-955/20 border border-indigo-900/30 px-3 py-1.5 rounded w-fit">
                              Hashtag: #{selectedCampaign.hashtag.replace(/^#/, '')}
                            </div>
                          )}
                          {selectedCampaign.audio && (
                            <div className="text-purple-400 font-mono text-xs mt-1 bg-purple-955/20 border border-purple-900/30 px-3 py-1.5 rounded w-fit">
                              Audio: {selectedCampaign.audio}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Financials & Action Panel */}
                    <div className="flex flex-col gap-6 justify-between h-full">
                      <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Campaign Parameters</h4>
                        <div className="h-px bg-zinc-800" />
                        
                        <div className="space-y-4">
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Total Budget</span>
                            <span className="font-bold text-xl text-white">₹{selectedCampaign.budget.toLocaleString()}</span>
                          </div>
                          
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Cost Per View (CPV)</span>
                            <span className="font-bold text-base text-white">₹{selectedCampaign.cpv}</span>
                          </div>

                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">View Threshold</span>
                            <span className="font-semibold text-sm text-white">
                              {selectedCampaign.view_threshold?.toLocaleString() || "0"} views
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Deadline Date</span>
                            <span className="font-semibold text-sm text-white">
                              {selectedCampaign.deadline ? formatDate(selectedCampaign.deadline) : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-zinc-800/80 mt-auto">
                        <Button
                          onClick={() => handleCampaignApproval(selectedCampaign.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                          disabled={processingCampaignApproval}
                        >
                          Approve Campaign
                        </Button>
                        <Button
                          onClick={() => setShowCampaignRejectModal(true)}
                          variant="outline"
                          className="w-full border-red-800 text-red-400 hover:bg-red-955/30 hover:text-red-300 font-semibold py-3"
                          disabled={processingCampaignApproval}
                        >
                          Reject Campaign
                        </Button>
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 h-[600px] flex flex-col justify-center items-center">
                <ShieldCheck className="w-16 h-16 text-indigo-200 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Campaigns Approval Panel</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  Select a pending campaign from the list on the left to preview it as creators will see it, check its settings, and moderate its approval status.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Campaign Reject Modal dialog form */}
        {showCampaignRejectModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form 
              onSubmit={handleCampaignRejection}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertTriangle className="w-7 h-7" />
                <h4 className="text-lg font-bold text-gray-900">Reject Campaign Request</h4>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Specify the reason for rejecting <strong>{selectedCampaign.name}</strong>. This message will be shown on the brand's dashboard.
              </p>

              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Rejection Reason</label>
                <Textarea
                  placeholder="e.g. Budget size mismatch, unacceptable image, or description details are unclear. Please revise."
                  value={campaignRejectionReason}
                  onChange={(e) => setCampaignRejectionReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCampaignRejectModal(false)}
                  disabled={processingCampaignApproval}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={processingCampaignApproval}
                >
                  {processingCampaignApproval ? "Processing..." : "Reject Campaign"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <img src="/play-symbol.svg" alt="Mipoe" className="h-6 w-6 invert" />
            <span className="text-xl font-extrabold tracking-tight text-white">Mipoe Admin</span>
          </div>
          <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white">Portal</Badge>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <button
            onClick={() => setActiveTab("clips")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
              activeTab === "clips"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Video className="w-5 h-5" />
            Clips Moderation
          </button>
          
          <button
            onClick={() => setActiveTab("brands")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
              activeTab === "brands"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Building className="w-5 h-5" />
            Brand Onboarding
            {pendingBrandsCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingBrandsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("campaigns")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
              activeTab === "campaigns"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            Campaigns Approval
            {pendingCampaignsCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingCampaignsCount}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          Admin Security Context
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === "clips" 
              ? "Clips Moderation & Review" 
              : activeTab === "brands" 
              ? "Brand Compliance Verification" 
              : "Campaigns Approval"}
          </h1>
          <button 
            onClick={() => navigate("/")} 
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            Back to Home
          </button>
        </header>

        <main className="p-8 max-w-7xl w-full mx-auto flex-1">
          {activeTab === "clips" 
            ? renderClipsTab() 
            : activeTab === "brands" 
            ? renderBrandsTab() 
            : renderCampaignsTab()}
        </main>
      </div>

    </div>
  );
};

export default AdminPage;