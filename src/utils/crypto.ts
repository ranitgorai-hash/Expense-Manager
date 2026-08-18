/**
 * AES-256-GCM encryption for the optional Google Drive backup.
 *
 * Design:
 *  - Key derivation: PBKDF2-SHA256 (200,000 iterations) from a user passphrase + random salt.
 *    Nothing about the passphrase is ever stored — only the salt travels with the ciphertext,
 *    so the backup file alone is useless without the passphrase.
 *  - Encryption: AES-256-GCM with a random 12-byte IV per encryption (never reused).
 *  - Output container: a single JSON-friendly object (base64 fields) so the encrypted backup
 *    can be uploaded to Drive as an ordinary file and round-tripped through JSON.
 *
 * Nothing here ever leaves the device — encryption happens entirely client-side before upload,
 * and decryption happens entirely client-side after download.
 */

const PBKDF2_ITERATIONS = 200_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface EncryptedPayload {
  v: 1;
  alg: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64
}

function bufToBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt an arbitrary JS value (typically a FullExport backup object) with a passphrase. */
export async function encryptJson(data: unknown, passphrase: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintext
  );
  return {
    v: 1,
    alg: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bufToBase64(salt.buffer),
    iv: bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ciphertext),
  };
}

/** Decrypt a payload produced by encryptJson. Throws if the passphrase is wrong (auth tag check fails). */
export async function decryptJson<T = unknown>(
  payload: EncryptedPayload,
  passphrase: string
): Promise<T> {
  const salt = new Uint8Array(base64ToBuf(payload.salt));
  const iv = new Uint8Array(base64ToBuf(payload.iv));
  const key = await deriveKey(passphrase, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    base64ToBuf(payload.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

export function isEncryptedPayload(x: unknown): x is EncryptedPayload {
  return (
    !!x &&
    typeof x === 'object' &&
    (x as EncryptedPayload).alg === 'AES-256-GCM' &&
    typeof (x as EncryptedPayload).ciphertext === 'string'
  );
}
