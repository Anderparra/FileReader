import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { STORAGE_KEYS } from '../../storage/StorageKeys';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const STEPS: Array<{ emoji: string; title: string; render: () => React.ReactNode }> = [
  {
    emoji: '🖍',
    title: '1. Resalta lo que cambia',
    render: () => (
      <>
        <Text style={stepStyles.paragraph}>
          Abre tu plantilla en <Text style={stepStyles.bold}>Word, Google Docs o LibreOffice</Text>.
          Con el resaltador <Text style={stepStyles.yellow}>amarillo</Text>, marca cualquier texto que
          cambie en cada oficio: fechas, nombres, correos, teléfonos, direcciones, radicados.
        </Text>

        <View style={stepStyles.mockup}>
          <Text style={stepStyles.mockupLine}>
            Bogotá D.C., <Text style={stepStyles.hl}>[fecha]</Text>
          </Text>
          <Text style={stepStyles.mockupLine}>Doctor / Doctora</Text>
          <Text style={stepStyles.mockupLine}>
            <Text style={stepStyles.hl}>[nombre del destinatario]</Text>
          </Text>
          <Text style={stepStyles.mockupLine}>
            Correo: <Text style={stepStyles.hl}>[correo electrónico]</Text>
          </Text>
          <Text style={stepStyles.mockupLine}>
            Celular: <Text style={stepStyles.hl}>[número de contacto]</Text>
          </Text>
        </View>

        <Text style={stepStyles.tip}>
          ✨ La app detecta cada trozo resaltado como un campo editable. Sin resaltar nada, igual
          funciona con fechas, correos y teléfonos gracias a patrones automáticos; pero resaltar da
          la mejor precisión.
        </Text>
      </>
    ),
  },
  {
    emoji: '📊',
    title: '2. Tablas: deja los encabezados',
    render: () => (
      <>
        <Text style={stepStyles.paragraph}>
          Si tu plantilla lleva tablas de personas, la primera fila debe tener títulos claros. La app
          reconoce estas combinaciones y las convierte en tablas que llenas dentro de la app (agregar,
          quitar filas, validar cédula y NIT).
        </Text>

        <Text style={stepStyles.subLabel}>Personas naturales</Text>
        <View style={stepStyles.tableMock}>
          <View style={stepStyles.tableHeader}>
            <Text style={stepStyles.tableCell}>Nro.</Text>
            <Text style={stepStyles.tableCell}>NOMBRE Y APELLIDOS</Text>
            <Text style={stepStyles.tableCell}>IDENTIFICACIÓN</Text>
          </View>
          <View style={stepStyles.tableEmpty}>
            <Text style={stepStyles.tableEmptyText}>(el app llena las filas)</Text>
          </View>
        </View>

        <Text style={stepStyles.subLabel}>Personas jurídicas</Text>
        <View style={stepStyles.tableMock}>
          <View style={stepStyles.tableHeader}>
            <Text style={stepStyles.tableCell}>Nro.</Text>
            <Text style={stepStyles.tableCell}>NOMBRE Y APELLIDOS</Text>
            <Text style={stepStyles.tableCell}>NIT</Text>
          </View>
          <View style={stepStyles.tableEmpty}>
            <Text style={stepStyles.tableEmptyText}>(el app llena las filas)</Text>
          </View>
        </View>

        <Text style={stepStyles.tip}>
          Deja una fila vacía debajo de los títulos; la app agregará las que necesites al llenar el
          documento.
        </Text>
      </>
    ),
  },
  {
    emoji: '💾',
    title: '3. Formatos y consejos finales',
    render: () => (
      <>
        <View style={stepStyles.formatRow}>
          <Text style={stepStyles.formatOk}>✅ .docx</Text>
          <Text style={stepStyles.formatDesc}>Word moderno — el formato ideal.</Text>
        </View>
        <View style={stepStyles.formatRow}>
          <Text style={stepStyles.formatOk}>✅ .xlsx</Text>
          <Text style={stepStyles.formatDesc}>Excel moderno — útil para planillas.</Text>
        </View>
        <View style={stepStyles.formatRow}>
          <Text style={stepStyles.formatWarn}>⚠️ .doc</Text>
          <Text style={stepStyles.formatDesc}>
            Word antiguo. Ábrelo en Word → "Guardar como" → .docx.
          </Text>
        </View>
        <View style={stepStyles.formatRow}>
          <Text style={stepStyles.formatWarn}>⚠️ .pdf</Text>
          <Text style={stepStyles.formatDesc}>
            Los PDF no se leen como plantilla. Pide el original en .docx o reconstrúyelo.
          </Text>
        </View>

        <View style={stepStyles.divider} />

        <Text style={stepStyles.subLabel}>Consejos rápidos</Text>
        <Text style={stepStyles.bullet}>• Evita tablas dentro de tablas.</Text>
        <Text style={stepStyles.bullet}>• Usa una sola hoja por plantilla de Excel.</Text>
        <Text style={stepStyles.bullet}>
          • Si un dato no se detecta, vuelve a Word, resáltalo en amarillo y súbelo otra vez.
        </Text>
        <Text style={stepStyles.bullet}>
          • Tu nombre, grado y firma se toman del Perfil — no los resaltes como campo.
        </Text>
      </>
    ),
  },
];

