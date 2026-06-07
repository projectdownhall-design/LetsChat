import { useCallback } from 'react';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export function useEncryption() {
  const encrypt = useCallback(async (plaintext: string, chatId: string): Promise<string> => {
    try {
      const saltRaw = crypto.getRandomValues(new Uint8Array(16));
      const ivRaw = crypto.getRandomValues(new Uint8Array(12));
      const salt = saltRaw.buffer as ArrayBuffer;
      const iv = ivRaw.buffer as ArrayBuffer;

      const key = await deriveKey(chatId, salt);
      const enc = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, enc.encode(plaintext));

      const combined = new Uint8Array(16 + 12 + encrypted.byteLength);
      combined.set(saltRaw, 0);
      combined.set(ivRaw, 16);
      combined.set(new Uint8Array(encrypted), 28);

      return btoa(String.fromCharCode(...combined));
    } catch {
      return plaintext;
    }
  }, []);

  const decrypt = useCallback(async (ciphertext: string, chatId: string): Promise<string> => {
    try {
      const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
      const salt = combined.slice(0, 16).buffer as ArrayBuffer;
      const iv = combined.slice(16, 28).buffer as ArrayBuffer;
      const data = combined.slice(28);

      const key = await deriveKey(chatId, salt);
      const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data);

      return new TextDecoder().decode(decrypted);
    } catch {
      return ciphertext;
    }
  }, []);

  return { encrypt, decrypt };
}
