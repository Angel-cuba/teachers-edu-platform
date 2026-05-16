import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

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

  async function handleRegister() {
    if (!name || !email || !password) return Alert.alert('Error', 'Completa todos los campos');
    if (password.length < 6) return Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, role);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 28 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 60, marginBottom: 8 }}>Crear cuenta</Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 28, fontSize: 14 }}>Únete a EduPlatform</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.value}
              onPress={() => setRole(r.value as any)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                borderWidth: 2,
                borderColor: role === r.value ? '#4F46E5' : colors.inputBorder,
                backgroundColor: role === r.value ? (isDark ? '#1E1B4B' : '#EEF2FF') : colors.card,
              }}
            >
              <Text style={{ fontWeight: '600', color: role === r.value ? '#4F46E5' : colors.textSecondary, fontSize: 14 }}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nombre */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Nombre completo</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
            style={{ borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg }}
          />
        </View>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Correo electrónico</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            style={{ borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg }}
          />
        </View>

        {/* Contraseña con toggle */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Contraseña</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, backgroundColor: colors.inputBg }}>
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
          style={{ backgroundColor: loading ? '#A5B4FC' : '#4F46E5', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {loading ? 'Registrando...' : 'Crear cuenta'}
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
