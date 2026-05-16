import { Tabs } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BookOpen, Home, Bell, User, ClipboardList } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LanguageContext';

/** Language toggle shown in every tab's header (top-right) */
function LangToggle() {
  const { lang, setLang, colors, isDark } = (() => {
    const { lang, setLang } = useLang();
    const { colors, isDark } = useTheme();
    return { lang, setLang, colors, isDark };
  })();

  return (
    <TouchableOpacity
      onPress={() => setLang(lang === 'en' ? 'es' : 'en')}
      style={[
        styles.langBtn,
        {
          backgroundColor: isDark ? '#1E293B' : '#F3F4F6',
          borderColor: isDark ? '#334155' : '#E5E7EB',
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={styles.flag}>{lang === 'en' ? '🇬🇧' : '🇪🇸'}</Text>
      <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#374151' }]}>
        {lang.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLang();

  const headerRight = () => <LangToggle />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#9CA3AF',
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.tabBar,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerTintColor: colors.text,
        headerRight,
        headerRightContainerStyle: { paddingRight: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.dashboard,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          headerTitle: t.nav.dashboard,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: t.nav.courses,
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          headerTitle: t.nav.courses,
        }}
      />
      <Tabs.Screen
        name="results"
        options={user?.role === 'STUDENT' ? {
          title: t.nav.results,
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
          headerTitle: t.nav.results,
        } : {
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t.nav.notifications,
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          headerTitle: t.nav.notifications,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.nav.profile,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          headerTitle: t.nav.profile,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  flag: {
    fontSize: 15,
    lineHeight: 19,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
