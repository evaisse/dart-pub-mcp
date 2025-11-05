import { env } from 'node:process';
import { join } from 'node:path';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';

export function getPubCacheCandidates(): string[] {
  const candidates: string[] = [];
  const envOverride = env.PUB_CACHE;
  if (envOverride) {
    const normalized = envOverride.trim();
    if (normalized.length > 0) {
      candidates.push(normalized);
    }
  }

  candidates.push(join(homedir(), '.pub-cache'));
  return Array.from(new Set(candidates));
}

export async function resolvePubCacheRoot(): Promise<string> {
  const candidates = getPubCacheCandidates();
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.R_OK);
      return candidate;
    } catch {
      // Continue searching other candidates.
    }
  }

  // Fall back to first candidate even if it does not exist yet.
  const fallback = candidates[0];
  if (!fallback) {
    throw new Error('Unable to resolve a pub cache location.');
  }

  return fallback;
}
