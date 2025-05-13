// src/utils/config.ts
export interface Config {
    SERVER_HOST: string;
    SERVER_PORT: string;
    SERVER_URL: string;
    API_URL: string;
}

// Default configuration for production environment
const defaultConfig: Config = {
    SERVER_HOST: window.location.hostname,
    SERVER_PORT: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
    SERVER_URL: `${window.location.protocol}//${window.location.host}`,
    API_URL: `${window.location.protocol}//${window.location.host}/api`
};

// Cache for configuration
let cachedConfig: Config | undefined;

export async function loadConfig(): Promise<Config> {
    // If configuration is already cached, return it
    if (cachedConfig) {
        return cachedConfig;
    }

    try {
        // Try to load configuration from config.json
        const res = await fetch('/config.json');
        // Check if response is OK and contains valid JSON
        if (res.ok) {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const config = await res.json() as Config;
                cachedConfig = config;
                return config;
            }
        }

        // If we get here, the configuration could not be loaded
        // Use default configuration for production
        console.warn('Could not load config.json, using default production config');
        cachedConfig = { ...defaultConfig };
        return { ...defaultConfig };
    } catch (error) {
        console.error('Error loading config:', error);
        // In case of error, use default configuration
        cachedConfig = { ...defaultConfig };
        return { ...defaultConfig };
    }
}