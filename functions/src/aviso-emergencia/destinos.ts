import { db } from '../comun/firebase.js';
import type { Dispositivo } from '../comun/tipos.js';

export interface DestinoEmergencia {
  id: string;
  token: string;
}

export async function resolverDestinos(uid: string): Promise<DestinoEmergencia[]> {
  const snapshot = await db.collection(`usuarios/${uid}/dispositivos`)
    .where('tipo', '==', 'TUTOR')
    .get();
  return snapshot.docs.flatMap((documento) => {
    const dispositivo = documento.data() as Partial<Dispositivo>;
    if (dispositivo.estado !== 'ACTIVO' || typeof dispositivo.token_fcm !== 'string' || !dispositivo.token_fcm) {
      return [];
    }
    return [{ id: documento.id, token: dispositivo.token_fcm }];
  });
}

