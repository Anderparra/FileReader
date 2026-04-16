import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import MainTabNavigator from './MainTabNavigator';
import LoadingOverlay from '../components/common/LoadingOverlay';
import { getProfile } from '../storage/profileStorage';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');

  useEffect(() => {
    getProfile().then((profile) => {
      setInitialRoute(profile?.isConfigured ? 'Main' : 'Onboarding');
      setReady(true);
    });
  }, []);

  if (!ready) return <LoadingOverlay message="Cargando..." />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="Onboarding"
          component={ProfileSetupScreen}
          options={{
            headerShown: true,
            title: 'Configurar Perfil',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: Colors.white,
          }}
        />
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
