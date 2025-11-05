import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listLocalFiles, listLocalPackageVersions, readLocalPackageFile } from '../pubCache.js';

const PACKAGE_NAME = 'example';
const VERSION = '1.0.0';

describe('pub cache helpers', () => {
  let tempCache: string;
  let versionDir: string;

  beforeEach(async () => {
    tempCache = await mkdtemp(join(tmpdir(), 'pub-cache-test-'));
    process.env.PUB_CACHE = tempCache;

    const hostedDir = join(tempCache, 'hosted', 'pub.dev');
    versionDir = join(hostedDir, `${PACKAGE_NAME}-${VERSION}`);

    await mkdir(join(versionDir, 'lib'), { recursive: true });
    await writeFile(join(versionDir, 'README.md'), '# Example package\n');
    await writeFile(join(versionDir, 'lib', 'example.dart'), 'class Example {}');
  });

  afterEach(async () => {
    delete process.env.PUB_CACHE;
    await rm(tempCache, { recursive: true, force: true });
  });

  it('lists available local package versions', async () => {
    const versions = await listLocalPackageVersions(PACKAGE_NAME);
    expect(versions).toEqual([
      {
        version: VERSION,
        path: versionDir,
        host: 'pub.dev',
      },
    ]);
  });

  it('lists files stored in the local cache', async () => {
    const files = await listLocalFiles(PACKAGE_NAME, VERSION);
    expect(new Set(files)).toEqual(new Set(['README.md', 'lib/example.dart']));
  });

  it('reads files from the local cache', async () => {
    const buffer = await readLocalPackageFile(PACKAGE_NAME, VERSION, 'lib/example.dart');
    expect(buffer.toString('utf8')).toContain('class Example');
  });

  it('throws when accessing a missing version', async () => {
    await expect(readLocalPackageFile(PACKAGE_NAME, '9.9.9', 'README.md')).rejects.toThrow(/not found/);
  });
});
