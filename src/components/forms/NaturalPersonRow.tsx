import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NaturalPerson } from '../../types';
import AppTextInput from '../common/AppTextInput';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import { validateCedula } from '../../utils/coValidators';

interface Props {
  person: NaturalPerson;
  onChange: (updated: NaturalPerson) => void;
  onRemove: () => void;
}

export default function NaturalPersonRow({ person, onChange, onRemove }: Props) {
  const v = validateCedula(person.cedula);
  const showStatus = person.cedula.length > 0;

  return (
    <View style={styles.container}>
      <AppTextInput
        label={Strings.documents.personName}
        value={person.name}
        onChangeText={(t) => onChange({ ...person, name: t })}
        autoCapitalize="words"
        style={styles.input}
      />
      <AppTextInput
        label={Strings.documents.cedula}
        value={person.cedula}
        onChangeText={(t) => onChange({ ...person, cedula: t })}
        keyboardType="numeric"
        style={styles.input}
      />
      {showStatus ? (
        <Text style={[styles.status, { color: v.valid ? Colors.success : Colors.danger }]}>
          {v.valid ? '✓ Cédula válida' : `⚠ ${v.message ?? 'Cédula inválida'}`}
        </Text>
      ) : null}
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Text style={styles.removeText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: { marginBottom: 10 },
  status: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  removeBtn: { alignSelf: 'flex-end' },
  removeText: { color: Colors.danger, fontSize: 13 },
});
