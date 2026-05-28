import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ImportPicker } from '../app/ImportPicker';
import { ImportReview } from '../app/ImportReview';
import { fr } from '../i18n/fr';
import { rootStackOptions, stackScreenOptions } from './options';
import type { ImportStackParamList } from './types';

const Stack = createNativeStackNavigator<ImportStackParamList>();

export function ImportStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="ImportPicker"
        component={ImportPicker}
        options={{ ...rootStackOptions, title: fr.import.title }}
      />
      <Stack.Screen
        name="ImportReview"
        component={ImportReview}
        options={{ title: fr.import.reviewTitle }}
      />
    </Stack.Navigator>
  );
}
