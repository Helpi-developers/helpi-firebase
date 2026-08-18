import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Manifiesto } from '../../functions/src/comun/tipos-publicacion.js';
import { validarPrevia } from './validar.js';
import { verificarHash } from './hashes.js';
import { activarVersion } from './activar.js';
import { aplicarRetencion } from './retencion.js';
import { publicarVersion } from './publicar.js';
import { subirArtefactos } from './subir.js';

interface Argumentos {
  version: string;
  artefactos: string;
  emulador: boolean;
}

function argumentos(argv: string[]): Argumentos {
  const valor = (nombre: string): string | undefined => {
    const index = argv.indexOf(nombre);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const version = valor('--version');
  const artefactos = valor('--artefactos');
  if (!version || !artefactos) throw new Error('Uso: --version <version> --artefactos <directorio> [--emulador]');
  return { version, artefactos, emulador: argv.includes('--emulador') };
}

async function ejecutar(): Promise<void> {
  const args = argumentos(process.argv.slice(2));
  if (!args.emulador && process.env.CI !== 'true') throw new Error('La publicación sólo puede ejecutarse en CI o con --emulador');
  const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-helpi-local', storageBucket: `${process.env.GCLOUD_PROJECT ?? 'demo-helpi-local'}.appspot.com` });
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket();
  const directorio = resolve(args.artefactos);
  const manifiesto = JSON.parse(await readFile(resolve(directorio, 'manifiesto.json'), 'utf8')) as Manifiesto;
  if (manifiesto.version !== args.version) throw new Error('La versión del manifiesto no coincide con el argumento');
  await verificarHash(resolve(directorio, 'modelo'), manifiesto.artefactos.modelo);
  await verificarHash(resolve(directorio, 'catalogo'), manifiesto.artefactos.catalogo);
  await validarPrevia(db, manifiesto);
  const rutas = await subirArtefactos(bucket, args.version, {
    modelo: resolve(directorio, 'modelo'),
    catalogo: resolve(directorio, 'catalogo'),
    manifiesto: resolve(directorio, 'manifiesto.json'),
  });
  await publicarVersion(db, manifiesto, rutas);
  const activo = await db.doc('config/modelo_activo').get();
  await aplicarRetencion(db, bucket, activo.get('version'));
  await activarVersion(db, args.version);
}

if (process.argv[1] && /scripts[\\/]publicar-modelo[\\/]index\.ts$/.test(process.argv[1])) {
  ejecutar().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

export { ejecutar };
