import React, { useState, useEffect } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { cn } from "@/lib/utils";

export type ImageCropperAccent = "brand" | "creator" | "neutral";

export interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  fileName: string;
  aspectRatio: "1:1" | "16:9" | "3:1";
  onCropComplete: (file: File, previewUrl: string) => void;
  accent?: ImageCropperAccent;
}

const ACCENT_STYLES: Record<
  ImageCropperAccent,
  {
    cropOutline: string;
    rangeAccent: string;
    applyButton: string;
  }
> = {
  brand: {
    cropOutline: "border-brand-blue",
    rangeAccent: "accent-brand-blue",
    applyButton: "bg-brand-blue hover:bg-brand-blue/90 text-white",
  },
  creator: {
    cropOutline: "border-lava",
    rangeAccent: "accent-lava",
    applyButton: "bg-lava hover:bg-lava/90 text-white",
  },
  neutral: {
    cropOutline: "border-white/90",
    rangeAccent: "accent-ink",
    applyButton: "bg-ink hover:bg-charcoal text-white",
  },
};

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  fileName,
  aspectRatio,
  onCropComplete,
  accent = "neutral",
}) => {
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");

  const accentStyle = ACCENT_STYLES[accent] ?? ACCENT_STYLES.neutral;

  // Load natural dimensions whenever a new image source is supplied
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        setNaturalWidth(img.naturalWidth);
        setNaturalHeight(img.naturalHeight);
      };
      img.src = imageSrc;
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setError("");
    }
  }, [imageSrc]);

  const is1to1 = aspectRatio === "1:1";
  const is3to1 = aspectRatio === "3:1";

  // Calculate base scaling to cover the active crop zone
  const getScaleAndSize = (currentZoom: number) => {
    // 1:1 cutout is centered 280x280px
    // 16:9 cutout is centered 320x180px
    // 3:1 cutout is centered 300x100px
    let targetW = 320;
    let targetH = 180;
    if (is1to1) {
      targetW = 280;
      targetH = 280;
    } else if (is3to1) {
      targetW = 300;
      targetH = 100;
    }

    const baseScale = Math.max(targetW / naturalWidth, targetH / naturalHeight);
    const W = naturalWidth * baseScale * currentZoom;
    const H = naturalHeight * baseScale * currentZoom;

    return { baseScale, W, H, targetW, targetH };
  };

  const clampOffsets = (x: number, y: number, currentZoom: number) => {
    if (naturalWidth === 0 || naturalHeight === 0) {
      return { panX: 0, panY: 0, xOffset: 0, yOffset: 0 };
    }

    const { W, H } = getScaleAndSize(currentZoom);

    // Initial base centering coordinates inside the 320x320 workspace container
    const xOffsetBase = (320 - W) / 2;
    const yOffsetBase = (320 - H) / 2;

    const xOffsetProposed = xOffsetBase + x;
    const yOffsetProposed = yOffsetBase + y;

    // Boundaries: crop box boundaries inside 320x320 workspace
    // 1:1 circular crop box: starts at x=20, y=20 (centered 280x280)
    // 16:9 rectangular crop box: starts at x=0, y=70 (centered 320x180)
    // 3:1 rectangular crop box: starts at x=10, y=110 (centered 300x100)
    let minX = 0;
    let maxX = 320;
    let minY = 70;
    let maxY = 250;
    if (is1to1) {
      minX = 20;
      maxX = 300;
      minY = 20;
      maxY = 300;
    } else if (is3to1) {
      minX = 10;
      maxX = 310;
      minY = 110;
      maxY = 210;
    }

    const xOffsetConstrained = Math.min(minX, Math.max(maxX - W, xOffsetProposed));
    const yOffsetConstrained = Math.min(minY, Math.max(maxY - H, yOffsetProposed));

    return {
      panX: xOffsetConstrained - xOffsetBase,
      panY: yOffsetConstrained - yOffsetBase,
      xOffset: xOffsetConstrained,
      yOffset: yOffsetConstrained,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panX,
      y: e.clientY - panY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const proposedPanX = e.clientX - dragStart.x;
    const proposedPanY = e.clientY - dragStart.y;

    const clamped = clampOffsets(proposedPanX, proposedPanY, zoom);
    setPanX(clamped.panX);
    setPanY(clamped.panY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - panX,
      y: e.touches[0].clientY - panY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const proposedPanX = e.touches[0].clientX - dragStart.x;
    const proposedPanY = e.touches[0].clientY - dragStart.y;

    const clamped = clampOffsets(proposedPanX, proposedPanY, zoom);
    setPanX(clamped.panX);
    setPanY(clamped.panY);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    const clamped = clampOffsets(panX, panY, newZoom);
    setPanX(clamped.panX);
    setPanY(clamped.panY);
  };

  const handleApplyCrop = () => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Browser canvas is not supported.");
          return;
        }

        const { W, H, targetW, targetH } = getScaleAndSize(zoom);
        const clamped = clampOffsets(panX, panY, zoom);

        let cropStartX = 0;
        let cropStartY = 70;
        if (is1to1) {
          cropStartX = 20;
          cropStartY = 20;
        } else if (is3to1) {
          cropStartX = 10;
          cropStartY = 110;
        }

        const sx = (cropStartX - clamped.xOffset) * (img.naturalWidth / W);
        const sy = (cropStartY - clamped.yOffset) * (img.naturalHeight / H);
        const sWidth = targetW * (img.naturalWidth / W);
        const sHeight = targetH * (img.naturalHeight / H);

        let destWidth = sWidth;
        let destHeight = sHeight;

        // Apply resolution rules based on aspect ratio request
        if (is1to1) {
          // If 1:1 circle, reduce/cap at 720p. Do not upscale if smaller.
          destWidth = sWidth >= 720 ? 720 : Math.max(1, Math.round(sWidth));
          destHeight = destWidth;
        } else if (is3to1) {
          // If 3:1, cap width at 1200. Do not upscale if smaller.
          destWidth = sWidth >= 1200 ? 1200 : Math.max(1, Math.round(sWidth));
          destHeight = destWidth / 3;
        } else {
          // If 16:9, do NOT resize resolution/pixel ratio. Keep original crop size.
          destWidth = Math.max(16, Math.round(sWidth));
          destHeight = Math.max(9, Math.round(sHeight));
        }

        canvas.width = destWidth;
        canvas.height = destHeight;

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, destWidth, destHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError("Failed to process cropped image.");
              return;
            }

            const previewUrl = URL.createObjectURL(blob);
            const croppedFile = new File([blob], fileName.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp",
              lastModified: Date.now(),
            });

            onCropComplete(croppedFile, previewUrl);
            onClose();
          },
          "image/webp",
          0.85
        );
      } catch (err: any) {
        setError("Error processing image crop: " + err.message);
      }
    };
    img.src = imageSrc;
  };

  if (!isOpen || !imageSrc) return null;

  const { W, H } = getScaleAndSize(zoom);
  const clamped = clampOffsets(panX, panY, zoom);
  const left = clamped.xOffset;
  const top = clamped.yOffset;

  return (
    <Dialog
      open={isOpen && Boolean(imageSrc)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md rounded-2xl border border-black/10 bg-white p-4 sm:p-6 text-ink shadow-[0_16px_48px_-12px_rgba(0,0,0,0.16)] data-[state=open]:animate-none data-[state=closed]:animate-none">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink">
            {is1to1 ? "Crop Brand Logo" : is3to1 ? "Crop Store Banner" : "Crop Campaign Cover"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate">
            Drag to position the image inside the crop frame. Use the slider to zoom.
          </DialogDescription>
        </DialogHeader>

        {/* Viewport Workspace Box (320x320) */}
        <div className="w-full overflow-x-auto flex justify-center">
          <div
            className="w-[320px] h-[320px] shrink-0 rounded-xl relative overflow-hidden bg-ink cursor-move select-none touch-none border border-black/15 flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Draggable scaled image */}
            <img
              src={imageSrc}
              alt="Cropping workspace"
              style={{
                width: `${W}px`,
                height: `${H}px`,
                left: `${left}px`,
                top: `${top}px`,
              }}
              className="absolute select-none pointer-events-none max-w-none"
            />

            {/* Blurred Crop Cutout Overlay & Guides */}
            {is1to1 ? (
              <>
                <div
                  className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-none z-10"
                  style={{
                    maskImage: "radial-gradient(circle 140px at center, transparent 140px, black 141px)",
                    WebkitMaskImage: "radial-gradient(circle 140px at center, transparent 140px, black 141px)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                />
                <div
                  className={cn(
                    "absolute top-[20px] left-[20px] w-[280px] h-[280px] rounded-full border-2 pointer-events-none z-20",
                    accentStyle.cropOutline
                  )}
                />
                <div className="absolute top-[20px] left-[20px] w-[280px] h-[280px] rounded-full border border-white/30 pointer-events-none z-20" />
                <div className="absolute top-[160px] left-[20px] right-[20px] border-t border-dashed border-white/25 pointer-events-none z-20" />
                <div className="absolute left-[160px] top-[20px] bottom-[20px] border-l border-dashed border-white/25 pointer-events-none z-20" />
              </>
            ) : is3to1 ? (
              <>
                <div
                  className="absolute top-0 left-0 right-0 h-[110px] bg-black/70 backdrop-blur-md pointer-events-none z-10 border-b border-white/10"
                  style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-[110px] bg-black/70 backdrop-blur-md pointer-events-none z-10 border-t border-white/10"
                  style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                />
                <div
                  className="absolute top-[110px] bottom-[110px] left-0 w-[10px] bg-black/70 backdrop-blur-md pointer-events-none z-10 border-r border-white/10"
                  style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                />
                <div
                  className="absolute top-[110px] bottom-[110px] right-0 w-[10px] bg-black/70 backdrop-blur-md pointer-events-none z-10 border-l border-white/10"
                  style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                />
                <div
                  className={cn(
                    "absolute top-[110px] left-[10px] w-[300px] h-[100px] border-2 pointer-events-none z-20",
                    accentStyle.cropOutline
                  )}
                />
                <div className="absolute top-[110px] left-[10px] w-[300px] h-[100px] border border-white/30 pointer-events-none z-20" />
                <div className="absolute left-[110px] top-[110px] bottom-[110px] border-l border-dashed border-white/25 pointer-events-none z-20" />
                <div className="absolute left-[210px] top-[110px] bottom-[110px] border-l border-dashed border-white/25 pointer-events-none z-20" />
              </>
            ) : (
              <>
                <div
                  className="absolute top-0 left-0 right-0 h-[70px] bg-black/70 backdrop-blur-md pointer-events-none z-10 border-b border-white/10"
                  style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-[70px] bg-black/70 backdrop-blur-md pointer-events-none z-10 border-t border-white/10"
                  style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                />
                <div
                  className={cn(
                    "absolute top-[70px] left-0 right-0 h-[180px] border-2 pointer-events-none z-20",
                    accentStyle.cropOutline
                  )}
                />
                <div className="absolute top-[70px] left-0 right-0 h-[180px] border border-white/30 pointer-events-none z-20" />
                <div className="absolute top-[130px] left-0 right-0 border-t border-dashed border-white/25 pointer-events-none z-20" />
                <div className="absolute top-[190px] left-0 right-0 border-t border-dashed border-white/25 pointer-events-none z-20" />
                <div className="absolute left-1/3 top-[70px] bottom-[70px] border-l border-dashed border-white/25 pointer-events-none z-20" />
                <div className="absolute left-2/3 top-[70px] bottom-[70px] border-l border-dashed border-white/25 pointer-events-none z-20" />
              </>
            )}
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center font-mono text-[11px] uppercase tracking-wider text-slate font-bold">
            <span>Zoom</span>
            <span className="tabular-nums text-ink">{Math.round(zoom * 100)}%</span>
          </div>
          <input
            title="Zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className={cn(
              "w-full h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer focus:outline-none",
              accentStyle.rangeAccent
            )}
          />
        </div>

        {error && <p className="text-rose-600 text-xs font-semibold">{error}</p>}

        {/* Action Controls */}
        <DialogFooter className="gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApplyCrop}
            className={cn("font-semibold", accentStyle.applyButton)}
          >
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
