import React, { useRef, useState } from "react";
import { ImageCropperModal } from "./ImageCropperModal";
import { Button } from "./button";
import { Building2, Image as ImageIcon, Camera, Upload, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCropInputProps {
  value: string; // The image preview URL or existing database URL
  onChange: (file: File | null, previewUrl: string) => void;
  aspectRatio: "1:1" | "16:9" | "3:1";
  disabled?: boolean;
  maxSizeMB?: number; // default: 25
  label?: string;
  placeholder?: string;
}

export const ImageCropInput: React.FC<ImageCropInputProps> = ({
  value,
  onChange,
  aspectRatio,
  disabled = false,
  maxSizeMB = 5,
  label,
  placeholder,
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
    <div className="space-y-2">
      {label && <label className="block text-sm font-bold text-gray-700">{label}</label>}
      
      {is1to1 ? (
        // 1:1 Circle Layout
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div 
            className={cn(
              "relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden group transition duration-200",
              isDragActive && "border-indigo-500 bg-indigo-50/50",
              disabled && "opacity-75 cursor-not-allowed",
              !disabled && "cursor-pointer hover:border-indigo-400"
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
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-3 text-gray-400">
                <Building2 className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                <span className="text-xs font-semibold block">Upload Logo</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="font-semibold text-xs active:scale-95 transition"
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
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold text-xs active:scale-95 transition"
                >
                  Remove Logo
                </Button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              JPG, PNG, or WebP. Max {maxSizeMB}MB.
            </p>
          </div>
        </div>
      ) : (
        // 16:9 Rectangle Layout
        <div className="space-y-3">
          {value ? (
            <div className={cn(
              "relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 max-w-lg shadow-sm",
              aspectRatio === "3:1" ? "aspect-[3/1]" : "aspect-video"
            )}>
              <img src={value} alt="Campaign cover preview" className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="bg-white/90 hover:bg-white text-gray-800 font-semibold text-xs shadow-md backdrop-blur-sm active:scale-95 transition"
                >
                  Replace Cover
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="bg-red-600/90 hover:bg-red-600 text-white font-semibold text-xs shadow-md backdrop-blur-sm active:scale-95 transition animate-in fade-in"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "border-2 border-dashed border-gray-300 rounded-xl p-4 max-w-lg flex flex-col items-center justify-center text-center transition duration-200 bg-gray-50",
                aspectRatio === "3:1" ? "aspect-[3/1]" : "aspect-video",
                isDragActive && "border-indigo-500 bg-indigo-50/50",
                disabled && "opacity-75 cursor-not-allowed",
                !disabled && "cursor-pointer hover:border-indigo-400 hover:bg-gray-50/50"
              )}
              onClick={() => !disabled && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {placeholder || "Click to upload or drag campaign cover here"}
              </p>
              <p className="text-xs text-gray-400 mt-1.5">
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

      {/* Validation Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <ShieldAlert className="w-7 h-7" />
              <h4 className="text-lg font-bold text-gray-900">Upload Validation Error</h4>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {validationError}
            </p>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Close & Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

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
          onCropComplete={(croppedFile, previewUrl) => {
            onChange(croppedFile, previewUrl);
          }}
        />
      )}
    </div>
  );
};
