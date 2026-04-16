import React, { useCallback, useState } from 'react';
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
import { MainTabParamList, DocumentStackParamList } from '../../navigation/types';
import { SavedDocument } from '../../types';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import EmptyState from '../../components/common/EmptyState';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { useDocuments } from '../../hooks/useDocument';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<DocumentStackParamList, 'DocumentList'>,
  BottomTabNavigationProp<MainTabParamList>
>;
type Props = { navigation: Nav };

type StatusFilter = 'all' | 'draft' | 'complete' | 'exported';

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Borrador', value: 'draft' },
  { label: 'Completo', value: 'complete' },
  { label: 'Exportado', value: 'exported' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: Colors.warning,
  complete: Colors.success,
  exported: Colors.primary,
};

export default function DocumentListScreen({ navigation }: Props) {
  const { documents, loading, remove, reload } = useDocuments();
  const [filter, setFilter] = useState<StatusFilter>('all');

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const filtered = filter === 'all' ? documents : documents.filter((d) => d.status === filter);

  const handleOpen = (doc: SavedDocument) => {
    if (doc.status === 'draft') {
      navigation.navigate('DocumentFill', { templateId: doc.templateId, documentId: doc.id });
    } else {
      navigation.navigate('DocumentPreview', { documentId: doc.id, title: doc.title });
    }
  };

  const handleLongPress = (doc: SavedDocument) => {
    Alert.alert('', Strings.documents.deleteConfirm, [
      { text: Strings.common.cancel, style: 'cancel' },
      { text: Strings.common.delete, style: 'destructive', onPress: () => remove(doc.id) },
    ]);
  };

  if (loading) return <LoadingOverlay />;

  return (
    <View style={styles.flex}>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
        ListEmptyComponent={
          <EmptyState title={Strings.documents.empty} subtitle={Strings.documents.emptySubtitle} />
        }
        contentContainerStyle={filtered.length === 0 ? styles.flex : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleOpen(item)}
            onLongPress={() => handleLongPress(item)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.docTitle}>{item.title}</Text>
              <Text style={styles.templateName}>📋 {item.templateName}</Text>
              <Text style={styles.date}>
                {new Date(item.updatedAt).toLocaleDateString('es-CO')}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                {Strings.documents.status[item.status]}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { padding: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLeft: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  templateName: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  date: { fontSize: 12, color: Colors.textDisabled, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
});
