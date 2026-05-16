import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Fade + slide-up entrance animation.
 *
 * @param delay     Start delay in ms (default 0). Captured once at mount — changes ignored.
 * @param duration  Animation duration in ms (default 320).
 *
 * Usage:
 *   const anim = useFadeInUp(80);
 *   <Animated.View style={anim}>...</Animated.View>
 */
export function useFadeInUp(delay = 0, duration = 320) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — mount-only; refs and delay are stable

  return { opacity, transform: [{ translateY }] };
}
