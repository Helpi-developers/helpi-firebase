import { onTaskDispatched } from 'firebase-functions/tasks';
import { db } from '../comun/firebase.js';
import { registrarYRelanzar } from '../comun/errores.js';
import { estaVencido } from '../comun/vencimientos.js';
import { borrarArchivosDeCuenta } from './archivos.js';
import { avisarCierre } from './aviso.js';
import { despersonalizarAutoria } from './autoria.js';
import { quitarDeAutorizados } from './referencias.js';
import { borrarSubarbol } from './subarbol.js';

export async function ejecutarBorrado(uid: string, ahora: Date = new Date()): Promise<boolean> {
  const pendiente = await db.doc(`eliminaciones_pendientes/${uid}`).get();
  if (!pendiente.exists) return false;
  const venceEn = pendiente.get('vence_en');
  if (!venceEn || !estaVencido(venceEn, ahora)) return false;
  try {
    const afectados = await quitarDeAutorizados(uid);
    await avisarCierre(afectados);
    await despersonalizarAutoria(uid);
    await borrarArchivosDeCuenta(uid);
    await borrarSubarbol(uid);
    await db.doc(`eliminaciones_pendientes/${uid}`).delete();
    return true;
  } catch (error) {
    return registrarYRelanzar(error, 'ejecutar_borrado', { uid });
  }
}

export const ejecutar = onTaskDispatched(async (request) => {
  const uid = typeof request.data?.uid === 'string' ? request.data.uid : undefined;
  if (!uid) throw new Error('Tarea de borrado sin uid');
  await ejecutarBorrado(uid);
});

