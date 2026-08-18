import type { Bucket } from '@google-cloud/storage';
import type { Firestore } from 'firebase-admin/firestore';

export async function aplicarRetencion(db: Firestore, bucket: Bucket, vigente?: string): Promise<string[]> {
  const snapshot = await db.collection('modelos').get();
  const documentos = snapshot.docs.sort((a, b) => {
    const fechaA = a.get('publicado_en')?.toDate?.()?.getTime?.() ?? 0;
    const fechaB = b.get('publicado_en')?.toDate?.()?.getTime?.() ?? 0;
    return fechaB - fechaA;
  });
  const conservar = new Set(documentos.slice(0, 3).map((documento) => documento.id));
  if (vigente) conservar.add(vigente);
  const eliminados: string[] = [];
  for (const documento of documentos) {
    if (conservar.has(documento.id)) continue;
    await documento.ref.delete();
    await bucket.deleteFiles({ prefix: `modelos/${documento.id}/` });
    eliminados.push(documento.id);
  }
  return eliminados;
}

