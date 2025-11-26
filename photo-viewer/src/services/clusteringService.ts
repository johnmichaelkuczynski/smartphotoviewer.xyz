import { kmeans } from 'ml-kmeans';
import type { MediaFile, Cluster } from '../types';
import { cosineSimilarity } from './embeddingService';

const CLUSTER_LABELS = [
  'Portraits & People',
  'Nature & Landscapes',
  'Indoor Scenes',
  'Documents & Screenshots',
  'Food & Dining',
  'Architecture & Buildings',
  'Animals & Pets',
  'Abstract & Artistic',
  'Sports & Activities',
  'Miscellaneous',
];

export function clusterByTheme(
  files: MediaFile[],
  embeddings: Map<string, number[]>
): Cluster[] {
  const filesWithEmbeddings = files.filter(f => embeddings.has(f.path));
  
  if (filesWithEmbeddings.length < 3) {
    return [{
      id: 0,
      label: 'All Items',
      files: filesWithEmbeddings,
      representative: filesWithEmbeddings[0],
    }];
  }
  
  const numClusters = Math.min(
    Math.max(3, Math.floor(filesWithEmbeddings.length / 10)),
    10
  );
  
  const embeddingMatrix = filesWithEmbeddings.map(f => embeddings.get(f.path)!);
  
  const result = kmeans(embeddingMatrix, numClusters, {
    initialization: 'kmeans++',
    maxIterations: 100,
  });
  
  const clusters: Cluster[] = [];
  
  for (let i = 0; i < numClusters; i++) {
    const clusterFiles = filesWithEmbeddings.filter((_, idx) => result.clusters[idx] === i);
    
    if (clusterFiles.length === 0) continue;
    
    const centroid = result.centroids[i];
    let representative = clusterFiles[0];
    let minDistance = Infinity;
    
    for (const file of clusterFiles) {
      const embedding = embeddings.get(file.path)!;
      const distance = euclideanDistance(embedding, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        representative = file;
      }
    }
    
    clusters.push({
      id: i,
      label: CLUSTER_LABELS[i % CLUSTER_LABELS.length],
      files: clusterFiles,
      representative,
    });
  }
  
  return clusters.sort((a, b) => b.files.length - a.files.length);
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function sortBySimilarity(
  targetFile: MediaFile,
  allFiles: MediaFile[],
  embeddings: Map<string, number[]>
): MediaFile[] {
  const targetEmbedding = embeddings.get(targetFile.path);
  if (!targetEmbedding) return allFiles;
  
  const filesWithSimilarity = allFiles
    .filter(f => embeddings.has(f.path) && f.path !== targetFile.path)
    .map(file => {
      const embedding = embeddings.get(file.path)!;
      const similarity = cosineSimilarity(targetEmbedding, embedding);
      return { file, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity);
  
  return [targetFile, ...filesWithSimilarity.map(item => item.file)];
}
