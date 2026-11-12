import React, { useEffect, useMemo, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import GuestLockedView from "@/components/creator/GuestLockedView";
import {
  fetchCreatorCampaigns,
  Campaign,
  SubmittedClipData,
  AcceptedClipData,
  deleteClip,
  getUserId,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ConfirmDialog,
  PortalPageHeader,
  StatusPill,
  StatusTone,
} from "@/components/ui/PortalPrimitives";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Filter,
  Link as LinkIcon,
  Loader2,
  Trash2,
  Send,
  AlertCircle,
} from "lucide-react";

type Clip = (SubmittedClipData | AcceptedClipData) & {
  campaignName: string;
  isAccepted?: boolean;
};
type ApprovalFilter = "all" | "approved" | "not_approved";
type ViewSort = "high_to_low" | "low_to_high";

const isApprovedClip = (clip: Clip) => !!clip.isAccepted;
const getViewCount = (clip: Clip) => clip.view_count ?? 0;

const getClipStatusInfo = (clip: Clip): { label: string; tone: StatusTone } => {
  if (isApprovedClip(clip)) {
    return { label: "Accepted", tone: "success" };
  }
  if ("is_deleted_by_admin" in clip && clip.is_deleted_by_admin) {
    return { label: "Rejected", tone: "danger" };
  }
  return { label: "In Review", tone: "warning" };
};

