import type { MediaFile } from '../types';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v', 'flv', 'wmv'];

export async function selectFolder(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await window.showDirectoryPicker({
      mode: 'read',
    });
    return handle;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Error selecting folder:', err);
    }
    return null;
  }
}

export async function selectFile(): Promise<FileSystemFileHandle | null> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Images and Videos',
          accept: {
            'image/*': IMAGE_EXTENSIONS.map(ext => `.${ext}`),
            'video/*': VIDEO_EXTENSIONS.map(ext => `.${ext}`),
          },
        },
      ],
      multiple: false,
    });
    return handle;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Error selecting file:', err);
    }
    return null;
  }
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : '';
}

function isMediaFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext);
}

function getMediaType(filename: string): 'image' | 'video' | null {
  const ext = getFileExtension(filename);
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

export async function loadMediaFilesFromDirectory(
  dirHandle: FileSystemDirectoryHandle
): Promise<MediaFile[]> {
  const files: MediaFile[] = [];
  
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && isMediaFile(entry.name)) {
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      const type = getMediaType(entry.name);
      
      if (type) {
        files.push({
          file,
          handle: fileHandle,
          name: entry.name,
          path: `${dirHandle.name}/${entry.name}`,
          type,
          lastModified: file.lastModified,
        });
      }
    }
  }
  
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadMediaFileFromHandle(
  handle: FileSystemFileHandle
): Promise<MediaFile | null> {
  const file = await handle.getFile();
  const type = getMediaType(handle.name);
  
  if (!type) return null;
  
  return {
    file,
    handle,
    name: handle.name,
    path: handle.name,
    type,
    lastModified: file.lastModified,
  };
}

export function createObjectURL(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}

export async function extractVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(video.duration / 2, 5);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
        video.src = '';
      }, 'image/jpeg', 0.8);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}
