// src/utils/config.ts
export interface Config {
    SERVER_HOST: string;
    SERVER_PORT: string;
    SERVER_URL: string;
    API_URL: string;
}
export async function loadConfig(): Promise<Config> {
    const res = await fetch('/config.json');
    if (!res.ok) throw new Error('Failed to load config.json');
    return res.json();
}