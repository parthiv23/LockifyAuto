import { apiRequest } from "./queryClient";
import {
  createVault,
  decryptPasswordWithKey,
  deriveLegacyRecordKey,
  encryptPassword,
  isEncryptedPassword,
  type VaultSetupPayload,
} from "./vault";

async function saveVaultSetup(token: string, setup: VaultSetupPayload): Promise<void> {
  await apiRequest("PUT", "/api/auth/vault", {
    wrappedDek: setup.wrappedDek,
    wrapSalt: setup.wrapSalt,
    recoveryWrappedDek: setup.recoveryWrappedDek,
    recoveryWrapSalt: setup.recoveryWrapSalt,
    recoveryKey: setup.recoveryKey,
  }, { token });
}

export async function provisionNewVault(
  token: string,
  userId: string,
  accountPassword: string,
): Promise<string> {
  const setup = await createVault(userId, accountPassword);
  await saveVaultSetup(token, setup);
  return setup.recoveryKey;
}

export async function provisionVaultAndMigrateLegacy(
  token: string,
  userId: string,
  accountPassword: string,
): Promise<string> {
  const listRes = await apiRequest("GET", "/api/records", undefined, { token });
  const records = (await listRes.json()) as Array<{ id: string; password?: string }>;
  const oldKey = await deriveLegacyRecordKey(userId, accountPassword);
  const setup = await createVault(userId, accountPassword);

  for (const record of records) {
    if (!record.password || !isEncryptedPassword(record.password)) continue;
    const plain = await decryptPasswordWithKey(record.password, oldKey);
    if (plain === record.password) continue;
    const cipher = await encryptPassword(plain);
    await apiRequest("PUT", `/api/records/${record.id}`, { password: cipher }, { token });
  }

  await saveVaultSetup(token, setup);
  return setup.recoveryKey;
}
