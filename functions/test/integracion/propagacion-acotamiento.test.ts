import { describe, expect, it } from 'vitest';
import { actualizarEtiquetas } from '../../src/propagacion-pictograma/actualizar.js';

describe('acotamiento de propagación', () => {
  it('no cambia listas de autorizados ni campos fuera de pasos', () => {
    const rutina = {
      nombre: 'Rutina',
      uids_autorizados: ['otro'],
      pictogramas_referenciados: ['p1'],
      actividades: [{ nombre: 'Actividad', pasos: [{ pictograma_id: 'p1', etiqueta: 'Vieja', ubicacion: 0 }] }],
    };
    const actualizada = actualizarEtiquetas(rutina, 'p1', { etiqueta: 'Nueva' });
    expect(actualizada.nombre).toBe(rutina.nombre);
    expect(actualizada.uids_autorizados).toEqual(rutina.uids_autorizados);
    expect(actualizada.actividades?.[0]?.nombre).toBe('Actividad');
    expect(actualizada.actividades?.[0]?.pasos?.[0]?.ubicacion).toBe(0);
  });
});

