import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('cobertura de la matriz de reglas', () => {
  it('mantiene una prueba por cada familia de rutas no vacía', () => {
    const root = resolve(process.cwd(), '../..');
    const pruebas = [
      'firestore/perfil.test.ts',
      'firestore/autorizados.test.ts',
      'firestore/enumeracion.test.ts',
      'firestore/revocacion.test.ts',
      'firestore/rutinas.test.ts',
      'firestore/dispositivos.test.ts',
      'firestore/pictogramas.test.ts',
      'firestore/resumenes.test.ts',
      'firestore/resumenes-contenido.test.ts',
      'firestore/gracia.test.ts',
      'firestore/globales.test.ts',
      'firestore/consultas.test.ts',
      'storage/zona-publica.test.ts',
      'storage/zona-cuenta.test.ts',
      'storage/rutas-inexistentes.test.ts',
      'storage/zonas-cobertura.test.ts',
    ];
    expect(pruebas.every((archivo) => existsSync(resolve(root, 'tests/reglas', archivo)))).toBe(true);
  });
});

