import { onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { db } from '../comun/firebase.js';
import { exigirAutenticacion, registrarYRelanzar } from '../comun/errores.js';

export async function cancelarEliminacion(
  request: CallableRequest<Record<string, never>>,
): Promise<Record<string, never>> {
  const uid = request.auth?.uid;
  exigirAutenticacion(uid);
  try {
    await db.doc(`eliminaciones_pendientes/${uid}`).delete();
    return {};
  } catch (error) {
    return registrarYRelanzar(error, 'cancelar_eliminacion', { uid });
  }
}

export const cancelar = onCall(async (request) => cancelarEliminacion(request));

