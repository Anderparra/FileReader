import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NaturalPerson } from '../../types';
import AppTextInput from '../common/AppTextInput';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';

interface Props {
  person: NaturalPerson;
  onChange: (updated: NaturalPerson) => void;
  onRemove: () => void;
}

export default function NaturalPersonRow({ person, onChange, onRemove }: Props) {
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
  removeBtn: { alignSelf: 'flex-end' },
  removeText: { color: Colors.danger, fontSize: 13 },
});
