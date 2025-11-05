import { URL } from 'node:url';

const PUB_DEV_BASE = 'https://pub.dev/api';

export interface PackageSummary {
  name: string;
  latest: PackageVersion;
  versions: PackageVersion[];
}

export interface PackageVersion {
  version: string;
  pubspec: Record<string, unknown>;
  archive_url: string;
  archive_sha256: string;
  published?: string;
}

export interface PackageVersionDetail extends PackageVersion {
  published: string;
}

export interface ScoreResponse {
  grantedPoints: number | null;
  maxPoints: number | null;
  likeCount: number | null;
  downloadCount30Days: number | null;
  tags: string[];
}

export interface PublisherResponse {
  publisherId: string | null;
}

export interface PackageNameCompletionResponse {
  packages: string[];
}

export interface PackageNamesResponse {
  packages: string[];
  nextUrl: string | null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await safeReadText(response);
    throw new Error(`pub.dev request failed (${response.status}): ${body || response.statusText}`);
  }

  return (await response.json()) as T;
}

async function safeReadText(response: Response): Promise<string | undefined> {
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}

export async function getPackageSummary(packageName: string): Promise<PackageSummary> {
  const url = new URL(`/packages/${encodeURIComponent(packageName)}`, PUB_DEV_BASE);
  return await fetchJson<PackageSummary>(url.toString());
}

export async function getPackageVersion(
  packageName: string,
  version: string,
): Promise<PackageVersionDetail> {
  const url = new URL(`/packages/${encodeURIComponent(packageName)}/versions/${encodeURIComponent(version)}`, PUB_DEV_BASE);
  return await fetchJson<PackageVersionDetail>(url.toString());
}

export async function getPackageScore(packageName: string): Promise<ScoreResponse> {
  const url = new URL(`/packages/${encodeURIComponent(packageName)}/score`, PUB_DEV_BASE);
  return await fetchJson<ScoreResponse>(url.toString());
}

export async function getPackagePublisher(packageName: string): Promise<PublisherResponse> {
  const url = new URL(`/packages/${encodeURIComponent(packageName)}/publisher`, PUB_DEV_BASE);
  return await fetchJson<PublisherResponse>(url.toString());
}

export async function getPackageNameCompletions(): Promise<PackageNameCompletionResponse> {
  const url = new URL('/package-name-completion-data', PUB_DEV_BASE);
  return await fetchJson<PackageNameCompletionResponse>(url.toString());
}

export async function getAllPackageNames(): Promise<PackageNamesResponse> {
  const url = new URL('/package-names', PUB_DEV_BASE);
  return await fetchJson<PackageNamesResponse>(url.toString());
}