export default function TemplateGuideModal({ visible, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleClose = async () => {
    if (dontShow) {
      await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATE_GUIDE_SEEN, 'true');
    }
    onClose();
    setStep(0);
  };

  const current = STEPS[step];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cómo preparar tu plantilla</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progress}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
            />
          ))}
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <Text style={styles.emoji}>{current.emoji}</Text>
          <Text style={styles.stepTitle}>{current.title}</Text>
          {current.render()}
        </ScrollView>

        <View style={styles.footer}>
          {isLast ? (
            <View style={styles.lastRow}>
              <Switch value={dontShow} onValueChange={setDontShow} />
              <Text style={styles.dontShow}>No volver a mostrar</Text>
            </View>
          ) : null}
          <View style={styles.navRow}>
            {!isFirst ? (
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setStep(step - 1)}>
                <Text style={styles.btnSecondaryText}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => (isLast ? handleClose() : setStep(step + 1))}
            >
              <Text style={styles.btnPrimaryText}>
                {isLast ? 'Entendido' : 'Siguiente →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export async function shouldShowTemplateGuide(): Promise<boolean> {
  const seen = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATE_GUIDE_SEEN);
  return seen !== 'true';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  close: { color: Colors.white, fontSize: 22 },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 24 },
  dotDone: { backgroundColor: Colors.primaryLight },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },
  emoji: { fontSize: 48, textAlign: 'center', marginVertical: 10 },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  lastRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dontShow: { color: Colors.textSecondary, fontSize: 13 },
  navRow: { flexDirection: 'row', gap: 10 },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  btnSecondaryText: { color: Colors.textSecondary, fontWeight: '600' },
  btnPrimary: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  btnPrimaryText: { color: Colors.white, fontWeight: '700' },
});

const stepStyles = StyleSheet.create({
  paragraph: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 21,
    marginBottom: 14,
  },
  bold: { fontWeight: '700', color: Colors.primary },
  yellow: { backgroundColor: '#ffe08a', paddingHorizontal: 4, color: '#7a5c00' },
  mockup: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  mockupLine: {
    fontSize: 13,
    color: '#1a1a1a',
    marginBottom: 6,
    fontFamily: 'serif',
  },
  hl: { backgroundColor: '#ffe08a', color: '#7a5c00', fontWeight: '600' },
  tip: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: 4,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  tableMock: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tableHeader: { flexDirection: 'row', backgroundColor: Colors.primary },
  tableCell: {
    flex: 1,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 11,
    padding: 6,
    textAlign: 'center',
  },
  tableEmpty: { padding: 12, alignItems: 'center', backgroundColor: Colors.surface },
  tableEmptyText: { fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic' },
  formatRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  formatOk: { fontSize: 15, fontWeight: '700', color: Colors.success, width: 80 },
  formatWarn: { fontSize: 15, fontWeight: '700', color: Colors.warning, width: 80 },
  formatDesc: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 19 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  bullet: { fontSize: 13, color: Colors.textPrimary, marginBottom: 6, lineHeight: 19 },
});
