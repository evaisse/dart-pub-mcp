import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getPubCacheCandidates, resolvePubCacheRoot } from '../config.js';

describe('config utilities', () => {
  let originalPubCache: string | undefined;
  let tempCache: string | undefined;

  beforeEach(() => {
    originalPubCache = process.env.PUB_CACHE;
  });

  afterEach(async () => {
    if (originalPubCache === undefined) {
      delete process.env.PUB_CACHE;
    } else {
      process.env.PUB_CACHE = originalPubCache;
    }

    if (tempCache) {
      await rm(tempCache, { recursive: true, force: true });
      tempCache = undefined;
    }
  });

  it('includes PUB_CACHE override in candidates', () => {
    process.env.PUB_CACHE = '  /tmp/custom-cache  ';
    const candidates = getPubCacheCandidates();
    expect(candidates[0]).toBe('/tmp/custom-cache');
    expect(candidates).toContain(join(homedir(), '.pub-cache'));
  });

  it('resolves to PUB_CACHE when accessible', async () => {
    tempCache = await mkdtemp(join(tmpdir(), 'pub-cache-config-'));
    process.env.PUB_CACHE = tempCache;

    const resolved = await resolvePubCacheRoot();
    expect(resolved).toBe(tempCache);
  });

  it('falls back to the default pub cache location', async () => {
    delete process.env.PUB_CACHE;
    const resolved = await resolvePubCacheRoot();
    expect(resolved).toBe(join(homedir(), '.pub-cache'));
  });
});
