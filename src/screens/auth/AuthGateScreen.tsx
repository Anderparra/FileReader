import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '../../constants/colors';

interface Props {
  onUnlocked: () => void;
}

export default function AuthGateScreen({ onUnlocked }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const attempt = async () => {
    setBusy(true);
    setError(null);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        onUnlocked();
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Gestión Documental',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar PIN del dispositivo',
        disableDeviceFallback: false,
      });
      if (result.success) {
        onUnlocked();
      } else {
        setError('Autenticación cancelada. Intenta de nuevo.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo autenticar.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    attempt();
  }, []);

  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active' && !busy) attempt();
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [busy]);

  return (
    <View style={styles.container}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.title}>Aplicación bloqueada</Text>
      <Text style={styles.subtitle}>
        Esta app contiene información reservada. Autentícate con huella, rostro o PIN para continuar.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.btn} onPress={attempt} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Esperando...' : 'Autenticar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  lock: { fontSize: 72, marginBottom: 16 },
  title: { color: Colors.white, fontSize: 22, fontWeight: '700', marginBottom: 10 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  error: { color: '#ffcccc', marginBottom: 16, textAlign: 'center' },
  btn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});
