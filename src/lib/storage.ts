import 'server-only';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

function client() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('Object storage is not configured. Set the five S3 variables.');
  }
  return { bucket, s3: new S3Client({ endpoint, region: process.env.S3_REGION || 'auto', forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', credentials: { accessKeyId, secretAccessKey } }) };
}

const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function uploadImage(file: File, folder: 'products' | 'slips') {
  if (!types[file.type]) throw new Error('รองรับเฉพาะ JPG, PNG หรือ WebP');
  if (file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error('รูปภาพต้องมีขนาดไม่เกิน 5 MB');
  const bytes = Buffer.from(await file.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!(file.type === 'image/jpeg' && isJpeg || file.type === 'image/png' && isPng || file.type === 'image/webp' && isWebp)) {
    throw new Error('เนื้อหาไฟล์ไม่ตรงกับชนิดรูปภาพ');
  }
  const key = folder + '/' + randomUUID() + '.' + types[file.type];
  const { bucket, s3 } = client();
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: file.type }));
  return key;
}

export async function getImage(key: string) {
  const { bucket, s3 } = client();
  return s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}
