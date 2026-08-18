import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { propietaria } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('contenido del resumen', () => {
  it.each(['glosa', 'texto', 'transcripcion'])('rechaza el campo sensible %s', async (campo) => {
    await sembrarBase(testEnv);
    await assertFails(setDoc(doc(propietaria(testEnv), `usuarios/propietaria/resumenes/${campo}`), {
      fecha: '2026-01-03',
      rutinas: [],
      fecha_actualizacion: serverTimestamp(),
      [campo]: 'dato prohibido',
    }));
  });

  it('acepta el agregado diario sin contenido de conversación', async () => {
    await sembrarBase(testEnv);
    await assertSucceeds(setDoc(doc(propietaria(testEnv), 'usuarios/propietaria/resumenes/2026-01-03'), {
      fecha: '2026-01-03', rutinas: [], fecha_actualizacion: serverTimestamp(),
    }));
  });
});

