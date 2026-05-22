import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { getPasswordStrength } from '../utils/passwordUtils';

const BARS       = { weak: 1, medium: 2, strong: 3 } as const;
const BAR_COLOR  = { weak: '#F87171', medium: '#FBBF24', strong: '#4ADE80' } as const;
const TEXT_COLOR = { weak: '#EF4444', medium: '#D97706', strong: '#16A34A' } as const;

interface Props { password: string }

export function PasswordStrengthBar({ password }: Props) {
  const { colors } = useTheme();
  const { t } = useLang();
  if (!password) return null;
  const strength = getPasswordStrength(password);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={{
            flex: 1, height: 4, borderRadius: 2,
            backgroundColor: i <= BARS[strength] ? BAR_COLOR[strength] : colors.inputBorder,
          }}
        />
      ))}
      <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_COLOR[strength], minWidth: 40 }}>
        {t.common.passwordStrength[strength]}
      </Text>
    </View>
  );
}
