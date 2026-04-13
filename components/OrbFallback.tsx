import React from "react";
import { View, StyleSheet } from "react-native";
import { AWAKENED_CORE_COLOR } from "@/constants/chakras";

interface OrbFallbackProps {
  layers: string[];
  size: number;
  isAwakened?: boolean;
}

export const OrbFallback: React.FC<OrbFallbackProps> = ({ layers, size, isAwakened = false }) => {
  const palette = layers.length > 0 ? layers : ["#c4b5fd", "#f9a8d4"];
  const safeSize = Math.max(size, 96);

  return (
    <View style={[styles.container, { width: safeSize, height: safeSize }]}>
      <View
        style={[
          styles.glow,
          {
            width: safeSize * 0.96,
            height: safeSize * 0.96,
            borderRadius: safeSize * 0.48,
          },
        ]}
      />
      {[...palette].reverse().map((color, index) => {
        const layerSize = safeSize * (0.36 + index * 0.1);
        return (
          <View
            key={`${color}-${index}`}
            style={[
              styles.layer,
              {
                width: layerSize,
                height: layerSize,
                borderRadius: layerSize / 2,
                backgroundColor: color,
                opacity: Math.max(0.22, 0.72 - index * 0.08),
                transform: [
                  { translateY: (index - palette.length / 2) * 2 },
                  { scaleX: 1 - index * 0.02 },
                ],
              },
            ]}
          />
        );
      })}
      {isAwakened && (
        <View
          style={[
            styles.core,
            {
              width: safeSize * 0.16,
              height: safeSize * 0.16,
              borderRadius: safeSize * 0.08,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(167,139,250,0.12)",
    shadowColor: "#a78bfa",
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  layer: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  core: {
    position: "absolute",
    backgroundColor: `${AWAKENED_CORE_COLOR}D1`,
    shadowColor: AWAKENED_CORE_COLOR,
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
});
