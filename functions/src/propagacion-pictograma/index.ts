import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { db } from '../comun/firebase.js';
import { registrarYRelanzar } from '../comun/errores.js';
import { actualizarEtiquetas } from './actualizar.js';
import { localizarRutinas } from './localizar.js';

export interface CambioGlobal {
  etiqueta?: string;
  ubicacion?: string | number;
}

export async function propagarPictograma(
  pictogramaId: string,
  cambio: CambioGlobal,
  uidPropietario?: string,
): Promise<number> {
  const rutinas = await localizarRutinas(pictogramaId, uidPropietario);
  if (!rutinas.length) return 0;
  const batch = db.batch();
  for (const rutina of rutinas) {
    const actualizada = actualizarEtiquetas(rutina.data, pictogramaId, cambio);
    batch.set(rutina.ref, { actividades: actualizada.actividades }, { merge: true });
  }
  await batch.commit();
  return rutinas.length;
}

export async function manejarCambioPictograma(
  pictogramaId: string,
  antes: CambioGlobal,
  despues: CambioGlobal,
): Promise<number> {
  if (antes.etiqueta === despues.etiqueta && antes.ubicacion === despues.ubicacion) return 0;
  try {
    return await propagarPictograma(pictogramaId, despues);
  } catch (error) {
    return registrarYRelanzar(error, 'propagacion_pictograma', { pictograma_id: pictogramaId });
  }
}

export const propagacionPictograma = onDocumentUpdated('pictogramas/{pictogramaId}', async (event) => {
  const antes = event.data?.before.data() as CambioGlobal | undefined;
  const despues = event.data?.after.data() as CambioGlobal | undefined;
  if (!antes || !despues) return;
  await manejarCambioPictograma(event.params.pictogramaId, antes, despues);
});

