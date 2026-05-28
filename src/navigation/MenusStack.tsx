import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SavedMenus } from '../app/SavedMenus';
import { MenuDetail } from '../app/MenuDetail';
import { fr } from '../i18n/fr';
import { rootStackOptions, stackScreenOptions } from './options';
import type { MenusStackParamList } from './types';

const Stack = createNativeStackNavigator<MenusStackParamList>();

export function MenusStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="SavedMenusList"
        component={SavedMenus}
        options={{ ...rootStackOptions, title: fr.nav.savedMenus }}
      />
      <Stack.Screen
        name="MenuDetail"
        component={MenuDetail}
        options={{ title: fr.menuDetail.title }}
      />
    </Stack.Navigator>
  );
}
