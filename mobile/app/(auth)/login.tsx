import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { Link } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useOrbAnimation } from '../../hooks/useOrbAnimation';
import { getClerkErrorMessage } from '../../utils/clerkError';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Three orbs with different durations and starting phases (natural stagger)
  const a1 = useOrbAnimation(4400, 0);    // large top-right — slow
  const a2 = useOrbAnimation(5800, 0.35); // medium bottom-left — slower
  const a3 = useOrbAnimation(3600, 0.65); // small centre — fastest

  const orb1Y       = a1.interpolate({ inputRange: [0, 1], outputRange: [0, -35] });
  const orb1Opacity = a1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.10, 0.22, 0.10] });

  const orb2Y       = a2.interpolate({ inputRange: [0, 1], outputRange: [0, 28] });
  const orb2X       = a2.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const orb2Opacity = a2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.14, 0.26, 0.14] });

  const orb3Scale   = a3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const orb3Opacity = a3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.07, 0.18, 0.07] });

  async function handleLogin() {
    if (!isLoaded) return;
    if (!email || !password) return Alert.alert('Error', 'Completa todos los campos');
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });
      if (result.status === 'complete') {
        // Clerk is signed in — AuthContext detects isSignedIn change and fetches /users/me
        await setActive({ session: result.createdSessionId });
      } else {
        Alert.alert('Error', 'No se pudo completar el inicio de sesión. Verifica tus datos.');
      }
    } catch (e: unknown) {
      Alert.alert('Error', getClerkErrorMessage(e, 'No se pudo iniciar sesión'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Animated header ──────────────────────────────────────────────── */}
        <View style={{
          flex: 1,
          backgroundColor: '#4F46E5',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 80,
          paddingBottom: 40,
          overflow: 'hidden',
        }}>
          {/* Orb 1 */}
          <Animated.View style={{
            position: 'absolute',
            width: 300, height: 300, borderRadius: 150,
            backgroundColor: '#ffffff',
            top: -90, right: -90,
            opacity: orb1Opacity,
            transform: [{ translateY: orb1Y }],
          }} />
          {/* Orb 2 */}
          <Animated.View style={{
            position: 'absolute',
            width: 220, height: 220, borderRadius: 110,
            backgroundColor: '#818CF8',
            bottom: -55, left: -55,
            opacity: orb2Opacity,
            transform: [{ translateY: orb2Y }, { translateX: orb2X }],
          }} />
          {/* Orb 3 */}
          <Animated.View style={{
            position: 'absolute',
            width: 160, height: 160, borderRadius: 80,
            backgroundColor: '#ffffff',
            top: '35%', left: '25%',
            opacity: orb3Opacity,
            transform: [{ scale: orb3Scale }],
          }} />

          <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5, zIndex: 1 }}>
            EduPlatform
          </Text>
          <Text style={{ color: '#C7D2FE', marginTop: 4, fontSize: 15, zIndex: 1 }}>
            Aprende y enseña en tiempo real
          </Text>
        </View>

        {/* ── Login card ───────────────────────────────────────────────────── */}
        <View style={{
          flex: 2,
          backgroundColor: colors.card,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 28,
          marginTop: -28,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
            Iniciar sesión
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
              Correo electrónico
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 13,
                fontSize: 15, color: colors.text, backgroundColor: colors.inputBg,
              }}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
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
                autoComplete="current-password"
                placeholder="••••••••"
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
            onPress={handleLogin}
            disabled={loading || !isLoaded}
            style={{
              backgroundColor: (loading || !isLoaded) ? '#A5B4FC' : '#4F46E5',
              borderRadius: 12, paddingVertical: 15, alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <Link href="/(auth)/forgot-password" style={{ color: '#4F46E5', fontWeight: '500', fontSize: 14 }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>¿No tienes cuenta?</Text>
            <Link href="/(auth)/register" style={{ color: '#4F46E5', fontWeight: '600', fontSize: 14 }}>
              Regístrate
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
