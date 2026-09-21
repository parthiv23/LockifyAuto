export const MALE_AVATARS = [
  "/images/avatars/M1.png",
  "/images/avatars/M2.png",
  "/images/avatars/M3.png",
  "/images/avatars/M4.png",
  "/images/avatars/M5.png",
] as const;

export const FEMALE_AVATARS = [
  "/images/avatars/F1.png",
  "/images/avatars/F2.png",
  "/images/avatars/F3.png",
  "/images/avatars/F4.png",
  "/images/avatars/F5.png",
  "/images/avatars/F6.png",
  "/images/avatars/F7.png",
] as const;

export const ALL_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS] as const;

const LEGACY_AVATAR_HOST = "avatar.iran.liara.run";

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % ALL_AVATARS.length;
  }
  return hash;
}

export function defaultAvatarForUser(seed = "1"): string {
  return ALL_AVATARS[hashSeed(seed) || 0];
}

export function randomAvatar(): string {
  return ALL_AVATARS[Math.floor(Math.random() * ALL_AVATARS.length)];
}

export function resolveAvatarUrl(profileimage?: string | null, seed = "1"): string {
  if (
    profileimage &&
    profileimage.includes("/images/avatars/") &&
    !profileimage.includes(LEGACY_AVATAR_HOST)
  ) {
    return profileimage;
  }
  return defaultAvatarForUser(seed);
}
