import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  BookOpen, Pencil, Calculator, Atom, Globe,
  Lightbulb, Trophy, Sparkles, FlaskConical, Music,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

// ── Floating classroom icons ──────────────────────────────────────────────────
// Each icon is absolutely positioned and animates indefinitely.
// Fixed values (no Math.random) so the animation is deterministic across renders.
// `amp`    → vertical float amplitude in px
// `rot`    → ± rotation in degrees
// `dur`    → full cycle duration in seconds
// `delay`  → start delay in seconds (creates natural stagger between icons)
interface IconDef {
  Icon: LucideIcon;
  size: number;
  left: string;
  top: string;
  amp: number;
  rot: number;
  dur: number;
  delay: number;
}

const CLASSROOM_ICONS: IconDef[] = [
  { Icon: BookOpen,     size: 22, left: '7%',  top: '11%', amp: 18, rot: 8,  dur: 4.8, delay: 0.0 },
  { Icon: Pencil,       size: 18, left: '83%', top: '9%',  amp: 14, rot: -12,dur: 5.3, delay: 0.7 },
  { Icon: Calculator,   size: 16, left: '5%',  top: '50%', amp: 20, rot: 6,  dur: 4.1, delay: 1.4 },
  { Icon: Atom,         size: 21, left: '88%', top: '46%', amp: 16, rot: 10, dur: 5.7, delay: 0.3 },
  { Icon: Globe,        size: 19, left: '9%',  top: '79%', amp: 12, rot: -7, dur: 4.6, delay: 2.0 },
  { Icon: Lightbulb,    size: 17, left: '84%', top: '74%', amp: 22, rot: 9,  dur: 3.9, delay: 0.5 },
  { Icon: Trophy,       size: 15, left: '63%', top: '6%',  amp: 15, rot: -5, dur: 5.1, delay: 1.8 },
  { Icon: Sparkles,     size: 16, left: '27%', top: '87%', amp: 19, rot: 13, dur: 4.4, delay: 1.1 },
  { Icon: FlaskConical, size: 15, left: '72%', top: '85%', amp: 17, rot: -8, dur: 5.9, delay: 2.4 },
  { Icon: Music,        size: 14, left: '18%', top: '6%',  amp: 13, rot: 7,  dur: 4.2, delay: 0.9 },
];
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-page wrapper for auth screens (login / register).
 *
 * Layers (back → front):
 *  1. Dot-grid texture (CSS background)
 *  2. Three large radial-gradient orbs with mouse parallax (framer-motion springs)
 *  3. Ten small classroom icons that float + wobble in infinite loops
 *  4. z-10 content wrapper (the card)
 *
 * Using radial-gradient for orbs (not filter:blur) avoids the overflow:hidden
 * clipping issue — gradient falloff IS the soft edge, no GPU blur needed.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const sx = useSpring(rawX, { stiffness: 50, damping: 20 });
  const sy = useSpring(rawY, { stiffness: 50, damping: 20 });

  const o1x = useTransform(sx, [0, 1], [-70, 70]);
  const o1y = useTransform(sy, [0, 1], [-70, 70]);
  const o2x = useTransform(sx, [0, 1], [50, -50]);
  const o2y = useTransform(sy, [0, 1], [50, -50]);
  const o3x = useTransform(sx, [0, 1], [-35, 35]);
  const o3y = useTransform(sy, [0, 1], [35, -35]);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden
                 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50
                 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950"
      onMouseMove={(e) => {
        rawX.set(e.clientX / window.innerWidth);
        rawY.set(e.clientY / window.innerHeight);
      }}
    >
      {/* ── 1. Dot-grid texture ───────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          backgroundImage: 'radial-gradient(rgba(99,102,241,0.09) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          backgroundImage: 'radial-gradient(rgba(165,180,252,0.14) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── 2. Radial-gradient orbs (mouse parallax) ─────────────────────── */}
      <motion.div
        aria-hidden
        style={{
          x: o1x, y: o1y,
          background: 'radial-gradient(circle, rgba(99,102,241,0.70) 0%, rgba(99,102,241,0.30) 40%, transparent 70%)',
        }}
        className="absolute -top-24 -left-24 w-[800px] h-[800px] pointer-events-none opacity-60 dark:opacity-80"
      />
      <motion.div
        aria-hidden
        style={{
          x: o2x, y: o2y,
          background: 'radial-gradient(circle, rgba(139,92,246,0.65) 0%, rgba(139,92,246,0.25) 40%, transparent 70%)',
        }}
        className="absolute -bottom-24 -right-24 w-[750px] h-[750px] pointer-events-none opacity-50 dark:opacity-75"
      />
      <motion.div
        aria-hidden
        style={{
          x: o3x, y: o3y,
          background: 'radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(59,130,246,0.20) 40%, transparent 70%)',
        }}
        className="absolute -top-16 right-1/4 w-[550px] h-[550px] pointer-events-none opacity-40 dark:opacity-60"
      />

      {/* ── 3. Floating classroom icons ───────────────────────────────────── */}
      {CLASSROOM_ICONS.map(({ Icon, size, left, top, amp, rot, dur, delay }, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="absolute pointer-events-none
                     text-indigo-500/40 dark:text-indigo-300/25"
          style={{ left, top }}
          animate={{
            y: [0, -amp, 0],
            rotate: [-rot, rot, -rot],
          }}
          transition={{
            duration: dur,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon size={size} strokeWidth={1.5} />
        </motion.div>
      ))}

      {/* ── 4. Content ────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
