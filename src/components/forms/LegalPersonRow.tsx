import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LegalPerson } from '../../types';
import AppTextInput from '../common/AppTextInput';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import { validateNit } from '../../utils/coValidators';

interface Props {
  person: LegalPerson;
  onChange: (updated: LegalPerson) => void;
  onRemove: () => void;
}

export default function LegalPersonRow({ person, onChange, onRemove }: Props) {
  const v = validateNit(person.nit);
  const showStatus = person.nit.length > 0;

  return (
    <View style={styles.container}>
      <AppTextInput
        label={Strings.documents.companyName}
        value={person.companyName}
        onChangeText={(t) => onChange({ ...person, companyName: t })}
        autoCapitalize="words"
        style={styles.input}
      />
      <AppTextInput
        label={Strings.documents.nit}
        value={person.nit}
        onChangeText={(t) => onChange({ ...person, nit: t })}
        keyboardType="numeric"
        style={styles.input}
      />
      {showStatus ? (
        <Text style={[styles.status, { color: v.valid ? Colors.success : Colors.danger }]}>
          {v.valid ? '✓ NIT válido' : `⚠ ${v.message ?? 'NIT inválido'}`}
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
