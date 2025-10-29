export const Easing = {
  in: (x: any) => x,
  out: (x: any) => x,
  inOut: (x: any) => x,
  linear: (x: any) => x,
};

export function useSharedValue<T>(value: T) {
  return { value } as { value: T };
}

export function useAnimatedStyle<T>(_updater: () => T) {
  return {} as Record<string, unknown>;
}

export function withTiming<T>(value: T) {
  return value;
}

export function withDelay<T>(_delay: number, value: T) {
  return value;
}

export function withSpring<T>(value: T) {
  return value;
}

export function runOnJS<T extends (...args: any[]) => any>(fn: T) {
  return fn;
}

export function runOnUI<T extends (...args: any[]) => any>(fn: T) {
  return fn;
}

export default {};
