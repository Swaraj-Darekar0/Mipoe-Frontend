import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  // Configuration for "High Traffic" Optimization
  const options = {
    maxSizeMB: 1,          // Max file size ~1MB
    maxWidthOrHeight: 1280, // 720p Resolution (High Quality, Low Size)
    useWebWorker: true,    // Multi-threading (Doesn't freeze the UI)
    fileType: 'image/webp' // Modern format (30% smaller than JPEG)
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Compression cancelled or failed:", error);
    throw error; // If compression fails, we might want to stop the upload
  }
}