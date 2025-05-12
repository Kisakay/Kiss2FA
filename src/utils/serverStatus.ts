import { API_URL } from './api';

/**
 * Vérifie si le serveur est accessible
 * @returns {Promise<boolean>} true si le serveur est accessible, false sinon
 */
export const isServerOnline = async (): Promise<boolean> => {
  try {
    // Utilisation d'un timeout pour ne pas bloquer trop longtemps
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${API_URL}/vault/exists`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Serveur injoignable:', error);
    return false;
  }
};
