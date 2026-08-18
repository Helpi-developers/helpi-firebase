import { describe, expect, it } from 'vitest';
import { hashArchivo } from '../hashes.js';

describe('publicación de modelo', () => {
  it('calcula un hash sha256 y el tamaño del artefacto', async () => {
    const ruta = `${process.cwd()}/scripts/publicar-modelo/test/fixture.bin`;
    const { writeFile, rm } = await import('node:fs/promises');
    await writeFile(ruta, Buffer.from('modelo'));
    const resultado = await hashArchivo(ruta);
    await rm(ruta);
    expect(resultado.bytes).toBe(6);
    expect(resultado.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});

