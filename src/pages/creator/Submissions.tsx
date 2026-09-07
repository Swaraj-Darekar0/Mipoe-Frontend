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
    return { label: "Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold", icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> };
  }
  if ("is_deleted_by_admin" in clip && clip.is_deleted_by_admin) {
    return { label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200 font-semibold", icon: <XCircle className="h-3.5 w-3.5 text-rose-600" /> };
  }
  return { label: "In Review", color: "bg-amber-50 text-amber-700 border-amber-200 font-semibold", icon: <Clock className="h-3.5 w-3.5 text-amber-600" /> };
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
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">Your Submissions</h1>
          <p className="mt-1.5 text-zinc-500 text-sm">Track the status, views, and review outcomes of all your submitted clips.</p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
          <div className="flex flex-col gap-3 border-b border-zinc-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-50/50">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Submission Queue</p>
              <p className="text-xs text-zinc-500">Accepted clips are pinned first, then ranked by view count.</p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 self-start rounded-xl border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-xs">
                  <Filter className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[320px] rounded-2xl border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl">
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">Approval</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {[
                        { value: "all", label: "All" },
                        { value: "approved", label: "Approved" },
                        { value: "not_approved", label: "Not Approved" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setApprovalFilter(option.value as ApprovalFilter)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                            approvalFilter === option.value
                              ? "border-orange-300 bg-orange-50 text-orange-700 shadow-xs font-bold"
                              : "border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100/80"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-3">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">View Count</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewSort("high_to_low")}
                        className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                          viewSort === "high_to_low"
                            ? "border-orange-300 bg-orange-50 text-orange-700 shadow-xs font-bold"
                            : "border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100/80"
                        }`}
                      >
                        <ArrowDownWideNarrow className="mr-1.5 h-3.5 w-3.5" />
                        High to Low
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewSort("low_to_high")}
                        className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                          viewSort === "low_to_high"
                            ? "border-orange-300 bg-orange-50 text-orange-700 shadow-xs font-bold"
                            : "border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100/80"
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
            <div className="p-12 text-center text-zinc-400 text-sm">No clips match the current filters.</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50/50">
                      <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">Campaign</TableHead>
                      <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">Clip ID</TableHead>
                      <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">Clip URL</TableHead>
                      <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">View Count</TableHead>
                      <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-right font-semibold text-xs text-zinc-500 uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleClips.map((clip) => {
                      const statusInfo = getClipStatusInfo(clip);
                      return (
                        <TableRow key={`${clip.campaignName}-${clip.id}`} className="border-zinc-100 hover:bg-zinc-50/60 transition-colors">
                          <TableCell className="font-semibold text-zinc-900 text-sm">{clip.campaignName}</TableCell>
                          <TableCell className="font-mono text-xs text-zinc-500">#{clip.id}</TableCell>
                          <TableCell>
                            <a 
                              href={clip.clip_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                            >
                              <span>View Clip</span>
                              <LinkIcon className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell className="font-mono font-medium text-zinc-800 text-sm">{getViewCount(clip).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={`${statusInfo.color} flex items-center gap-1.5 w-fit text-xs px-2.5 py-0.5 rounded-full shadow-none`}>
                              {statusInfo.icon} {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteConfirmation(clip.id)}
                              disabled={deletingClipId === clip.id}
                              className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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
                    <div key={`${clip.campaignName}-${clip.id}`} className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{clip.campaignName}</p>
                          <p className="font-mono text-xs text-zinc-400 mt-0.5">Clip #{clip.id}</p>
                        </div>
                        <Badge className={`${statusInfo.color} flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full`}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm border-t border-zinc-100 pt-3">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">Views</p>
                          <p className="mt-0.5 font-mono font-bold text-zinc-900">{getViewCount(clip).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">Link</p>
                          <a href={clip.clip_url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                            <span>Open</span>
                            <LinkIcon className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end border-t border-zinc-100 pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfirmation(clip.id)}
                          disabled={deletingClipId === clip.id}
                          className="h-8 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          {deletingClipId === clip.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-2 h-3.5 w-3.5" />}
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
