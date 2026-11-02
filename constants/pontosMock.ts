export type PontoRegistro = {
  id: string;
  titulo: string;
  categoria: string;
  dataHora: string;
  localizacao: string;
  latitude: number;
  longitude: number;
  observacao: string;
};

export const PONTOS_INICIAIS: PontoRegistro[] = [
  {
    id: '1',
    titulo: 'Entrada Matutina',
    categoria: 'Entrada Regular',
    dataHora: '21/09/2026 08:02:14',
    localizacao: 'Sede Principal - Bloco A',
    latitude: -15.7942,
    longitude: -47.8822,
    observacao: 'Registro confirmado via biometria facial e geolocalização.',
  },
  {
    id: '2',
    titulo: 'Saída para Almoço',
    categoria: 'Intervalo',
    dataHora: '21/09/2026 12:05:30',
    localizacao: 'Sede Principal - Refeitório',
    latitude: -15.7945,
    longitude: -47.8825,
    observacao: 'Saída de intervalo regular de 1 hora.',
  },
  {
    id: '3',
    titulo: 'Retorno do Almoço',
    categoria: 'Retorno',
    dataHora: '21/09/2026 13:04:18',
    localizacao: 'Sede Principal - Bloco A',
    latitude: -15.7941,
    longitude: -47.8821,
    observacao: 'Retorno pontual de intervalo intrajornada.',
  },
  {
    id: '4',
    titulo: 'Saída do Expediente',
    categoria: 'Saída Regular',
    dataHora: '21/09/2026 17:31:05',
    localizacao: 'Portaria Central',
    latitude: -15.7948,
    longitude: -47.8819,
    observacao: 'Fim de jornada normal cumprida com sucesso.',
  },
  {
    id: '5',
    titulo: 'Plantão Extra',
    categoria: 'Hora Extra',
    dataHora: '21/09/2026 19:15:00',
    localizacao: 'Laboratório de TI - Campus Asa Sul',
    latitude: -15.8012,
    longitude: -47.8935,
    observacao: 'Autorizado previamente pela coordenação técnica.',
  },
];
