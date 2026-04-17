import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Snippet } from '../../types';
import {
  getAllSnippets,
  saveSnippet,
  deleteSnippet,
} from '../../storage/snippetStorage';
import AppTextInput from '../../components/common/AppTextInput';
import AppButton from '../../components/common/AppButton';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function SnippetsScreen() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Snippet | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await getAllSnippets();
    setSnippets(s.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const startCreate = () => {
    const now = new Date().toISOString();
    setEditing({ id: uuidv4(), title: '', body: '', createdAt: now, updatedAt: now });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.body.trim()) {
      Alert.alert('', 'Título y contenido son obligatorios.');
      return;
    }
    const now = new Date().toISOString();
    await saveSnippet({ ...editing, title: editing.title.trim(), body: editing.body.trim(), updatedAt: now });
    setEditing(null);
    load();
  };

  const handleDelete = (s: Snippet) => {
    Alert.alert('Eliminar frase', `¿Eliminar "${s.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteSnippet(s.id);
          load();
        },
      },
    ]);
  };

  if (loading) return <LoadingOverlay />;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Frases reutilizables para acelerar la redacción de oficios.
        </Text>
      </View>

      <FlatList
        data={snippets}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No tienes frases guardadas. Toca "+ Nueva frase" para crear una.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => setEditing(item)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardBody} numberOfLines={4}>{item.body}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={startCreate}>
        <Text style={styles.fabText}>+ Nueva frase</Text>
      </TouchableOpacity>

      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {editing && snippets.find((s) => s.id === editing.id) ? 'Editar frase' : 'Nueva frase'}
            </Text>
            <AppTextInput
              label="Título"
              value={editing?.title ?? ''}
              onChangeText={(t) => setEditing((e) => (e ? { ...e, title: t } : e))}
              placeholder="Ej. Saludo formal"
            />
            <AppTextInput
              label="Contenido"
              value={editing?.body ?? ''}
              onChangeText={(t) => setEditing((e) => (e ? { ...e, body: t } : e))}
              multiline
              numberOfLines={5}
              placeholder="Texto de la frase..."
            />
            <View style={styles.modalActions}>
              <AppButton
                title="Cancelar"
                variant="outline"
                onPress={() => setEditing(null)}
                style={styles.modalBtn}
              />
              <AppButton title="Guardar" onPress={handleSave} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  headerText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  list: { padding: 12, paddingBottom: 100 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', fontSize: 14 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, flex: 1 },
  cardBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  actionText: { fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1 },
});
