interface Window {
  showDirectoryPicker(options?: {
    mode?: 'read' | 'readwrite';
  }): Promise<FileSystemDirectoryHandle>;

  showOpenFilePicker(options?: {
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
    multiple?: boolean;
  }): Promise<FileSystemFileHandle[]>;
}

interface FileSystemDirectoryHandle {
  readonly kind: 'directory';
  readonly name: string;
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemFileHandle {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<File>;
}

type FileSystemHandle = FileSystemDirectoryHandle | FileSystemFileHandle;
