import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type {
  BlobResourceContents,
  ListResourcesResult,
  ReadResourceResult,
  TextResourceContents,
} from '@modelcontextprotocol/sdk/types.js';
import { analyseBuffer } from './buffer.js';
import { getPackageNameCompletions, getPackagePublisher, getPackageScore, getPackageSummary, getPackageVersion } from './pubDevApi.js';
import { extractFirstMatchingFile, fetchPackageArchive, listArchiveFiles } from './pubArchive.js';
import { guessMimeType } from './mime.js';
import { listLocalFiles, listLocalPackageVersions, readLocalPackageFile } from './pubCache.js';

const server = new McpServer({
  name: 'dart-pub-mcp',
  version: '0.1.0',
});

const packageMetadataTemplate = new ResourceTemplate('pub.dev://package/{package}', {
  list: async () => buildPackageListResources(),
});

server.registerResource(
  'pubdev-package',
  packageMetadataTemplate,
  {
    title: 'Pub.dev package metadata',
    description: 'Retrieves the complete metadata summary for a package from pub.dev.',
    mimeType: 'application/json',
  },
  async (uri, variables): Promise<ReadResourceResult> => {
    const packageName = requireVariable(variables, 'package');
    const summary = await getPackageSummary(packageName);
    return createJsonResource(uri.href, summary);
  },
);

const scoreTemplate = new ResourceTemplate('pub.dev://package/{package}/score', {
  list: undefined,
});

server.registerResource(
  'pubdev-score',
  scoreTemplate,
  {
    title: 'Pub.dev package score',
    description: 'Provides the current score metrics for the selected package.',
    mimeType: 'application/json',
  },
  async (uri, variables): Promise<ReadResourceResult> => {
    const packageName = requireVariable(variables, 'package');
    const score = await getPackageScore(packageName);
    return createJsonResource(uri.href, score);
  },
);

const publisherTemplate = new ResourceTemplate('pub.dev://package/{package}/publisher', {
  list: undefined,
});

server.registerResource(
  'pubdev-publisher',
  publisherTemplate,
  {
    title: 'Pub.dev package publisher',
    description: 'Returns the publisher information for a package if it is managed by a verified publisher.',
    mimeType: 'application/json',
  },
  async (uri, variables): Promise<ReadResourceResult> => {
    const packageName = requireVariable(variables, 'package');
    const publisher = await getPackagePublisher(packageName);
    return createJsonResource(uri.href, publisher);
  },
);

const versionTemplate = new ResourceTemplate('pub.dev://package/{package}/version/{version}', {
  list: undefined,
});

server.registerResource(
  'pubdev-version',
  versionTemplate,
  {
    title: 'Pub.dev package version',
    description: 'Returns metadata for a specific package version.',
    mimeType: 'application/json',
  },
  async (uri, variables): Promise<ReadResourceResult> => {
    const packageName = requireVariable(variables, 'package');
    const version = await resolveVersion(packageName, variables.version);
    const details = await getPackageVersion(packageName, version);
    return createJsonResource(uri.href, details);
  },
);

const remoteFileTemplate = new ResourceTemplate('pub.dev://package/{package}/version/{version}/file/{+filePath}', {
  list: undefined,
});

server.registerResource(
  'pubdev-file',
  remoteFileTemplate,
  {
    title: 'Pub.dev package file',
    description: 'Streams a file from the published package archive on pub.dev.',
  },
  async (uri, variables): Promise<ReadResourceResult> => {
    const packageName = requireVariable(variables, 'package');
    const version = await resolveVersion(packageName, variables.version);
    const filePath = normalizeRelativePath(requireVariable(variables, 'filePath'));

    const details = await getPackageVersion(packageName, version);
    const archiveStream = await fetchPackageArchive(details.archive_url);
    const archiveFile = await extractFirstMatchingFile(archiveStream, (entryPath) => {
      const relativeEntry = stripArchiveRoot(entryPath);
      return normalizeRelativePath(relativeEntry) === filePath;
    });

    if (!archiveFile) {
      throw new Error(`File "${filePath}" not found in package archive for ${packageName} ${version}`);
    }

    const analysis = analyseBuffer(archiveFile.content);
    return createBufferResource(uri.href, archiveFile.content, filePath, analysis.isText ? analysis.text : undefined);
  },
);

const remoteFileListTemplate = new ResourceTemplate('pub.dev://package/{package}/version/{version}/files', {
  list: undefined,
});

