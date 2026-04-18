import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/colors';
import { LEGAL_REFERENCES, LegalReference } from '../../constants/legalReferences';

export default function LegalReferenceScreen() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LEGAL_REFERENCES;
    return LEGAL_REFERENCES.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.article.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q) ||
        r.tags.some((t) => t.includes(q)),
    );
  }, [query]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyText = async (ref: LegalReference) => {
    const full = `${ref.code} — ${ref.article}\n${ref.topic}\n\n${ref.text}`;
    await Clipboard.setStringAsync(full);
    Alert.alert('Copiado', 'La referencia está en el portapapeles.');
  };

  const renderCard = ({ item }: { item: LegalReference }) => {
    const isOpen = expanded.has(item.id);
    return (
      <TouchableOpacity style={styles.card} onPress={() => toggle(item.id)} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View style={styles.headBadge}>
            <Text style={styles.headBadgeText}>{item.article}</Text>
          </View>
          <Text style={styles.cardCode}>{item.code}</Text>
        </View>
        <Text style={styles.cardTopic}>{item.topic}</Text>
        <Text style={styles.cardText} numberOfLines={isOpen ? undefined : 3}>
          {item.text}
        </Text>
        <View style={styles.tagRow}>
          {item.tags.slice(0, 4).map((t) => (
            <Text key={t} style={styles.tag}>
              #{t}
            </Text>
          ))}
        </View>
        {isOpen ? (
          <TouchableOpacity style={styles.copyBtn} onPress={() => copyText(item)}>
            <Text style={styles.copyBtnText}>📋  Copiar al portapapeles</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.expandHint}>Toca para ver completo</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Artículos y normas frecuentes para oficios de Policía Judicial.
          Toca una tarjeta para ver el texto completo y copiarlo.
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Buscar por código, artículo, tema, palabra..."
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.searchClear}>
            <Text style={styles.searchClearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={renderCard}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sin resultados para "{query}".</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  searchClear: { padding: 8 },
  searchClearText: { fontSize: 16, color: Colors.textSecondary },
  list: { padding: 12, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  headBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  headBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  cardCode: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', flex: 1 },
  cardTopic: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  cardText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { fontSize: 11, color: Colors.primaryLight },
  expandHint: { fontSize: 11, color: Colors.textDisabled, marginTop: 8, fontStyle: 'italic' },
  copyBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight + '22',
    alignItems: 'center',
  },
  copyBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary },
});
