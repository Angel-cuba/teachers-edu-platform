import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Returns an Animated.Value that loops smoothly between 0 and 1.
 *
 * @param duration   Half-cycle duration in ms (0→1 takes this long, then 1→0 same).
 * @param initialPhase  Starting value (0–1). Use different values per orb so they
 *                      begin at different points in the cycle — natural stagger,
 *                      no setTimeout needed.
 *
 * Animations run via useNativeDriver: true (compositor thread, no JS overhead).
 */
export function useOrbAnimation(duration: number, initialPhase: number): Animated.Value {
  const anim = useRef(new Animated.Value(initialPhase)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // `anim` is a stable ref — safe to omit from deps.

  return anim;
}
