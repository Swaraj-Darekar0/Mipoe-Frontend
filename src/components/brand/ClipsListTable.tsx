import React from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Filter, Video } from "lucide-react";
import { ClipData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead
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
  loading
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

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Submitted Clips & Compliance Status</h3>
          <p className="text-xs text-gray-500">Click a row to load diagnostics, thumbnail, and view graphs below</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-full border-slate-200 px-3 text-slate-700">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[320px] rounded-2xl border-slate-200 p-4 shadow-xl">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Approval</p>
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
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">View Count</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setViewSort("high_to_low")}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        viewSort === "high_to_low"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
            <span className="text-xs font-medium text-indigo-600 animate-pulse">Refreshing clips...</span>
          ) : null}
        </div>
      </div>

      {filteredClips.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                const isSelected = selectedClip?.id === clip.id && selectedClip?.status === clip.status;
                return (
                  <TableRow
                    key={`${clip.status}-${clip.id}`}
                    onClick={() => onSelectClip(clip)}
                    className={`cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "border-l-4 border-l-indigo-600 bg-indigo-50/70 font-medium hover:bg-indigo-50"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    <TableCell className="font-mono text-xs">#{clip.id}</TableCell>
                    <TableCell className="font-bold text-slate-800">{clip.creator_name || `Creator #${clip.creator_id}`}</TableCell>
                    <TableCell className="max-w-xs truncate text-indigo-600 hover:underline">
                      <a href={clip.clip_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        {clip.clip_url}
                      </a>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {clip.submitted_at
                        ? new Date(clip.submitted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          clip.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : clip.status === "rejected" || clip.is_deleted_by_admin
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {clip.status === "accepted" ? "Approved" : clip.status === "rejected" || clip.is_deleted_by_admin ? "Rejected" : "In Review"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-700">
                      {getClipViewCount(clip).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-slate-50 py-12 text-center">
          <Video className="mx-auto mb-2 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No clips match the current filters</p>
          <p className="mt-1 text-xs text-slate-400">Try changing the approval or view count filters to reveal more submissions.</p>
        </div>
      )}
    </div>
  );
};
