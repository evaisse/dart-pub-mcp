export interface BufferAnalysis {
  isText: boolean;
  text?: string;
}

export function analyseBuffer(buffer: Buffer): BufferAnalysis {
  if (buffer.length === 0) {
    return { isText: true, text: '' };
  }

  let printable = 0;
  let nullByte = false;

  for (const byte of buffer) {
    if (byte === 0) {
      nullByte = true;
      break;
    }

    if (
      byte === 9 || // tab
      byte === 10 || // lf
      byte === 13 || // cr
      (byte >= 32 && byte <= 126)
    ) {
      printable += 1;
    }
  }

  if (!nullByte && printable / buffer.length > 0.8) {
    return { isText: true, text: buffer.toString('utf8') };
  }

  return { isText: false };
}
