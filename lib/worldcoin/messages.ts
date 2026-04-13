import type { Language } from "@/providers/SettingsProvider";

export function getOpenInWorldAppMessage(lang: Language) {
  if (lang === "zh") return "請在 World App 內打開 PSI-G";
  if (lang === "es") return "Abre PSI-G dentro de World App";
  return "Please open PSI-G inside World App";
}

export function getMiniKitUnavailableMessage(lang: Language) {
  if (lang === "zh") {
    return "目前裝置未安裝 World App 或不支援 MiniKit，無法選擇聯絡人錢包";
  }
  if (lang === "es") {
    return "World App o MiniKit no está disponible en este dispositivo, así que no se puede elegir la cartera del contacto.";
  }
  return "World App or MiniKit is unavailable on this device, so a contact wallet cannot be selected.";
}

export function getWorldAppUpdateRequiredMessage(lang: Language) {
  if (lang === "zh") {
    return "目前 World App 版本不支援此功能，請先更新後再試。";
  }
  if (lang === "es") {
    return "Esta función requiere una versión más reciente de World App. Actualízala e inténtalo de nuevo.";
  }
  return "This feature requires a newer World App version. Please update and try again.";
}
