export interface MediaMetadata {
  duration?: number;
  width?: number;
  height?: number;
}

export async function getMediaMetadata(file: File): Promise<MediaMetadata> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
        cleanup();
      };
      video.onerror = () => {
        resolve({});
        cleanup();
      };
      video.src = url;
    } else if (file.type.startsWith('audio/')) {
      const audio = document.createElement('audio');
      audio.onloadedmetadata = () => {
        resolve({ duration: audio.duration });
        cleanup();
      };
      audio.onerror = () => {
        resolve({});
        cleanup();
      };
      audio.src = url;
    } else if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        cleanup();
      };
      img.onerror = () => {
        resolve({});
        cleanup();
      };
      img.src = url;
    } else {
      resolve({});
      cleanup();
    }
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}
