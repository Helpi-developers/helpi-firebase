import { messaging } from './firebase.js';
import { registrarError } from './errores.js';

export interface MensajeDatos {
  token?: string;
  topic?: string;
  data: Record<string, string>;
  android: { priority: 'high' | 'normal' };
}

export type Enviador = (mensaje: MensajeDatos) => Promise<string>;

export function construirMensaje(
  destino: { token?: string; topic?: string },
  data: Record<string, string>,
  priority: 'high' | 'normal',
): MensajeDatos {
  if (!destino.token && !destino.topic) throw new Error('Destino de envío ausente');
  return { ...destino, data, android: { priority } };
}

export function mensajeEmergencia(perfilId: string, emitidoEn: Date, token: string): MensajeDatos {
  return construirMensaje({ token }, {
    tipo: 'emergencia',
    perfil_id: perfilId,
    emitido_en: emitidoEn.toISOString(),
  }, 'high');
}

export function mensajeNovedad(categoria: 'modelo' | 'pictogramas' | 'vocabulario', version: string, topic: string): MensajeDatos {
  return construirMensaje({ topic }, { tipo: 'novedad', categoria, version }, 'normal');
}

export function mensajeVinculoCerrado(perfilId: string, token: string): MensajeDatos {
  return construirMensaje({ token }, { tipo: 'vinculo_cerrado', perfil_id: perfilId }, 'normal');
}

export const enviarConFirebase: Enviador = async (mensaje) => {
  return messaging.send(mensaje as Parameters<typeof messaging.send>[0]);
};

export function destinoInvalido(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code) : '';
  return [
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/invalid-argument',
  ].includes(code);
}

export async function enviarContinuando(
  mensajes: Array<{ mensaje: MensajeDatos; alFallar?: () => Promise<void> }>,
  enviador: Enviador = enviarConFirebase,
): Promise<number> {
  let enviados = 0;
  for (const item of mensajes) {
    try {
      await enviador(item.mensaje);
      enviados += 1;
    } catch (error) {
      registrarError(error, 'envio_mensaje');
      if (destinoInvalido(error) && item.alFallar) {
        try {
          await item.alFallar();
        } catch (cleanupError) {
          registrarError(cleanupError, 'depurar_destino');
        }
      }
    }
  }
  return enviados;
}
