import { createHmac, timingSafeEqual } from 'node:crypto';
import { estaVencido } from '../comun/vencimientos.js';

interface CargaCodigo {
  emisor: string;
  vence_en: string;
  nonce: string;
}

function secreto(): string {
  return process.env.HELPI_LINK_SECRET ?? 'helpi-local-link-secret';
}

function firma(contenido: string): string {
  return createHmac('sha256', secreto()).update(contenido).digest('base64url');
}

export function firmarCodigo(emisor: string, venceEn: Date, nonce: string): string {
  const carga: CargaCodigo = { emisor, vence_en: venceEn.toISOString(), nonce };
  const contenido = Buffer.from(JSON.stringify(carga), 'utf8').toString('base64url');
  return `${contenido}.${firma(contenido)}`;
}

export function verificarCodigo(codigo: string): CargaCodigo | null {
  const [contenido, firmaRecibida] = codigo.split('.');
  if (!contenido || !firmaRecibida) return null;
  const firmaEsperada = firma(contenido);
  const recibida = Buffer.from(firmaRecibida);
  const esperada = Buffer.from(firmaEsperada);
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try {
    const carga = JSON.parse(Buffer.from(contenido, 'base64url').toString('utf8')) as Partial<CargaCodigo>;
    if (typeof carga.emisor !== 'string' || typeof carga.vence_en !== 'string' || typeof carga.nonce !== 'string') return null;
    if (estaVencido(new Date(carga.vence_en))) return null;
    return carga as CargaCodigo;
  } catch {
    return null;
  }
}

