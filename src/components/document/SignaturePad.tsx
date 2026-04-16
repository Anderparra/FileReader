import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SignatureCanvas, { SignatureViewRef } from 'react-native-signature-canvas';
import { Colors } from '../../constants/colors';

interface Props {
  onSave: (base64: string) => void;
  onClear?: () => void;
  height?: number;
}

export default function SignaturePad({ onSave, onClear, height = 200 }: Props) {
  const ref = useRef<SignatureViewRef>(null);

  const handleOK = (signature: string) => {
    onSave(signature);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
    onClear?.();
  };

  const handleSave = () => {
    ref.current?.readSignature();
  };

  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; }
    body, html { height: ${height}px; }
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dibuja tu firma en el recuadro</Text>
      <View style={[styles.padContainer, { height }]}>
        <SignatureCanvas
          ref={ref}
          onOK={handleOK}
          onEmpty={() => {}}
          descriptionText=""
          clearText="Limpiar"
          confirmText="Guardar"
          webStyle={webStyle}
          autoClear={false}
          style={styles.canvas}
        />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearText}>Limpiar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Guardar firma</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  padContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  canvas: { flex: 1 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
  },
  clearText: { color: Colors.textSecondary, fontSize: 14 },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  saveText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
});
