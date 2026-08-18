import type { Storage } from 'firebase-admin/storage';
import { basename } from 'node:path';
import { upload } from './util.js';
import type { Manifiesto } from '../../functions/src/comun/tipos-publicacion.js';

export interface RutasSubidas {
  modelo: string;
  catalogo: string;
  manifiesto: string;
}

export async function subirArtefactos(
  bucket: ReturnType<Storage['bucket']>,
  version: string,
  artefactos: { modelo: string; catalogo: string; manifiesto: string },
): Promise<RutasSubidas> {
  const base = `modelos/${version}`;
  const rutas = { modelo: `${base}/modelo`, catalogo: `${base}/catalogo`, manifiesto: `${base}/manifiesto` };
  await upload(bucket, artefactos.modelo, rutas.modelo);
  await upload(bucket, artefactos.catalogo, rutas.catalogo);
  await upload(bucket, artefactos.manifiesto, rutas.manifiesto);
  return rutas;
}

export function nombreArtefacto(ruta: string): string {
  return basename(ruta);
}

