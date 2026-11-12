import React, { useRef, useState } from "react";
import { ImageCropperModal, type ImageCropperAccent } from "./ImageCropperModal";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Building2, Camera, Upload, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImageCropInputAccent = ImageCropperAccent;

export interface ImageCropInputProps {
  value: string; // The image preview URL or existing database URL
  onChange: (file: File | null, previewUrl: string) => void;
  aspectRatio: "1:1" | "16:9" | "3:1";
  disabled?: boolean;
  maxSizeMB?: number; // default: 5
  label?: string;
  placeholder?: string;
  accent?: ImageCropInputAccent;
}

const ACCENT_STYLES: Record<
  ImageCropInputAccent,
  {
    dragActive: string;
    hoverBorder: string;
    iconCircle: string;
    buttonClass: string;
  }
> = {
  brand: {
    dragActive: "border-brand-blue bg-brand-blue/[0.06]",
    hoverBorder: "hover:border-brand-blue/60",
    iconCircle: "bg-brand-blue/10 text-brand-blue",
    buttonClass: "bg-brand-blue hover:bg-brand-blue/90 text-white",
  },
  creator: {
    dragActive: "border-lava bg-lava/[0.06]",
    hoverBorder: "hover:border-lava/60",
    iconCircle: "bg-lava/10 text-lava",
    buttonClass: "bg-lava hover:bg-lava/90 text-white",
  },
  neutral: {
    dragActive: "border-ink bg-black/[0.05]",
    hoverBorder: "hover:border-black/35",
    iconCircle: "bg-black/[0.04] text-ink border border-black/10",
    buttonClass: "bg-ink hover:bg-charcoal text-white",
  },
};

export const ImageCropInput: React.FC<ImageCropInputProps> = ({
  value,
  onChange,
  aspectRatio,
  disabled = false,
  maxSizeMB = 5,
  label,
  placeholder,
  accent = "neutral",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState("");
  const [croppingFileName, setCroppingFileName] = useState("");

  // Drag and drop state
  const [isDragActive, setIsDragActive] = useState(false);

  // Validation modal state
  const [validationError, setValidationError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const is1to1 = aspectRatio === "1:1";
  const accentStyle = ACCENT_STYLES[accent] ?? ACCENT_STYLES.neutral;

  const handleFile = (file: File) => {
    // 1. File size check
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError(`File size exceeds ${maxSizeMB}MB. Please choose a smaller file.`);
      setShowErrorModal(true);
      return;
    }

    // 2. Format validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setValidationError("Invalid format. Only JPG, PNG, and WebP images are allowed.");
      setShowErrorModal(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropperImageSrc(event.target?.result as string);
      setCroppingFileName(file.name);
      setShowCropper(true);
    };
    reader.onerror = () => {
      setValidationError("Failed to read image file.");
      setShowErrorModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onChange(null, "");
  };

  return (
    <div className="space-y-2 min-w-0">
      {label && <label className="block text-sm font-semibold text-ink">{label}</label>}

      {is1to1 ? (
        // 1:1 Circle Layout
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div
            className={cn(
              "relative w-32 h-32 rounded-full border-2 border-dashed border-black/15 flex items-center justify-center bg-black/[0.03] overflow-hidden group transition-colors duration-150 shrink-0",
              isDragActive && accentStyle.dragActive,
              disabled && "opacity-60 cursor-not-allowed",
              !disabled && cn("cursor-pointer", accentStyle.hoverBorder)
            )}
            onClick={() => !disabled && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {value ? (
              <>
                <img src={value} alt="Logo preview" className="w-full h-full object-cover" />
                {!disabled && (
                  <div className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-150">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Change</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-3 text-slate">
                <Building2 className="w-8 h-8 mx-auto mb-1 text-steel" />
                <span className="text-xs font-semibold block">Upload Logo</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="font-semibold text-xs"
              >
                {value ? "Replace Logo" : "Select Logo"}
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold text-xs"
                >
                  Remove Logo
                </Button>
              )}
            </div>
            <p className="font-mono text-[11px] text-steel leading-normal">
              JPG, PNG, or WebP. Max {maxSizeMB}MB.
            </p>
          </div>
        </div>
      ) : (
        // 16:9 / 3:1 Rectangle Layout
        <div className="space-y-3">
          {value ? (
            <div
              className={cn(
                "relative rounded-xl border border-black/10 overflow-hidden bg-black/[0.03] max-w-lg",
                aspectRatio === "3:1" ? "aspect-[3/1]" : "aspect-video"
              )}
            >
              <img src={value} alt="Campaign cover preview" className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="bg-white/95 hover:bg-white text-ink border border-black/10 font-semibold text-xs shadow-sm"
                >
                  Replace Cover
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled}
                  aria-label="Remove image"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "border-2 border-dashed border-black/15 rounded-xl p-4 max-w-lg flex flex-col items-center justify-center text-center transition-colors duration-150 bg-black/[0.03]",
                aspectRatio === "3:1" ? "aspect-[3/1]" : "aspect-video",
                isDragActive && accentStyle.dragActive,
                disabled && "opacity-60 cursor-not-allowed",
                !disabled && cn("cursor-pointer hover:bg-black/[0.05]", accentStyle.hoverBorder)
              )}
              onClick={() => !disabled && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div
                className={cn(
                  "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3",
                  accentStyle.iconCircle
                )}
              >
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-ink">
                {placeholder || "Click to upload or drag campaign cover here"}
              </p>
              <p className="font-mono text-[11px] text-steel mt-1.5">
                Supports JPG, PNG, or WebP (Max size {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Validation Error Modal (Accessible Shadcn Dialog) */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-black/10 bg-white p-5 sm:p-6 text-ink shadow-[0_16px_48px_-12px_rgba(0,0,0,0.16)] data-[state=open]:animate-none data-[state=closed]:animate-none">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <DialogTitle className="font-display text-lg font-bold tracking-tight text-ink">
                Upload Validation Error
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate leading-relaxed pt-2">
              {validationError}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              onClick={() => setShowErrorModal(false)}
              className={cn("font-semibold", accentStyle.buttonClass)}
            >
              Close & Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modular Cropper Modal */}
      {showCropper && (
        <ImageCropperModal
          isOpen={showCropper}
          onClose={() => {
            setShowCropper(false);
            setCropperImageSrc("");
          }}
          imageSrc={cropperImageSrc}
          fileName={croppingFileName}
          aspectRatio={aspectRatio}
          accent={accent}
          onCropComplete={(croppedFile, previewUrl) => {
            onChange(croppedFile, previewUrl);
          }}
        />
      )}
    </div>
  );
};
