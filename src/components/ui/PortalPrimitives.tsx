import * as React from "react";
import { Loader2 } from "lucide-react";
import { HighlightedText } from "@/components/Home/persona/HighlightedText";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type PortalAccent = "creator" | "brand" | "neutral";

/**
 * Editorial section/page header matching Homepage Swiss typography hierarchy:
 * Space Mono uppercase index -> Space Grotesk title (+ optional static HighlightedText) -> slate subtitle.
 */
interface PortalPageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  highlighted?: string;
  afterTitle?: React.ReactNode;
  subtitle?: string;
  accent?: PortalAccent;
  action?: React.ReactNode;
  className?: string;
}

export const PortalPageHeader: React.FC<PortalPageHeaderProps> = ({
  eyebrow,
  title,
  highlighted,
  afterTitle,
  subtitle,
  accent = "neutral",
  action,
  className,
}) => {
  const highlightColor =
    accent === "creator"
      ? "bg-lava/20"
      : accent === "brand"
      ? "bg-brand-blue/15"
      : "bg-highlight/50";

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-black/8",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-[1.15]">
          {title}
          {highlighted && (
            <>
              {" "}
              <HighlightedText animated={false} colorClass={highlightColor} textColorClass="text-ink">
                {highlighted}
              </HighlightedText>
            </>
          )}
          {afterTitle && <> {afterTitle}</>}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
};

/**
 * Compact architectural telemetry well matching SignalingCarousel platform snippets:
 * rounded-lg bg-black/[0.03] border border-black/[0.06]
 */
interface MetricCellProps {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  valueClassName?: string;
  className?: string;
}

export const MetricCell: React.FC<MetricCellProps> = ({
  label,
  value,
  sublabel,
  valueClassName,
  className,
}) => (
  <div
    className={cn(
      "rounded-lg bg-black/[0.03] border border-black/[0.06] px-3 py-2.5 min-w-0",
      className
    )}
  >
    <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-steel truncate">
      {label}
    </p>
    <div
      className={cn(
        "font-mono font-bold tabular-nums text-ink text-lg sm:text-xl leading-tight mt-1 truncate",
        valueClassName
      )}
    >
      {value}
    </div>
    {sublabel && (
      <p className="font-mono text-[10px] text-slate mt-0.5 truncate">{sublabel}</p>
    )}
  </div>
);

export type StatusTone = "success" | "warning" | "danger" | "brand" | "creator" | "neutral";

interface StatusPillProps {
  tone?: StatusTone;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

const STATUS_STYLES: Record<StatusTone, { badge: string; dot: string }> = {
  success: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-500/25",
    dot: "bg-emerald-600",
  },
  warning: {
    badge: "bg-amber-50 text-amber-800 border-amber-500/25",
    dot: "bg-amber-600",
  },
  danger: {
    badge: "bg-rose-50 text-rose-800 border-rose-500/25",
    dot: "bg-rose-600",
  },
  brand: {
    badge: "bg-brand-blue/10 text-brand-blue border-brand-blue/25",
    dot: "bg-brand-blue",
  },
  creator: {
    badge: "bg-lava/10 text-lava border-lava/25",
    dot: "bg-lava",
  },
  neutral: {
    badge: "bg-black/[0.04] text-charcoal border-black/10",
    dot: "bg-charcoal",
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  tone = "neutral",
  children,
  showDot = false,
  className,
}) => {
  const style = STATUS_STYLES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0",
        style.badge,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />}
      {children}
    </span>
  );
};

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className="font-display text-lg font-bold tracking-tight text-ink">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-slate leading-relaxed">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            void onConfirm();
          }}
          className={
            variant === "destructive"
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-ink text-white hover:bg-charcoal"
          }
        >
          {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

interface ReasonPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
  variant?: "default" | "destructive";
  loading?: boolean;
  initialValue?: string;
  onSubmit: (reason: string) => void | Promise<void>;
}

export const ReasonPromptDialog: React.FC<ReasonPromptDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  label = "Reason",
  placeholder = "Enter details...",
  confirmLabel = "Submit",
  cancelLabel = "Cancel",
  required = true,
  variant = "destructive",
  loading = false,
  initialValue = "",
  onSubmit,
}) => {
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError("");
    }
  }, [open, initialValue]);

  const handleConfirm = async () => {
    const trimmed = value.trim();
    if (required && !trimmed) {
      setError("Please provide a reason before continuing.");
      return;
    }
    setError("");
    await onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold tracking-tight text-ink">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-slate">{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-2 py-1">
          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate">
            {label}
          </label>
          <Textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            placeholder={placeholder}
            rows={4}
            className="resize-none rounded-xl border-black/15 bg-white text-sm text-ink focus-visible:ring-ink"
          />
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "ink"}
            loading={loading}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
