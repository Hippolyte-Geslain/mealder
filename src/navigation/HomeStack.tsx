import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home } from '../app/Home';
import { fr } from '../i18n/fr';
import { rootStackOptions, stackScreenOptions } from './options';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="HomeMain"
        component={Home}
        options={{ ...rootStackOptions, title: fr.nav.home }}
      />
    </Stack.Navigator>
  );
}
