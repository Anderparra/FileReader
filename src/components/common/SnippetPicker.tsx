import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Colors } from '../../constants/colors';
import { Snippet } from '../../types';
import { getAllSnippets } from '../../storage/snippetStorage';

interface Props {
  onInsert: (text: string) => void;
}

export default function SnippetPicker({ onInsert }: Props) {
  const [open, setOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  useEffect(() => {
    if (open) {
      getAllSnippets().then(setSnippets);
    }
  }, [open]);

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>📋  Insertar frase rápida</Text>
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Seleccionar frase</Text>
            <FlatList
              data={snippets}
              keyExtractor={(s) => s.id}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  No tienes frases guardadas. Crea frases desde la pestaña "Frases".
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onInsert(item.body);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowBody} numberOfLines={3}>{item.body}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight + '22',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: -6,
  },
  triggerText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  empty: { color: Colors.textSecondary, textAlign: 'center', padding: 24 },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 3 },
  rowBody: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  cancel: { padding: 14, alignItems: 'center' },
  cancelText: { color: Colors.danger, fontWeight: '600' },
});
