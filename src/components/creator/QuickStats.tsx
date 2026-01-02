
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Send, Zap } from "lucide-react";
import React from "react";

interface QuickStatsProps {
  currentEarnings: number;
  activeSubmissions: number;
  loading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ currentEarnings, activeSubmissions, loading }) => {
  if (loading) {
    return (
      <Card className="flex items-center justify-center p-6 h-[280px] bg-raisin-black border border-[#262626]">
        <Zap className="h-8 w-8 animate-pulse text-primary" />
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-1 bg-raisin-black border border-[#262626] rounded-xl p-6 flex flex-col gap-6">
      <h2 className="font-display text-snow text-[22px] font-bold leading-tight tracking-[-0.015em]">Quick Stats</h2>
      <div className="flex flex-col gap-4 text-center p-6 bg-[#262626]/50 rounded-lg">
        <p className="text-dusty-grey text-sm font-medium uppercase tracking-widest">Total Earnings</p>
        <p className="font-display text-primary text-5xl font-bold tracking-tighter">₹{currentEarnings.toLocaleString()}</p>
      </div>
      <div className="flex flex-col gap-2 p-4 bg-[#262626]/50 rounded-lg text-center">
        <p className="text-dusty-grey text-xs font-medium uppercase tracking-wider">Active</p>
        <p className="font-display text-snow text-3xl font-bold">{activeSubmissions}</p>
        <p className="text-dusty-grey text-sm">Submissions</p>
      </div>
    </Card>
  );
};

export default QuickStats;
