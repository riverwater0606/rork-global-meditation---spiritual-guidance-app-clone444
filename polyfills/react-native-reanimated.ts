import React, { ComponentType, forwardRef } from 'react';
import { ScrollView, Text, View } from 'react-native';

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

export function useEvent<T extends (...args: any[]) => unknown>(handler: T, _events?: string[], _rebuild?: boolean): T {
  return ((...args: Parameters<T>) => handler(...args)) as T;
}

export function setGestureState(): void {
  // no-op shim for web builds
}

export function createAnimatedComponent<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  const AnimatedComponent = forwardRef<any, P>((props, ref) =>
    React.createElement(Component as ComponentType<P>, { ...props, ref: ref as any })
  );
  AnimatedComponent.displayName = `Animated(${Component.displayName ?? Component.name ?? 'Component'})`;
  return AnimatedComponent;
}

export const Animated = {
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  ScrollView: createAnimatedComponent(ScrollView),
};

const defaultExport = {
  createAnimatedComponent,
  View: Animated.View,
  Text: Animated.Text,
  ScrollView: Animated.ScrollView,
};

export default defaultExport;
