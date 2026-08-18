import type { Rutina } from '../comun/tipos.js';

export interface CambioPictograma {
  etiqueta?: string;
  ubicacion?: string | number;
}

export function actualizarEtiquetas(rutina: Rutina, pictogramaId: string, cambio: CambioPictograma): Rutina {
  const actividades = (rutina.actividades ?? []).map((actividad) => ({
    ...actividad,
    pasos: (actividad.pasos ?? []).map((paso) => {
      const id = paso.pictograma_id ?? paso.id_pictograma;
      if (id !== pictogramaId) return paso;
      return {
        ...paso,
        ...(cambio.etiqueta === undefined ? {} : { etiqueta: cambio.etiqueta }),
        ...(cambio.ubicacion === undefined ? {} : { ubicacion: cambio.ubicacion }),
      };
    }),
  }));
  return { ...rutina, actividades };
}

export function cambiosDeRutina(original: Rutina, actualizada: Rutina): Record<string, unknown> {
  return { actividades: actualizada.actividades, original_actividades: original.actividades };
}

