import { describe, expect, it } from 'vitest';
import { guessMimeType } from '../mime.js';

describe('mime type detection', () => {
  it('returns known MIME type for markdown files', () => {
    expect(guessMimeType('README.md')).toBe('text/markdown');
  });

  it('falls back to default for unknown extensions', () => {
    expect(guessMimeType('archive.unknown', 'application/octet-stream')).toBe('application/octet-stream');
  });
});
