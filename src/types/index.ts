export interface TOTPEntry {
  id: string;
  name: string;
  secret: string;
  icon: string; // Can be an icon name or a base64 image string
  isCustomIcon?: boolean; // Flag to indicate if icon is a base64 image
  period?: number;
  digits?: number;
}