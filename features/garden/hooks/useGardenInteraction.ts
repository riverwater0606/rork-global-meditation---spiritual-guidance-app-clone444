import { useRef, useState } from "react";
import { PanResponder } from "react-native";

export function useGardenInteraction({ setSharedSpinVelocity, isMeditating, onTap, onSwipeUp, onSwipeDown, onStopGathering }: any) {
  const interactionState = useRef({ mode: "idle", spinVelocity: 0, spinVelocityX: 0, progress: 0 });
  const [isOrbDragging, setIsOrbDragging] = useState(false);
  const isOrbDraggingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        if (!isOrbDraggingRef.current) {
          isOrbDraggingRef.current = true;
          setIsOrbDragging(true);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const newVelocity = -gestureState.vx * 0.5;
        interactionState.current.spinVelocity = newVelocity;
        setSharedSpinVelocity(newVelocity);
        const { dy, vy, dx } = gestureState;
        const canSwipe = ["gather", "idle", "diffused"].includes(interactionState.current.mode);
        if (canSwipe && Math.abs(dy) > Math.abs(dx) && dy < -60 && vy < -0.2) onSwipeUp();
        if (canSwipe && Math.abs(dy) > Math.abs(dx) && dy > 60 && vy > 0.2) onSwipeDown();
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isOrbDraggingRef.current) {
          isOrbDraggingRef.current = false;
          setIsOrbDragging(false);
        }
        const isTap = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10 && Math.abs(gestureState.vx) < 0.1 && Math.abs(gestureState.vy) < 0.1;
        if (isTap && !isMeditating) onTap();
        onStopGathering();
      },
      onPanResponderTerminate: () => {
        if (isOrbDraggingRef.current) {
          isOrbDraggingRef.current = false;
          setIsOrbDragging(false);
        }
        onStopGathering();
      },
    })
  ).current;

  return { interactionState, panResponder, isOrbDragging };
}
