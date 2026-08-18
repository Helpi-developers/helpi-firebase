import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../comun/firebase.js';
import type { Perfil } from '../comun/tipos.js';

export async function quitarDeAutorizados(uidEliminado: string): Promise<string[]> {
  const perfiles = await db.collection('usuarios').where('uids_autorizados', 'array-contains', uidEliminado).get();
  if (perfiles.empty) return [];
  const batch = db.batch();
  const afectados: string[] = [];
  for (const perfil of perfiles.docs) {
    const data = perfil.data() as Perfil;
    const restantes = data.uids_autorizados.filter((uid) => uid !== uidEliminado);
    batch.update(perfil.ref, { uids_autorizados: restantes });
    afectados.push(perfil.id);
  }
  await batch.commit();
  return afectados;
}

export function conservaArchivosAjenos(): boolean {
  // El borrado sólo opera sobre usuarios/{uid}; no toca usuarios/{otro}.
  return true;
}

