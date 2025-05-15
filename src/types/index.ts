export interface Folder {
  id: string;
  name: string;
  icon: string; // Emoji ou icône pour le dossier
  color: string; // Couleur du dossier (code hexadécimal)
  isExpanded?: boolean; // État d'expansion du dossier dans l'UI
  parentId?: string; // ID du dossier parent, undefined si à la racine
}

export interface TOTPEntry {
  id: string;
  name: string;
  secret: string;
  icon: string; // Can be an icon name or a base64 image string
  isCustomIcon?: boolean; // Flag to indicate if icon is a base64 image
  period?: number;
  digits?: number;
  folderId?: string; // ID du dossier parent, null/undefined si à la racine
}