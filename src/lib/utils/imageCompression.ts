import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 2048,
    useWebWorker: true
  }
): Promise<File> {
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
  }
} 