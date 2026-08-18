import { FieldValue } from 'firebase-admin/firestore';
import { getFunctions } from 'firebase-admin/functions';
import { onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { db } from '../comun/firebase.js';
import { exigirAutenticacion, registrarYRelanzar } from '../comun/errores.js';
import { DIAS_GRACIA_ELIMINACION, iso, sumarDias } from '../comun/vencimientos.js';

export type Encolador = (uid: string, venceEn: Date) => Promise<void>;

export const encolarBorrado: Encolador = async (uid, venceEn) => {
  await getFunctions().taskQueue('ejecutar').enqueue({ uid }, { scheduleTime: venceEn });
};

export async function solicitarEliminacion(
  request: CallableRequest<Record<string, never>>,
  encolar: Encolador = encolarBorrado,
): Promise<{ vence_en: string }> {
  const uid = request.auth?.uid;
  exigirAutenticacion(uid);
  const ahora = new Date();
  const venceEn = sumarDias(ahora, DIAS_GRACIA_ELIMINACION);
  try {
    await db.doc(`eliminaciones_pendientes/${uid}`).set({
      vence_en: venceEn,
      solicitada_en: FieldValue.serverTimestamp(),
    });
    await encolar(uid, venceEn);
    return { vence_en: iso(venceEn) };
  } catch (error) {
    return registrarYRelanzar(error, 'solicitar_eliminacion', { uid });
  }
}

export const solicitar = onCall(async (request) => solicitarEliminacion(request));
