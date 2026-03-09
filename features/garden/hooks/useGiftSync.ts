import { useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { OrbShape } from "@/providers/MeditationProvider";
import { pollGiftOrbs, uploadGiftOrbToCloud } from "@/features/garden/services/giftService";

export function useGiftSync({ walletAddress, receiveGiftOrb, language }: any) {
  const giftPollInFlightRef = useRef(false);

  useEffect(() => {
    if (!walletAddress) return;
    const interval = setInterval(() => {
      const run = async () => {
        if (giftPollInFlightRef.current) return;
        giftPollInFlightRef.current = true;
        try {
          const gifts = await pollGiftOrbs({ myWalletAddress: walletAddress, max: 5 });
          for (const g of gifts) {
            await receiveGiftOrb({
              fromDisplayName: g.fromDisplayName,
              fromWalletAddress: g.from,
              blessing: g.blessing,
              orb: {
                ...g.orb,
                shape: (g.orb.shape as OrbShape | undefined) ?? undefined,
              },
            });
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              language === "zh" ? "🎁 收到光球" : "🎁 Gift Received",
              language === "zh"
                ? `你收到來自 ${g.fromDisplayName || "朋友"} 的光球`
                : `You received an orb from ${g.fromDisplayName || "Friend"}`
            );
          }
        } catch {
          Alert.alert(language === "zh" ? "傳送失敗，請重試" : "Send failed, please retry");
        } finally {
          giftPollInFlightRef.current = false;
        }
      };
      void run();
    }, 6000);

    return () => clearInterval(interval);
  }, [walletAddress, receiveGiftOrb, language]);

  return { uploadGiftOrbToCloud };
}
