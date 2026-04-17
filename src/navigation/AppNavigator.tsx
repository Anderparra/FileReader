import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import MainTabNavigator from './MainTabNavigator';
import LoadingOverlay from '../components/common/LoadingOverlay';
import AuthGateScreen from '../screens/auth/AuthGateScreen';
import { getProfile } from '../storage/profileStorage';
import { isSecurityEnabled } from '../storage/securityStorage';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');
  const [securityOn, setSecurityOn] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    (async () => {
      const [profile, sec] = await Promise.all([getProfile(), isSecurityEnabled()]);
      setInitialRoute(profile?.isConfigured ? 'Main' : 'Onboarding');
      setSecurityOn(sec);
      setReady(true);
    })();
  }, []);

  if (!ready) return <LoadingOverlay message="Cargando..." />;
  if (securityOn && !unlocked) {
    return <AuthGateScreen onUnlocked={() => setUnlocked(true)} />;
  }

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
