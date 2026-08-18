import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('auditoría de mensajes', () => {
  it('no construye cargas de notificación en código ni pruebas', () => {
    const root = resolve(process.cwd());
    const files = [
      readFileSync(resolve(root, 'src/comun/envio.ts'), 'utf8'),
      readFileSync(resolve(root, 'test/contratos/envio.test.ts'), 'utf8'),
    ];
    expect(files.join('\n')).not.toMatch(/notification\s*:/);
  });
});
