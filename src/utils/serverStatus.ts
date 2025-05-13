import { API_URL } from './../../config.js';

/**
 * Checks if the server is reachable
 * @returns {Promise<boolean>} true if the server is reachable, false otherwise
 */
export const isServerOnline = async (): Promise<boolean> => {
  try {
    // Use a timeout to avoid hanging too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_URL}/vault/exists`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Server unreachable:', error);
    return false;
  }
};
