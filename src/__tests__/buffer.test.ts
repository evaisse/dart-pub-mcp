import { describe, expect, it } from 'vitest';
import { analyseBuffer } from '../buffer.js';

describe('buffer analysis', () => {
  it('detects UTF-8 text buffers', () => {
    const buffer = Buffer.from('Hello, Dart!', 'utf8');
    const result = analyseBuffer(buffer);
    expect(result.isText).toBe(true);
    expect(result.text).toBe('Hello, Dart!');
  });

  it('treats binary data as non-text', () => {
    const bytes = Buffer.from([0, 255, 128, 64, 32]);
    const result = analyseBuffer(bytes);
    expect(result.isText).toBe(false);
    expect(result.text).toBeUndefined();
  });
});
