import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('auditoría de reglas permisivas', () => {
  it('no usa allow read, write: if true en reglas ni pruebas', () => {
    const root = resolve(process.cwd(), '../..');
    const firestore = readFileSync(resolve(root, 'reglas/firestore.rules'), 'utf8');
    const storage = readFileSync(resolve(root, 'reglas/storage.rules'), 'utf8');
    expect(`${firestore}\n${storage}`).not.toMatch(/allow\s+(read|write|read,\s*write)\s*:\s*if\s+true/);
  });
});

