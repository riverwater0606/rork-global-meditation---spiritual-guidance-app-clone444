export const extractContactsFromPayload = (payload: any) => {
  const contacts =
    payload?.contacts ||
    payload?.finalPayload?.contacts ||
    payload?.data?.contacts ||
    payload?.response?.contacts ||
    payload?.result?.contacts ||
    payload?.data?.result?.contacts ||
    payload?.response?.result?.contacts ||
    payload?.payload?.result?.contacts ||
    payload?.data?.payload?.result?.contacts;
  if (Array.isArray(contacts)) return contacts;
  if (payload?.contact) return [payload.contact];
  if (payload?.finalPayload?.contact) return [payload.finalPayload.contact];
  return [];
};

export const extractContactWalletAddress = (contact: any): string => {
  if (!contact) return "";
  const directAddress = contact.walletAddress || contact.wallet_address || contact.address;
  if (directAddress) return directAddress;

  if (Array.isArray(contact.wallets)) {
    const walletEntry = contact.wallets.find(
      (entry: any) => entry?.address || entry?.walletAddress || entry?.wallet_address
    );
    const walletEntryAddress =
      walletEntry?.address || walletEntry?.walletAddress || walletEntry?.wallet_address;
    if (walletEntryAddress) return walletEntryAddress;
  }

  if (contact?.wallet && typeof contact.wallet === "object") {
    const walletAddress =
      contact.wallet.address || contact.wallet.walletAddress || contact.wallet.wallet_address;
    if (walletAddress) return walletAddress;
  }

  if (typeof contact.wallet === "string") return contact.wallet;
  return contact?.account?.address || "";
};

export const formatContactName = (
  contact: any,
  fallbackWallet?: string,
  language: string = "en"
) => {
  const display = contact?.name || contact?.displayName || contact?.username || contact?.handle || "";
  if (display) return display;
  if (fallbackWallet) return `User ${fallbackWallet.slice(0, 4)}`;
  return language === "zh" ? "好友" : "Friend";
};
