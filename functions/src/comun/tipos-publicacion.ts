export interface ArtefactoManifiesto {
  hash: string;
  bytes: number;
}

export interface Manifiesto {
  version: string;
  version_vocabulario: string;
  publicado_en: string;
  artefactos: {
    modelo: ArtefactoManifiesto;
    catalogo: ArtefactoManifiesto;
  };
}

export interface DocumentoVersion {
  version_vocabulario: string;
  publicado_en: Date;
  min_version_app: string;
  storage_path: string;
  hash: string;
}

export interface ModeloActivo {
  version: string;
  min_version_app: string;
  actualizado_en: Date;
}