server.registerResource(
  'pubdev-file-list',
  remoteFileListTemplate,
  {
    title: 'Pub.dev package file listing',
    description: 'Lists files contained in the package archive on pub.dev.',
    mimeType: 'application/json',
  },
  async (uri, variables): Promise<ReadResourceResult> => {
    const packageName = requireVariable(variables, 'package');
    const version = await resolveVersion(packageName, variables.version);
    const details = await getPackageVersion(packageName, version);
    const archiveStream = await fetchPackageArchive(details.archive_url);
    const files = await listArchiveFiles(archiveStream);
    const relativeFiles = files.map(stripArchiveRoot).filter(Boolean).sort();
    return createJsonResource(uri.href, { files: relativeFiles });
  },
);

const localVersionsTemplate = new ResourceTemplate('pubcache://package/{package}/versions', {
  list: undefined,
});

server.registerResource(
  'pubcache-versions',
  localVersionsTemplate,
  {
    title: 'Local pub cache versions',
    description: 'Lists versions of a package available in the local pub cache.',
    mimeType: 'application/json',
  },
  async (uri, variables): Promise<ReadResourceResult> => {
    const packageName = requireVariable(variables, 'package');
    const versions = await listLocalPackageVersions(packageName);
    return createJsonResource(uri.href, { package: packageName, versions });
  },
);

const localFileListTemplate = new ResourceTemplate('pubcache://package/{package}/version/{version}/files', {
  list: undefined,
});

server.registerResource(
  'pubcache-file-list',
  localFileListTemplate,
  {
    title: 'Local pub cache file listing',
    description: 'Enumerates files stored in the local pub cache for a specific package version.',
    mimeType: 'application/json',
  },
  async (uri, variables): Promise<ReadResourceResult> => {
    const packageName = requireVariable(variables, 'package');
    const version = requireVariable(variables, 'version');
    const files = await listLocalFiles(packageName, version);
    return createJsonResource(uri.href, { package: packageName, version, files });
  },
);

const localFileTemplate = new ResourceTemplate('pubcache://package/{package}/version/{version}/file/{+filePath}', {
  list: undefined,
});

server.registerResource(
  'pubcache-file',
  localFileTemplate,
  {
    title: 'Local pub cache file',
    description: 'Reads a file from the local pub cache.',
  },
  async (uri, variables): Promise<ReadResourceResult> => {
    const packageName = requireVariable(variables, 'package');
    const version = requireVariable(variables, 'version');
    const filePath = normalizeRelativePath(requireVariable(variables, 'filePath'));
    const buffer = await readLocalPackageFile(packageName, version, filePath);
    const analysis = analyseBuffer(buffer);
    return createBufferResource(uri.href, buffer, filePath, analysis.isText ? analysis.text : undefined);
  },
);

function requireVariable(variables: Record<string, unknown>, key: string): string {
  const value = variables[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required path variable "${key}"`);
  }

  return value;
}

async function resolveVersion(packageName: string, versionValue: unknown): Promise<string> {
  if (typeof versionValue === 'string' && versionValue.trim().length > 0 && versionValue !== 'latest') {
    return versionValue;
  }

  const summary = await getPackageSummary(packageName);
  return summary.latest.version;
}

function normalizeRelativePath(input: string): string {
  const normalized = input.replace(/^[\\/]+/, '').replace(/\\/g, '/');
  if (normalized.includes('..')) {
    throw new Error(`Relative paths cannot contain parent directory segments: "${input}"`);
  }

  return normalized;
}

function stripArchiveRoot(entryPath: string): string {
  const normalized = entryPath.replace(/\\/g, '/');
  const slashIndex = normalized.indexOf('/');
  if (slashIndex === -1) {
    return '';
  }

  return normalized.slice(slashIndex + 1);
}

function createJsonResource(uri: string, payload: unknown): ReadResourceResult {
  const json = JSON.stringify(payload, null, 2);
  const content: TextResourceContents = {
    uri,
    mimeType: 'application/json',
    text: json,
  };
  return { contents: [content] };
}

function createBufferResource(uri: string, buffer: Buffer, filePath: string, text?: string): ReadResourceResult {
  const mimeType = guessMimeType(filePath, text ? 'text/plain' : 'application/octet-stream');

  if (typeof text === 'string') {
    const content: TextResourceContents = {
      uri,
      mimeType,
      text,
    };
    return { contents: [content] };
  }

  const content: BlobResourceContents = {
    uri,
    mimeType,
    blob: buffer.toString('base64'),
  };

  return { contents: [content] };
}

async function buildPackageListResources(): Promise<ListResourcesResult> {
  const completions = await getPackageNameCompletions();
  return {
    resources: completions.packages.map((packageName) => ({
      uri: `pub.dev://package/${encodeURIComponent(packageName)}`,
      name: packageName,
      description: `Metadata summary for ${packageName}`,
      mimeType: 'application/json',
    })),
  };
}

export async function start() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
