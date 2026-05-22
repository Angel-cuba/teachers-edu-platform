import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { Eye, EyeOff, ArrowLeft, Wand2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { getClerkErrorMessage } from '../../utils/clerkError';
import { generatePassword } from '../../utils/passwordUtils';
import { PasswordStrengthBar } from '../../components/PasswordStrengthBar';

type Step = 'email' | 'verify';

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1: request OTP
  async function handleSendCode() {
    if (!isLoaded || !signIn || !email.trim()) return Alert.alert('Error', 'Introduce tu correo electrónico');
    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim().toLowerCase(),
      });
      setStep('verify');
    } catch (e: unknown) {
      Alert.alert('Error', getClerkErrorMessage(e, 'No se pudo enviar el código'));
    } finally {
      setLoading(false);
    }
  }

  // Step 2: verify OTP + set new password
  async function handleReset() {
    if (!isLoaded || !signIn) return;
    if (!code || !password) return Alert.alert('Error', 'Completa todos los campos');
    if (password.length < 8) return Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });
      if (result.status === 'complete') {
        // Activate the session — RootGuard detects user and navigates to (tabs) automatically
        await setActive({ session: result.createdSessionId });
      } else {
        Alert.alert('Error', 'Verificación incompleta. Inténtalo de nuevo.');
      }
    } catch (e: unknown) {
      Alert.alert('Error', getClerkErrorMessage(e, 'Código inválido o expirado'));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.inputBg,
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 6,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={{
          flex: 1,
          backgroundColor: '#4F46E5',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 80,
          paddingBottom: 40,
          overflow: 'hidden',
        }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>
            {step === 'email' ? 'Recuperar contraseña' : 'Código de verificación'}
          </Text>
          <Text style={{ color: '#C7D2FE', marginTop: 6, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 }}>
            {step === 'email'
              ? 'Te enviaremos un código a tu correo'
              : `Código enviado a ${email}`}
          </Text>
        </View>

        {/* ── Card ── */}
        <View style={{
          flex: 2,
          backgroundColor: colors.card,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 28,
          marginTop: -28,
        }}>
          {step === 'email' ? (
            <>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
                ¿Olvidaste tu contraseña?
              </Text>

              <View style={{ marginBottom: 24 }}>
                <Text style={labelStyle}>Correo electrónico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle}
                />
              </View>

              <TouchableOpacity
                onPress={handleSendCode}
                disabled={loading || !isLoaded}
                style={{
                  backgroundColor: (loading || !isLoaded) ? '#A5B4FC' : '#4F46E5',
                  borderRadius: 12, paddingVertical: 15, alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {loading ? 'Enviando...' : 'Enviar código'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                Establece nueva contraseña
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
                Introduce el código de 6 dígitos que recibiste y tu nueva contraseña.
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={labelStyle}>Código de recuperación</Text>
                <TextInput
                  value={code}
                  onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle}
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={labelStyle}>Nueva contraseña</Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  borderWidth: 1.5, borderColor: colors.inputBorder,
                  borderRadius: 12, backgroundColor: colors.inputBg,
                }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text }}
                  />
                  {/* Suggest strong password */}
                  <TouchableOpacity
                    onPress={() => { setPassword(generatePassword()); setShowPassword(true); }}
                    style={{ paddingHorizontal: 8 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Sugerir contraseña segura"
                  >
                    <Wand2 color='#6366F1' size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowPassword(v => !v)}
                    style={{ paddingHorizontal: 12 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword
                      ? <EyeOff color={colors.textMuted} size={20} />
                      : <Eye color={colors.textMuted} size={20} />}
                  </TouchableOpacity>
                </View>
                <PasswordStrengthBar password={password} />
              </View>

              <TouchableOpacity
                onPress={handleReset}
                disabled={loading || !isLoaded}
                style={{
                  backgroundColor: (loading || !isLoaded) ? '#A5B4FC' : '#4F46E5',
                  borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 14,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {loading ? 'Guardando...' : 'Establecer contraseña'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setStep('email'); setCode(''); setPassword(''); }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <ArrowLeft color='#4F46E5' size={16} />
                <Text style={{ color: '#4F46E5', fontWeight: '500', fontSize: 14 }}>
                  Cambiar correo
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ alignItems: 'center', marginTop: 28 }}>
            <Link href="/(auth)/login" style={{ color: colors.textSecondary, fontSize: 14 }}>
              ← Volver al inicio de sesión
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
