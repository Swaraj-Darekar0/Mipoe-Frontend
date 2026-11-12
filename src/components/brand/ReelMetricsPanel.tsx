import React from "react";
import { Flame, TrendingUp, TrendingDown, Clock3 } from "lucide-react";
import { ClipData } from "@/lib/api";
import { MetricCell, StatusPill } from "@/components/ui/PortalPrimitives";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
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
  campaignViewThreshold: _campaignViewThreshold,
  avgViews,
  timeFilter,
  onTimeFilterChange,
  formatViews,
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
        status: "Outperforming",
        tone: "success" as const,
        containerClass: "text-emerald-800 bg-emerald-50 border-emerald-500/25",
        meaning: "The clip is gaining algorithmic traction fast.",
      };
    } else if (dev >= 85) {
      return {
        status: "On Track",
        tone: "brand" as const,
        containerClass: "text-brand-blue bg-brand-blue/[0.05] border-brand-blue/25",
        meaning: "Normal performance; steady organic distribution.",
      };
    } else {
      return {
        status: "Underperforming",
        tone: "danger" as const,
        containerClass: "text-rose-800 bg-rose-50 border-rose-500/25",
        meaning: "Weak hook or poor retention; distribution is stalling.",
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
      const label =
        timeFilter === "24h"
          ? `${i}h`
          : timeFilter === "7d"
          ? `Day ${i}`
          : `Week ${Math.ceil(i / 7.5)}`;
      const factor = Math.sin((i / points) * (Math.PI / 2));
      const pointViews = Math.round(views * factor);

      data.push({
        name: label,
        Views: pointViews,
        Engagement: Number(engagementRate.toFixed(2)),
      });
    }
    return data;
  }, [clip, timeFilter]);

  if (!clip) {
    return (
      <div className="lg:col-span-2 rounded-2xl bg-white border border-black/10 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] h-[440px] flex flex-col justify-center items-center text-steel text-center">
        <TrendingUp className="w-10 h-10 mb-2 opacity-35" />
        <span className="font-mono text-xs uppercase tracking-wider">
          Select a clip to display video metrics telemetry
        </span>
      </div>
    );
  }

  const deviationDelta = Math.round(selectedClipDeviation - 100);

  return (
    <div className="lg:col-span-2 rounded-2xl bg-white border border-black/10 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between w-full min-w-0 text-ink">
      <div>
        {/* Header & Filter dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel mb-1">
              02 // REEL TELEMETRY
            </p>
            <h4 className="font-display text-base sm:text-lg font-bold tracking-tight text-ink">
              Video Analysis Dashboard
            </h4>
            <p className="text-xs text-slate">
              Real-time performance metrics relative to campaign benchmark
            </p>
          </div>

          <select
            title="timeFilter"
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value as "24h" | "7d" | "30d")}
            className="font-mono text-xs font-bold bg-white border border-black/15 rounded-lg px-3 py-1.5 text-ink outline-none focus:border-brand-blue transition-colors duration-150 self-start sm:self-auto"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last Month</option>
          </select>
        </div>

        {/* Top Metric Row (KPI Wells) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <MetricCell
            label="Views"
            value={
              <span className="inline-flex items-baseline gap-1.5">
                <span>{formatViews(safeViews)}</span>
                {safeViews > 0 && (
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      selectedClipDeviation >= 100 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {deviationDelta >= 0 ? `+${deviationDelta}%` : `${deviationDelta}%`}
                  </span>
                )}
              </span>
            }
          />
          <MetricCell label="Likes" value={formatViews(safeLikes)} />
          <MetricCell label="Comments" value={formatViews(safeComments)} />
        </div>

        {/* Live Engagement Rate Well */}
        <div className="mb-4 rounded-xl border border-brand-blue/25 bg-brand-blue/[0.05] p-3.5 sm:p-4">
          <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-brand-blue">
            Live Engagement Rate
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-lg sm:text-xl font-bold tabular-nums text-ink">
              {safeEngagementRate.toFixed(2)}%
            </span>
            <span className="font-mono text-xs text-slate tabular-nums">
              ({formatViews(safeLikes + safeComments)} interactions from {formatViews(safeViews)}{" "}
              views)
            </span>
          </div>
        </div>

        {/* Algorithmic Deviation Diagnostic Block */}
        <div
          className={`p-3.5 rounded-xl border flex items-start sm:items-center gap-3 mb-5 ${diagnosticSignal.containerClass}`}
        >
          {selectedClipDeviation > 115 ? (
            <Flame className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
          ) : selectedClipDeviation >= 85 ? (
            <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <TrendingDown className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-xs uppercase tracking-wide">
                Status: {diagnosticSignal.status}
              </span>
              <StatusPill tone={diagnosticSignal.tone}>
                Deviation: {selectedClipDeviation.toFixed(1)}%
              </StatusPill>
            </div>
            <p className="text-xs mt-1 text-charcoal">{diagnosticSignal.meaning}</p>
          </div>
        </div>

        {/* Composed Chart */}
        <div className="h-[200px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid stroke="rgba(18, 19, 22, 0.06)" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: "rgba(18, 19, 22, 0.08)" }}
                style={{ fontSize: "10px", fill: "#71717a", fontFamily: "Space Mono, monospace" }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                style={{ fontSize: "10px", fill: "#71717a", fontFamily: "Space Mono, monospace" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                style={{ fontSize: "10px", fill: "#71717a", fontFamily: "Space Mono, monospace" }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "rgba(18, 19, 22, 0.12)",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontFamily: "Space Mono, monospace",
                  color: "#0e0e11",
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="Views"
                fill="rgba(43, 92, 230, 0.14)"
                stroke="#2b5ce6"
                strokeWidth={1.75}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Engagement"
                stroke="#0e0e11"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap justify-center gap-5 mt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-slate">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-brand-blue/20 border border-brand-blue rounded-sm" />
            <span>Views (Area)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-ink" />
            <span>Engagement Rate (Line)</span>
          </div>
        </div>
      </div>

      <div className="font-mono text-[10px] text-steel border-t border-black/[0.06] pt-3.5 mt-4 flex items-center gap-1.5">
        <Clock3 className="w-3.5 h-3.5 shrink-0" />
        <span>
          Data feeds update every 12h. Benchmark baseline:{" "}
          <strong className="text-ink tabular-nums">{avgViews.toLocaleString("en-IN")}</strong>{" "}
          views average.
        </span>
      </div>
    </div>
  );
};
