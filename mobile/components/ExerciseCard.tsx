import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { Clock, AlertCircle } from 'lucide-react-native';
import { useFadeInUp } from '../lib/useFadeInUp';
import type { ThemeColors } from '../context/ThemeContext';
import type { Exercise } from '../lib/types';

export interface ExerciseCardProps {
  exercise: Exercise;
  /** Stagger index — each card animates in with `index * 60 ms` delay. */
  index: number;
  colors: ThemeColors;
  onPress: () => void;
}

/**
 * Card for a single pending exercise.
 * Used in the Dashboard inline list and the dedicated Pending Exercises screen.
 */
export function ExerciseCard({ exercise, index, colors, onPress }: ExerciseCardProps) {
  const cardAnim = useFadeInUp(index * 60, 280);

  const isOverdue = exercise.dueDate && new Date(exercise.dueDate) < new Date();
  const daysLeft = exercise.dueDate
    ? Math.ceil((new Date(exercise.dueDate).getTime() - Date.now()) / 86_400_000)
    : null;

  const dueBadgeColor = isOverdue ? '#EF4444' : daysLeft !== null && daysLeft <= 1 ? '#F59E0B' : '#6B7280';
  const dueBg = isOverdue ? '#FEF2F2' : daysLeft !== null && daysLeft <= 1 ? '#FFFBEB' : '#F3F4F6';

  return (
    <Animated.View style={cardAnim}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          gap: 10,
          borderWidth: 1.5,
          borderColor: isOverdue ? '#FECACA' : 'transparent',
        }}
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }} numberOfLines={2}>
              {exercise.title}
            </Text>
            {exercise.courseTitle && (
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{exercise.courseTitle}</Text>
            )}
          </View>
          {isOverdue && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <AlertCircle color="#EF4444" size={12} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#EF4444' }}>Vencido</Text>
            </View>
          )}
        </View>

        {/* Footer row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Type badge */}
            <View style={{ backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#4F46E5' }}>
                {exercise.type === 'MULTIPLE_CHOICE' ? 'Opción múltiple' : exercise.type === 'CODE' ? 'Código' : 'Abierta'}
              </Text>
            </View>
            {/* Max score */}
            <View style={{ backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#059669' }}>{exercise.maxScore} pts</Text>
            </View>
          </View>

          {/* Due date chip */}
          {exercise.dueDate && daysLeft !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: dueBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Clock color={dueBadgeColor} size={11} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: dueBadgeColor }}>
                {isOverdue
                  ? `Venció hace ${Math.abs(daysLeft)} d`
                  : daysLeft === 0 ? 'Hoy'
                  : daysLeft === 1 ? 'Mañana'
                  : `${daysLeft} días`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
