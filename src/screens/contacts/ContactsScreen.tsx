import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Contact, ContactRole } from '../../types';
import {
  getAllContacts,
  saveContact,
  deleteContact,
} from '../../storage/contactStorage';
import AppTextInput from '../../components/common/AppTextInput';
import AppButton from '../../components/common/AppButton';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const ROLES: { value: ContactRole; label: string; icon: string }[] = [
  { value: 'fiscal', label: 'Fiscal', icon: '⚖️' },
  { value: 'juez', label: 'Juez', icon: '👨‍⚖️' },
  { value: 'perito', label: 'Perito', icon: '🔬' },
  { value: 'investigador', label: 'Investigador', icon: '🔍' },
  { value: 'testigo', label: 'Testigo', icon: '🧑' },
  { value: 'abogado', label: 'Abogado', icon: '⚖️' },
  { value: 'otro', label: 'Otro', icon: '📇' },
];

function roleIcon(role: ContactRole): string {
  return ROLES.find((r) => r.value === role)?.icon ?? '📇';
}
function roleLabel(role: ContactRole): string {
  return ROLES.find((r) => r.value === role)?.label ?? 'Otro';
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllContacts();
    setContacts(all.sort((a, b) => a.fullName.localeCompare(b.fullName)));
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.organization ?? '').toLowerCase().includes(q) ||
        (c.position ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q) ||
        roleLabel(c.role).toLowerCase().includes(q),
    );
  }, [contacts, query]);

  const startCreate = () => {
    const now = new Date().toISOString();
    setEditing({
      id: uuidv4(),
      fullName: '',
      role: 'fiscal',
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.fullName.trim()) {
      Alert.alert('', 'El nombre es obligatorio.');
      return;
    }
    const now = new Date().toISOString();
    await saveContact({ ...editing, fullName: editing.fullName.trim(), updatedAt: now });
    setEditing(null);
    load();
  };

  const handleDelete = (c: Contact) => {
    Alert.alert('Eliminar contacto', `¿Eliminar a ${c.fullName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteContact(c.id);
          load();
        },
      },
    ]);
  };

  if (loading) return <LoadingOverlay />;

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Buscar por nombre, rol, organización..."
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
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📇</Text>
            <Text style={styles.emptyText}>
              {contacts.length === 0
                ? 'Aún no tienes contactos. Toca "+ Nuevo" para agregar el primero.'
                : 'No hay contactos que coincidan con la búsqueda.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setEditing(item)}>
            <Text style={styles.cardIcon}>{roleIcon(item.role)}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.fullName}</Text>
              <Text style={styles.cardRole}>
                {roleLabel(item.role)}
                {item.organization ? ` · ${item.organization}` : ''}
                {item.position ? ` · ${item.position}` : ''}
              </Text>
              {item.phone || item.email ? (
                <Text style={styles.cardContact}>
                  {[item.phone, item.email].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Text style={styles.deleteText}>🗑</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={startCreate}>
        <Text style={styles.fabText}>+ Nuevo contacto</Text>
      </TouchableOpacity>

      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editing && contacts.find((c) => c.id === editing.id) ? 'Editar contacto' : 'Nuevo contacto'}
              </Text>

              <AppTextInput
                label="Nombre completo *"
                value={editing?.fullName ?? ''}
                onChangeText={(t) => setEditing((e) => (e ? { ...e, fullName: t } : e))}
                placeholder="Nombres y apellidos"
                autoCapitalize="words"
              />

              <Text style={styles.roleLabel}>Rol</Text>
              <View style={styles.rolesRow}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.roleChip,
                      editing?.role === r.value && styles.roleChipActive,
                    ]}
                    onPress={() => setEditing((e) => (e ? { ...e, role: r.value } : e))}
                  >
                    <Text style={styles.roleChipIcon}>{r.icon}</Text>
                    <Text
                      style={[
                        styles.roleChipText,
                        editing?.role === r.value && styles.roleChipTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppTextInput
                label="Cargo"
                value={editing?.position ?? ''}
                onChangeText={(t) => setEditing((e) => (e ? { ...e, position: t } : e))}
                placeholder="Cargo o función"
              />
              <AppTextInput
                label="Organización / Entidad"
                value={editing?.organization ?? ''}
                onChangeText={(t) => setEditing((e) => (e ? { ...e, organization: t } : e))}
                placeholder="Fiscalía, CTI, Juzgado, etc."
              />
              <AppTextInput
                label="Teléfono"
                value={editing?.phone ?? ''}
                onChangeText={(t) => setEditing((e) => (e ? { ...e, phone: t } : e))}
                keyboardType="phone-pad"
              />
              <AppTextInput
                label="Correo electrónico"
                value={editing?.email ?? ''}
                onChangeText={(t) => setEditing((e) => (e ? { ...e, email: t } : e))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AppTextInput
                label="Dirección"
                value={editing?.address ?? ''}
                onChangeText={(t) => setEditing((e) => (e ? { ...e, address: t } : e))}
              />
              <AppTextInput
                label="Notas"
                value={editing?.notes ?? ''}
                onChangeText={(t) => setEditing((e) => (e ? { ...e, notes: t } : e))}
                multiline
                numberOfLines={3}
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
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 8 },
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
  list: { padding: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  cardIcon: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardRole: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  cardContact: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 16 },
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
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '92%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  roleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  roleChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleChipIcon: { fontSize: 14 },
  roleChipText: { color: Colors.textSecondary, fontSize: 12 },
  roleChipTextActive: { color: Colors.white, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1 },
});
