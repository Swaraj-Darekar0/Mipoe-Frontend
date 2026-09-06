
import { Card } from "@/components/ui/card";
import { Zap, IndianRupee, Layers } from "lucide-react";
import React from "react";

interface QuickStatsProps {
  currentEarnings: number;
  activeSubmissions: number;
  loading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ currentEarnings, activeSubmissions, loading }) => {
  if (loading) {
    return (
      <Card className="flex items-center justify-center p-6 h-[260px] bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
        <Zap className="h-8 w-8 animate-pulse text-orange-500" />
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-zinc-900 text-xl font-bold tracking-tight">Quick Stats</h2>
        <span className="bg-orange-100 text-orange-700 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Real-time
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Earnings Card */}
        <div className="flex flex-col gap-2 p-5 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-pink-500/5 border border-orange-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-orange-700">Total Earnings</p>
            <div className="size-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <IndianRupee size={14} />
            </div>
          </div>
          <p className="font-display text-orange-600 text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            ₹{currentEarnings.toLocaleString()}
          </p>
          <p className="text-zinc-500 text-[11px]">Available for withdrawal</p>
        </div>

        {/* Active Submissions Card */}
        <div className="flex flex-col gap-2 p-5 bg-purple-50/60 border border-purple-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700">Active Submissions</p>
            <div className="size-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Layers size={14} />
            </div>
          </div>
          <p className="font-display text-zinc-900 text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            {activeSubmissions}
          </p>
          <p className="text-zinc-500 text-[11px]">Clips under active tracking</p>
        </div>
      </div>
    </Card>
  );
};

export default QuickStats;

