import { onCall, type CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../comun/firebase.js';
import { exigirAutenticacion, registrarYRelanzar } from '../comun/errores.js';
import { enviarContinuando, enviarConFirebase, mensajeEmergencia, type Enviador } from '../comun/envio.js';
import { resolverDestinos } from './destinos.js';

export interface AvisoDependencies {
  resolver: typeof resolverDestinos;
  enviar: Enviador;
  borrarDestino: (uid: string, id: string) => Promise<void>;
  ahora: () => Date;
}

const dependencias: AvisoDependencies = {
  resolver: resolverDestinos,
  enviar: enviarConFirebase,
  borrarDestino: async (uid, id) => { await db.doc(`usuarios/${uid}/dispositivos/${id}`).delete(); },
  ahora: () => new Date(),
};

export async function procesarAviso(
  request: CallableRequest<{ perfil_id?: string }>,
  deps: AvisoDependencies = dependencias,
): Promise<{ enviados: number }> {
  const uid = request.auth?.uid;
  exigirAutenticacion(uid);
  if (request.data?.perfil_id && request.data.perfil_id !== uid) {
    throw new HttpsError('permission-denied', 'Operación no permitida');
  }
  try {
    const destinos = await deps.resolver(uid);
    const mensajes = destinos.map((destino) => ({
      mensaje: mensajeEmergencia(uid, deps.ahora(), destino.token),
      alFallar: () => deps.borrarDestino(uid, destino.id),
    }));
    return { enviados: await enviarContinuando(mensajes, deps.enviar) };
  } catch (error) {
    return registrarYRelanzar(error, 'aviso_emergencia', { uid });
  }
}

export const avisoEmergencia = onCall(async (request) => procesarAviso(request));
