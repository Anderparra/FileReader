import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { ChecklistRun, ChecklistTemplate } from '../../types';
import { CHECKLIST_TEMPLATES } from '../../constants/checklistTemplates';
import {
  getAllChecklistRuns,
  saveChecklistRun,
  deleteChecklistRun,
} from '../../storage/checklistStorage';
import AppTextInput from '../../components/common/AppTextInput';
import AppButton from '../../components/common/AppButton';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type Mode = 'list' | 'templates' | 'run';

export default function ChecklistsScreen() {
  const [runs, setRuns] = useState<ChecklistRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [active, setActive] = useState<ChecklistRun | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllChecklistRuns();
    setRuns(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const startFromTemplate = (tpl: ChecklistTemplate) => {
    const now = new Date().toISOString();
    const run: ChecklistRun = {
      id: uuidv4(),
      templateId: tpl.id,
      templateName: tpl.name,
      items: tpl.items.map((text) => ({ text, done: false })),
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
    setActive(run);
    setMode('run');
  };

  const openExisting = (run: ChecklistRun) => {
    setActive(run);
    setMode('run');
  };

  const toggleItem = (idx: number) => {
    if (!active) return;
    const items = active.items.map((it, i) =>
      i === idx ? { ...it, done: !it.done } : it
    );
    setActive({ ...active, items });
  };

  const saveActive = async () => {
    if (!active) return;
    const now = new Date().toISOString();
    await saveChecklistRun({ ...active, updatedAt: now });
    setMode('list');
    setActive(null);
    load();
  };

  const deleteActive = () => {
    if (!active) return;
    Alert.alert('Eliminar checklist', '¿Eliminar este checklist?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteChecklistRun(active.id);
          setMode('list');
          setActive(null);
          load();
        },
      },
    ]);
  };

  if (loading) return <LoadingOverlay />;

  if (mode === 'run' && active) {
    const progress = active.items.filter((i) => i.done).length;
    const total = active.items.length;
    return (
      <View style={styles.flex}>
        <View style={styles.runHeader}>
          <TouchableOpacity onPress={() => setMode('list')}>
            <Text style={styles.back}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.runTitle}>{active.templateName}</Text>
          <Text style={styles.progress}>
            {progress}/{total}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.runContent}>
          <AppTextInput
            label="Caso / Radicado"
            value={active.caseRef ?? ''}
            onChangeText={(t) => setActive({ ...active, caseRef: t })}
            placeholder="SPOA o referencia del caso"
            autoCapitalize="characters"
          />

          {active.items.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.checkRow}
              onPress={() => toggleItem(idx)}
            >
              <View style={[styles.checkBox, item.done && styles.checkBoxDone]}>
                {item.done ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={[styles.checkText, item.done && styles.checkTextDone]}>
                {item.text}
              </Text>
            </TouchableOpacity>
          ))}

          <AppTextInput
            label="Notas adicionales"
            value={active.notes}
            onChangeText={(t) => setActive({ ...active, notes: t })}
            multiline
            numberOfLines={4}
          />

          <View style={styles.runActions}>
            <AppButton
              title="Eliminar"
              variant="outline"
              onPress={deleteActive}
              style={styles.runBtn}
            />
            <AppButton title="Guardar" onPress={saveActive} style={styles.runBtn} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={runs}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Listas operativas</Text>
              <Text style={styles.headerHint}>
                Usa una plantilla para asegurar que no te salte ningún paso.
                Los checklists guardados se pueden reabrir en cualquier momento.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Plantillas disponibles</Text>
            <FlatList
              data={CHECKLIST_TEMPLATES}
              keyExtractor={(t) => t.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.templateCard}
                  onPress={() => startFromTemplate(item)}
                >
                  <Text style={styles.templateIcon}>{item.icon}</Text>
                  <Text style={styles.templateName}>{item.name}</Text>
                  <Text style={styles.templateCount}>{item.items.length} pasos</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.sectionLabel}>En curso / guardados</Text>
          </View>
        }
        renderItem={({ item }) => {
          const done = item.items.filter((i) => i.done).length;
          const total = item.items.length;
          return (
            <TouchableOpacity style={styles.runCard} onPress={() => openExisting(item)}>
              <View style={styles.runCardInfo}>
                <Text style={styles.runCardName}>{item.templateName}</Text>
                {item.caseRef ? (
                  <Text style={styles.runCardCase}>Caso: {item.caseRef}</Text>
                ) : null}
                <Text style={styles.runCardDate}>
                  {new Date(item.updatedAt).toLocaleString('es-CO')}
                </Text>
              </View>
              <View style={styles.runCardProgress}>
                <Text style={styles.runCardProgressText}>
                  {done}/{total}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Aún no has iniciado ningún checklist. Elige una plantilla arriba.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  headerHint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  templateRow: { paddingHorizontal: 14, paddingBottom: 10 },
  templateCard: {
    width: 140,
    padding: 12,
    marginRight: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  templateIcon: { fontSize: 32, marginBottom: 6 },
  templateName: { fontSize: 13, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
  templateCount: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  list: { paddingBottom: 40 },
  runCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  runCardInfo: { flex: 1 },
  runCardName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  runCardCase: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  runCardDate: { fontSize: 11, color: Colors.textDisabled, marginTop: 2 },
  runCardProgress: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  runCardProgressText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  runHeader: {
    backgroundColor: Colors.primary,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: Colors.white, fontSize: 14 },
  runTitle: { color: Colors.white, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  progress: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  runContent: { padding: 14, paddingBottom: 40 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkBoxDone: { backgroundColor: Colors.primary },
  checkMark: { color: Colors.white, fontWeight: '700' },
  checkText: { flex: 1, fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  checkTextDone: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  runActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  runBtn: { flex: 1 },
});
