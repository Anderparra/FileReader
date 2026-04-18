import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ToolsStackParamList } from './types';
import ToolsScreen from '../screens/tools/ToolsScreen';
import SnippetsScreen from '../screens/snippets/SnippetsScreen';
import ContactsScreen from '../screens/contacts/ContactsScreen';
import LegalReferenceScreen from '../screens/reference/LegalReferenceScreen';
import ChecklistsScreen from '../screens/checklists/ChecklistsScreen';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<ToolsStackParamList>();

export default function ToolsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="ToolsHome" component={ToolsScreen} options={{ title: 'Herramientas' }} />
      <Stack.Screen name="Snippets" component={SnippetsScreen} options={{ title: 'Frases rápidas' }} />
      <Stack.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Contactos' }} />
      <Stack.Screen name="Reference" component={LegalReferenceScreen} options={{ title: 'Referencia jurídica' }} />
      <Stack.Screen name="Checklists" component={ChecklistsScreen} options={{ title: 'Listas operativas' }} />
    </Stack.Navigator>
  );
}
