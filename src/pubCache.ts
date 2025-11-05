import { Dirent, constants } from 'node:fs';
import { access, readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { resolvePubCacheRoot } from './config.js';

export interface LocalPackageVersion {
  version: string;
  path: string;
  host: string;
}

export async function listLocalPackageVersions(packageName: string): Promise<LocalPackageVersion[]> {
  const root = await resolvePubCacheRoot();
  const hostedRoot = join(root, 'hosted');

  const hostDirs = await safeReaddir(hostedRoot);
  const result: LocalPackageVersion[] = [];

  for (const hostDir of hostDirs) {
    const entries = await safeReaddir(hostDir.path);

    for (const entry of entries) {
      if (!entry.dirent.isDirectory()) {
        continue;
      }

      const entryName = entry.dirent.name;
      if (entryName.startsWith(`${packageName}-`)) {
        const version = entryName.slice(packageName.length + 1);
        result.push({
          version,
          path: join(hostDir.path, entryName),
          host: hostDir.dirent.name,
        });
      }
    }
  }

  return result.sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
}

export async function readLocalPackageFile(
  packageName: string,
  version: string,
  filePath: string,
): Promise<Buffer> {
  const versionDir = await locateLocalPackageVersion(packageName, version);
  const absolutePath = resolve(versionDir.path, filePath);

  if (!absolutePath.startsWith(versionDir.path)) {
    throw new Error(`File path resolves outside of package directory: ${filePath}`);
  }

  await access(absolutePath, constants.R_OK);
  return await readFile(absolutePath);
}

export async function listLocalFiles(
  packageName: string,
  version: string,
): Promise<string[]> {
  const versionDir = await locateLocalPackageVersion(packageName, version);
  return await walkRelativeFiles(versionDir.path);
}

async function locateLocalPackageVersion(
  packageName: string,
  version: string,
): Promise<LocalPackageVersion> {
  const versions = await listLocalPackageVersions(packageName);
  const match = versions.find((entry) => entry.version === version);
  if (!match) {
    throw new Error(`Package ${packageName} version ${version} not found in local pub cache`);
  }

  return match;
}

interface DirectoryEntryInfo {
  dirent: Dirent;
  path: string;
}

async function safeReaddir(dir: string): Promise<DirectoryEntryInfo[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.map((dirent) => ({
      dirent,
      path: join(dir, dirent.name),
    }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function walkRelativeFiles(root: string, current = '.'): Promise<string[]> {
  const absCurrent = resolve(root, current);
  const entries = await safeReaddir(absCurrent);
  const result: string[] = [];

  for (const entry of entries) {
    const relativePath = relativePathFrom(root, entry.path);
    if (entry.dirent.isDirectory()) {
      const nested = await walkRelativeFiles(root, relativePath);
      result.push(...nested);
    } else if (entry.dirent.isFile()) {
      result.push(relativePath);
    }
  }

  return result;
}

function relativePathFrom(root: string, absolute: string): string {
  const rel = relative(root, absolute);
  if (rel.startsWith('..')) {
    throw new Error(`Resolved path ${absolute} escapes root ${root}`);
  }

  return rel.split(sep).join('/');
}
