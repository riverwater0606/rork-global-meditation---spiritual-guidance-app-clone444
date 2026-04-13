import React from "react";
import { confirmVipPayment } from "@/lib/worldcoin/pay";
import type { Language } from "@/providers/SettingsProvider";

type ConfirmationProfile = {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
};

type PendingPayment = {
  reference: string;
  verificationToken: string;
  paymentResult: Record<string, unknown>;
} | null;

export function useVipConfirmationSync(params: {
  enabled: boolean;
  pendingPayment: PendingPayment;
  authToken: string | null;
  lang: Language;
  profile: {
    name: string;
    email: string;
    username?: string;
    avatarUrl?: string;
  };
  unlockVIP: () => Promise<void>;
  grantVipStarterPack: () => Promise<void>;
  markVIPConfirmPending: (pending: boolean, pendingPayment?: PendingPayment) => Promise<void>;
  updateProfile: (updates: Partial<{ name: string; email: string; username?: string; avatarUrl?: string }>) => Promise<void>;
  onNotice: (message: string | null) => void;
}) {
  const {
    enabled,
    pendingPayment,
    authToken,
    lang,
    profile,
    unlockVIP,
    grantVipStarterPack,
    markVIPConfirmPending,
    updateProfile,
    onNotice,
  } = params;

  const confirmationRunnerRef = React.useRef(false);
  const [retryTick, setRetryTick] = React.useState(0);
  const [lastConfirmationError, setLastConfirmationError] = React.useState<string | null>(null);
  const t = React.useCallback(
    (zh: string, en: string, es: string) => {
      if (lang === "zh") return zh;
      if (lang === "es") return es;
      return en;
    },
    [lang]
  );
  const retryConfirmation = React.useCallback(() => {
    setRetryTick((tick) => tick + 1);
  }, []);

  React.useEffect(() => {
    if (!enabled || !pendingPayment || confirmationRunnerRef.current) {
      return;
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    confirmationRunnerRef.current = true;

    void (async () => {
      try {
        onNotice(
          t(
            "付款已送出，正在等待鏈上確認。確認完成後會自動開通 VIP，請勿重複付款。",
            "Payment submitted. Waiting for on-chain confirmation. VIP will activate automatically once confirmed. Please do not pay again.",
            "Pago enviado. Esperando la confirmación en cadena. VIP se activará automáticamente cuando se confirme. No vuelvas a pagar."
          )
        );

        const confirmation = await confirmVipPayment(
          pendingPayment.paymentResult,
          pendingPayment.reference,
          pendingPayment.verificationToken,
          authToken
        );

        if (cancelled) return;

        setLastConfirmationError(null);
        await unlockVIP();
        await grantVipStarterPack();
        await markVIPConfirmPending(false, null);
        onNotice(null);

        const confirmedProfile = (confirmation as { profile?: ConfirmationProfile })?.profile;
        if (confirmedProfile) {
          await updateProfile({
            name: confirmedProfile.displayName || confirmedProfile.username || profile.name,
            email: confirmedProfile.email || profile.email,
            username: confirmedProfile.username || profile.username,
            avatarUrl: confirmedProfile.avatarUrl || profile.avatarUrl,
          });
        }
      } catch (confirmationError) {
        console.error("[VIP] Background confirmation error", confirmationError);
        if (cancelled) return;
        const errorMessage =
          confirmationError instanceof Error && confirmationError.message
            ? confirmationError.message
            : null;
        setLastConfirmationError(errorMessage || t("未知確認錯誤", "Unknown confirmation error", "Error de confirmación desconocido"));
        onNotice(
          errorMessage && !/timed out|waiting|timeout/i.test(errorMessage)
            ? t(
                `VIP 確認暫時未成功：${errorMessage}。系統會自動重試，你亦可手動刷新確認。`,
                `VIP confirmation has not succeeded yet: ${errorMessage}. The app will retry automatically, and you can also refresh confirmation manually.`,
                `La confirmación VIP aún no se ha completado: ${errorMessage}. La app volverá a intentarlo automáticamente y también puedes actualizar la confirmación manualmente.`
              )
            : t(
                "仍在等待鏈上確認。系統會自動重試；你亦可在下方手動刷新確認。請勿重複付款。",
                "Still waiting for on-chain confirmation. The app will retry automatically, and you can also refresh confirmation below. Please do not pay again.",
                "Aún se está esperando la confirmación en cadena. La app volverá a intentarlo automáticamente y también puedes actualizar la confirmación abajo. No vuelvas a pagar."
              )
        );
        retryTimer = setTimeout(() => {
          setRetryTick((tick) => tick + 1);
        }, 8000);
      } finally {
        if (!cancelled) {
          confirmationRunnerRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      confirmationRunnerRef.current = false;
    };
  }, [
    authToken,
    enabled,
    grantVipStarterPack,
    lang,
    markVIPConfirmPending,
    onNotice,
    pendingPayment,
    profile.avatarUrl,
    profile.email,
    profile.name,
    profile.username,
    retryTick,
    unlockVIP,
    updateProfile,
  ]);

  return {
    lastConfirmationError,
    retryConfirmation,
  };
}
