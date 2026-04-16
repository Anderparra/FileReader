import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DocumentStackParamList } from './types';
import DocumentListScreen from '../screens/document/DocumentListScreen';
import DocumentFillScreen from '../screens/document/DocumentFillScreen';
import DocumentPreviewScreen from '../screens/document/DocumentPreviewScreen';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<DocumentStackParamList>();

export default function DocumentStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="DocumentList" component={DocumentListScreen} options={{ title: 'Documentos' }} />
      <Stack.Screen name="DocumentFill" component={DocumentFillScreen} options={{ title: 'Llenar Oficio' }} />
      <Stack.Screen name="DocumentPreview" component={DocumentPreviewScreen} options={{ title: 'Vista Previa' }} />
    </Stack.Navigator>
  );
}
