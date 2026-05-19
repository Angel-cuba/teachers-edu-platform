import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Link } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useOrbAnimation } from '../../hooks/useOrbAnimation';
import { api } from '../../lib/api';

const ROLES = [
  { label: 'Soy alumno', value: 'STUDENT' },
  { label: 'Soy profesor', value: 'TEACHER' },
];

export default function RegisterScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { refreshUser, logout } = useAuth();
  const { colors, isDark } = useTheme();

  // Step 1: registration form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [loading, setLoading] = useState(false);

  // Step 2: email verification
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [pendingRole, setPendingRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [pendingName, setPendingName] = useState('');

  // Orbs (same visual language as login)
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

  // ── Step 1: create account with Clerk ──────────────────────────────────────
  async function handleRegister() {
    if (!isLoaded || !signUp) return;
    if (!name || !email || !password) return Alert.alert('Error', 'Completa todos los campos');
    if (password.length < 8) return Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
    setLoading(true);
    try {
      await signUp.create({
        firstName: name.trim(),
        emailAddress: email.trim().toLowerCase(),
        password,
      });
      // Trigger email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingRole(role);
      setPendingName(name.trim());
      setPendingVerification(true);
    } catch (e: unknown) {
      const clerkErr = e as { errors?: Array<{ message?: string }> };
      const msg = clerkErr?.errors?.[0]?.message ?? (e as Error)?.message ?? 'No se pudo registrar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify email OTP and complete registration ────────────────────
  async function handleVerify() {
    if (!isLoaded || !signUp || !setActive) return;
    if (!code) return Alert.alert('Error', 'Ingresa el código de verificación');
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        // Activate the session — triggers AuthContext isSignedIn → fetchAppUser() (gen N)
        await setActive({ session: result.createdSessionId });
        // PATCH role + displayName. If this fails, sign out to avoid the user
        // landing in the app with an incomplete profile (no role).
        try {
          await api.patch('/users/me', { role: pendingRole, displayName: pendingName });
        } catch {
          await logout(); // undo session activation — user must retry registration
          Alert.alert('Error', 'No se pudo asignar el rol. Por favor intenta de nuevo.');
          return;
        }
        // refreshUser() (gen N+1) wins over the auto-fetch — correct role guaranteed
        await refreshUser();
      } else if (result.status === 'needs_second_factor') {
        Alert.alert('Autenticación adicional requerida', 'Esta cuenta requiere un segundo factor de verificación.');
      } else {
        Alert.alert('Error', 'No se pudo verificar. Revisa el código e intenta de nuevo.');
      }
    } catch (e: unknown) {
      const clerkErr = e as { errors?: Array<{ message?: string }> };
      const msg = clerkErr?.errors?.[0]?.message ?? (e as Error)?.message ?? 'Código inválido';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Shared animated header ─────────────────────────────────────────────────
  const Header = (
    <View style={{
      backgroundColor: '#4F46E5',
      justifyContent: 'center', alignItems: 'center',
      paddingTop: 64, paddingBottom: 36, overflow: 'hidden',
    }}>
      <Animated.View style={{
        position: 'absolute', width: 280, height: 280, borderRadius: 140,
        backgroundColor: '#ffffff', top: -80, right: -80,
        opacity: orb1Opacity, transform: [{ translateY: orb1Y }],
      }} />
      <Animated.View style={{
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#818CF8', bottom: -50, right: -40,
        opacity: orb2Opacity, transform: [{ translateY: orb2Y }, { translateX: orb2X }],
      }} />
      <Animated.View style={{
        position: 'absolute', width: 150, height: 150, borderRadius: 75,
        backgroundColor: '#ffffff', top: '20%', left: '15%',
        opacity: orb3Opacity, transform: [{ scale: orb3Scale }],
      }} />
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, zIndex: 1 }}>
        EduPlatform
      </Text>
      <Text style={{ color: '#C7D2FE', marginTop: 3, fontSize: 14, zIndex: 1 }}>
        {pendingVerification ? 'Verifica tu correo' : 'Únete a la plataforma'}
      </Text>
    </View>
  );

  // ── Step 2: verification UI ────────────────────────────────────────────────
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {Header}
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.card, marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          contentContainerStyle={{ padding: 28, paddingTop: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            Verifica tu correo
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 28, lineHeight: 20 }}>
            Te enviamos un código a <Text style={{ fontWeight: '600', color: colors.text }}>{email}</Text>. Introdúcelo para activar tu cuenta.
          </Text>

          <View style={{ marginBottom: 28 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
              Código de verificación
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoCapitalize="none"
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              maxLength={6}
              style={{
                borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 22, letterSpacing: 6, color: colors.text,
                backgroundColor: colors.inputBg, textAlign: 'center',
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#A5B4FC' : '#4F46E5',
              borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 16,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {loading ? 'Verificando...' : 'Verificar y entrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPendingVerification(false)} style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>← Volver al registro</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 1: registration form ──────────────────────────────────────────────
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      {Header}
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
              <Text style={{ fontWeight: '600', fontSize: 14, color: role === r.value ? '#4F46E5' : colors.textSecondary }}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nombre */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Nombre completo</Text>
          <TextInput
            value={name} onChangeText={setName}
            autoCapitalize="words" placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
            style={{ borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg }}
          />
        </View>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Correo electrónico</Text>
          <TextInput
            value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            style={{ borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg }}
          />
        </View>

        {/* Contraseña */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Contraseña</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, backgroundColor: colors.inputBg }}>
            <TextInput
              value={password} onChangeText={setPassword}
              secureTextEntry={!showPassword} autoCapitalize="none"
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text }}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ paddingHorizontal: 14 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showPassword ? <EyeOff color={colors.textMuted} size={20} /> : <Eye color={colors.textMuted} size={20} />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading || !isLoaded}
          style={{ backgroundColor: (loading || !isLoaded) ? '#A5B4FC' : '#4F46E5', borderRadius: 12, paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>¿Ya tienes cuenta?</Text>
          <Link href="/(auth)/login" style={{ color: '#4F46E5', fontWeight: '600', fontSize: 14 }}>Inicia sesión</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
