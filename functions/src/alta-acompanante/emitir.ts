import { randomUUID } from 'node:crypto';
import { onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { exigirAutenticacion, registrarYRelanzar } from '../comun/errores.js';
import { MINUTOS_VIGENCIA_VINCULACION, iso, sumarMinutos } from '../comun/vencimientos.js';
import { firmarCodigo } from './verificar.js';

export async function emitirCodigo(
  request: CallableRequest<Record<string, never>>,
  ahora: Date = new Date(),
): Promise<{ codigo: string; vence_en: string }> {
  const uid = request.auth?.uid;
  exigirAutenticacion(uid);
  try {
    const venceEn = sumarMinutos(ahora, MINUTOS_VIGENCIA_VINCULACION);
    return { codigo: firmarCodigo(uid, venceEn, randomUUID()), vence_en: iso(venceEn) };
  } catch (error) {
    return registrarYRelanzar(error, 'emitir_codigo_vinculacion', { uid });
  }
}

export const emitir = onCall(async (request) => emitirCodigo(request));

