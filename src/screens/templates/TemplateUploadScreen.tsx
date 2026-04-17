import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TemplateStackParamList } from '../../navigation/types';
import { Field, FieldType } from '../../types';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import AppTextInput from '../../components/common/AppTextInput';
import AppButton from '../../components/common/AppButton';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { detectFieldsFromFile, UnsupportedFormatError } from '../../utils/fieldDetector';
import TemplateGuideModal, { shouldShowTemplateGuide } from './TemplateGuideModal';
import { saveTemplate } from '../../storage/templateStorage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  navigation: NativeStackNavigationProp<TemplateStackParamList, 'TemplateUpload'>;
};

const FIELD_TYPE_OPTIONS: FieldType[] = [
  'text', 'multiline', 'date', 'natural_persons_table',
  'legal_persons_table', 'signature', 'investigator_name', 'investigator_rank',
];

export default function TemplateUploadScreen({ navigation }: Props) {
  const [fileName, setFileName] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [htmlContent, setHtmlContent] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  useEffect(() => {
    shouldShowTemplateGuide().then((show) => {
      if (show) setGuideVisible(true);
    });
  }, []);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'text/html',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];

      setDetecting(true);
      try {
        const detected = await detectFieldsFromFile(asset.uri, asset.name);
        setFileName(asset.name);
        setFileUri(asset.uri);
        setTemplateName(asset.name.replace(/\.[^.]+$/, ''));
        setFields(detected.fields);
        setHtmlContent(detected.htmlContent);
      } catch (err: any) {
        if (err instanceof UnsupportedFormatError) {
          Alert.alert('Formato no compatible', err.message);
        } else {
          Alert.alert('Error', err?.message ?? 'No se pudo leer el archivo.');
        }
      } finally {
        setDetecting(false);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo leer el archivo.');
    }
  };

  const updateFieldLabel = (id: string, label: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, label } : f)));
  };

  const updateFieldType = (id: string, type: FieldType) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, type } : f)));
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const addField = () => {
    const newField: Field = {
      id: uuidv4(),
      label: 'Nuevo campo',
      placeholder: '',
      type: 'text',
      required: false,
      order: fields.length,
    };
    setFields((prev) => [...prev, newField]);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      Alert.alert('', 'El nombre de la plantilla es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await saveTemplate({
        id: uuidv4(),
        name: templateName.trim(),
        description: fileName,
        sourceType: 'uploaded',
        htmlContent,
        originalFileName: fileName,
        fields,
        createdAt: now,
        updatedAt: now,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (detecting) return <LoadingOverlay message={Strings.templates.detectingFields} />;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.helpBanner} onPress={() => setGuideVisible(true)}>
        <Text style={styles.helpIcon}>❓</Text>
        <Text style={styles.helpText}>
          ¿Cómo preparar mi plantilla para que la app la lea bien? <Text style={styles.helpLink}>Ver guía</Text>
        </Text>
      </TouchableOpacity>

      <AppButton
        title={fileUri ? `📎  ${fileName}` : Strings.templates.selectFile}
        variant="outline"
        onPress={handlePickFile}
        style={styles.pickBtn}
      />

      {fileUri && fields.length > 0 ? (
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryTitle}>
            ✓ Detectamos {fields.length} campos
          </Text>
          <Text style={styles.summaryHint}>
            Revisa que cada uno tenga el tipo correcto. Si falta alguno, vuelve a Word, resáltalo en amarillo y súbelo otra vez.
          </Text>
        </View>
      ) : null}

      {fileUri ? (
        <>
          <Text style={styles.hint}>{Strings.templates.uploadHint}</Text>
          <AppTextInput
            label={Strings.templates.nameLabel}
            value={templateName}
            onChangeText={setTemplateName}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {fields.length > 0
                ? `${Strings.templates.fieldsDetected} (${fields.length})`
                : Strings.templates.noFieldsDetected}
            </Text>
          </View>

          {fields.map((field) => (
            <View key={field.id} style={styles.fieldCard}>
              {field.placeholder ? (
                <View style={styles.detectedBadge}>
                  <Text style={styles.detectedLabel}>Detectado en el documento</Text>
                  <Text style={styles.detectedValue} numberOfLines={2}>
                    {field.placeholder}
                  </Text>
                </View>
              ) : null}
              <AppTextInput
                label="Etiqueta"
                value={field.label}
                onChangeText={(t) => updateFieldLabel(field.id, t)}
              />
              <Text style={styles.typeLabel}>Tipo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
                {FIELD_TYPE_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, field.type === t && styles.typeChipActive]}
                    onPress={() => updateFieldType(field.id, t)}
                  >
                    <Text style={[styles.typeChipText, field.type === t && styles.typeChipTextActive]}>
                      {Strings.fieldTypes[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => removeField(field.id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Eliminar campo</Text>
              </TouchableOpacity>
            </View>
          ))}

          <AppButton
            title={Strings.templates.addField}
            variant="outline"
            onPress={addField}
            style={styles.addBtn}
          />

          <AppButton
            title={Strings.templates.saveTemplate}
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📂</Text>
          <Text style={styles.placeholderText}>
            Selecciona un documento para detectar automáticamente los campos a completar.
          </Text>
          <Text style={styles.placeholderHint}>{Strings.templates.uploadHint}</Text>
        </View>
      )}

      <TemplateGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  pickBtn: { marginBottom: 16 },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '18',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  helpIcon: { fontSize: 20 },
  helpText: { flex: 1, color: Colors.textPrimary, fontSize: 13, lineHeight: 18 },
  helpLink: { color: Colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  summaryBanner: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryTitle: { color: Colors.success, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  summaryHint: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17 },
  hint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  sectionHeader: {
    paddingVertical: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  fieldCard: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  typeRow: { marginBottom: 8 },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 12, color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.white },
  removeBtn: { alignSelf: 'flex-end' },
  removeBtnText: { fontSize: 13, color: Colors.danger },
  detectedBadge: {
    backgroundColor: Colors.primaryLight + '22',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 10,
  },
  detectedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detectedValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontStyle: 'italic',
  },
  addBtn: { marginBottom: 12 },
  saveBtn: {},
  placeholder: { alignItems: 'center', marginTop: 40, padding: 24 },
  placeholderIcon: { fontSize: 56, marginBottom: 16 },
  placeholderText: {
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  placeholderHint: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
