import type { Firestore } from 'firebase-admin/firestore';

export async function diagnosticarIndicador(db: Firestore): Promise<{ colgado: boolean; version?: string }> {
  const indicador = await db.doc('config/modelo_activo').get();
  if (!indicador.exists) return { colgado: false };
  const version = indicador.get('version');
  if (typeof version !== 'string') return { colgado: true };
  const modelo = await db.doc(`modelos/${version}`).get();
  return modelo.exists ? { colgado: false, version } : { colgado: true, version };
}

