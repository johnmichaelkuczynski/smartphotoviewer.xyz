export interface MediaFile {
  file: File;
  handle: FileSystemFileHandle;
  name: string;
  path: string;
  type: 'image' | 'video';
  lastModified: number;
  thumbnailUrl?: string;
  embedding?: number[];
}

export interface EmbeddingCache {
  path: string;
  lastModified: number;
  embedding: number[];
  thumbnailUrl: string;
}

export interface Cluster {
  id: number;
  label: string;
  files: MediaFile[];
  representative: MediaFile;
}

export interface ViewMode {
  type: 'grid' | 'filmstrip' | 'viewer' | 'slideshow';
  gridColumns?: number;
  gridRows?: number;
  filmstripSize?: 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge' | '3xlarge';
}

export interface AppSettings {
  aiEnabled: boolean;
  slideshowInterval: number;
  slideshowSkipVideos: boolean;
  theme: 'light' | 'dark';
}

export interface IndexingProgress {
  total: number;
  processed: number;
  isIndexing: boolean;
}
