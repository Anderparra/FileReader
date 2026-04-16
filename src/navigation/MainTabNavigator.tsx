import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MainTabParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import TemplateStackNavigator from './TemplateStackNavigator';
import DocumentStackNavigator from './DocumentStackNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIcon(name: string, focused: boolean): string {
  const icons: Record<string, [string, string]> = {
    Inicio: ['🏠', '🏠'],
    Plantillas: ['📋', '📋'],
    Documentos: ['📄', '📄'],
    Perfil: ['👤', '👤'],
  };
  return icons[name]?.[focused ? 0 : 1] ?? '●';
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22 }}>{tabIcon(route.name, focused)}</Text>
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingBottom: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ title: Strings.tabs.home, headerTitle: Strings.appName }}
      />
      <Tab.Screen
        name="Plantillas"
        component={TemplateStackNavigator}
        options={{ title: Strings.tabs.templates, headerShown: false }}
      />
      <Tab.Screen
        name="Documentos"
        component={DocumentStackNavigator}
        options={{ title: Strings.tabs.documents, headerShown: false }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ title: Strings.tabs.profile }}
      />
    </Tab.Navigator>
  );
}