const SubmissionsPage = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteClipId, setPendingDeleteClipId] = useState<number | null>(null);
  const [deletingClipId, setDeletingClipId] = useState<number | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const [viewSort, setViewSort] = useState<ViewSort>("high_to_low");
  const { toast } = useToast();

  const loadClips = async () => {
    if (!getUserId()) {
      setLoading(false);
      return;
    }
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
        variant: "destructive",
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
    setPendingDeleteClipId(clipId);
  };

  const handleDeleteClip = async () => {
    if (pendingDeleteClipId === null) return;
    const targetId = pendingDeleteClipId;
    try {
      setDeletingClipId(targetId);
      await deleteClip(targetId);
      toast({
        title: "Clip Deleted",
        description: "Your clip has been successfully deleted.",
      });
      setPendingDeleteClipId(null);
      await loadClips();
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete clip.",
        variant: "destructive",
      });
    } finally {
      setDeletingClipId(null);
    }
  };

  if (!getUserId()) {
    return (
      <CreatorLayout>
        <GuestLockedView
          title="Submitted Clips & Performance"
          subtitle="Real-Time View Tracking & Milestone Payouts"
          description="Sign in to submit your UGC clips, track verified reel view counts, and claim automatic milestone earnings."
          returnUrl="/creator/submissions"
          icon={<Send className="w-8 h-8 text-lava" />}
        />
      </CreatorLayout>
    );
  }

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex flex-col h-64 items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-lava" />
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-steel">
            Loading clip submissions...
          </p>
        </div>
      </CreatorLayout>
    );
  }

  if (error) {
    return (
      <CreatorLayout>
        <div className="rounded-2xl border border-rose-500/25 bg-rose-50 p-6 text-center max-w-lg mx-auto mt-8 space-y-3">
          <AlertCircle className="h-7 w-7 text-rose-700 mx-auto" />
          <p className="text-sm font-medium text-rose-800">{error}</p>
          <Button variant="outline" size="sm" onClick={loadClips}>
            Retry
          </Button>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="01 // SUBMISSIONS"
          title="Your"
          highlighted="Submissions"
          accent="creator"
          subtitle="Track the status, verified views, and review outcomes of all your submitted clips."
        />

        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3 border-b border-black/8 px-4 sm:px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-black/[0.02]">
            <div className="min-w-0">
              <p className="font-display text-base font-bold text-ink">Submission Queue</p>
              <p className="text-xs text-slate mt-0.5">
                Accepted clips are pinned first, then ranked by view count.
              </p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 self-start sm:self-auto font-mono text-[11px] font-bold uppercase tracking-wider"
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5 text-slate" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[calc(100vw-2rem)] sm:w-[320px] rounded-2xl border border-black/10 bg-white p-5 text-ink shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-steel">
                      Approval
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {[
                        { value: "all", label: "All" },
                        { value: "approved", label: "Approved" },
                        { value: "not_approved", label: "Not Approved" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setApprovalFilter(option.value as ApprovalFilter)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-mono font-bold transition-colors duration-150 cursor-pointer ${
                            approvalFilter === option.value
                              ? "border-lava/40 bg-lava/10 text-lava"
                              : "border-black/10 bg-black/[0.03] text-charcoal hover:border-black/25 hover:bg-black/[0.05]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-black/8 pt-3.5">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-steel">
                      View Count
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewSort("high_to_low")}
                        className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-mono font-bold transition-colors duration-150 cursor-pointer ${
                          viewSort === "high_to_low"
                            ? "border-lava/40 bg-lava/10 text-lava"
                            : "border-black/10 bg-black/[0.03] text-charcoal hover:border-black/25 hover:bg-black/[0.05]"
                        }`}
                      >
                        <ArrowDownWideNarrow className="mr-1.5 h-3.5 w-3.5" />
                        High to Low
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewSort("low_to_high")}
                        className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-mono font-bold transition-colors duration-150 cursor-pointer ${
                          viewSort === "low_to_high"
                            ? "border-lava/40 bg-lava/10 text-lava"
                            : "border-black/10 bg-black/[0.03] text-charcoal hover:border-black/25 hover:bg-black/[0.05]"
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
            <div className="p-12 text-center">
              <Send className="h-7 w-7 text-steel mx-auto mb-2" />
              <p className="font-display text-sm font-bold text-ink">No clips match the current filters</p>
              <p className="text-xs text-slate mt-1">Adjust your approval or sort criteria to inspect submissions.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-black/8 bg-black/[0.02] hover:bg-black/[0.02]">
                      <TableHead className="font-mono font-bold text-[10px] text-steel uppercase tracking-wider">
                        Campaign
                      </TableHead>
                      <TableHead className="font-mono font-bold text-[10px] text-steel uppercase tracking-wider">
                        Clip ID
                      </TableHead>
                      <TableHead className="font-mono font-bold text-[10px] text-steel uppercase tracking-wider">
                        Clip URL
                      </TableHead>
                      <TableHead className="font-mono font-bold text-[10px] text-steel uppercase tracking-wider">
                        View Count
                      </TableHead>
                      <TableHead className="font-mono font-bold text-[10px] text-steel uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-right font-mono font-bold text-[10px] text-steel uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleClips.map((clip) => {
                      const statusInfo = getClipStatusInfo(clip);
                      return (
                        <TableRow
                          key={`${clip.campaignName}-${clip.id}`}
                          className="border-b border-black/[0.06] hover:bg-black/[0.02] transition-colors duration-150"
                        >
                          <TableCell className="font-display font-semibold text-ink text-sm">
                            {clip.campaignName}
                          </TableCell>
                          <TableCell className="font-mono text-xs tabular-nums text-slate">
                            #{clip.id}
                          </TableCell>
                          <TableCell>
                            <a
                              href={clip.clip_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-lava hover:text-lava/80 hover:underline"
                            >
                              <span>View Clip</span>
                              <LinkIcon className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell className="font-mono font-bold tabular-nums text-ink text-sm">
                            {getViewCount(clip).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <StatusPill tone={statusInfo.tone} showDot>
                              {statusInfo.label}
                            </StatusPill>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteConfirmation(clip.id)}
                              disabled={deletingClipId === clip.id}
                              className="h-8 w-8 text-steel hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                              aria-label={`Delete clip #${clip.id}`}
                            >
                              {deletingClipId === clip.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
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
                    <div
                      key={`${clip.campaignName}-${clip.id}`}
                      className="rounded-xl border border-black/10 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-bold text-ink truncate">
                            {clip.campaignName}
                          </p>
                          <p className="font-mono text-xs tabular-nums text-steel mt-0.5">
                            Clip #{clip.id}
                          </p>
                        </div>
                        <StatusPill tone={statusInfo.tone} showDot className="shrink-0">
                          {statusInfo.label}
                        </StatusPill>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-black/8 pt-3">
                        <div className="rounded-lg bg-black/[0.03] border border-black/[0.06] p-2.5 min-w-0">
                          <p className="text-[9.5px] font-mono uppercase tracking-wider text-steel font-bold">
                            Views
                          </p>
                          <p className="mt-0.5 font-mono font-bold tabular-nums text-ink text-sm truncate">
                            {getViewCount(clip).toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-lg bg-black/[0.03] border border-black/[0.06] p-2.5 min-w-0">
                          <p className="text-[9.5px] font-mono uppercase tracking-wider text-steel font-bold">
                            Link
                          </p>
                          <a
                            href={clip.clip_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs font-bold text-lava hover:underline"
                          >
                            <span>Open</span>
                            <LinkIcon className="h-3 w-3 shrink-0" />
                          </a>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end border-t border-black/8 pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfirmation(clip.id)}
                          disabled={deletingClipId === clip.id}
                          className="h-8 text-xs font-mono font-bold text-rose-700 hover:bg-rose-50"
                        >
                          {deletingClipId === clip.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          )}
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

      <ConfirmDialog
        open={pendingDeleteClipId !== null}
        onOpenChange={(open) => {
          if (!open && deletingClipId === null) {
            setPendingDeleteClipId(null);
          }
        }}
        title="Delete Clip Submission?"
        description="This action cannot be undone. This will permanently delete your clip submission from this campaign."
        confirmLabel="Delete Clip"
        variant="destructive"
        loading={deletingClipId !== null}
        onConfirm={handleDeleteClip}
      />
    </CreatorLayout>
  );
};

export default SubmissionsPage;
