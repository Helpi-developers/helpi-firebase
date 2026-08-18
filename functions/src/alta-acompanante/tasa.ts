import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../comun/firebase.js';

const MAX_INTENTOS = 5;
const HORA_MS = 60 * 60 * 1000;

function clave(solicitante: string, emisor: string): string {
  return `${solicitante}_${emisor}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function intentoPermitido(solicitante: string, emisor: string, ahora = new Date()): Promise<boolean> {
  const ref = db.doc(`limites_alta/${clave(solicitante, emisor)}`);
  let permitido = true;
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() as { intentos?: number; vence_en?: Timestamp } | undefined;
    const vence = data?.vence_en?.toDate();
    const vigente = vence && vence.getTime() > ahora.getTime();
    if (!vigente || !data) {
      transaction.set(ref, { intentos: 1, vence_en: new Date(ahora.getTime() + HORA_MS) });
      return;
    }
    if ((data.intentos ?? 0) >= MAX_INTENTOS) {
      permitido = false;
      return;
    }
    transaction.update(ref, { intentos: FieldValue.increment(1) });
  });
  return permitido;
}

