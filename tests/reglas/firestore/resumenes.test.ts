import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { ajena, autorizada, propietaria, sinAutenticar } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

const data = { fecha: '2026-01-02', rutinas: [], fecha_actualizacion: serverTimestamp() };

describe('resumenes diarios', () => {
  it('permite lectura a propietaria y autorizada, pero escritura solo a propietaria', async () => {
    await sembrarBase(testEnv);
    const existing = 'usuarios/propietaria/resumenes/2026-01-01';
    await assertSucceeds(getDoc(doc(propietaria(testEnv), existing)));
    await assertSucceeds(getDoc(doc(autorizada(testEnv), existing)));
    await assertFails(getDoc(doc(ajena(testEnv), existing)));
    await assertFails(getDoc(doc(sinAutenticar(testEnv), existing)));
    await assertSucceeds(setDoc(doc(propietaria(testEnv), 'usuarios/propietaria/resumenes/2026-01-02'), data));
    await assertFails(setDoc(doc(autorizada(testEnv), 'usuarios/propietaria/resumenes/2026-01-02'), data));
    await assertFails(setDoc(doc(ajena(testEnv), 'usuarios/propietaria/resumenes/2026-01-02'), data));
    await assertFails(setDoc(doc(sinAutenticar(testEnv), 'usuarios/propietaria/resumenes/2026-01-02'), data));
  });
});

