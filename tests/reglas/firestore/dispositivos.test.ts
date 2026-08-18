import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { ajena, autorizada, propietaria, sinAutenticar } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('dispositivos', () => {
  it('aplica las cuatro clases a lectura y escritura', async () => {
    await sembrarBase(testEnv);
    const path = 'usuarios/propietaria/dispositivos/nuevo';
    const data = { tipo: 'TUTOR', token_fcm: 'otro-token', estado: 'ACTIVO' };
    await assertSucceeds(getDoc(doc(propietaria(testEnv), 'usuarios/propietaria/dispositivos/dispositivo-1')));
    await assertSucceeds(getDoc(doc(autorizada(testEnv), 'usuarios/propietaria/dispositivos/dispositivo-1')));
    await assertFails(getDoc(doc(ajena(testEnv), 'usuarios/propietaria/dispositivos/dispositivo-1')));
    await assertFails(getDoc(doc(sinAutenticar(testEnv), 'usuarios/propietaria/dispositivos/dispositivo-1')));
    await assertSucceeds(setDoc(doc(propietaria(testEnv), path), data));
    await assertSucceeds(setDoc(doc(autorizada(testEnv), path), data));
    await assertFails(setDoc(doc(ajena(testEnv), path), data));
    await assertFails(setDoc(doc(sinAutenticar(testEnv), path), data));
  });
});

