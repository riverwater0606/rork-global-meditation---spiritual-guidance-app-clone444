const readFlag = (value: string | undefined) => {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
};

const isProductionBuild = process.env.NODE_ENV === "production";

const localDevOverride = readFlag(process.env.EXPO_PUBLIC_LOCAL_DEV);
const fullMockOverride = readFlag(process.env.EXPO_PUBLIC_DEV_FULL_MOCK);

export const IS_LOCAL_DEV = localDevOverride ?? !isProductionBuild;
export const IS_DEV_FULL_MOCK = fullMockOverride ?? !isProductionBuild;

export const ENV_FLAG_SUMMARY = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  localDev: IS_LOCAL_DEV,
  devFullMock: IS_DEV_FULL_MOCK,
};
