export const DIAS_GRACIA_ELIMINACION = 30;
export const MINUTOS_VIGENCIA_VINCULACION = 10;

export function instanteActual(): Date {
  return new Date();
}

export function sumarDias(origen: Date, dias: number): Date {
  return new Date(origen.getTime() + dias * 24 * 60 * 60 * 1000);
}

export function sumarMinutos(origen: Date, minutos: number): Date {
  return new Date(origen.getTime() + minutos * 60 * 1000);
}

export function estaVencido(venceEn: Date | { toDate(): Date }, ahora: Date = instanteActual()): boolean {
  const fecha = venceEn instanceof Date ? venceEn : venceEn.toDate();
  return fecha.getTime() <= ahora.getTime();
}

export function iso(fecha: Date): string {
  return fecha.toISOString();
}

