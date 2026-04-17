import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import InlineWebPreview from '../../components/common/InlineWebPreview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList, TemplateStackParamList } from '../../navigation/types';
import { Field, FieldType } from '../../types';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import AppTextInput from '../../components/common/AppTextInput';
import AppButton from '../../components/common/AppButton';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { getTemplateById, saveTemplate } from '../../storage/templateStorage';
import { buildTemplateFromScratch } from '../../utils/fieldDetector';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<TemplateStackParamList, 'TemplateEditor'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type Props = {
  navigation: Nav;
  route: RouteProp<TemplateStackParamList, 'TemplateEditor'>;
};

const FIELD_TYPE_OPTIONS: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Texto', icon: '✏️' },
  { type: 'multiline', label: 'Texto largo', icon: '📝' },
  { type: 'date', label: 'Fecha', icon: '📅' },
  { type: 'natural_persons_table', label: 'Personas Naturales', icon: '👤' },
  { type: 'legal_persons_table', label: 'Personas Jurídicas', icon: '🏢' },
  { type: 'signature', label: 'Firma', icon: '✍️' },
  { type: 'investigator_name', label: 'Nombre investigador', icon: '🪪' },
  { type: 'investigator_rank', label: 'Grado investigador', icon: '🎖️' },
];

export default function TemplateEditorScreen({ navigation, route }: Props) {
  const editingId = route.params?.templateId;
  const [loading, setLoading] = useState(!!editingId);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [sourceType, setSourceType] = useState<'uploaded' | 'scratch'>('scratch');
  const [showBasePreview, setShowBasePreview] = useState(false);

  useEffect(() => {
    if (editingId) {
      getTemplateById(editingId).then((t) => {
        if (t) {
          setTemplateName(t.name);
          setDescription(t.description);
          setFields(t.fields);
          setHtmlContent(t.htmlContent);
          setSourceType(t.sourceType);
        }
        setLoading(false);
      });
    }
  }, [editingId]);

  const basePreviewHtml = htmlContent
    ? `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>
        body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;padding:16px;color:#1a1a1a;}
        mark.field-mark{background:#ffe08a;padding:1px 4px;border-radius:3px;color:#7a5c00;font-weight:600;}
      </style></head><body>${
        fields.reduce((acc, f) => {
          const label = f.label.replace(/&/g,'&amp;').replace(/</g,'&lt;');
          return acc.split(`{{${f.id}}}`).join(`<mark class="field-mark">[${label}]</mark>`);
        }, htmlContent)
      }</body></html>`
    : '';

  const addField = (type: FieldType) => {
    const newField: Field = {
      id: uuidv4(),
      label: Strings.fieldTypes[type],
      placeholder: `{{${type}}}`,
      type,
      required: false,
      order: fields.length,
    };
    setFields((prev) => [...prev, newField]);
    setShowAddField(false);
  };

  const updateLabel = (id: string, label: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, label } : f)));
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((f, i) => ({ ...f, order: i }));
    });
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      Alert.alert('', 'El nombre de la plantilla es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const finalHtml = sourceType === 'uploaded' && htmlContent
        ? htmlContent
        : buildTemplateFromScratch(fields);
      await saveTemplate({
        id: editingId ?? uuidv4(),
        name: templateName.trim(),
        description: description.trim(),
        sourceType,
        htmlContent: finalHtml,
        fields,
        createdAt: now,
        updatedAt: now,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDocument = () => {
    if (!editingId) {
      Alert.alert('', 'Guarda la plantilla antes de crear un documento.');
      return;
    }
    navigation
      .getParent()
      ?.navigate('Documentos', {
        screen: 'DocumentFill',
        params: { templateId: editingId },
      });
  };

  if (loading) return <LoadingOverlay />;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AppTextInput label={Strings.templates.nameLabel} value={templateName} onChangeText={setTemplateName} />
      <AppTextInput
        label={Strings.templates.descriptionLabel}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={2}
      />

      {editingId ? (
        <TouchableOpacity style={styles.createDocBtn} onPress={handleCreateDocument}>
          <Text style={styles.createDocText}>📄  Crear documento con esta plantilla</Text>
        </TouchableOpacity>
      ) : null}

      {htmlContent ? (
        <>
          <TouchableOpacity
            style={styles.previewToggle}
            onPress={() => setShowBasePreview((v) => !v)}
          >
            <Text style={styles.previewToggleText}>
              {showBasePreview ? '🔽  Ocultar documento base' : '▶️  Ver documento base'}
            </Text>
          </TouchableOpacity>
          {showBasePreview ? (
            <View style={styles.basePreview}>
              <InlineWebPreview
                html={basePreviewHtml}
                minHeight={280}
                maxHeight={2000}
                style={styles.basePreviewInner}
              />
              <Text style={styles.baseHint}>
                Los campos detectados aparecen resaltados en amarillo.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Campos ({fields.length})</Text>
        <TouchableOpacity onPress={() => setShowAddField(!showAddField)}>
          <Text style={styles.addLink}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {showAddField && (
        <View style={styles.addPanel}>
          <Text style={styles.addPanelTitle}>Tipo de campo</Text>
          {FIELD_TYPE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={styles.typeOption}
              onPress={() => addField(opt.type)}
            >
              <Text style={styles.typeOptionIcon}>{opt.icon}</Text>
              <Text style={styles.typeOptionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {fields.map((field, idx) => (
        <View key={field.id} style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldTypeTag}>{Strings.fieldTypes[field.type]}</Text>
            <View style={styles.fieldActions}>
              <TouchableOpacity onPress={() => moveField(field.id, 'up')} disabled={idx === 0}>
                <Text style={[styles.moveBtn, idx === 0 && styles.moveBtnDisabled]}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => moveField(field.id, 'down')} disabled={idx === fields.length - 1}>
                <Text style={[styles.moveBtn, idx === fields.length - 1 && styles.moveBtnDisabled]}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeField(field.id)}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <AppTextInput
            label="Etiqueta"
            value={field.label}
            onChangeText={(t) => updateLabel(field.id, t)}
            style={styles.noMargin}
          />
          {field.placeholder && !field.placeholder.startsWith('{{') ? (
            <Text style={styles.detectedHint} numberOfLines={2}>
              Detectado: <Text style={styles.detectedValue}>{field.placeholder}</Text>
            </Text>
          ) : null}
        </View>
      ))}

      {fields.length === 0 && !showAddField && (
        <View style={styles.emptyFields}>
          <Text style={styles.emptyText}>No hay campos. Toca "+ Agregar" para comenzar.</Text>
        </View>
      )}

      <AppButton title={Strings.templates.saveTemplate} onPress={handleSave} loading={saving} style={styles.saveBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  addLink: { fontSize: 15, color: Colors.primaryLight, fontWeight: '600' },
  addPanel: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addPanelTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typeOptionIcon: { fontSize: 20, marginRight: 12 },
  typeOptionLabel: { fontSize: 14, color: Colors.textPrimary },
  fieldCard: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fieldTypeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.tableRowAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    textTransform: 'uppercase',
  },
  fieldActions: { flexDirection: 'row', gap: 12 },
  moveBtn: { fontSize: 16, color: Colors.primary },
  moveBtnDisabled: { color: Colors.textDisabled },
  deleteBtn: { fontSize: 16, color: Colors.danger },
  noMargin: { marginBottom: 0 },
  emptyFields: { alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  saveBtn: { marginTop: 16 },
  createDocBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createDocText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  previewToggle: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewToggleText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  basePreview: { marginBottom: 16 },
  basePreviewInner: {},
  baseHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    padding: 6,
    textAlign: 'center',
    backgroundColor: Colors.surface,
  },
  detectedHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  detectedValue: { color: Colors.primary, fontWeight: '600' },
});
