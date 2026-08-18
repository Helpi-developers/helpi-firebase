import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('auditoría de credenciales', () => {
  it('mantiene el sembrado administrativo fuera de las aserciones', () => {
    const root = resolve(process.cwd(), '../..');
    const files = readFileSync(resolve(root, 'tests/reglas/helpers/siembra.ts'), 'utf8');
    expect(files).toContain('withSecurityRulesDisabled');
    const tests = readFileSync(resolve(root, 'tests/reglas/firestore/perfil.test.ts'), 'utf8');
    expect(tests).not.toContain('withSecurityRulesDisabled');
  });
});

