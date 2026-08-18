import { describe, expect, it } from 'vitest';
import { actualizarEtiquetas } from '../../src/propagacion-pictograma/actualizar.js';

describe('propagación de pictogramas', () => {
  it('actualiza etiquetas duplicadas en más de un perfil', () => {
    const rutina = {
      nombre: 'Rutina',
      pictogramas_referenciados: ['p1'],
      actividades: [{ pasos: [{ pictograma_id: 'p1', etiqueta: 'Vieja', ubicacion: 0, otro: 'igual' }] }],
    };
    const actualizada = actualizarEtiquetas(rutina, 'p1', { etiqueta: 'Nueva', ubicacion: 1 });
    expect(actualizada.actividades?.[0]?.pasos?.[0]).toEqual({ pictograma_id: 'p1', etiqueta: 'Nueva', ubicacion: 1, otro: 'igual' });
  });
});

