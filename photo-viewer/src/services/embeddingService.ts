import { pipeline, env } from '@xenova/transformers';
import type { MediaFile, EmbeddingCache } from '../types';
import { extractVideoThumbnail } from './fileSystemService';
import { saveEmbedding, getEmbedding } from './indexedDBService';

env.allowLocalModels = false;
env.allowRemoteModels = true;

let clipModel: any = null;
let isModelLoading = false;
let modelLoadPromise: Promise<any> | null = null;

export async function initializeModel(): Promise<void> {
  if (clipModel) return;
  
  if (isModelLoading && modelLoadPromise) {
    await modelLoadPromise;
    return;
  }
  
  isModelLoading = true;
  modelLoadPromise = pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
  
  try {
    clipModel = await modelLoadPromise;
    console.log('CLIP model loaded successfully');
  } catch (error) {
    console.error('Failed to load CLIP model:', error);
    throw error;
  } finally {
    isModelLoading = false;
  }
}

async function getImageDataURL(file: File, mediaType: 'image' | 'video'): Promise<string> {
  if (mediaType === 'image') {
    return URL.createObjectURL(file);
  } else {
    return await extractVideoThumbnail(file);
  }
}

export async function generateEmbedding(mediaFile: MediaFile): Promise<number[]> {
  const cached = await getEmbedding(mediaFile.path);
  
  if (cached && cached.lastModified === mediaFile.lastModified) {
    return cached.embedding;
  }
  
  if (!clipModel) {
    await initializeModel();
  }
  
  try {
    const imageUrl = await getImageDataURL(mediaFile.file, mediaFile.type);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const size = 224;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    
    const output = await clipModel(imageUrl, {
      pooling: 'mean',
      normalize: true,
    });
    
    const embedding = Array.from(output.data as Float32Array);
    
    const cache: EmbeddingCache = {
      path: mediaFile.path,
      lastModified: mediaFile.lastModified,
      embedding,
      thumbnailUrl: imageUrl,
    };
    
    await saveEmbedding(cache);
    
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    
    return embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw error;
  }
}

export async function batchGenerateEmbeddings(
  files: MediaFile[],
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>();
  
  for (let i = 0; i < files.length; i++) {
    try {
      const embedding = await generateEmbedding(files[i]);
      embeddings.set(files[i].path, embedding);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Failed to generate embedding for ${files[i].name}:`, error);
    }
  }
  
  return embeddings;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}
