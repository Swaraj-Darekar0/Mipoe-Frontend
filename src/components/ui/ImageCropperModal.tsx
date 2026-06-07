import React, { useState, useEffect } from "react";
import { Button } from "./button";

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  fileName: string;
  aspectRatio: "1:1" | "16:9";
  onCropComplete: (file: File, previewUrl: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  fileName,
  aspectRatio,
  onCropComplete,
}) => {
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");

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

  if (!isOpen || !imageSrc) return null;

  const is1to1 = aspectRatio === "1:1";

  // Calculate base scaling to cover the active crop zone
  const getScaleAndSize = (currentZoom: number) => {
    // 1:1 cutout is centered 280x280px
    // 16:9 cutout is centered 320x180px
    const targetW = is1to1 ? 280 : 320;
    const targetH = is1to1 ? 280 : 180;

    const baseScale = Math.max(targetW / naturalWidth, targetH / naturalHeight);
    const W = naturalWidth * baseScale * currentZoom;
    const H = naturalHeight * baseScale * currentZoom;

    return { baseScale, W, H, targetW, targetH };
  };

  const clampOffsets = (x: number, y: number, currentZoom: number) => {
    if (naturalWidth === 0 || naturalHeight === 0) {
      return { panX: 0, panY: 0, xOffset: 0, yOffset: 0 };
    }

    const { W, H, targetW, targetH } = getScaleAndSize(currentZoom);

    // Initial base centering coordinates inside the 320x320 workspace container
    const xOffsetBase = (320 - W) / 2;
    const yOffsetBase = (320 - H) / 2;

    const xOffsetProposed = xOffsetBase + x;
    const yOffsetProposed = yOffsetBase + y;

    // Boundaries: crop box boundaries inside 320x320 workspace
    // 1:1 circular crop box: starts at x=20, y=20 (centered 280x280)
    // 16:9 rectangular crop box: starts at x=0, y=70 (centered 320x180)
    const minX = is1to1 ? 20 : 0;
    const maxX = is1to1 ? 300 : 320;
    const minY = is1to1 ? 20 : 70;
    const maxY = is1to1 ? 300 : 250;

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

        const cropStartX = is1to1 ? 20 : 0;
        const cropStartY = is1to1 ? 20 : 70;

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

  const { W, H } = getScaleAndSize(zoom);
  const clamped = clampOffsets(panX, panY, zoom);
  const left = clamped.xOffset;
  const top = clamped.yOffset;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-200 text-left">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {is1to1 ? "Crop Brand Logo" : "Crop Campaign Cover"}
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Drag to position the image inside the crop frame. Use the slider to zoom.
        </p>

        {/* Viewport Workspace Box (320x320) */}
        <div
          className="w-[320px] h-[320px] rounded-xl relative overflow-hidden bg-gray-950 cursor-move mx-auto shadow-inner select-none touch-none border border-gray-200 flex items-center justify-center"
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

          {/* WhatsApp-Style Dark Blurred Overlay & Guides */}
          {is1to1 ? (
            <>
              {/* Circular Cutout Backdrop Blur Overlay */}
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-none z-10"
                style={{
                  maskImage: "radial-gradient(circle 140px at center, transparent 140px, black 141px)",
                  WebkitMaskImage: "radial-gradient(circle 140px at center, transparent 140px, black 141px)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              />
              {/* Crop bounds outline */}
              <div className="absolute top-[20px] left-[20px] w-[280px] h-[280px] rounded-full border-2 border-indigo-600 pointer-events-none z-20" />
              <div className="absolute top-[20px] left-[20px] w-[280px] h-[280px] rounded-full border border-white/30 pointer-events-none z-20" />
              {/* Overlay guides */}
              <div className="absolute top-[160px] left-[20px] right-[20px] border-t border-dashed border-white/20 pointer-events-none z-20" />
              <div className="absolute left-[160px] top-[20px] bottom-[20px] border-l border-dashed border-white/20 pointer-events-none z-20" />
            </>
          ) : (
            <>
              {/* Top/Bottom Overlay panels for 16:9 crop blur */}
              <div 
                className="absolute top-0 left-0 right-0 h-[70px] bg-black/70 backdrop-blur-md pointer-events-none z-10 border-b border-white/10" 
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
              />
              <div 
                className="absolute bottom-0 left-0 right-0 h-[70px] bg-black/70 backdrop-blur-md pointer-events-none z-10 border-t border-white/10" 
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
              />
              {/* Crop bounds outline */}
              <div className="absolute top-[70px] left-0 right-0 h-[180px] border-2 border-indigo-600 pointer-events-none z-20" />
              <div className="absolute top-[70px] left-0 right-0 h-[180px] border border-white/30 pointer-events-none z-20" />
              {/* Overlay guides */}
              <div className="absolute top-[130px] left-0 right-0 border-t border-dashed border-white/20 pointer-events-none z-25" />
              <div className="absolute top-[190px] left-0 right-0 border-t border-dashed border-white/20 pointer-events-none z-25" />
              <div className="absolute left-1/3 top-[70px] bottom-[70px] border-l border-dashed border-white/20 pointer-events-none z-25" />
              <div className="absolute left-2/3 top-[70px] bottom-[70px] border-l border-dashed border-white/20 pointer-events-none z-25" />
            </>
          )}
        </div>

        {/* Zoom Slider */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs text-gray-500 font-bold">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            title="Zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
          />
        </div>

        {error && <p className="text-red-500 text-xs font-semibold mt-4">{error}</p>}

        {/* Action Controls */}
        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApplyCrop} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
};
