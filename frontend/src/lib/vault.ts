/**
 * Vault encryption: records are encrypted with a random DEK.
 * The DEK is wrapped with a KEK from the account password (and again with a recovery key).
 * Changing the login password only re-wraps the DEK; record ciphertext stays put.
 */

const PREFIX = "enc:v1:";
const STORAGE_KEY = "lockify-vault-key";
const PBKDF2_ITERATIONS = 100_000;

export type VaultWrap = {
  wrappedDek: string;
  wrapSalt: string;
};

export type VaultSetupPayload = VaultWrap & {
  recoveryWrappedDek: string;
  recoveryWrapSalt: string;
  recoveryKey: string;
};

type StoredVaultKey = {
  userId: string;
  jwk: JsonWebKey;
};

let vaultKey: CryptoKey | null = null;

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function randomSalt(): string {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
}

export function isEncryptedPassword(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function generateRecoveryKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i % 4 === 3 && i !== bytes.length - 1) out += "-";
  }
  return out;
}

async function importAesKey(raw: Uint8Array, extractable: boolean): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, extractable, ["encrypt", "decrypt"]);
}

async function generateDek(): Promise<CryptoKey> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  return importAesKey(raw, true);
}

async function dekToRaw(dek: CryptoKey): Promise<Uint8Array> {
  const buf = await crypto.subtle.exportKey("raw", dek);
  return new Uint8Array(buf);
}

async function deriveKek(secret: string, saltB64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToBytes(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Legacy: record key derived directly from account password + userId. */
export async function deriveLegacyRecordKey(userId: string, accountPassword: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(accountPassword),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(userId),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function wrapBytes(kek: CryptoKey, plaintext: Uint8Array): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, kek, plaintext);
  return `${PREFIX}${bytesToB64(iv)}:${bytesToB64(new Uint8Array(cipherBuf))}`;
}

async function unwrapBytes(kek: CryptoKey, wrapped: string): Promise<Uint8Array> {
  if (!isEncryptedPassword(wrapped)) throw new Error("Invalid wrapped key");
  const parts = wrapped.slice(PREFIX.length).split(":");
  if (parts.length !== 2) throw new Error("Invalid wrapped key");
  const iv = b64ToBytes(parts[0]);
  const cipher = b64ToBytes(parts[1]);
  const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, kek, cipher);
  return new Uint8Array(buf);
}

async function persistDek(userId: string, dek: CryptoKey): Promise<void> {
  const jwk = await crypto.subtle.exportKey("jwk", dek);
  vaultKey = await crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, jwk } satisfies StoredVaultKey));
}

function readStoredKey(): StoredVaultKey | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredVaultKey;
    if (!parsed?.userId || !parsed?.jwk) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function hydrateVaultKey(): Promise<CryptoKey | null> {
  if (vaultKey) return vaultKey;
  const stored = readStoredKey();
  if (!stored) return null;
  try {
    vaultKey = await crypto.subtle.importKey("jwk", stored.jwk, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
    return vaultKey;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    vaultKey = null;
    return null;
  }
}

export async function wrapDekWithSecret(dek: CryptoKey, secret: string): Promise<VaultWrap> {
  const wrapSalt = randomSalt();
  const kek = await deriveKek(secret, wrapSalt);
  const wrappedDek = await wrapBytes(kek, await dekToRaw(dek));
  return { wrappedDek, wrapSalt };
}

export async function unwrapDekWithSecret(secret: string, wrap: VaultWrap): Promise<CryptoKey> {
  const kek = await deriveKek(secret, wrap.wrapSalt);
  const raw = await unwrapBytes(kek, wrap.wrappedDek);
  return importAesKey(raw, true);
}

export async function createVault(userId: string, accountPassword: string): Promise<VaultSetupPayload> {
  const dek = await generateDek();
  const passwordWrap = await wrapDekWithSecret(dek, accountPassword);
  const recoveryKey = generateRecoveryKey();
  const recoveryWrap = await wrapDekWithSecret(dek, recoveryKey);
  await persistDek(userId, dek);
  return {
    ...passwordWrap,
    recoveryWrappedDek: recoveryWrap.wrappedDek,
    recoveryWrapSalt: recoveryWrap.wrapSalt,
    recoveryKey,
  };
}

export async function unlockVaultWithPassword(userId: string, accountPassword: string, wrap: VaultWrap): Promise<void> {
  const dek = await unwrapDekWithSecret(accountPassword, wrap);
  await persistDek(userId, dek);
}

export async function unlockVaultWithRecovery(userId: string, recoveryKey: string, wrap: VaultWrap): Promise<CryptoKey> {
  const dek = await unwrapDekWithSecret(recoveryKey, wrap);
  await persistDek(userId, dek);
  return dek;
}

export async function wrapCurrentDek(secret: string): Promise<VaultWrap> {
  const key = await hydrateVaultKey();
  if (!key) throw new Error("Vault is locked. Sign in again.");
  return wrapDekWithSecret(key, secret);
}

export async function rewrapDekForNewPassword(newPassword: string): Promise<VaultWrap> {
  return wrapCurrentDek(newPassword);
}

export function clearVault(): void {
  vaultKey = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export async function encryptPasswordWithKey(plaintext: string, key: CryptoKey): Promise<string> {
  if (!plaintext || isEncryptedPassword(plaintext)) return plaintext;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return `${PREFIX}${bytesToB64(iv)}:${bytesToB64(new Uint8Array(cipherBuf))}`;
}

export async function decryptPasswordWithKey(value: string, key: CryptoKey): Promise<string> {
  if (!value || !isEncryptedPassword(value)) return value;
  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 2) return value;
  try {
    const iv = b64ToBytes(parts[0]);
    const cipher = b64ToBytes(parts[1]);
    const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(plainBuf);
  } catch {
    return value;
  }
}

export async function encryptPassword(plaintext: string): Promise<string> {
  const key = await hydrateVaultKey();
  if (!key) {
    throw new Error("Vault key is not available. Sign in again to save passwords.");
  }
  return encryptPasswordWithKey(plaintext, key);
}

export async function decryptPassword(value: string): Promise<string> {
  const key = await hydrateVaultKey();
  if (!key) return value;
  return decryptPasswordWithKey(value, key);
}

export async function decryptRecord<T extends { password?: string | null }>(record: T): Promise<T> {
  if (!record?.password) return record;
  const password = await decryptPassword(record.password);
  if (password === record.password) return record;
  return { ...record, password };
}

export async function decryptRecords<T extends { password?: string | null }>(records: T[]): Promise<T[]> {
  return Promise.all(records.map((record) => decryptRecord(record)));
}
