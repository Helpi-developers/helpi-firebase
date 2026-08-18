import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { ArtefactoManifiesto } from '../../functions/src/comun/tipos-publicacion.js';

export async function hashArchivo(ruta: string): Promise<{ hash: string; bytes: number }> {
  const contenido = await readFile(ruta);
  return { hash: `sha256:${createHash('sha256').update(contenido).digest('hex')}`, bytes: contenido.byteLength };
}

export async function verificarHash(ruta: string, esperado: ArtefactoManifiesto): Promise<void> {
  const recibido = await hashArchivo(ruta);
  if (recibido.hash !== esperado.hash || recibido.bytes !== esperado.bytes) {
    throw new Error(`El hash o tamaño no coincide para ${ruta}`);
  }
}

