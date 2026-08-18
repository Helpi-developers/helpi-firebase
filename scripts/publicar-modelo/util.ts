import type { Bucket } from '@google-cloud/storage';

export async function upload(bucket: Bucket, local: string, destino: string): Promise<void> {
  await bucket.upload(local, { destination: destino, resumable: false });
}

