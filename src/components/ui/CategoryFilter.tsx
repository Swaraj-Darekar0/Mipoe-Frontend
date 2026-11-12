import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  value: string;
  label: string;
}

export type CategoryFilterAccent = "creator" | "brand";

export interface CategoryFilterProps {
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
  isOpen: boolean;
  /** @deprecated Light Paper Canvas is always enforced per DESIGN.md. */
  theme?: "light" | "dark";
  accent?: CategoryFilterAccent;
  className?: string;
}

const ACCENT_STYLES: Record<
  CategoryFilterAccent,
  {
    clearText: string;
    activeDot: string;
    inactiveHoverBorder: string;
  }
> = {
  creator: {
    clearText: "text-lava hover:text-ink",
    activeDot: "bg-lava",
    inactiveHoverBorder: "hover:border-lava/35",
  },
  brand: {
    clearText: "text-brand-blue hover:text-ink",
    activeDot: "bg-brand-blue",
    inactiveHoverBorder: "hover:border-brand-blue/35",
  },
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isOpen,
  theme: _theme = "light",
  accent = "creator",
  className,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const accentStyle = ACCENT_STYLES[accent] ?? ACCENT_STYLES.creator;

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      // Show left arrow if we have scrolled to the right
      setShowLeftArrow(scrollLeft > 2);
      // Show right arrow if there is still content remaining to the right
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 4);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && isOpen) {
      // Small timeout to allow element to render and compute correct scrollWidth
      const timeoutId = setTimeout(checkScroll, 100);

      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);

      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [isOpen, categories]);

  const handleScroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === "left" ? -220 : 220;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <div className="rounded-2xl bg-white border border-black/10 text-ink p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] select-none">
        {/* Header inside Panel */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel flex items-center gap-1.5">
            <SlidersHorizontal size={11} />
            Filter by Category
          </span>
          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => onSelectCategory("all")}
              className={cn(
                "font-mono text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors duration-150 hover:underline",
                accentStyle.clearText
              )}
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Scroll Container Wrapper */}
        <div className="relative flex items-center min-w-0">
          {/* Scroll Left Button */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => handleScroll("left")}
              className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-ink shadow-sm cursor-pointer transition-colors duration-150 hover:bg-black/[0.03] hover:border-black/25"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Scrollable Badges Inner Row */}
          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto py-0.5 w-full min-w-0 px-0.5"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            onScroll={checkScroll}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => onSelectCategory(cat.value)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3.5 font-mono text-[11px] tracking-wide whitespace-nowrap transition-colors duration-150 cursor-pointer",
                    isSelected
                      ? "bg-ink text-white border-ink font-bold"
                      : cn(
                          "bg-black/[0.03] border-black/10 text-charcoal font-medium hover:text-ink hover:bg-black/[0.06]",
                          accentStyle.inactiveHoverBorder
                        )
                  )}
                >
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className={cn("w-1.5 h-1.5 rounded-full shrink-0", accentStyle.activeDot)}
                    />
                  )}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          {showRightArrow && (
            <button
              type="button"
              onClick={() => handleScroll("right")}
              className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-ink shadow-sm cursor-pointer transition-colors duration-150 hover:bg-black/[0.03] hover:border-black/25"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
