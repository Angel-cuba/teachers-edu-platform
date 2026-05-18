import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useOrbAnimation } from '../../hooks/useOrbAnimation';

const ROLES = [
  { label: 'Soy alumno', value: 'STUDENT' },
  { label: 'Soy profesor', value: 'TEACHER' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [loading, setLoading] = useState(false);

  // Same three orbs as login — different durations/phases so they don't sync
  const a1 = useOrbAnimation(4800, 0.2);
  const a2 = useOrbAnimation(6200, 0.6);
  const a3 = useOrbAnimation(3900, 0.1);

  const orb1Y       = a1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const orb1Opacity = a1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.10, 0.22, 0.10] });

  const orb2Y       = a2.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  const orb2X       = a2.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const orb2Opacity = a2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.14, 0.26, 0.14] });

  const orb3Scale   = a3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.20] });
  const orb3Opacity = a3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.07, 0.18, 0.07] });

  async function handleRegister() {
    if (!name || !email || !password) return Alert.alert('Error', 'Completa todos los campos');
    if (password.length < 6) return Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, role);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error)?.message ?? 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      {/* ── Animated header (matches login) ─────────────────────────────── */}
      <View style={{
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 64,
        paddingBottom: 36,
        overflow: 'hidden',
      }}>
        {/* Orb 1 — large, top-right */}
        <Animated.View style={{
          position: 'absolute',
          width: 280, height: 280, borderRadius: 140,
          backgroundColor: '#ffffff',
          top: -80, right: -80,
          opacity: orb1Opacity,
          transform: [{ translateY: orb1Y }],
        }} />

        {/* Orb 2 — medium, bottom-right */}
        <Animated.View style={{
          position: 'absolute',
          width: 200, height: 200, borderRadius: 100,
          backgroundColor: '#818CF8',
          bottom: -50, right: -40,
          opacity: orb2Opacity,
          transform: [{ translateY: orb2Y }, { translateX: orb2X }],
        }} />

        {/* Orb 3 — small, centre pulse */}
        <Animated.View style={{
          position: 'absolute',
          width: 150, height: 150, borderRadius: 75,
          backgroundColor: '#ffffff',
          top: '20%', left: '15%',
          opacity: orb3Opacity,
          transform: [{ scale: orb3Scale }],
        }} />

        <Text style={{
          fontSize: 28, fontWeight: '800', color: '#fff',
          letterSpacing: -0.5, zIndex: 1,
        }}>
          EduPlatform
        </Text>
        <Text style={{ color: '#C7D2FE', marginTop: 3, fontSize: 14, zIndex: 1 }}>
          Únete a la plataforma
        </Text>
      </View>

      {/* ── Scrollable form card ─────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.card, marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        contentContainerStyle={{ padding: 28, paddingTop: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 20 }}>
          Crear cuenta
        </Text>

        {/* Role selector */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.value}
              onPress={() => setRole(r.value as 'STUDENT' | 'TEACHER')}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                borderWidth: 2,
                borderColor: role === r.value ? '#4F46E5' : colors.inputBorder,
                backgroundColor: role === r.value ? (isDark ? '#1E1B4B' : '#EEF2FF') : colors.card,
              }}
            >
              <Text style={{
                fontWeight: '600', fontSize: 14,
                color: role === r.value ? '#4F46E5' : colors.textSecondary,
              }}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nombre */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
            Nombre completo
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
            style={{
              borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
              paddingHorizontal: 16, paddingVertical: 13,
              fontSize: 15, color: colors.text, backgroundColor: colors.inputBg,
            }}
          />
        </View>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
            Correo electrónico
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            style={{
              borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
              paddingHorizontal: 16, paddingVertical: 13,
              fontSize: 15, color: colors.text, backgroundColor: colors.inputBg,
            }}
          />
        </View>

        {/* Contraseña */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
            Contraseña
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            borderWidth: 1.5, borderColor: colors.inputBorder,
            borderRadius: 12, backgroundColor: colors.inputBg,
          }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              style={{ paddingHorizontal: 14 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showPassword
                ? <EyeOff color={colors.textMuted} size={20} />
                : <Eye color={colors.textMuted} size={20} />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#A5B4FC' : '#4F46E5',
            borderRadius: 12, paddingVertical: 15,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>¿Ya tienes cuenta?</Text>
          <Link href="/(auth)/login" style={{ color: '#4F46E5', fontWeight: '600', fontSize: 14 }}>
            Inicia sesión
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
