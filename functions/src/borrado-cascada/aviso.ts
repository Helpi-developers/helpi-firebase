import { db } from '../comun/firebase.js';
import { enviarContinuando, enviarConFirebase, mensajeVinculoCerrado, type Enviador } from '../comun/envio.js';
import { registrarError } from '../comun/errores.js';

export async function avisarCierre(
  perfiles: string[],
  enviar: Enviador = enviarConFirebase,
): Promise<number> {
  const mensajes: Array<{ mensaje: ReturnType<typeof mensajeVinculoCerrado> }> = [];
  for (const perfilId of perfiles) {
    const dispositivos = await db.collection(`usuarios/${perfilId}/dispositivos`)
      .where('tipo', '==', 'TUTOR')
      .where('estado', '==', 'ACTIVO')
      .get();
    for (const dispositivo of dispositivos.docs) {
      const token = dispositivo.get('token_fcm');
      if (typeof token === 'string' && token) {
        mensajes.push({ mensaje: mensajeVinculoCerrado(perfilId, token) });
      }
    }
  }
  try {
    return await enviarContinuando(mensajes, enviar);
  } catch (error) {
    registrarError(error, 'aviso_cierre_vinculo');
    return 0;
  }
}

