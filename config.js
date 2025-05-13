/**
 * Configuration partagée entre le serveur et le client
 */

// Configuration du serveur
export const SERVER_HOST = 'localhost';
export const SERVER_PORT = 3001;
export const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;
export const API_PATH = '/api';
export const API_URL = `${SERVER_URL}${API_PATH}`;
