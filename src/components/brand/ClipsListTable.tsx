import React from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Filter, Video, Loader2 } from "lucide-react";
import { ClipData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/PortalPrimitives";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";

interface ClipsListTableProps {
  clips: ClipData[];
  selectedClip: ClipData | null;
  onSelectClip: (clip: ClipData) => void;
  loading: boolean;
}

type ApprovalFilter = "all" | "approved" | "not_approved";
type ViewSort = "high_to_low" | "low_to_high";

const getClipApprovalState = (clip: ClipData) => clip.status === "accepted";
const getClipViewCount = (clip: ClipData) => clip.view_count ?? 0;

export const ClipsListTable: React.FC<ClipsListTableProps> = ({
  clips,
  selectedClip,
  onSelectClip,
  loading,
}) => {
  const [approvalFilter, setApprovalFilter] = React.useState<ApprovalFilter>("all");
  const [viewSort, setViewSort] = React.useState<ViewSort>("high_to_low");

  const filteredClips = React.useMemo(() => {
    const visibleClips = clips.filter((clip) => {
      if (approvalFilter === "approved") {
        return getClipApprovalState(clip);
      }
      if (approvalFilter === "not_approved") {
        return !getClipApprovalState(clip);
      }
      return true;
    });

    return [...visibleClips].sort((a, b) => {
      if (approvalFilter === "all") {
        const approvalDiff = Number(getClipApprovalState(a)) - Number(getClipApprovalState(b));
        if (approvalDiff !== 0) {
          return approvalDiff;
        }
      }

      const highToLow = getClipViewCount(b) - getClipViewCount(a);
      return viewSort === "high_to_low" ? highToLow || a.id - b.id : -highToLow || a.id - b.id;
    });
  }, [approvalFilter, clips, viewSort]);

  const renderClipStatusPill = (clip: ClipData) => {
    if (clip.status === "accepted") {
      return <StatusPill tone="success">Approved</StatusPill>;
    }
    if (clip.status === "rejected" || clip.is_deleted_by_admin) {
      return <StatusPill tone="danger">Rejected</StatusPill>;
    }
    return <StatusPill tone="warning">In Review</StatusPill>;
  };

  return (
    <div className="rounded-2xl bg-white border border-black/10 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] text-ink">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel mb-1">
            01 // SUBMITTED REELS
          </p>
          <h3 className="font-display text-lg font-bold tracking-tight text-ink">
            Submitted Clips & Compliance Status
          </h3>
          <p className="text-xs text-slate">
            Click a row to load diagnostics, thumbnail, and view graphs below
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-black/15 px-3 font-mono text-xs font-bold uppercase tracking-wider text-ink"
              >
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[calc(100vw-2rem)] sm:w-[320px] rounded-2xl border border-black/10 bg-white p-4 text-ink shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            >
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
                    Approval
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "approved", label: "Approved" },
                      { value: "not_approved", label: "Not Approved" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setApprovalFilter(option.value as ApprovalFilter)}
                        className={`rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors duration-150 ${
                          approvalFilter === option.value
                            ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                            : "border-black/10 bg-white text-charcoal hover:border-black/25 hover:bg-black/[0.02]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
                    View Count
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setViewSort("high_to_low")}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors duration-150 ${
                        viewSort === "high_to_low"
                          ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                          : "border-black/10 bg-white text-charcoal hover:border-black/25 hover:bg-black/[0.02]"
                      }`}
                    >
                      <ArrowDownWideNarrow className="mr-1.5 h-3.5 w-3.5" />
                      High to Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewSort("low_to_high")}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors duration-150 ${
                        viewSort === "low_to_high"
                          ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                          : "border-black/10 bg-white text-charcoal hover:border-black/25 hover:bg-black/[0.02]"
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

          {loading ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-brand-blue">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing clips...
            </span>
          ) : null}
        </div>
      </div>

      {filteredClips.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-black/10 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Creator Name</TableHead>
                  <TableHead>Submission URL</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">View Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClips.map((clip) => {
                  const isSelected =
                    selectedClip?.id === clip.id && selectedClip?.status === clip.status;
                  return (
                    <TableRow
                      key={`${clip.status}-${clip.id}`}
                      onClick={() => onSelectClip(clip)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isSelected
                          ? "border-l-4 border-l-brand-blue bg-brand-blue/[0.05] hover:bg-brand-blue/[0.08]"
                          : "hover:bg-black/[0.02]"
                      }`}
                    >
                      <TableCell className="font-mono text-xs tabular-nums text-slate">
                        #{clip.id}
                      </TableCell>
                      <TableCell className="font-display font-bold text-ink">
                        {clip.creator_name || `Creator #${clip.creator_id}`}
                      </TableCell>
                      <TableCell className="max-w-xs truncate font-mono text-xs text-brand-blue hover:underline">
                        <a
                          href={clip.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {clip.clip_url}
                        </a>
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums text-slate">
                        {clip.submitted_at
                          ? new Date(clip.submitted_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </TableCell>
                      <TableCell>{renderClipStatusPill(clip)}</TableCell>
                      <TableCell className="text-right font-mono font-bold tabular-nums text-ink">
                        {getClipViewCount(clip).toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Stacked Cards (<768px) */}
          <div className="md:hidden space-y-2.5">
            {filteredClips.map((clip) => {
              const isSelected =
                selectedClip?.id === clip.id && selectedClip?.status === clip.status;
              return (
                <div
                  key={`mobile-${clip.status}-${clip.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectClip(clip)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectClip(clip);
                    }
                  }}
                  className={`rounded-xl border p-3.5 transition-colors duration-150 cursor-pointer space-y-2 ${
                    isSelected
                      ? "border-brand-blue bg-brand-blue/[0.04]"
                      : "border-black/10 bg-white hover:border-black/25"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold tabular-nums text-steel">
                      #{clip.id}
                    </span>
                    {renderClipStatusPill(clip)}
                  </div>
                  <p className="font-display text-sm font-bold text-ink truncate">
                    {clip.creator_name || `Creator #${clip.creator_id}`}
                  </p>
                  <a
                    href={clip.clip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block font-mono text-xs text-brand-blue hover:underline truncate"
                  >
                    {clip.clip_url}
                  </a>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.06] font-mono text-xs">
                    <span className="text-steel">
                      {clip.submitted_at
                        ? new Date(clip.submitted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </span>
                    <span className="font-bold tabular-nums text-ink">
                      {getClipViewCount(clip).toLocaleString("en-IN")} views
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-black/15 bg-black/[0.02] py-12 text-center px-4">
          <Video className="mx-auto mb-2 h-10 w-10 text-steel" />
          <p className="font-display text-sm font-bold text-ink">
            No clips match the current filters
          </p>
          <p className="mt-1 text-xs text-slate">
            Try changing the approval or view count filters to reveal more submissions.
          </p>
        </div>
      )}
    </div>
  );
};
