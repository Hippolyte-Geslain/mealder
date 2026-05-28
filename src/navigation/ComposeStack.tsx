import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Compose } from '../app/Compose';
import { MenuSummary } from '../app/MenuSummary';
import { MenuDetail } from '../app/MenuDetail';
import { fr } from '../i18n/fr';
import { rootStackOptions, stackScreenOptions } from './options';
import type { ComposeStackParamList } from './types';

const Stack = createNativeStackNavigator<ComposeStackParamList>();

export function ComposeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="ComposeStart"
        component={Compose}
        options={{ ...rootStackOptions, title: fr.nav.compose }}
      />
      <Stack.Screen
        name="MenuSummary"
        component={MenuSummary}
        options={{ title: fr.menuSummary.title }}
      />
      <Stack.Screen
        name="MenuDetail"
        component={MenuDetail}
        options={{ title: fr.menuDetail.title }}
      />
    </Stack.Navigator>
  );
}
