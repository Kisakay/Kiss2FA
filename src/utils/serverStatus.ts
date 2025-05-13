import { loadConfig } from './config';

let apiUrl: string | null = null;

const getApiUrl = async (): Promise<string> => {
  if (!apiUrl) {
    const config = await loadConfig();
    apiUrl = config.API_URL;
  }
  return apiUrl;
};

/**
 * Checks if the server is reachable
 * @returns {Promise<boolean>} true if the server is reachable, false otherwise
 */
export const isServerOnline = async (): Promise<boolean> => {
  try {
    // Use a timeout to avoid hanging too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const url = await getApiUrl();
    const response = await fetch(`${url}/vault/exists`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Server unreachable:', error);
    return false;
  }
};
