import type { Firestore } from 'firebase-admin/firestore';
import type { Manifiesto } from '../../functions/src/comun/tipos-publicacion.js';

export async function validarVocabulario(db: Firestore, manifiesto: Manifiesto): Promise<void> {
  const snapshot = await db.doc(`vocabularios/${manifiesto.version_vocabulario}`).get();
  if (!snapshot.exists) throw new Error('El vocabulario referenciado no existe');
  const version = snapshot.get('version');
  if (version !== undefined && version !== manifiesto.version_vocabulario) {
    throw new Error('El vocabulario referenciado no corresponde');
  }
}

export async function validarNoPublicada(db: Firestore, version: string): Promise<void> {
  const snapshot = await db.doc(`modelos/${version}`).get();
  if (snapshot.exists) throw new Error('La versión ya fue publicada');
}

export async function validarPrevia(db: Firestore, manifiesto: Manifiesto): Promise<void> {
  await validarVocabulario(db, manifiesto);
  await validarNoPublicada(db, manifiesto.version);
}

