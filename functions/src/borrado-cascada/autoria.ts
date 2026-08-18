import { db } from '../comun/firebase.js';

export async function despersonalizarAutoria(uidEliminado: string): Promise<number> {
  const rutinas = await db.collectionGroup('rutinas').where('actualizada_por', '==', uidEliminado).get();
  if (rutinas.empty) return 0;
  const batch = db.batch();
  for (const rutina of rutinas.docs) batch.update(rutina.ref, { actualizada_por: 'CUENTA_ELIMINADA' });
  await batch.commit();
  return rutinas.size;
}

