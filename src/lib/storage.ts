import 'server-only';
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';

export const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
export const maxImageSize = 5 * 1024 * 1024;
let client: S3Client | undefined;

export function r2() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new Error('R2 is not configured');
  return client ??= new S3Client({
    region: 'auto', endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

export function r2Bucket() {
  if (!process.env.R2_BUCKET_NAME) throw new Error('R2 is not configured');
  return process.env.R2_BUCKET_NAME;
}

export function validImageKey(key: string, folder: 'products' | 'slips' | 'banners') {
  return new RegExp(`^${folder}/[a-f0-9-]{36}\\.(jpg|png|webp)$`).test(key);
}

export async function imageObject(key: string) {
  const response = await r2().send(new GetObjectCommand({ Bucket: r2Bucket(), Key: key }));
  if (!response.Body || !response.ContentType || !imageTypes.includes(response.ContentType)) throw new Error('Invalid image');
  return { bytes: Buffer.from(await response.Body.transformToByteArray()), contentType: response.ContentType };
}

export async function verifiedImage(key: string, folder: 'products' | 'slips' | 'banners') {
  if (!validImageKey(key, folder)) throw new Error('Invalid image key');
  const metadata = await r2().send(new HeadObjectCommand({ Bucket: r2Bucket(), Key: key }));
  if (!metadata.ContentType || !imageTypes.includes(metadata.ContentType) || !metadata.ContentLength || metadata.ContentLength > maxImageSize) throw new Error('Invalid image');
  const { bytes, contentType } = await imageObject(key);
  if (bytes.length !== metadata.ContentLength || bytes.length > maxImageSize) throw new Error('Invalid image');
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!(contentType === 'image/jpeg' && isJpeg || contentType === 'image/png' && isPng || contentType === 'image/webp' && isWebp)) throw new Error('Image content does not match type');
  return { bytes, contentType };
}
