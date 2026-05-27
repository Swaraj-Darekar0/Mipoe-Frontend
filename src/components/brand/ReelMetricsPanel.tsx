import React from "react";
import { Flame, TrendingUp, TrendingDown, Clock3 } from "lucide-react";
import { ClipData } from "@/lib/api";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";

interface ReelMetricsPanelProps {
  clip: ClipData | null;
  campaignViewThreshold: number;
  avgViews: number;
  timeFilter: "24h" | "7d" | "30d";
  onTimeFilterChange: (filter: "24h" | "7d" | "30d") => void;
  formatViews: (views: number) => string;
}

export const ReelMetricsPanel: React.FC<ReelMetricsPanelProps> = ({
  clip,
  campaignViewThreshold,
  avgViews,
  timeFilter,
  onTimeFilterChange,
  formatViews
}) => {
  const safeViews = clip?.view_count ?? 0;
  const safeLikes = clip?.like_count ?? 0;
  const safeComments = clip?.comment_count ?? 0;
  const safeEngagementRate = safeViews > 0 ? ((safeLikes + safeComments) / safeViews) * 100 : 0;

  const selectedClipDeviation = React.useMemo(() => {
    if (!clip) return 100;
    const current = clip.view_count ?? 0;
    return avgViews > 0 ? (current / avgViews) * 100 : 100;
  }, [clip, avgViews]);

  const diagnosticSignal = React.useMemo(() => {
    const dev = selectedClipDeviation;
    if (dev > 115) {
      return {
        status: "🔥 Outperforming",
        colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
        pillClass: "bg-emerald-100 text-emerald-800",
        meaning: "The clip is gaining algorithmic traction fast."
      };
    } else if (dev >= 85) {
      return {
        status: "⚡ On Track",
        colorClass: "text-blue-700 bg-blue-50 border-blue-200",
        pillClass: "bg-blue-100 text-blue-800",
        meaning: "Normal performance; steady organic distribution."
      };
    } else {
      return {
        status: "📉 Underperforming",
        colorClass: "text-rose-700 bg-rose-50 border-rose-200",
        pillClass: "bg-rose-100 text-rose-800",
        meaning: "Weak hook or poor retention; the algorithm is stalling."
      };
    }
  }, [selectedClipDeviation]);

  const chartData = React.useMemo(() => {
    if (!clip) return [];
    const views = clip.view_count ?? 0;
    const likes = clip.like_count ?? 0;
    const comments = clip.comment_count ?? 0;
    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
    const points = timeFilter === "24h" ? 24 : timeFilter === "7d" ? 7 : 30;
    const data = [];

    for (let i = 1; i <= points; i++) {
      const label = timeFilter === "24h" ? `${i}h` : timeFilter === "7d" ? `Day ${i}` : `Week ${Math.ceil(i / 7.5)}`;
      const factor = Math.sin((i / points) * (Math.PI / 2));
      const pointViews = Math.round(views * factor);
      
      data.push({
        name: label,
        Views: pointViews,
        Engagement: Number(engagementRate.toFixed(2))
      });
    }
    return data;
  }, [clip, timeFilter]);

  if (!clip) {
    return (
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-[460px] flex flex-col justify-center items-center text-gray-400">
        <TrendingUp className="w-12 h-12 mb-2 opacity-30 animate-pulse" />
        <span className="text-sm font-medium">Select a clip to display video metrics dashboard</span>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between w-full">
      <div>
        {/* Header & Filter dropdown */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Video Analysis Dashboard</h4>
            <p className="text-xs text-gray-500">Real-time performance metrics relative to campaign benchmark</p>
          </div>
          
          <select
            title="timeFilter"
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value as any)}
            className="text-xs bg-slate-50 border rounded-lg px-3 py-1.5 font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last Month</option>
          </select>
        </div>

        {/* Top Metric Row (KPI Cards) */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Views</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-800">
                {formatViews(safeViews)}
              </span>
              {safeViews > 0 ? (
                <span className={`text-[10px] font-bold ${
                  selectedClipDeviation >= 100 ? "text-green-600" : "text-red-500"
                }`}>
                  {selectedClipDeviation >= 100 ? "+" : ""}
                  {Math.round(selectedClipDeviation - 100)}%
                </span>
              ) : null}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Likes</span>
            <span className="text-lg font-bold text-slate-800">
              {formatViews(safeLikes)}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Comments</span>
            <span className="text-lg font-bold text-slate-800">
              {formatViews(safeComments)}
            </span>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 p-4">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-violet-500">Live Engagement Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-violet-900">{safeEngagementRate.toFixed(2)}%</span>
            <span className="text-xs text-violet-700">
              ({formatViews(safeLikes + safeComments)} interactions from {formatViews(safeViews)} views)
            </span>
          </div>
        </div>

        {/* Algorithmic Deviation diagnostic block */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 mb-6 ${diagnosticSignal.colorClass}`}>
          {selectedClipDeviation > 115 ? (
            <Flame className="w-5 h-5 flex-shrink-0" />
          ) : selectedClipDeviation >= 85 ? (
            <TrendingUp className="w-5 h-5 flex-shrink-0" />
          ) : (
            <TrendingDown className="w-5 h-5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wide">Status: {diagnosticSignal.status}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${diagnosticSignal.pillClass}`}>
                Deviation: {selectedClipDeviation.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs mt-1 opacity-90">{diagnosticSignal.meaning}</p>
          </div>
        </div>

        {/* Composed Chart */}
        <div className="h-[200px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="name" tickLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
              <RechartsTooltip />
              <Area yAxisId="left" type="monotone" dataKey="Views" fill="#e0e7ff" stroke="#4f46e5" strokeWidth={1.5} />
              <Line yAxisId="right" type="monotone" dataKey="Engagement" stroke="#10b981" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2 text-[10px] font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-indigo-100 border border-indigo-600 rounded-sm" />
              Views (Area)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-0.5 bg-emerald-500" />
              Engagement Rate (Line)
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-4 mt-4 flex items-center gap-1">
        <Clock3 className="w-3.5 h-3.5" />
        <span>Data feeds update every 12h. Benchmark baseline: {avgViews.toLocaleString()} views average.</span>
      </div>
    </div>
  );
};
