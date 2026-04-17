import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { DocumentAttachment } from '../../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  attachments: DocumentAttachment[];
  onChange: (next: DocumentAttachment[]) => void;
}

export default function EvidencePicker({ attachments, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  const pickFromLibrary = async () => {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso denegado', 'No se otorgó permiso a la galería.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsMultipleSelection: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      onChange([
        ...attachments,
        {
          id: uuidv4(),
          uri: asset.uri,
          type: 'image',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso denegado', 'No se otorgó permiso a la cámara.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      onChange([
        ...attachments,
        {
          id: uuidv4(),
          uri: asset.uri,
          type: 'image',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const updateLabel = (id: string, label: string) => {
    onChange(attachments.map((a) => (a.id === id ? { ...a, label } : a)));
  };

  const remove = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evidencia fotográfica ({attachments.length})</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={takePhoto} disabled={busy}>
          <Text style={styles.btnText}>📷  Tomar foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={pickFromLibrary} disabled={busy}>
          <Text style={styles.btnSecondaryText}>🖼  Galería</Text>
        </TouchableOpacity>
      </View>

      {attachments.map((att) => (
        <View key={att.id} style={styles.attachment}>
          <Image source={{ uri: att.uri }} style={styles.thumb} resizeMode="cover" />
          <View style={styles.attachmentInfo}>
            <Text style={styles.attachmentDate}>
              {new Date(att.createdAt).toLocaleString('es-CO')}
            </Text>
            <TouchableOpacity onPress={() => remove(att.id)} style={styles.removeBtn}>
              <Text style={styles.removeText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttons: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  btnText: { color: Colors.white, fontWeight: '600' },
  btnSecondaryText: { color: Colors.primary, fontWeight: '600' },
  attachment: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  thumb: { width: 80, height: 80, borderRadius: 6, backgroundColor: Colors.background },
  attachmentInfo: { flex: 1, justifyContent: 'space-between' },
  attachmentDate: { fontSize: 12, color: Colors.textSecondary },
  removeBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  removeText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
});
