import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { base } from '../fixtures/base.js';

export async function sembrarBase(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      db.doc('usuarios/propietaria').set(base.perfiles.propietaria),
      db.doc('usuarios/segunda').set(base.perfiles.segunda),
      db.doc('usuarios/propietaria/rutinas/rutina-1').set(base.rutina),
      db.doc('usuarios/propietaria/dispositivos/dispositivo-1').set(base.dispositivo),
      db.doc('usuarios/propietaria/pictogramas/pictograma-1').set(base.pictograma),
      db.doc('usuarios/propietaria/resumenes/2026-01-01').set(base.resumen),
      db.doc('usuarios/segunda/pictogramas/creado-por-propietaria').set(base.pictograma),
      db.doc('vocabularios/v1').set({ version: 'v1' }),
      db.doc('vocabularios/v1/senas/nueva').set(base.senas.nueva),
      db.doc('vocabularios/v1/senas/retirada').set(base.senas.retirada),
      db.doc('modelos/v1').set({
        version_vocabulario: 'v1',
        publicado_en: new Date('2026-01-04T00:00:00.000Z'),
        min_version_app: '1.0.0',
        storage_path: 'modelos/v1/modelo',
        hash: 'sha256:fixture',
      }),
      db.doc('config/modelo_activo').set({
        version: 'v1',
        min_version_app: '1.0.0',
        actualizado_en: new Date('2026-01-04T00:00:00.000Z'),
      }),
      db.doc('pictogramas/pictograma-1').set(base.pictograma),
    ]);
  });
}
