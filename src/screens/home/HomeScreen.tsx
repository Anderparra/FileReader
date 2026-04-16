import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { getAllDocuments } from '../../storage/documentStorage';
import { getAllTemplates } from '../../storage/templateStorage';
import { SavedDocument, Template } from '../../types';

type Props = { navigation: BottomTabNavigationProp<MainTabParamList, 'Inicio'> };

const STATUS_COLORS: Record<string, string> = {
  draft: Colors.warning,
  complete: Colors.success,
  exported: Colors.primary,
};

export default function HomeScreen({ navigation }: Props) {
  const [recent, setRecent] = useState<SavedDocument[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        const [docs, tmplts] = await Promise.all([getAllDocuments(), getAllTemplates()]);
        setRecent(docs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5));
        setTemplates(tmplts);
        setLoading(false);
      };
      load();
    }, [])
  );

  const handleNewDocument = () => {
    if (templates.length === 0) {
      Alert.alert(
        'Sin plantillas',
        'Primero debes crear o subir una plantilla.',
        [
          { text: 'Ir a Plantillas', onPress: () => navigation.navigate('Plantillas') },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }
    setShowTemplatePicker(true);
  };

  const openDocument = (doc: SavedDocument) => {
    navigation.navigate('Documentos');
  };

  if (loading) return <LoadingOverlay />;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.appName}>Gestión Documental</Text>
        <Text style={styles.subtitle}>Policía Nacional</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionCard, styles.actionPrimary]} onPress={handleNewDocument}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionLabel}>{Strings.home.newDocument}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, styles.actionSecondary]}
          onPress={() => navigation.navigate('Plantillas')}
        >
          <Text style={styles.actionIcon}>📎</Text>
          <Text style={styles.actionLabel}>{Strings.home.uploadTemplate}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{Strings.home.recentDocuments}</Text>

      {recent.length === 0 ? (
        <View style={styles.emptyRecent}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyText}>{Strings.home.noRecentDocuments}</Text>
        </View>
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.docCard} onPress={() => openDocument(item)}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{item.title}</Text>
                <Text style={styles.docTemplate}>{item.templateName}</Text>
              </View>
              <Text style={[styles.docStatus, { color: STATUS_COLORS[item.status] }]}>
                {Strings.documents.status[item.status]}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={showTemplatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{Strings.home.selectTemplate}</Text>
            <FlatList
              data={templates}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.templateItem}
                  onPress={() => {
                    setShowTemplatePicker(false);
                    navigation.navigate('Documentos');
                  }}
                >
                  <Text style={styles.templateIcon}>
                    {item.sourceType === 'uploaded' ? '📎' : '📝'}
                  </Text>
                  <View>
                    <Text style={styles.templateName}>{item.name}</Text>
                    <Text style={styles.templateMeta}>{item.fields.length} campos</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTemplatePicker(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    padding: 24,
    paddingTop: 16,
  },
  appName: { fontSize: 22, fontWeight: '700', color: Colors.white },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  actionsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionPrimary: { backgroundColor: Colors.primary },
  actionSecondary: { backgroundColor: Colors.primaryLight },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { color: Colors.white, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  emptyRecent: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  list: { paddingHorizontal: 16 },
  docCard: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  docTemplate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  docStatus: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  templateIcon: { fontSize: 24 },
  templateName: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  templateMeta: { fontSize: 12, color: Colors.textSecondary },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelText: { fontSize: 15, color: Colors.danger, fontWeight: '600' },
});
