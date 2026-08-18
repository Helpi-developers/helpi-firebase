export type CategoriaNovedad = 'modelo' | 'pictogramas' | 'vocabulario';

const temas: Record<CategoriaNovedad, string> = {
  modelo: 'novedades_modelo',
  pictogramas: 'novedades_pictogramas',
  vocabulario: 'novedades_vocabulario',
};

export function temaPara(categoria: string): string | undefined {
  if (!(categoria in temas)) return undefined;
  return temas[categoria as CategoriaNovedad];
}

