import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryOption {
  value: string;
  label: string;
}

interface CategoryFilterProps {
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
  isOpen: boolean;
  theme?: "light" | "dark";
  className?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isOpen,
  theme = "dark",
  className,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

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

  const isDark = theme === "dark";

  return (
    <div 
      className={cn(
        "relative w-full transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-4 duration-200", 
        className
      )}
    >
      <div 
        className={cn(
          "border rounded-2xl p-4 shadow-xl select-none",
          isDark 
            ? "bg-zinc-950/90 backdrop-blur-md border-zinc-800/80 text-white" 
            : "bg-white/95 backdrop-blur-md border-slate-200 text-slate-800"
        )}
      >
        {/* Header inside Panel */}
        <div className="flex justify-between items-center mb-3">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
            isDark ? "text-zinc-400" : "text-slate-500"
          )}>
            <SlidersHorizontal size={10} />
            Filter by Category
          </span>
          {selectedCategory !== "all" && (
            <button
              onClick={() => onSelectCategory("all")}
              className={cn(
                "text-xs font-semibold cursor-pointer transition-colors hover:underline",
                isDark ? "text-primary" : "text-indigo-600 hover:text-indigo-700"
              )}
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Scroll Container Wrapper */}
        <div className="relative flex items-center group/filter">
          
          {/* Scroll Left Button */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => handleScroll("left")}
              className={cn(
                "absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95",
                isDark 
                  ? "bg-zinc-900/90 border-zinc-800 text-white hover:bg-zinc-800" 
                  : "bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Scrollable Badges Inner Row */}
          <div
            ref={scrollContainerRef}
            className="flex gap-2.5 overflow-x-auto py-1 scroll-smooth w-full px-1"
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
                  onClick={() => onSelectCategory(cat.value)}
                  className={cn(
                    "flex h-8 shrink-0 items-center justify-center rounded-full px-4 transition-all duration-200 cursor-pointer text-[11px] font-semibold tracking-wide whitespace-nowrap",
                    isSelected
                      ? (isDark 
                          ? "bg-primary text-black font-bold shadow-md shadow-primary/20 scale-105" 
                          : "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20 scale-105")
                      : (isDark 
                          ? "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700" 
                          : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-350")
                  )}
                >
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
              className={cn(
                "absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95",
                isDark 
                  ? "bg-zinc-900/90 border-zinc-800 text-white hover:bg-zinc-800" 
                  : "bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
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
