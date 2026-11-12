import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ink/20 focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-ink text-white hover:bg-charcoal",
        secondary:
          "border-black/10 bg-black/[0.04] text-charcoal hover:bg-black/[0.08]",
        destructive:
          "border-rose-500/25 bg-rose-50 text-rose-700",
        outline: "border-black/15 text-ink bg-white",
        mono: "border-black/10 bg-black/[0.03] text-charcoal font-mono text-[10px] uppercase tracking-wider",
        success: "border-emerald-500/25 bg-emerald-50 text-emerald-800 font-mono text-[10px] uppercase tracking-wider",
        warning: "border-amber-500/25 bg-amber-50 text-amber-800 font-mono text-[10px] uppercase tracking-wider",
        danger: "border-rose-500/25 bg-rose-50 text-rose-700 font-mono text-[10px] uppercase tracking-wider",
        brand: "border-brand-blue/25 bg-brand-blue/10 text-brand-blue font-mono text-[10px] uppercase tracking-wider",
        creator: "border-lava/25 bg-lava/10 text-lava font-mono text-[10px] uppercase tracking-wider",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
