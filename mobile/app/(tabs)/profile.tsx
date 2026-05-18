import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, ScrollView,
  TextInput, Image, ActivityIndicator, Modal, Platform, StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme, type ThemeMode } from '../../context/ThemeContext';
import { useLang } from '../../context/LanguageContext';
import type { Lang } from '../../lib/i18n';
import { api, API_URL } from '../../lib/api';
import { LogOut, User, Camera, Pencil, Check, X, BookOpen, Lock, Sun, Moon, Monitor } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { mode, isDark, setMode, colors } = useTheme();
  const { lang, setLang, t } = useLang();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const roleLabel = user?.role === 'TEACHER' ? t.roles.TEACHER : user?.role === 'STUDENT' ? t.roles.STUDENT : t.roles.ADMIN;
  const roleColor = user?.role === 'TEACHER' ? '#4F46E5' : '#059669';
  const roleBg   = user?.role === 'TEACHER' ? (isDark ? '#312e81' : '#EEF2FF') : (isDark ? '#064e3b' : '#ECFDF5');

  // ── Logout ──────────────────────────────────────────────────────────────
  function handleLogout() {
    Alert.alert(t.profile.logoutTitle, t.profile.logoutConfirm, [
      { text: t.profile.logoutCancel, style: 'cancel' },
      { text: t.common.logout, style: 'destructive', onPress: logout },
    ]);
  }

  // ── Save display name ────────────────────────────────────────────────────
  async function handleSaveName() {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      await api.patch('/users/me', { displayName: newName.trim() });
      await refreshUser();
      setEditingName(false);
    } catch (e: unknown) {
      Alert.alert(t.common.error, (e as Error).message ?? 'No se pudo guardar el nombre');
    } finally {
      setSavingName(false);
    }
  }

  // ── Pick image from gallery ──────────────────────────────────────────────
  async function pickFromGallery() {
    setAvatarModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) await uploadAvatar(result.assets[0].uri);
  }

  // ── Take photo with camera ───────────────────────────────────────────────
  async function takePhoto() {
    setAvatarModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) await uploadAvatar(result.assets[0].uri);
  }

  // ── Change password ──────────────────────────────────────────────────────
  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword)
      return Alert.alert(t.common.error, 'Completa todos los campos');
    if (newPassword.length < 6)
      return Alert.alert(t.common.error, t.profile.passwordTooShort);
    if (newPassword !== confirmPassword)
      return Alert.alert(t.common.error, t.profile.passwordMismatch);

    setSavingPassword(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      Alert.alert('✅', t.profile.passwordChanged);
      setPasswordModalVisible(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: unknown) {
      Alert.alert(t.common.error, (e as Error).message ?? 'No se pudo actualizar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  }

  // ── Upload avatar to backend ─────────────────────────────────────────────
  async function uploadAvatar(uri: string) {
    setUploadingAvatar(true);
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const filename = uri.split('/').pop() ?? 'avatar.jpg';
      const ext = filename.split('.').pop() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      // React Native FormData accepts { uri, name, type } objects for file uploads,
      // but the standard TypeScript FormData interface expects Blob — safe cast.
      formData.append('file', { uri, name: filename, type: mimeType } as unknown as Blob);

      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al subir la imagen');
      }

      await refreshUser();
    } catch (e: unknown) {
      Alert.alert(t.common.error, (e as Error).message ?? 'No se pudo subir la foto');
    } finally {
      setUploadingAvatar(false);
    }
  }

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light',  label: t.profile.themeLight,  icon: <Sun  color={mode === 'light'  ? '#fff' : colors.textSecondary} size={14} /> },
    { value: 'dark',   label: t.profile.themeDark,   icon: <Moon color={mode === 'dark'   ? '#fff' : colors.textSecondary} size={14} /> },
    { value: 'system', label: t.profile.themeSystem, icon: <Monitor color={mode === 'system' ? '#fff' : colors.textSecondary} size={14} /> },
  ];

  const langOptions: { value: Lang; flag: string; label: string }[] = [
    { value: 'es', flag: '🇪🇸', label: 'Español' },
    { value: 'en', flag: '🇬🇧', label: 'English' },
  ];

  // ── Styles based on theme ────────────────────────────────────────────────
  const s = StyleSheet.create({
    inputField: {
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.inputBg,
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >

      {/* ── Avatar + nombre ── */}
      <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>

        {/* Avatar */}
        <TouchableOpacity
          onPress={() => setAvatarModalVisible(true)}
          disabled={uploadingAvatar}
          style={{ marginBottom: 16 }}
        >
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: isDark ? '#312e81' : '#EEF2FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            {uploadingAvatar ? (
              <ActivityIndicator color="#4F46E5" />
            ) : user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 88, height: 88, borderRadius: 44 }} />
            ) : (
              <User color="#4F46E5" size={36} />
            )}
          </View>
          <View style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
            borderWidth: 2, borderColor: colors.card,
          }}>
            <Camera color="#fff" size={13} />
          </View>
        </TouchableOpacity>

        {/* Display name — editable */}
        {editingName ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              autoFocus
              style={{
                fontSize: 18, fontWeight: '700', color: colors.text,
                borderBottomWidth: 2, borderColor: '#4F46E5', paddingVertical: 2, minWidth: 160, textAlign: 'center',
              }}
            />
            <TouchableOpacity onPress={handleSaveName} disabled={savingName}>
              {savingName
                ? <ActivityIndicator size="small" color="#4F46E5" />
                : <Check color="#4F46E5" size={20} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEditingName(false); setNewName(user?.displayName ?? ''); }}>
              <X color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { setNewName(user?.displayName ?? ''); setEditingName(true); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}
          >
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{user?.displayName}</Text>
            <Pencil color={colors.textMuted} size={15} />
          </TouchableOpacity>
        )}

        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{user?.email}</Text>
        <View style={{ marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: roleBg, borderRadius: 20 }}>
          <Text style={{ color: roleColor, fontWeight: '700', fontSize: 13 }}>{roleLabel}</Text>
        </View>
      </View>

      {/* ── Appearance: theme + language ── */}
      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text, marginBottom: 14 }}>{t.profile.appearance}</Text>

        {/* Theme */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
          {isDark ? t.profile.themeDark : mode === 'system' ? t.profile.themeSystem : t.profile.themeLight}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          {themeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setMode(opt.value)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingVertical: 9,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: mode === opt.value ? '#4F46E5' : colors.border,
                backgroundColor: mode === opt.value ? '#4F46E5' : colors.inputBg,
              }}
            >
              {opt.icon}
              <Text style={{ fontSize: 12, fontWeight: '700', color: mode === opt.value ? '#fff' : colors.textSecondary }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Language */}
        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 14 }} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
          {t.profile.language}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {langOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setLang(opt.value)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 9,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: lang === opt.value ? '#4F46E5' : colors.border,
                backgroundColor: lang === opt.value ? '#4F46E5' : colors.inputBg,
              }}
            >
              <Text style={{ fontSize: 18 }}>{opt.flag}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: lang === opt.value ? '#fff' : colors.textSecondary }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Info card ── */}
      <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <BookOpen color={colors.textSecondary} size={20} />
          <View>
            <Text style={{ fontWeight: '600', color: colors.text }}>{t.profile.roleLabel}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{roleLabel}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setPasswordModalVisible(true)}
          style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Lock color={colors.textSecondary} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: colors.text }}>{t.profile.changePassword}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Actualiza tu contraseña de acceso</Text>
          </View>
          <Pencil color={colors.textMuted} size={16} />
        </TouchableOpacity>
        <View style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <User color={colors.textSecondary} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: colors.text }}>{t.profile.userId}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{user?.id}</Text>
          </View>
        </View>
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{ backgroundColor: isDark ? '#450a0a' : '#FEF2F2', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <LogOut color="#EF4444" size={20} />
        <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 16 }}>{t.common.logout}</Text>
      </TouchableOpacity>

      {/* ── Change password modal ── */}
      <Modal visible={passwordModalVisible} transparent animationType="slide" onRequestClose={() => setPasswordModalVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setPasswordModalVisible(false)}
        >
          <View
            style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}
            onStartShouldSetResponder={() => true}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 20, textAlign: 'center' }}>
              {t.profile.changePassword}
            </Text>

            {[
              { label: t.profile.currentPassword, value: currentPassword, setter: setCurrentPassword },
              { label: t.profile.newPassword,      value: newPassword,     setter: setNewPassword },
              { label: t.profile.confirmPassword,  value: confirmPassword, setter: setConfirmPassword },
            ].map(field => (
              <View key={field.label} style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>{field.label}</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.setter}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  style={s.inputField}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={savingPassword}
              style={{ backgroundColor: savingPassword ? '#A5B4FC' : '#4F46E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
            >
              {savingPassword
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t.profile.savePassword}</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setPasswordModalVisible(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
              style={{ marginTop: 12, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Avatar source modal ── */}
      <Modal visible={avatarModalVisible} transparent animationType="slide" onRequestClose={() => setAvatarModalVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setAvatarModalVisible(false)}
        >
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 20, textAlign: 'center' }}>
              {t.profile.changePhoto}
            </Text>
            <TouchableOpacity
              onPress={takePhoto}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#312e81' : '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
                <Camera color="#4F46E5" size={20} />
              </View>
              <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{t.profile.takePhoto}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromGallery}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#312e81' : '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
                <Pencil color="#4F46E5" size={20} />
              </View>
              <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{t.profile.chooseGallery}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAvatarModalVisible(false)}
              style={{ marginTop: 8, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
}
