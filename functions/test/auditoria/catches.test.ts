import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = resolve(dir, entrada.name);
    return entrada.isDirectory() ? archivos(caminho) : [caminho];
  });
}

describe('auditoría de manejo de errores', () => {
  it('no contiene catches vacíos', () => {
    const source = archivos(resolve(process.cwd(), 'src'))
      .filter((archivo) => archivo.endsWith('.ts'))
      .map((archivo) => readFileSync(archivo, 'utf8'))
      .join('\n');
    expect(source).not.toMatch(/catch\s*\([^)]*\)?\s*\{\s*\}/);
  });
});

