export enum VerificationLevel {
  Orb = "orb",
  SecureDocument = "secure_document",
  Document = "document",
  Device = "device",
}

export interface ISuccessResult {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
  [key: string]: unknown;
}

export interface VerifyCommandInput {
  action: string;
  signal?: string;
  verification_level?: VerificationLevel;
  [key: string]: unknown;
}
