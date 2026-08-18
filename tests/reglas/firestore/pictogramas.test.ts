import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { ajena, autorizada, propietaria, sinAutenticar } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('pictogramas personalizados', () => {
  it('aplica las cuatro clases a lectura y escritura', async () => {
    await sembrarBase(testEnv);
    const path = 'usuarios/propietaria/pictogramas/nuevo';
    const data = { etiqueta: 'Nuevo', ubicacion: 1 };
    await assertSucceeds(getDoc(doc(propietaria(testEnv), 'usuarios/propietaria/pictogramas/pictograma-1')));
    await assertSucceeds(getDoc(doc(autorizada(testEnv), 'usuarios/propietaria/pictogramas/pictograma-1')));
    await assertFails(getDoc(doc(ajena(testEnv), 'usuarios/propietaria/pictogramas/pictograma-1')));
    await assertFails(getDoc(doc(sinAutenticar(testEnv), 'usuarios/propietaria/pictogramas/pictograma-1')));
    await assertSucceeds(setDoc(doc(propietaria(testEnv), path), data));
    await assertSucceeds(setDoc(doc(autorizada(testEnv), path), data));
    await assertFails(setDoc(doc(ajena(testEnv), path), data));
    await assertFails(setDoc(doc(sinAutenticar(testEnv), path), data));
  });
});

