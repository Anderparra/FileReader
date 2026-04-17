import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { DocumentStackParamList } from '../../navigation/types';
import {
  DocumentFieldValue,
  Field,
  LegalPerson,
  NaturalPerson,
  SavedDocument,
  Template,
} from '../../types';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import AppTextInput from '../../components/common/AppTextInput';
import AppButton from '../../components/common/AppButton';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import NaturalPersonRow from '../../components/forms/NaturalPersonRow';
import LegalPersonRow from '../../components/forms/LegalPersonRow';
import { getTemplateById } from '../../storage/templateStorage';
import { getDocumentById, saveDocument } from '../../storage/documentStorage';
import { getProfile } from '../../storage/profileStorage';
import { buildRenderedHtml } from '../../utils/htmlBuilder';
import { todaySpanish } from '../../utils/dateUtils';
import { InvestigatorProfile } from '../../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  navigation: NativeStackNavigationProp<DocumentStackParamList, 'DocumentFill'>;
  route: RouteProp<DocumentStackParamList, 'DocumentFill'>;
};

export default function DocumentFillScreen({ navigation, route }: Props) {
  const { templateId, documentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<Template | null>(null);
  const [profile, setProfile] = useState<InvestigatorProfile | null>(null);
  const [fieldValues, setFieldValues] = useState<Map<string, DocumentFieldValue['value']>>(new Map());
  const [docTitle, setDocTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [docId] = useState(documentId ?? uuidv4());
  const [showLivePreview, setShowLivePreview] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [tmpl, prof, existing] = await Promise.all([
        getTemplateById(templateId),
        getProfile(),
        documentId ? getDocumentById(documentId) : Promise.resolve(null),
      ]);

      if (!tmpl) { navigation.goBack(); return; }
      setTemplate(tmpl);
      setProfile(prof);

      const initial = new Map<string, DocumentFieldValue['value']>();

      if (existing) {
        setDocTitle(existing.title);
        for (const fv of existing.fieldValues) initial.set(fv.fieldId, fv.value);
      } else {
        setDocTitle(`Oficio - ${new Date().toLocaleDateString('es-CO')}`);
      }

      for (const field of tmpl.fields) {
        if (initial.has(field.id)) continue;
        switch (field.type) {
          case 'date':
            initial.set(field.id, todaySpanish());
            break;
          case 'investigator_name':
            initial.set(field.id, prof?.fullName ?? '');
            break;
          case 'investigator_rank':
            initial.set(field.id, `${prof?.rank ?? ''} - ${prof?.position ?? ''}`);
            break;
          case 'natural_persons_table':
            initial.set(field.id, []);
            break;
          case 'legal_persons_table':
            initial.set(field.id, []);
            break;
          case 'signature':
            initial.set(field.id, prof?.signatureFileUri ?? '');
            break;
          default:
            initial.set(field.id, field.defaultValue ?? '');
        }
      }

      setFieldValues(new Map(initial));
      setLoading(false);
    };
    init();
  }, [templateId, documentId]);

  const setValue = useCallback((fieldId: string, value: DocumentFieldValue['value']) => {
    setFieldValues((prev) => new Map(prev).set(fieldId, value));
  }, []);

  const buildFieldValuesArray = useCallback((): DocumentFieldValue[] =>
    Array.from(fieldValues.entries()).map(([fieldId, value]) => ({ fieldId, value })),
  [fieldValues]);

  const livePreviewHtml = useMemo(() => {
    if (!template || !profile) return '';
    return buildRenderedHtml(template, buildFieldValuesArray(), profile);
  }, [template, profile, buildFieldValuesArray]);

  const handleSave = async (status: SavedDocument['status']) => {
    if (!template || !profile) return;
    setSaving(true);
    try {
      const fvArray = buildFieldValuesArray();
      const rendered = buildRenderedHtml(template, fvArray, profile);
      const now = new Date().toISOString();
      await saveDocument({
        id: docId,
        templateId,
        templateName: template.name,
        title: docTitle || Strings.common.unnamed,
        status,
        fieldValues: fvArray,
        renderedHtml: rendered,
        createdAt: now,
        updatedAt: now,
      });
      if (status === 'complete') {
        navigation.replace('DocumentPreview', { documentId: docId, title: docTitle });
      } else {
        navigation.goBack();
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!template || !profile) return;
    const fvArray = buildFieldValuesArray();
    const rendered = buildRenderedHtml(template, fvArray, profile);
    navigation.navigate('DocumentPreview', { renderedHtml: rendered, title: docTitle });
  };

  if (loading) return <LoadingOverlay message={Strings.common.loading} />;
  if (!template) return null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <AppTextInput
          label={Strings.documents.documentTitle}
          value={docTitle}
          onChangeText={setDocTitle}
        />

        <TouchableOpacity
          style={styles.previewToggle}
          onPress={() => setShowLivePreview((v) => !v)}
        >
          <Text style={styles.previewToggleText}>
            {showLivePreview ? '🔽  Ocultar vista previa' : '▶️  Mostrar vista previa'}
          </Text>
        </TouchableOpacity>

        {showLivePreview ? (
          <View style={styles.livePreview}>
            <WebView
              source={{ html: livePreviewHtml }}
              style={styles.livePreviewWebview}
              originWhitelist={['*']}
              scalesPageToFit
            />
          </View>
        ) : null}

        {template.fields
          .sort((a, b) => a.order - b.order)
          .map((field) => renderField(field, fieldValues, setValue, profile))}

        <View style={styles.actionRow}>
          <AppButton
            title="Vista Previa Completa"
            variant="outline"
            onPress={handlePreview}
            style={styles.actionBtn}
          />
        </View>
        <View style={styles.actionRow}>
          <AppButton
            title={Strings.documents.saveDraft}
            variant="outline"
            onPress={() => handleSave('draft')}
            loading={saving}
            style={styles.actionBtn}
          />
          <AppButton
            title={Strings.documents.finalize}
            onPress={() => handleSave('complete')}
            loading={saving}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function renderField(
  field: Field,
  values: Map<string, DocumentFieldValue['value']>,
  setValue: (id: string, val: DocumentFieldValue['value']) => void,
  profile: InvestigatorProfile | null
): React.ReactElement {
  const value = values.get(field.id);

  switch (field.type) {
    case 'investigator_name':
    case 'investigator_rank':
    case 'signature':
      return (
        <View key={field.id} style={styles.lockedField}>
          <Text style={styles.lockedLabel}>{field.label}</Text>
          <Text style={styles.lockedValue}>
            {field.type === 'investigator_name'
              ? profile?.fullName
              : field.type === 'investigator_rank'
              ? `${profile?.rank} — ${profile?.position}`
              : '(firma del perfil)'}
          </Text>
          <Text style={styles.lockedHint}>{Strings.documents.autoFilledFromProfile}</Text>
        </View>
      );

    case 'natural_persons_table': {
      const persons = (value as NaturalPerson[]) ?? [];
      return (
        <View key={field.id} style={styles.tableSection}>
          <Text style={styles.tableTitle}>{Strings.documents.naturalPersons}</Text>
          {persons.map((p, i) => (
            <NaturalPersonRow
              key={p.id}
              person={p}
              onChange={(updated) => {
                const next = [...persons];
                next[i] = updated;
                setValue(field.id, next);
              }}
              onRemove={() => {
                setValue(field.id, persons.filter((_, j) => j !== i));
              }}
            />
          ))}
          <TouchableOpacity
            style={styles.addPersonBtn}
            onPress={() =>
              setValue(field.id, [...persons, { id: uuidv4(), name: '', cedula: '' }])
            }
          >
            <Text style={styles.addPersonText}>+ {Strings.documents.addNaturalPerson}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    case 'legal_persons_table': {
      const persons = (value as LegalPerson[]) ?? [];
      return (
        <View key={field.id} style={styles.tableSection}>
          <Text style={styles.tableTitle}>{Strings.documents.legalPersons}</Text>
          {persons.map((p, i) => (
            <LegalPersonRow
              key={p.id}
              person={p}
              onChange={(updated) => {
                const next = [...persons];
                next[i] = updated;
                setValue(field.id, next);
              }}
              onRemove={() => {
                setValue(field.id, persons.filter((_, j) => j !== i));
              }}
            />
          ))}
          <TouchableOpacity
            style={styles.addPersonBtn}
            onPress={() =>
              setValue(field.id, [...persons, { id: uuidv4(), companyName: '', nit: '' }])
            }
          >
            <Text style={styles.addPersonText}>+ {Strings.documents.addLegalPerson}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    default:
      return (
        <AppTextInput
          key={field.id}
          label={field.label}
          value={(value as string) ?? ''}
          onChangeText={(t) => setValue(field.id, t)}
          multiline={field.type === 'multiline'}
          numberOfLines={field.type === 'multiline' ? 4 : 1}
        />
      );
  }
}


const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  lockedField: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  lockedValue: { fontSize: 15, color: Colors.textPrimary },
  lockedHint: { fontSize: 11, color: Colors.primary, marginTop: 4 },
  tableSection: {
    marginBottom: 20,
  },
  tableTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  addPersonBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addPersonText: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1 },
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
  livePreview: {
    height: 360,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  livePreviewWebview: { flex: 1, backgroundColor: 'transparent' },
});
