import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, TemplateStackParamList } from '../../navigation/types';
import { Template } from '../../types';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import EmptyState from '../../components/common/EmptyState';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { useTemplates } from '../../hooks/useTemplates';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<TemplateStackParamList, 'TemplateList'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type Props = { navigation: Nav };

export default function TemplateListScreen({ navigation }: Props) {
  const { templates, loading, remove, reload } = useTemplates();

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const handleDelete = (t: Template) => {
    Alert.alert('Eliminar plantilla', Strings.templates.deleteConfirm, [
      { text: Strings.templates.cancel, style: 'cancel' },
      { text: Strings.templates.confirmDelete, style: 'destructive', onPress: () => remove(t.id) },
    ]);
  };

  if (loading) return <LoadingOverlay />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={templates}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
        ListEmptyComponent={
          <EmptyState
            title={Strings.templates.empty}
            subtitle={Strings.templates.emptySubtitle}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TemplateEditor', { templateId: item.id })}
          >
            <View style={styles.cardContent}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.sourceType === 'uploaded' ? '📎' : '📝'}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                ) : null}
                <Text style={styles.meta}>
                  {item.fields.length} campos · {item.sourceType === 'uploaded' ? 'Subido' : 'Creado'}
                </Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={templates.length === 0 ? styles.flex : styles.list}
      />

      <View style={styles.fab}>
        <TouchableOpacity
          style={[styles.fabBtn, styles.fabSecondary]}
          onPress={() => navigation.navigate('TemplateUpload')}
        >
          <Text style={styles.fabText}>📎  Subir documento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabBtn, styles.fabPrimary]}
          onPress={() => navigation.navigate('TemplateEditor', {})}
        >
          <Text style={styles.fabText}>✏️  Crear plantilla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 12, paddingBottom: 120 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  description: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  meta: { fontSize: 12, color: Colors.primary, marginTop: 4 },
  deleteBtn: { padding: 8 },
  deleteIcon: { fontSize: 18 },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  fabBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabPrimary: { backgroundColor: Colors.primary },
  fabSecondary: { backgroundColor: Colors.primaryLight },
  fabText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
});
