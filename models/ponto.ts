export type CategoriaPonto =
  | 'Entrada Regular'
  | 'Intervalo'
  | 'Retorno'
  | 'Saída Regular'
  | 'Hora Extra'
  | 'Ponto Manual'
  | 'Visita Externa';

export type AnexoDocumento = {
  uri: string;
  nome: string;
  tamanho?: number;
  mimeType?: string;
};

export type PontoRegistro = {
  id: string;
  titulo: string;
  categoria: string;
  dataHora: string;
  localizacao: string;
  latitude: number;
  longitude: number;
  observacao: string;
  fotoUri?: string | null;
  anexoPdf?: AnexoDocumento | null;
  sincronizadoApi?: boolean;
};

export type PerfilColaborador = {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  cargo: string;
  turnoFavorito: string;
  fotoPerfilUri?: string | null;
  aceitaTermos: boolean;
  atualizadoEm?: string;
};

export type PreferenciasApp = {
  modoCompacto: boolean;
  turnoFavorito: string;
  apiUrl: string;
};
