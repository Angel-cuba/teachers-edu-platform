import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Error', 'Completa todos los campos');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', paddingTop: 80, paddingBottom: 40 }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>EduPlatform</Text>
          <Text style={{ color: '#C7D2FE', marginTop: 4, fontSize: 15 }}>Aprende y enseña en tiempo real</Text>
        </View>

        <View style={{ flex: 2, backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, marginTop: -28 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 }}>Iniciar sesión</Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Correo electrónico</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.textMuted}
              style={{ borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg }}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Contraseña</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, backgroundColor: colors.inputBg }}>
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
            disabled={loading}
            style={{ backgroundColor: loading ? '#A5B4FC' : '#4F46E5', borderRadius: 12, paddingVertical: 15, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>¿No tienes cuenta?</Text>
            <Link href="/(auth)/register" style={{ color: '#4F46E5', fontWeight: '600', fontSize: 14 }}>Regístrate</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
