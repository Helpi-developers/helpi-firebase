import { FieldValue } from 'firebase-admin/firestore';
import { onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { db } from '../comun/firebase.js';
import { exigirAutenticacion, rechazoVinculacion, registrarError } from '../comun/errores.js';
import { intentoPermitido } from './tasa.js';
import { verificarCodigo } from './verificar.js';

export async function canjearCodigo(
  request: CallableRequest<{ codigo?: string }>,
): Promise<{ perfil_id: string }> {
  const solicitante = request.auth?.uid;
  exigirAutenticacion(solicitante);
  const codigo = request.data?.codigo;
  const carga = typeof codigo === 'string' ? verificarCodigo(codigo) : null;
  const emisor = carga?.emisor ?? 'desconocido';
  if (!(await intentoPermitido(solicitante, emisor))) throw rechazoVinculacion();
  if (!carga) throw rechazoVinculacion();
  const perfil = db.doc(`usuarios/${carga.emisor}`);
  try {
    const resultado = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(perfil);
      if (!snapshot.exists) throw rechazoVinculacion();
      const autorizados = snapshot.get('uids_autorizados') as unknown;
      if (!Array.isArray(autorizados) || autorizados.includes(solicitante)) throw rechazoVinculacion();
      transaction.update(perfil, { uids_autorizados: FieldValue.arrayUnion(solicitante) });
      return { perfil_id: carga.emisor };
    });
    return resultado;
  } catch (error) {
    if (error instanceof Error && error.message === 'Código inválido') throw rechazoVinculacion();
    registrarError(error, 'canjear_codigo', { solicitante, emisor });
    throw error;
  }
}

export const canjear = onCall(async (request) => canjearCodigo(request));

