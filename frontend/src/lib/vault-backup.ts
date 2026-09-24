import type { PasswordRecord } from "@shared/schema";

export const LUMORA_BACKUP_FORMAT = "lumora-backup";
export const LUMORA_BACKUP_VERSION = 1;

const DESCRIPTION_MAX = 200;
const PBKDF2_ITERATIONS = 100_000;
const PREFIX = "enc:v1:";

export type BackupRecord = {
  email: string;
  password: string;
  description?: string;
  userType?: string;
  starred?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
};

export type LumoraBackup = {
  format: typeof LUMORA_BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  username?: string;
  records: BackupRecord[];
};

export type EncryptedLumoraBackup = {
  format: typeof LUMORA_BACKUP_FORMAT;
  version: number;
  encrypted: true;
  exportedAt: string;
  username?: string;
  wrapSalt: string;
  ciphertext: string;
};

export type ExportFormat = "encrypted" | "json" | "csv";
export type ConflictResolution = "skip" | "replace" | "add";

export type PlannedImportRow = {
  email: string;
  password: string;
  description?: string;
  userType: string;
  starred: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  action: "create" | "replace" | "skip";
  existingId?: string;
  existing?: BackupRecord & { id: string };
  reason?: string;
  conflict?: boolean;
};

export type ImportPlan = {
  rows: PlannedImportRow[];
  toCreate: number;
  toReplace: number;
  skipped: number;
  conflicts: number;
};

