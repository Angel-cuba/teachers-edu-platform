const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER   = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS  = '0123456789';
const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const ALL     = UPPER + LOWER + DIGITS + SPECIAL;

/** Returns a cryptographically random integer in [0, max). */
function randInt(max: number): number {
  // Rejection sampling to avoid modulo bias
  const limit = Math.floor(0x100000000 / max) * max;
  let n: number;
  do { n = crypto.getRandomValues(new Uint32Array(1))[0]; } while (n >= limit);
  return n % max;
}

/** Generates a cryptographically random strong password (16 chars by default). */
export function generatePassword(length = 16): string {
  const required = [
    UPPER  [randInt(UPPER.length)],
    LOWER  [randInt(LOWER.length)],
    DIGITS [randInt(DIGITS.length)],
    SPECIAL[randInt(SPECIAL.length)],
  ];
  const rest = Array.from({ length: length - required.length }, () =>
    ALL[randInt(ALL.length)]
  );
  // Fisher-Yates shuffle with crypto random
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

/** Returns the visual strength level based on length and character variety. */
export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';
  const checks = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  if (password.length >= 12 && checks >= 3) return 'strong';
  if (password.length >= 8  && checks >= 2) return 'medium';
  return 'weak';
}
