import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AppTextInput from '../../components/common/AppTextInput';
import AppButton from '../../components/common/AppButton';
import SignaturePad from '../../components/document/SignaturePad';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import { useProfile } from '../../hooks/useProfile';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { exportBackup, importBackup } from '../../utils/backup';

export default function ProfileScreen() {
  const { profile, loading, save } = useProfile();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('');
  const [position, setPosition] = useState('');
  const [unit, setUnit] = useState('');
  const [signatureBase64, setSignatureBase64] = useState('');
  const [showSigPad, setShowSigPad] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleBackup = async () => {
    setBusy(true);
    try {
      await exportBackup();
      Alert.alert('Copia de seguridad', 'Archivo generado y listo para compartir.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo crear la copia.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      Alert.alert(
        'Restaurar copia',
        'Se sobrescribirán tus plantillas, documentos, frases y perfil actuales. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: async () => {
              setBusy(true);
              try {
                await importBackup(result.assets[0].uri);
                Alert.alert(
                  'Restauración completa',
                  'Cierra y vuelve a abrir la app para ver los cambios.',
                );
              } catch (err: any) {
                Alert.alert('Error', err?.message ?? 'Archivo inválido.');
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo leer el archivo.');
    }
  };

  if (loading) return <LoadingOverlay message={Strings.common.loading} />;

  const startEdit = () => {
    setFullName(profile?.fullName ?? '');
    setRank(profile?.rank ?? '');
    setPosition(profile?.position ?? '');
    setUnit(profile?.unit ?? '');
    setSignatureBase64('');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('', 'El nombre completo es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      let signatureFileUri = profile?.signatureFileUri;
      if (signatureBase64) {
        const fileUri = (documentDirectory ?? '') + 'signature.png';
        const base64Data = signatureBase64.replace(/^data:image\/png;base64,/, '');
        await writeAsStringAsync(fileUri, base64Data, {
          encoding: EncodingType.Base64,
        });
        signatureFileUri = fileUri;
      }
      await save({
        fullName: fullName.trim(),
        rank: rank.trim(),
        position: position.trim(),
        unit: unit.trim(),
        signatureFileUri,
        isConfigured: true,
      });
      setEditing(false);
      Alert.alert('', Strings.profile.profileSaved);
    } catch (err: any) {
      Alert.alert('Error al guardar', err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.fullName ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.fullName ?? '—'}</Text>
          <Text style={styles.rankText}>{profile?.rank}</Text>
          <Text style={styles.positionText}>{profile?.position}</Text>
        </View>

        <View style={styles.card}>
          <Row label="Unidad" value={profile?.unit ?? '—'} />
        </View>

        {profile?.signatureFileUri ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Firma</Text>
            <Image
              source={{ uri: profile.signatureFileUri }}
              style={styles.sigImage}
              resizeMode="contain"
            />
          </View>
        ) : null}

        <AppButton title={Strings.profile.editProfile} onPress={startEdit} style={styles.editBtn} />

        <View style={styles.backupSection}>
          <Text style={styles.sectionTitle}>Copia de seguridad</Text>
          <Text style={styles.sectionHint}>
            Exporta o restaura tus plantillas, documentos, frases y perfil.
          </Text>
          <AppButton
            title={busy ? 'Trabajando...' : '💾  Crear copia de seguridad'}
            variant="outline"
            onPress={handleBackup}
            loading={busy}
            style={styles.backupBtn}
          />
          <AppButton
            title="📂  Restaurar desde archivo"
            variant="outline"
            onPress={handleRestore}
            style={styles.backupBtn}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        <AppTextInput label={Strings.profile.fullName} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <AppTextInput label={Strings.profile.rank} value={rank} onChangeText={setRank} autoCapitalize="words" />
        <AppTextInput label={Strings.profile.position} value={position} onChangeText={setPosition} autoCapitalize="words" />
        <AppTextInput label={Strings.profile.unit} value={unit} onChangeText={setUnit} autoCapitalize="words" />

        <Text style={styles.sigLabel}>{Strings.profile.signature}</Text>
        {signatureBase64 ? (
          <View>
            <Image source={{ uri: signatureBase64 }} style={styles.sigImage} resizeMode="contain" />
            <AppButton title="Redibujar" variant="outline" onPress={() => { setSignatureBase64(''); setShowSigPad(true); }} />
          </View>
        ) : showSigPad ? (
          <SignaturePad
            onSave={(b64) => { setSignatureBase64(b64); setShowSigPad(false); setScrollEnabled(true); }}
            onDrawStart={() => setScrollEnabled(false)}
            onDrawEnd={() => setScrollEnabled(true)}
          />
        ) : (
          <AppButton title="Cambiar firma" variant="outline" onPress={() => setShowSigPad(true)} style={styles.sigBtn} />
        )}

        <View style={styles.row}>
          <AppButton title="Cancelar" variant="outline" onPress={() => setEditing(false)} style={styles.halfBtn} />
          <AppButton title="Guardar" onPress={handleSave} loading={saving} style={styles.halfBtn} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.white },
  name: { fontSize: 18, fontWeight: '700', color: Colors.white },
  rankText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  positionText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },
  sigImage: { height: 90, backgroundColor: Colors.background, borderRadius: 8 },
  sigLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  sigBtn: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  halfBtn: { flex: 1 },
  editBtn: { marginTop: 8 },
  backupSection: { marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12, lineHeight: 17 },
  backupBtn: { marginBottom: 8 },
});
