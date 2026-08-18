import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { enviarConFirebase, mensajeNovedad, type Enviador } from '../comun/envio.js';
import { registrarYRelanzar } from '../comun/errores.js';
import { temaPara, type CategoriaNovedad } from './temas.js';

export interface EventoNovedad {
  categoria: string;
  version: string;
}

export async function publicarNovedad(
  evento: EventoNovedad,
  enviar: Enviador = enviarConFirebase,
): Promise<boolean> {
  const topic = temaPara(evento.categoria);
  if (!topic) return false;
  try {
    await enviar(mensajeNovedad(evento.categoria as CategoriaNovedad, evento.version, topic));
    return true;
  } catch (error) {
    return registrarYRelanzar(error, 'novedad_tema', { categoria: evento.categoria, version: evento.version });
  }
}

export const novedadesTema = onDocumentCreated('novedades/{categoria}/{version}', async (event) => {
  const categoria = event.params.categoria;
  const version = event.params.version;
  await publicarNovedad({ categoria, version });
});

