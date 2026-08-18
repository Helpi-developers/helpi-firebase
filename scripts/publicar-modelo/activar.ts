import { Timestamp, type Firestore } from 'firebase-admin/firestore';

export async function activarVersion(db: Firestore, version: string): Promise<void> {
  const modelo = await db.doc(`modelos/${version}`).get();
  if (!modelo.exists) throw new Error('No se puede activar una versión inexistente');
  const vocabulario = await db.doc(`vocabularios/${modelo.get('version_vocabulario')}`).get();
  if (!vocabulario.exists) throw new Error('No se puede activar una versión sin vocabulario');
  await db.doc('config/modelo_activo').set({
    version,
    min_version_app: modelo.get('min_version_app'),
    actualizado_en: Timestamp.now(),
  });
}

