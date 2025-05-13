import CryptoJS from 'crypto-js';

const SESSION_KEY = 'vaultSession';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export interface VaultSession {
  expiresAt: number;
}

export const encryptVault = (data: unknown, password: string): string => {
  const jsonStr = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonStr, password).toString();
};

export const decryptVault = (encrypted: string, password: string): unknown => {
  const bytes = CryptoJS.AES.decrypt(encrypted, password);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
};

export const saveVaultSession = () => {
  const session: VaultSession = {
    expiresAt: Date.now() + SESSION_DURATION
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const checkVaultSession = (): boolean => {
  const sessionStr = sessionStorage.getItem(SESSION_KEY);
  if (!sessionStr) return false;
  
  const session: VaultSession = JSON.parse(sessionStr);
  return Date.now() < session.expiresAt;
};

export const clearVaultSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};