export function isDeletedRecord(record: PasswordRecord): boolean {
  return Boolean((record as { isDeleted?: boolean }).isDeleted);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUserType(userType?: string): string {
  return (userType || "gmail").trim().toLowerCase() || "gmail";
}

export function recordMatchKey(email: string, userType?: string): string {
  return `${normalizeEmail(email)}::${normalizeUserType(userType)}`;
}

function selectedRecords(records: PasswordRecord[], includeTrash?: boolean): PasswordRecord[] {
  return records.filter((record) => includeTrash || !isDeletedRecord(record));
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function timezoneOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset();
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  return `${sign}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)}`;
}

/** JSON / API: ISO 8601 with timezone, e.g. 2026-09-24T18:01:00+05:30 */
export function formatJsonDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}${timezoneOffset(date)}`;
}

/** Excel / CSV: date Excel can parse, e.g. 2026-09-24 18:01:00 */
export function formatExcelDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function parseBackupDate(value: unknown): Date | undefined {
  if (!value && value !== 0) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;

  const raw = String(value).trim();
  if (!raw) return undefined;

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 20000 && serial < 80000) {
      const excel = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      if (!Number.isNaN(excel.getTime())) return excel;
    }
  }

  const normalized = raw.includes("T") ? raw : raw.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/, "$1T$2");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function jsonDate(value: unknown): string | undefined {
  const date = parseBackupDate(value);
  return date ? formatJsonDate(date) : undefined;
}

function deletedAtIso(value: unknown): string | undefined {
  return jsonDate(value);
}

export function toApiDate(value: unknown): string | undefined {
  const date = parseBackupDate(value);
  return date ? date.toISOString() : undefined;
}

function truthyFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const raw = String(value || "").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

function toBackupRecord(record: PasswordRecord): BackupRecord {
  const isDeleted = isDeletedRecord(record);
  return {
    email: record.email,
    password: record.password,
    description: record.description || undefined,
    userType: record.userType || "gmail",
    starred: Boolean(record.starred),
    isDeleted: isDeleted || undefined,
    deletedAt: isDeleted ? jsonDate((record as { deletedAt?: unknown }).deletedAt) : undefined,
  };
}

export function buildLumoraBackup(
  records: PasswordRecord[],
  options: { username?: string; includeTrash?: boolean } = {},
): LumoraBackup {
  return {
    format: LUMORA_BACKUP_FORMAT,
    version: LUMORA_BACKUP_VERSION,
    exportedAt: formatJsonDate(new Date()),
    username: options.username,
    records: selectedRecords(records, options.includeTrash).map(toBackupRecord),
  };
}

export function backupFilename(username?: string, format: ExportFormat = "json"): string {
  const day = new Date().toISOString().slice(0, 10);
  const safeName = (username || "vault").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "vault";
  const suffix = format === "csv" ? "csv" : "json";
  const kind = format === "encrypted" ? "encrypted-" : "";
  return `lumora-backup-${kind}${safeName}-${day}.${suffix}`;
}

export function downloadTextFile(contents: string, filename: string, type: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadLumoraBackup(backup: LumoraBackup | EncryptedLumoraBackup, filename: string): void {
  downloadTextFile(JSON.stringify(backup, null, 2), filename, "application/json");
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildCsvBackup(records: PasswordRecord[], includeTrash?: boolean): string {
  const rows = selectedRecords(records, includeTrash).map((record) => [
    csvEscape(record.email || ""),
    csvEscape(record.password || ""),
    csvEscape(record.description || ""),
    csvEscape(record.userType || "gmail"),
    record.starred ? "true" : "false",
    isDeletedRecord(record) ? "true" : "false",
    (() => {
      const date = parseBackupDate((record as { deletedAt?: unknown }).deletedAt);
      return date && isDeletedRecord(record) ? formatExcelDate(date) : "";
    })(),
  ].join(","));
  return `\uFEFF${["email,password,description,userType,starred,isDeleted,deletedAt", ...rows].join("\r\n")}`;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function headerAlias(name: string): string {
  const key = name.trim().toLowerCase().replace(/[\s_]+/g, "");
  if (["email", "username", "user", "login", "name"].includes(key)) return "email";
  if (["password", "pass", "secret"].includes(key)) return "password";
  if (["description", "notes", "note", "comment"].includes(key)) return "description";
  if (["usertype", "type", "category", "url"].includes(key)) return "userType";
  if (["starred", "favorite", "fav"].includes(key)) return "starred";
  if (["isdeleted", "deleted", "trashed", "intrash"].includes(key)) return "isDeleted";
  if (["deletedat", "deletedon"].includes(key)) return "deletedAt";
  return key;
}

export function parseCsvBackup(text: string): LumoraBackup {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("This CSV has no records.");

  const headers = splitCsvLine(lines[0]).map(headerAlias);
  const emailIndex = headers.indexOf("email");
  const passwordIndex = headers.indexOf("password");
  if (emailIndex < 0 || passwordIndex < 0) {
    throw new Error("CSV must include email (or username) and password columns.");
  }

  const records: BackupRecord[] = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const cell = (name: string) => (headers.includes(name) ? cells[headers.indexOf(name)] : undefined);
    const isDeleted = truthyFlag(cell("isDeleted"));
    return {
      email: cells[emailIndex] || "",
      password: cells[passwordIndex] || "",
      description: cell("description"),
      userType: cell("userType") || "gmail",
      starred: truthyFlag(cell("starred")),
      isDeleted: isDeleted || undefined,
      deletedAt: isDeleted ? jsonDate(cell("deletedAt")) : undefined,
    };
  });

  return {
    format: LUMORA_BACKUP_FORMAT,
    version: LUMORA_BACKUP_VERSION,
    exportedAt: formatJsonDate(new Date()),
    records,
  };
}

function looksLikeCsv(text: string, filename?: string): boolean {
  if (filename?.toLowerCase().endsWith(".csv")) return true;
  const first = text.trimStart().split(/\r?\n/, 1)[0] || "";
  return /email|username|login/i.test(first) && /password/i.test(first) && first.includes(",");
}

export function isEncryptedBackup(value: unknown): value is EncryptedLumoraBackup {
  if (!value || typeof value !== "object") return false;
  const file = value as Partial<EncryptedLumoraBackup>;
  return file.format === LUMORA_BACKUP_FORMAT && file.encrypted === true && typeof file.ciphertext === "string" && typeof file.wrapSalt === "string";
}

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

async function deriveBackupKey(secret: string, saltB64: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64ToBytes(saltB64), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptLumoraBackup(backup: LumoraBackup, passphrase: string): Promise<EncryptedLumoraBackup> {
  const wrapSalt = bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
  const key = await deriveBackupKey(passphrase, wrapSalt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify({ records: backup.records })),
  );
  return {
    format: LUMORA_BACKUP_FORMAT,
    version: LUMORA_BACKUP_VERSION,
    encrypted: true,
    exportedAt: backup.exportedAt,
    username: backup.username,
    wrapSalt,
    ciphertext: `${PREFIX}${bytesToB64(iv)}:${bytesToB64(new Uint8Array(cipherBuf))}`,
  };
}

export async function decryptLumoraBackup(file: EncryptedLumoraBackup, passphrase: string): Promise<LumoraBackup> {
  const key = await deriveBackupKey(passphrase, file.wrapSalt);
  if (!file.ciphertext.startsWith(PREFIX)) throw new Error("This encrypted backup is damaged.");
  const parts = file.ciphertext.slice(PREFIX.length).split(":");
  if (parts.length !== 2) throw new Error("This encrypted backup is damaged.");
  try {
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(parts[0]) },
      key,
      b64ToBytes(parts[1]),
    );
    const inner = JSON.parse(new TextDecoder().decode(plainBuf)) as { records?: BackupRecord[] };
    if (!Array.isArray(inner.records)) throw new Error("This encrypted backup has no records.");
    return {
      format: LUMORA_BACKUP_FORMAT,
      version: LUMORA_BACKUP_VERSION,
      exportedAt: file.exportedAt,
      username: file.username,
      records: inner.records,
    };
  } catch (error: any) {
    if (String(error?.message || "").includes("no records")) throw error;
    throw new Error("Wrong backup password, or the file is damaged.");
  }
}

export function parsePlainLumoraBackup(text: string): LumoraBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("This file is not a Lumora backup.");
  if (isEncryptedBackup(parsed)) {
    throw new Error("ENCRYPTED");
  }
  const file = parsed as Partial<LumoraBackup>;
  if (file.format !== LUMORA_BACKUP_FORMAT) {
    throw new Error("This file is not a Lumora backup. Try a .json or .csv export.");
  }
  if (file.version !== LUMORA_BACKUP_VERSION) {
    throw new Error(`Unsupported backup version (${String(file.version)}).`);
  }
  if (!Array.isArray(file.records)) throw new Error("This backup has no records list.");
  return {
    format: LUMORA_BACKUP_FORMAT,
    version: LUMORA_BACKUP_VERSION,
    exportedAt: jsonDate(file.exportedAt) || formatJsonDate(new Date()),
    username: typeof file.username === "string" ? file.username : undefined,
    records: file.records,
  };
}

export function inspectBackupFile(text: string, filename?: string): { kind: "csv" | "json" | "encrypted"; backup?: LumoraBackup; encrypted?: EncryptedLumoraBackup } {
  if (looksLikeCsv(text, filename)) {
    return { kind: "csv", backup: parseCsvBackup(text) };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Choose a Lumora JSON backup or a CSV file.");
  }
  if (isEncryptedBackup(parsed)) {
    return { kind: "encrypted", encrypted: parsed };
  }
  return { kind: "json", backup: parsePlainLumoraBackup(text) };
}

function existingByKey(records: PasswordRecord[]): Map<string, PasswordRecord> {
  const map = new Map<string, PasswordRecord>();
  for (const record of records) {
    if (isDeletedRecord(record)) continue;
    const key = recordMatchKey(record.email || "", record.userType);
    if (key.startsWith("::")) continue;
    if (!map.has(key)) map.set(key, record);
  }
  return map;
}

export function planLumoraImport(backup: LumoraBackup, existingRecords: PasswordRecord[]): ImportPlan {
  const existing = existingByKey(existingRecords);
  const rows: PlannedImportRow[] = [];

  for (const raw of backup.records) {
    const email = typeof raw?.email === "string" ? raw.email.trim() : "";
    const password = typeof raw?.password === "string" ? raw.password : "";
    const description = typeof raw?.description === "string" ? raw.description.trim().slice(0, DESCRIPTION_MAX) : undefined;
    const userType = normalizeUserType(typeof raw?.userType === "string" ? raw.userType : "gmail");
    const starred = Boolean(raw?.starred);
    const isDeleted = Boolean(raw?.isDeleted);
    const deletedAt = isDeleted ? jsonDate(raw?.deletedAt) : undefined;

    if (!email) {
      rows.push({ email: "", password: "", userType, starred, isDeleted, deletedAt, action: "skip", reason: "Missing email" });
      continue;
    }
    if (!password) {
      rows.push({ email, password: "", userType, starred, isDeleted, deletedAt, action: "skip", reason: "Missing password" });
      continue;
    }
    if (password.startsWith(PREFIX)) {
      rows.push({ email, password: "", userType, starred, isDeleted, deletedAt, action: "skip", reason: "Encrypted password cannot be imported" });
      continue;
    }

    const match = existing.get(recordMatchKey(email, userType));
    if (match) {
      rows.push({
        email,
        password,
        description,
        userType,
        starred,
        isDeleted,
        deletedAt,
        action: "skip",
        conflict: true,
        existingId: match.id,
        existing: {
          id: match.id,
          email: match.email,
          password: match.password,
          description: match.description || undefined,
          userType: match.userType || "gmail",
          starred: Boolean(match.starred),
          isDeleted: isDeletedRecord(match),
          deletedAt: jsonDate((match as { deletedAt?: unknown }).deletedAt),
        },
        reason: "Already in vault",
      });
      continue;
    }

    rows.push({ email, password, description, userType, starred, isDeleted, deletedAt, action: "create" });
  }

  return summarizePlan(rows);
}

export function summarizePlan(rows: PlannedImportRow[]): ImportPlan {
  return {
    rows,
    toCreate: rows.filter((row) => row.action === "create").length,
    toReplace: rows.filter((row) => row.action === "replace").length,
    skipped: rows.filter((row) => row.action === "skip").length,
    conflicts: rows.filter((row) => row.conflict).length,
  };
}

export function applyConflictResolution(row: PlannedImportRow, resolution: ConflictResolution): PlannedImportRow {
  if (!row.conflict) return row;
  if (resolution === "replace") return { ...row, action: "replace", reason: undefined };
  if (resolution === "add") return { ...row, action: "create", reason: undefined };
  return { ...row, action: "skip", reason: "Already in vault" };
}

export function applyAllConflicts(rows: PlannedImportRow[], resolution: ConflictResolution): PlannedImportRow[] {
  return rows.map((row) => applyConflictResolution(row, resolution));
}

export function maskSecret(value?: string): string {
  if (!value) return "—";
  if (value.length <= 2) return "•".repeat(value.length);
  return `${value.slice(0, 1)}${"•".repeat(Math.min(value.length - 2, 10))}${value.slice(-1)}`;
}
