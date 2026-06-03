import React, { useEffect, useMemo, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { fetchCreatorCampaigns, Campaign, SubmittedClipData, AcceptedClipData, deleteClip } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckCircle,
  Clock,
  Filter,
  Link as LinkIcon,
  Loader2,
  Trash2,
  XCircle
} from "lucide-react";

type Clip = (SubmittedClipData | AcceptedClipData) & { campaignName: string; isAccepted?: boolean };
type ApprovalFilter = "all" | "approved" | "not_approved";
type ViewSort = "high_to_low" | "low_to_high";

const isApprovedClip = (clip: Clip) => !!clip.isAccepted;
const getViewCount = (clip: Clip) => clip.view_count ?? 0;

const getClipStatusInfo = (clip: Clip) => {
  if (isApprovedClip(clip)) {
    return { label: "Accepted", color: "bg-green-600/20 text-green-300", icon: <CheckCircle className="h-3 w-3" /> };
  }
  if ("is_deleted_by_admin" in clip && clip.is_deleted_by_admin) {
    return { label: "Rejected", color: "bg-red-600/20 text-red-300", icon: <XCircle className="h-3 w-3" /> };
  }
  return { label: "In Review", color: "bg-yellow-600/20 text-yellow-300", icon: <Clock className="h-3 w-3" /> };
};

const SubmissionsPage = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingClipId, setDeletingClipId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const [viewSort, setViewSort] = useState<ViewSort>("high_to_low");
  const { toast } = useToast();

  const loadClips = async () => {
    try {
      setLoading(true);
      const campaigns = await fetchCreatorCampaigns();
      const allClips: Clip[] = [];

      campaigns.forEach((campaign: Campaign) => {
        campaign.submitted_clips?.forEach((clip) => {
          allClips.push({ ...clip, campaignName: campaign.name, isAccepted: false });
        });
        campaign.accepted_clips?.forEach((clip) => {
          allClips.push({ ...clip, campaignName: campaign.name, isAccepted: true });
        });
      });

      allClips.sort((a, b) => {
        const approvalDiff = Number(isApprovedClip(b)) - Number(isApprovedClip(a));
        if (approvalDiff !== 0) {
          return approvalDiff;
        }

        const viewDiff = getViewCount(b) - getViewCount(a);
        if (viewDiff !== 0) {
          return viewDiff;
        }

        return new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime();
      });

      setClips(allClips);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load submissions.");
      toast({
        title: "Error",
        description: err.message || "Failed to load submissions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClips();
  }, []);

  const visibleClips = useMemo(() => {
    const filtered = clips.filter((clip) => {
      if (approvalFilter === "approved") {
        return isApprovedClip(clip);
      }
      if (approvalFilter === "not_approved") {
        return !isApprovedClip(clip);
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (approvalFilter === "all") {
        const approvalDiff = Number(isApprovedClip(b)) - Number(isApprovedClip(a));
        if (approvalDiff !== 0) {
          return approvalDiff;
        }
      }

      const highToLow = getViewCount(b) - getViewCount(a);
      return viewSort === "high_to_low" ? highToLow || b.id - a.id : -highToLow || a.id - b.id;
    });
  }, [approvalFilter, clips, viewSort]);

  const handleDeleteConfirmation = (clipId: number) => {
    setDeletingClipId(clipId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClip = async () => {
    if (deletingClipId === null) return;
    try {
      setLoading(true);
      await deleteClip(deletingClipId);
      toast({
        title: "Clip Deleted",
        description: "Your clip has been successfully deleted."
      });
      await loadClips();
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete clip.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setDeletingClipId(null);
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CreatorLayout>
    );
  }

  if (error) {
    return (
      <CreatorLayout>
        <div className="p-4 text-center text-red-500">{error}</div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-4xl font-bold text-white">Your Submissions</h1>
          <p className="mt-2 text-gray-400">Track the status of all your submitted clips.</p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#18181B] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Submission Queue</p>
              <p className="text-xs text-gray-400">Accepted clips are pinned first, then ranked by view count.</p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 self-start rounded-full border-white/15 bg-white/5 px-3 text-white hover:bg-white/10">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[320px] rounded-2xl border-white/10 bg-[#111114] p-4 text-white shadow-2xl">
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Approval</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        { value: "all", label: "All" },
                        { value: "approved", label: "Approved" },
                        { value: "not_approved", label: "Not Approved" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setApprovalFilter(option.value as ApprovalFilter)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            approvalFilter === option.value
                              ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                              : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">View Count</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewSort("high_to_low")}
                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          viewSort === "high_to_low"
                            ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <ArrowDownWideNarrow className="mr-1.5 h-3.5 w-3.5" />
                        High to Low
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewSort("low_to_high")}
                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          viewSort === "low_to_high"
                            ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <ArrowUpNarrowWide className="mr-1.5 h-3.5 w-3.5" />
                        Low to High
                      </button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {visibleClips.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No clips match the current filters.</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead>Campaign</TableHead>
                      <TableHead>Clip ID</TableHead>
                      <TableHead>Clip URL</TableHead>
                      <TableHead>View Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleClips.map((clip) => {
                      const statusInfo = getClipStatusInfo(clip);
                      return (
                        <TableRow key={`${clip.campaignName}-${clip.id}`} className="border-white/10">
                          <TableCell className="font-medium text-white">{clip.campaignName}</TableCell>
                          <TableCell className="text-gray-300">{clip.id}</TableCell>
                          <TableCell>
                            <a href={clip.clip_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              View Clip <LinkIcon className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell className="text-gray-300">{getViewCount(clip).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={statusInfo.color}>
                              {statusInfo.icon} {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteConfirmation(clip.id)}
                              disabled={deletingClipId === clip.id}
                            >
                              {deletingClipId === clip.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {visibleClips.map((clip) => {
                  const statusInfo = getClipStatusInfo(clip);
                  return (
                    <div key={`${clip.campaignName}-${clip.id}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{clip.campaignName}</p>
                          <p className="text-xs text-gray-500">Clip #{clip.id}</p>
                        </div>
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Views</p>
                          <p className="mt-1 font-semibold text-white">{getViewCount(clip).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Link</p>
                          <a href={clip.clip_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-primary">
                            Open <LinkIcon className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteConfirmation(clip.id)}
                          disabled={deletingClipId === clip.id}
                        >
                          {deletingClipId === clip.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your clip submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CreatorLayout>
  );
};

export default SubmissionsPage;
