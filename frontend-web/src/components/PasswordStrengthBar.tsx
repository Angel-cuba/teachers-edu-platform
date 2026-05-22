import { useLang } from '../contexts/LanguageContext';
import { getPasswordStrength } from '../utils/passwordUtils';

const BARS   = { weak: 1, medium: 2, strong: 3 } as const;
const COLORS = { weak: 'bg-red-400', medium: 'bg-yellow-400', strong: 'bg-green-500' } as const;
const TEXT   = {
  weak:   'text-red-500',
  medium: 'text-yellow-600 dark:text-yellow-400',
  strong: 'text-green-600 dark:text-green-400',
} as const;

interface Props { password: string }

export function PasswordStrengthBar({ password }: Props) {
  const { t } = useLang();
  if (!password) return null;
  const strength = getPasswordStrength(password);
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= BARS[strength] ? COLORS[strength] : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${TEXT[strength]}`}>
        {t.common.passwordStrength[strength]}
      </span>
    </div>
  );
}
