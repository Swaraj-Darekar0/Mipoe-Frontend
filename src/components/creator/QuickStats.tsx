import React from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/PortalPrimitives";
import { Loader2, IndianRupee, Layers } from "lucide-react";

interface QuickStatsProps {
  currentEarnings: number;
  activeSubmissions: number;
  loading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({
  currentEarnings,
  activeSubmissions,
  loading,
}) => {
  if (loading) {
    return (
      <Card className="flex items-center justify-center gap-2.5 p-6 min-h-[210px] rounded-2xl bg-white text-ink border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
        <Loader2 className="h-5 w-5 animate-spin text-lava shrink-0" />
        <span className="font-mono text-xs uppercase tracking-wider text-slate">
          Syncing telemetry...
        </span>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl bg-white text-ink border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3 flex-wrap min-w-0">
        <div className="min-w-0 space-y-0.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
            01 // EARNINGS SUMMARY
          </p>
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink">
            Quick Stats
          </h2>
        </div>
        <StatusPill tone="creator" showDot>
          Real-time
        </StatusPill>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Total Earnings Well */}
        <div className="rounded-lg bg-black/[0.03] border border-black/[0.06] p-3.5 min-w-0 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-slate truncate">
              Total Earnings
            </p>
            <div className="size-7 rounded-md bg-lava/10 border border-lava/25 flex items-center justify-center text-lava shrink-0">
              <IndianRupee size={14} />
            </div>
          </div>
          <p className="font-mono font-bold tabular-nums text-lava text-2xl sm:text-3xl tracking-tight leading-tight truncate">
            ₹{currentEarnings.toLocaleString("en-IN")}
          </p>
          <p className="font-mono text-[10px] text-steel truncate">
            Available for withdrawal
          </p>
        </div>

        {/* Active Submissions Well */}
        <div className="rounded-lg bg-black/[0.03] border border-black/[0.06] p-3.5 min-w-0 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-slate truncate">
              Active Submissions
            </p>
            <div className="size-7 rounded-md bg-white border border-black/10 flex items-center justify-center text-ink shrink-0">
              <Layers size={14} />
            </div>
          </div>
          <p className="font-mono font-bold tabular-nums text-ink text-2xl sm:text-3xl tracking-tight leading-tight truncate">
            {activeSubmissions}
          </p>
          <p className="font-mono text-[10px] text-steel truncate">
            Clips under active tracking
          </p>
        </div>
      </div>
    </Card>
  );
};

export default QuickStats;
