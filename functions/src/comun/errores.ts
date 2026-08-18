import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';

export const CODIGO_VINCULACION_INVALIDO = 'Código inválido';

export function registrarError(error: unknown, operacion: string, contexto: Record<string, string> = {}): void {
  const errorCode = error instanceof Error ? error.name : 'UnknownError';
  logger.error('Error en operación de servidor', {
    operacion,
    error_code: errorCode,
    ...contexto,
  });
}

export function registrarYRelanzar(error: unknown, operacion: string, contexto: Record<string, string> = {}): never {
  registrarError(error, operacion, contexto);
  throw error;
}

export function rechazoVinculacion(): HttpsError {
  return new HttpsError('invalid-argument', CODIGO_VINCULACION_INVALIDO);
}

export function exigirAutenticacion(uid: string | undefined): asserts uid is string {
  if (!uid) throw new HttpsError('unauthenticated', 'Autenticación requerida');
}

