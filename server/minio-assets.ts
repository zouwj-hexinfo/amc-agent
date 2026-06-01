type MinioImageAsset = {
  bucket: string;
  key: string;
  rptId: string;
  imageId: string;
  contentType: string;
};

type MinioReportAsset = {
  bucket: string;
  key: string;
  rptId: string;
  reportId: string;
  contentType: string;
};

const imageExtensions: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

export function parseMinioImageS3Uri(uri: string): MinioImageAsset | null {
  const match = uri.trim().match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) return null;
  const bucket = match[1];
  const key = match[2];
  const expectedBucket = process.env.MINIO_BUCKET || 'xfas';
  if (bucket !== expectedBucket) return null;
  const keyMatch = key.match(/^(?:xfas\/)?images\/([^/]+)\/([^/]+)$/);
  if (!keyMatch) return null;
  const rptId = keyMatch[1];
  const imageId = keyMatch[2];
  if (!isSafeAssetSegment(rptId) || !isSafeAssetSegment(imageId)) return null;
  const extension = imageId.match(/\.([A-Za-z0-9]+)$/)?.[1]?.toLowerCase();
  const contentType = extension ? imageExtensions[extension] : undefined;
  return contentType ? { bucket, key, rptId, imageId, contentType } : null;
}

export function parseMinioReportS3Uri(uri: string): MinioReportAsset | null {
  const match = uri.trim().match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) return null;
  const bucket = match[1];
  const key = match[2];
  const expectedBucket = process.env.MINIO_BUCKET || 'xfas';
  if (bucket !== expectedBucket) return null;
  const keyMatch = key.match(/^(?:xfas\/)?reports\/([^/]+)\/([^/]+\.md)$/);
  if (!keyMatch) return null;
  const rptId = keyMatch[1];
  const reportId = keyMatch[2];
  if (!isSafeAssetSegment(rptId) || !isSafeAssetSegment(reportId)) return null;
  return { bucket, key, rptId, reportId, contentType: 'text/markdown;charset=utf-8' };
}

export function parseMinioImagePath(rptId: string, imageId: string) {
  return parseMinioImageS3Uri(`s3://${process.env.MINIO_BUCKET || 'xfas'}/images/${rptId}/${imageId}`);
}

export function parseMinioReportPath(rptId: string, reportId: string) {
  return parseMinioReportS3Uri(`s3://${process.env.MINIO_BUCKET || 'xfas'}/reports/${rptId}/${reportId}`);
}

export function buildMinioImageAssetPath(uri: string) {
  const asset = parseMinioImageS3Uri(uri);
  if (!asset) return null;
  return `/api/assets/minio/images/${encodeURIComponent(asset.rptId)}/${encodeURIComponent(asset.imageId)}`;
}

export async function createMinioImageAssetResponse(asset: MinioImageAsset, fetcher: typeof fetch = fetch) {
  return createMinioAssetResponse(asset, '图片资源', fetcher);
}

export async function createMinioReportAssetResponse(asset: MinioReportAsset, fetcher: typeof fetch = fetch) {
  return createMinioAssetResponse(asset, '报告资源', fetcher);
}

export async function readMinioReportMarkdown(uri: string, fetcher: typeof fetch = fetch) {
  const asset = parseMinioReportS3Uri(uri);
  if (!asset) return null;
  const response = await createMinioReportAssetResponse(asset, fetcher);
  if (!response.ok) return null;
  return await response.text();
}

async function createMinioAssetResponse(asset: MinioImageAsset | MinioReportAsset, label: string, fetcher: typeof fetch = fetch) {
  const config = readMinioConfig();
  if (!config) return Response.json({ message: `${label}服务暂不可用。` }, { status: 503 });

  const endpoint = new URL(config.endpoint);
  const pathname = `/${encodePathSegment(asset.bucket)}/${asset.key.split('/').map(encodePathSegment).join('/')}`;
  const url = new URL(pathname, `${endpoint.protocol}//${endpoint.host}`);
  const headers = await buildS3GetHeaders({
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: config.region,
    host: url.host,
    pathname: url.pathname,
  });

  const response = await fetcher(url, { method: 'GET', headers });
  if (!response.ok || !response.body) {
    await response.body?.cancel().catch(() => {});
    return Response.json({ message: response.status === 404 ? `${label}不存在。` : `${label}读取失败。` }, {
      status: response.status === 404 ? 404 : 502,
    });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || asset.contentType,
      'Cache-Control': 'private, max-age=300',
    },
  });
}

function readMinioConfig() {
  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  if (!endpoint || !accessKey || !secretKey) return null;
  return { endpoint, accessKey, secretKey, region: process.env.MINIO_REGION || 'us-east-1' };
}

async function buildS3GetHeaders(input: {
  accessKey: string;
  secretKey: string;
  region: string;
  host: string;
  pathname: string;
}) {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const canonicalHeaders = [
    `host:${input.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    '',
  ].join('\n');
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = ['GET', input.pathname, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${input.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = await getSignatureKey(input.secretKey, dateStamp, input.region);
  const signature = await hmacHex(signingKey, stringToSign);

  return {
    Host: input.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    Authorization: [
      `AWS4-HMAC-SHA256 Credential=${input.accessKey}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', '),
  };
}

function isSafeAssetSegment(value: string) {
  return /^[A-Za-z0-9._=-]+$/.test(value) && !value.includes('..');
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value).replace(/%2F/gi, '/');
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

async function hmacBytes(key: BufferSource | string, value: string) {
  const rawKey = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey('raw', rawKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(value));
  return new Uint8Array(signature);
}

async function hmacHex(key: BufferSource | string, value: string) {
  return bytesToHex(await hmacBytes(key, value));
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string) {
  const dateKey = await hmacBytes(`AWS4${secretKey}`, dateStamp);
  const dateRegionKey = await hmacBytes(dateKey, region);
  const dateRegionServiceKey = await hmacBytes(dateRegionKey, 's3');
  return await hmacBytes(dateRegionServiceKey, 'aws4_request');
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
