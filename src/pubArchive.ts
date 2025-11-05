import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import tar from 'tar-stream';

export interface ArchiveFile {
  path: string;
  content: Buffer;
}

export async function fetchPackageArchive(archiveUrl: string): Promise<Readable> {
  const response = await fetch(archiveUrl);
  if (!response.ok || !response.body) {
    const text = await safeReadBody(response);
    throw new Error(`Failed to download archive (${response.status}): ${text ?? response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return Readable.from(buffer);
}

export async function extractFirstMatchingFile(
  archiveStream: Readable,
  matcher: (entryPath: string) => boolean,
): Promise<ArchiveFile | undefined> {
  const extract = tar.extract();

  return new Promise<ArchiveFile | undefined>((resolve, reject) => {
    let settled = false;

    extract.on('entry', (header, stream, next) => {
      const entryPath = header.name;

      if (matcher(entryPath)) {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => {
          chunks.push(chunk as Buffer);
        });
        stream.on('end', () => {
          if (!settled) {
            settled = true;
            resolve({ path: entryPath, content: Buffer.concat(chunks) });
          }
          next();
        });
        stream.on('error', (error) => {
          if (!settled) {
            settled = true;
            reject(error);
          }
        });
      } else {
        stream.resume();
        stream.on('end', next);
      }
    });

    extract.on('finish', () => {
      if (!settled) {
        settled = true;
        resolve(undefined);
      }
    });

    extract.on('error', (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    pipeline(archiveStream, createGunzip(), extract).catch((error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
}

export async function listArchiveFiles(archiveStream: Readable): Promise<string[]> {
  const extract = tar.extract();
  const result = new Set<string>();

  return new Promise<string[]>((resolve, reject) => {
    extract.on('entry', (header, stream, next) => {
      result.add(header.name);
      stream.resume();
      stream.on('end', next);
    });

    extract.on('finish', () => {
      resolve(Array.from(result));
    });

    extract.on('error', (error) => {
      reject(error);
    });

    pipeline(archiveStream, createGunzip(), extract).catch(reject);
  });
}

async function safeReadBody(response: Response): Promise<string | undefined> {
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}
