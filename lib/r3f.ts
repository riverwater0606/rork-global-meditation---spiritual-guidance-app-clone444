import { Platform } from "react-native";
import * as FiberWeb from "@react-three/fiber";
import * as FiberNative from "@react-three/fiber/native";
import type { ThreeEvent } from "@react-three/fiber";

const fiber: typeof FiberWeb = Platform.OS === "web" ? FiberWeb : (FiberNative as typeof FiberWeb);

export const Canvas = fiber.Canvas;
export const useFrame = fiber.useFrame;
export const useThree = fiber.useThree;

export type { ThreeEvent };
