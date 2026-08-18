import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { propietaria } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

const path = 'usuarios/propietaria/rutinas/validada';
const campos = { nombre: 'Rutina', actividades: [], pictogramas_referenciados: [] };

describe('validación de escritura de rutinas', () => {
  it('acepta los dos campos de auditoría correctos', async () => {
    await sembrarBase(testEnv);
    await assertSucceeds(setDoc(doc(propietaria(testEnv), path), {
      ...campos,
      actualizada_por: 'propietaria',
      fecha_actualizacion: serverTimestamp(),
    }));
  });

  it.each([
    ['sin actualizada_por', { fecha_actualizacion: serverTimestamp() }],
    ['sin fecha_actualizacion', { actualizada_por: 'propietaria' }],
    ['autoría ajena', { actualizada_por: 'ajena', fecha_actualizacion: serverTimestamp() }],
    ['fecha no servidor', { actualizada_por: 'propietaria', fecha_actualizacion: Timestamp.now() }],
  ])('%s rechaza la escritura', async (_nombre, extra) => {
    await sembrarBase(testEnv);
    await assertFails(setDoc(doc(propietaria(testEnv), path), { ...campos, ...extra }));
  });
});

