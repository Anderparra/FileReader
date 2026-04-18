import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { ToolsStackParamList } from '../../navigation/types';

type Props = { navigation: NativeStackNavigationProp<ToolsStackParamList, 'ToolsHome'> };

interface Tool {
  key: keyof ToolsStackParamList;
  icon: string;
  label: string;
  description: string;
  color: string;
}

const TOOLS: Tool[] = [
  {
    key: 'Snippets',
    icon: '💬',
    label: 'Frases rápidas',
    description: 'Párrafos reutilizables para oficios (saludo, cierre, reserva).',
    color: '#9b59b6',
  },
  {
    key: 'Contacts',
    icon: '📇',
    label: 'Contactos',
    description: 'Fiscales, jueces, peritos, testigos y colegas.',
    color: '#1abc9c',
  },
  {
    key: 'Reference',
    icon: '📚',
    label: 'Referencia jurídica',
    description: 'Artículos más usados (CPC, Ley 1708, Ley 1581, CPP).',
    color: '#e67e22',
  },
  {
    key: 'Checklists',
    icon: '✅',
    label: 'Listas operativas',
    description: 'Inspección ocular, entrevista, captura, cadena de custodia.',
    color: '#2ecc71',
  },
];

export default function ToolsScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Herramientas del investigador</Text>
      <Text style={styles.subtitle}>
        Utilidades complementarias a la gestión documental.
      </Text>

      <View style={styles.grid}>
        {TOOLS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.card, { borderLeftColor: t.color }]}
            onPress={() => navigation.navigate(t.key as any)}
          >
            <Text style={styles.cardIcon}>{t.icon}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>{t.label}</Text>
              <Text style={styles.cardDesc}>{t.description}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20, lineHeight: 18 },
  grid: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    gap: 14,
  },
  cardIcon: { fontSize: 32 },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 3, lineHeight: 17 },
  chev: { fontSize: 28, color: Colors.textDisabled, fontWeight: '300' },
});
