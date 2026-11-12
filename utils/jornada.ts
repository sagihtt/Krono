import { PontoRegistro } from '@/models/ponto';

export const CATEGORIAS_JORNADA = [
  'Entrada Regular',
  'Intervalo',
  'Retorno',
  'Saída Regular',
  'Hora Extra',
] as const;

export function sugerirProximaCategoria(
  lista: Pick<PontoRegistro, 'categoria'>[]
): string {
  if (!Array.isArray(lista) || lista.length === 0) {
    return 'Entrada Regular';
  }

  const ultimaCategoria = (lista[0]?.categoria || '').trim();
  switch (ultimaCategoria) {
    case 'Entrada Regular':
      return 'Intervalo';
    case 'Intervalo':
      return 'Retorno';
    case 'Retorno':
      return 'Saída Regular';
    case 'Saída Regular':
      return 'Hora Extra';
    default:
      return 'Entrada Regular';
  }
}

export function formatarLinkMapa(latitude: number, longitude: number): string {
  const lat = Number.isFinite(latitude) ? latitude : -15.7942;
  const lon = Number.isFinite(longitude) ? longitude : -47.8822;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
