import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { Manifiesto } from '../../functions/src/comun/tipos-publicacion.js';
import type { RutasSubidas } from './subir.js';

export async function publicarVersion(
  db: Firestore,
  manifiesto: Manifiesto,
  rutas: RutasSubidas,
): Promise<void> {
  await db.doc(`modelos/${manifiesto.version}`).create({
    version_vocabulario: manifiesto.version_vocabulario,
    publicado_en: Timestamp.fromDate(new Date(manifiesto.publicado_en)),
    min_version_app: '1.0.0',
    storage_path: rutas.modelo,
    hash: manifiesto.artefactos.modelo.hash,
  });
}

