import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Library } from '../app/Library';
import { RecipeForm } from '../app/RecipeForm';
import { fr } from '../i18n/fr';
import { rootStackOptions, stackScreenOptions } from './options';
import type { LibraryStackParamList } from './types';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="LibraryList"
        component={Library}
        options={{ ...rootStackOptions, title: fr.nav.library }}
      />
      <Stack.Screen
        name="RecipeForm"
        component={RecipeForm}
        options={({ route }) => ({
          title: route.params?.recipeId ? fr.recipeForm.titleEdit : fr.recipeForm.titleCreate,
        })}
      />
    </Stack.Navigator>
  );
}
