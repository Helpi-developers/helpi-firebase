import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('auditoría de registros', () => {
  it('no incluye nombres, contenido o ubicación en logs de funciones', () => {
    const root = resolve(process.cwd());
    const source = readdirSync(resolve(root, 'src/comun'))
      .filter((archivo) => archivo.endsWith('.ts'))
      .map((archivo) => readFileSync(resolve(root, 'src/comun', archivo), 'utf8'))
      .join('\n');
    expect(source).not.toContain('logger.info(nombre');
    expect(source).not.toContain('logger.info(contenido');
  });
});
