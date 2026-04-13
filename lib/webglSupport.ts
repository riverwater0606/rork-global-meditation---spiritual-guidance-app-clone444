import { Platform } from "react-native";

let cachedWebGLSupport: boolean | null = null;

export function canUseWebGL(): boolean {
  if (Platform.OS !== "web") {
    return true;
  }

  if (cachedWebGLSupport !== null) {
    return cachedWebGLSupport;
  }

  if (typeof navigator !== "undefined") {
    const userAgent = navigator.userAgent || "";
    if (navigator.webdriver || /HeadlessChrome/i.test(userAgent)) {
      cachedWebGLSupport = false;
      return cachedWebGLSupport;
    }
  }

  if (typeof document === "undefined") {
    return true;
  }

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl") ||
      canvas.getContext("webgl2");

    cachedWebGLSupport = Boolean(gl);
    return cachedWebGLSupport;
  } catch {
    cachedWebGLSupport = false;
    return cachedWebGLSupport;
  }
}
