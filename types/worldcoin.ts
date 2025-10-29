import type { VerificationLevel } from "@worldcoin/idkit-core";

export interface VerifyCommandInput {
  action: string;
  signal?: string;
  verification_level?: VerificationLevel;
  [key: string]: unknown;
}
