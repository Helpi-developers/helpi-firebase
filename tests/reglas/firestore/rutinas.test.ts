import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { ajena, autorizada, propietaria, sinAutenticar } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

function rutina(db: ReturnType<typeof propietaria>, uid: string) {
  return setDoc(doc(db, 'usuarios/propietaria/rutinas/nueva'), {
    nombre: 'Nueva',
    actividades: [],
    pictogramas_referenciados: [],
    actualizada_por: uid,
    fecha_actualizacion: serverTimestamp(),
  });
}

describe('rutinas', () => {
  it('permite leer y escribir a propietaria y autorizada', async () => {
    await sembrarBase(testEnv);
    await assertSucceeds(getDoc(doc(propietaria(testEnv), 'usuarios/propietaria/rutinas/rutina-1')));
    await assertSucceeds(getDoc(doc(autorizada(testEnv), 'usuarios/propietaria/rutinas/rutina-1')));
    await assertSucceeds(rutina(propietaria(testEnv), 'propietaria'));
    await assertSucceeds(rutina(autorizada(testEnv), 'autorizada'));
    await assertFails(getDoc(doc(ajena(testEnv), 'usuarios/propietaria/rutinas/rutina-1')));
    await assertFails(getDoc(doc(sinAutenticar(testEnv), 'usuarios/propietaria/rutinas/rutina-1')));
    await assertFails(rutina(ajena(testEnv), 'ajena'));
    await assertFails(rutina(sinAutenticar(testEnv), 'sin_autenticar'));
  });
});

