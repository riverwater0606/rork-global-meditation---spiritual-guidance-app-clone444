import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder } from "react-native";

export const createGardenDrawerConfig = (screenHeight: number) => ({
  COLLAPSED_DRAWER_HEIGHT: Math.min(screenHeight * 0.17, 154),
  EXPANDED_DRAWER_HEIGHT:
    screenHeight < 760
      ? Math.min(screenHeight * 0.45, 374)
      : Math.min(screenHeight * 0.48, 400),
});

export function useGardenDrawer(params: {
  collapsedHeight: number;
  expandedHeight: number;
}) {
  const { collapsedHeight, expandedHeight } = params;
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const drawerHeight = useRef(new Animated.Value(collapsedHeight)).current;
  const drawerHeightRef = useRef(collapsedHeight);

  useEffect(() => {
    drawerHeightRef.current = isDrawerExpanded ? expandedHeight : collapsedHeight;
  }, [collapsedHeight, expandedHeight, isDrawerExpanded]);

  const animateDrawerTo = (toValue: number, expanded: boolean) => {
    Animated.spring(drawerHeight, {
      toValue,
      useNativeDriver: false,
      bounciness: 4,
    }).start(() => {
      drawerHeightRef.current = toValue;
      setIsDrawerExpanded(expanded);
    });
  };

  const revealDrawer = () => {
    animateDrawerTo(expandedHeight, true);
  };

  const collapseDrawer = () => {
    animateDrawerTo(collapsedHeight, false);
  };

  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 6,
      onPanResponderGrant: () => {
        drawerHeight.setOffset(drawerHeightRef.current);
        drawerHeight.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const nextHeight = Math.max(
          collapsedHeight,
          Math.min(expandedHeight, drawerHeightRef.current - gestureState.dy)
        );
        drawerHeight.setValue(nextHeight - drawerHeightRef.current);
      },
      onPanResponderRelease: (_, gestureState) => {
        drawerHeight.flattenOffset();
        const currentHeight =
          typeof (drawerHeight as any).__getValue === "function"
            ? (drawerHeight as any).__getValue()
            : drawerHeightRef.current;
        const midpoint = (collapsedHeight + expandedHeight) / 2;
        const shouldExpand = currentHeight > midpoint || gestureState.vy < -0.45;
        animateDrawerTo(shouldExpand ? expandedHeight : collapsedHeight, shouldExpand);
      },
    })
  ).current;

  return {
    isDrawerExpanded,
    drawerHeight,
    drawerPanResponder,
    animateDrawerTo,
    revealDrawer,
    collapseDrawer,
  };
}
