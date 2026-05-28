import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Settings } from '../app/Settings';
import { fr } from '../i18n/fr';
import { rootStackOptions, stackScreenOptions } from './options';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="SettingsMain"
        component={Settings}
        options={{ ...rootStackOptions, title: fr.nav.settings }}
      />
    </Stack.Navigator>
  );
}
