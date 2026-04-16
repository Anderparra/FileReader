import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import AppTextInput from '../../components/common/AppTextInput';
import AppButton from '../../components/common/AppButton';
import SignaturePad from '../../components/document/SignaturePad';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import { saveProfile } from '../../storage/profileStorage';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export default function ProfileSetupScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('');
  const [position, setPosition] = useState('');
  const [unit, setUnit] = useState('');
  const [signatureBase64, setSignatureBase64] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSigPad, setShowSigPad] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('', 'El nombre completo es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      let signatureFileUri: string | undefined;

      if (signatureBase64) {
        const fileUri = (documentDirectory ?? '') + 'signature.png';
        const base64Data = signatureBase64.replace(/^data:image\/png;base64,/, '');
        await writeAsStringAsync(fileUri, base64Data, {
          encoding: EncodingType.Base64,
        });
        signatureFileUri = fileUri;
      }

      await saveProfile({
        fullName: fullName.trim(),
        rank: rank.trim(),
        position: position.trim(),
        unit: unit.trim(),
        signatureFileUri,
        isConfigured: true,
      });

      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🔵</Text>
          </View>
          <Text style={styles.title}>{Strings.profile.setup}</Text>
          <Text style={styles.subtitle}>{Strings.profile.setupSubtitle}</Text>
        </View>

        <AppTextInput
          label={Strings.profile.fullName}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Ej. Oscar Stiven Parra Hoyos"
          autoCapitalize="words"
        />
        <AppTextInput
          label={Strings.profile.rank}
          value={rank}
          onChangeText={setRank}
          placeholder="Ej. Patrullero de Policía"
          autoCapitalize="words"
        />
        <AppTextInput
          label={Strings.profile.position}
          value={position}
          onChangeText={setPosition}
          placeholder="Ej. Investigador Criminal"
          autoCapitalize="words"
        />
        <AppTextInput
          label={Strings.profile.unit}
          value={unit}
          onChangeText={setUnit}
          placeholder="Ej. DIJIN - AIFIT-GRULA"
          autoCapitalize="words"
        />

        <Text style={styles.sectionLabel}>{Strings.profile.signature}</Text>
        {signatureBase64 ? (
          <View style={styles.sigPreview}>
            <Image
              source={{ uri: signatureBase64 }}
              style={styles.sigImage}
              resizeMode="contain"
            />
            <AppButton
              title="Redibujar firma"
              variant="outline"
              onPress={() => { setSignatureBase64(''); setShowSigPad(true); }}
              style={styles.redrawBtn}
            />
          </View>
        ) : showSigPad ? (
          <SignaturePad
            onSave={(b64) => { setSignatureBase64(b64); setShowSigPad(false); }}
            onClear={() => setSignatureBase64('')}
          />
        ) : (
          <AppButton
            title={Strings.profile.drawSignature}
            variant="outline"
            onPress={() => setShowSigPad(true)}
            style={styles.sigBtn}
          />
        )}

        <AppButton
          title={Strings.profile.saveProfile}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  badge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeIcon: { fontSize: 32 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sigBtn: { marginBottom: 16 },
  sigPreview: { marginBottom: 16 },
  sigImage: { height: 100, backgroundColor: Colors.surface, borderRadius: 8, marginBottom: 8 },
  redrawBtn: {},
  saveBtn: { marginTop: 8 },
});
