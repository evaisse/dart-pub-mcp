import { extname } from 'node:path';

const EXTENSION_MIME_MAP: Record<string, string> = {
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.txt': 'text/plain',
  '.dart': 'text/x-dart',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ts': 'application/typescript',
  '.tsx': 'application/typescript',
  '.c': 'text/x-c',
  '.cc': 'text/x-c++',
  '.cpp': 'text/x-c++',
  '.h': 'text/x-c',
  '.hpp': 'text/x-c++',
  '.java': 'text/x-java-source',
  '.kt': 'text/x-kotlin',
  '.swift': 'text/x-swift',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
};

export function guessMimeType(filename: string, defaultMime = 'text/plain'): string {
  const extension = extname(filename).toLowerCase();
  return EXTENSION_MIME_MAP[extension] ?? defaultMime;
}
