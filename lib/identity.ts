import type { Language as AppLanguage } from "@/providers/SettingsProvider";

interface IdentityProfileLike {
  name?: string;
  username?: string;
}

export function shortenWalletAddress(walletAddress?: string | null) {
  if (!walletAddress) return "";
  if (walletAddress.length <= 10) return walletAddress;
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

export function getPreferredIdentityLabel({
  profile,
  walletAddress,
  lang,
  fallbackZh,
  fallbackEn,
}: {
  profile?: IdentityProfileLike | null;
  walletAddress?: string | null;
  lang: AppLanguage;
  fallbackZh: string;
  fallbackEn: string;
}) {
  return (
    profile?.name ||
    profile?.username ||
    shortenWalletAddress(walletAddress) ||
    (lang === "zh" ? fallbackZh : fallbackEn)
  );
}
