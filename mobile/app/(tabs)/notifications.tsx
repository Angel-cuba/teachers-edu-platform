import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import type { Notification } from '../../lib/types';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading, refetch, isRefetching } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
  });
  const unread = notifications.filter(n => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {unread > 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={() => markAll.mutate()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' }}
          >
            <CheckCheck color="#4F46E5" size={16} />
            <Text style={{ color: '#4F46E5', fontWeight: '600', fontSize: 13 }}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4F46E5" />}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" /> : (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <Bell color={colors.textMuted} size={48} />
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>No tienes notificaciones</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => !item.isRead && markRead.mutate(item.id)}
            style={{
              backgroundColor: item.isRead ? colors.card : (isDark ? '#1E1B4B' : '#EEF2FF'),
              borderRadius: 14, padding: 16,
              flexDirection: 'row', alignItems: 'flex-start', gap: 12,
              borderWidth: item.isRead ? 0 : 1.5,
              borderColor: item.isRead ? 'transparent' : (isDark ? '#3730A3' : '#C7D2FE'),
            }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.isRead ? colors.textMuted : '#4F46E5', marginTop: 5 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.text, fontWeight: item.isRead ? '400' : '600', lineHeight: 20 }}>{item.message}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                {new Date(item.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
