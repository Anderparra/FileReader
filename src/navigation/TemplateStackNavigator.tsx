import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TemplateStackParamList } from './types';
import TemplateListScreen from '../screens/templates/TemplateListScreen';
import TemplateEditorScreen from '../screens/templates/TemplateEditorScreen';
import TemplateUploadScreen from '../screens/templates/TemplateUploadScreen';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<TemplateStackParamList>();

export default function TemplateStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="TemplateList" component={TemplateListScreen} options={{ title: 'Plantillas' }} />
      <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} options={{ title: 'Editor de Plantilla' }} />
      <Stack.Screen name="TemplateUpload" component={TemplateUploadScreen} options={{ title: 'Subir Documento' }} />
    </Stack.Navigator>
  );
}
