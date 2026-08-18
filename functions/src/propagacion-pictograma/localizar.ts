import { db } from '../comun/firebase.js';
import type { DocumentReference } from 'firebase-admin/firestore';
import type { Rutina } from '../comun/tipos.js';

export interface RutinaEncontrada {
  ref: DocumentReference;
  data: Rutina;
}

export async function localizarRutinas(pictogramaId: string, uidPropietario?: string): Promise<RutinaEncontrada[]> {
  const consulta = uidPropietario
    ? db.collection(`usuarios/${uidPropietario}/rutinas`).where('pictogramas_referenciados', 'array-contains', pictogramaId)
    : db.collectionGroup('rutinas').where('pictogramas_referenciados', 'array-contains', pictogramaId);
  const snapshot = await consulta.get();
  return snapshot.docs.map((documento) => ({ ref: documento.ref, data: documento.data() as Rutina }));
}
