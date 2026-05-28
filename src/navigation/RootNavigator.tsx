import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { HomeStack } from './HomeStack';
import { LibraryStack } from './LibraryStack';
import { ComposeStack } from './ComposeStack';
import { MenusStack } from './MenusStack';
import { ImportStack } from './ImportStack';
import { SettingsStack } from './SettingsStack';
import { colors } from '../theme/colors';
import { fr } from '../i18n/fr';

const Drawer = createDrawerNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="HomeTab"
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.text,
          drawerStyle: { backgroundColor: colors.surface },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Drawer.Screen name="HomeTab" component={HomeStack} options={{ title: fr.nav.home }} />
        <Drawer.Screen name="LibraryTab" component={LibraryStack} options={{ title: fr.nav.library }} />
        <Drawer.Screen name="ComposeTab" component={ComposeStack} options={{ title: fr.nav.compose }} />
        <Drawer.Screen name="MenusTab" component={MenusStack} options={{ title: fr.nav.savedMenus }} />
        <Drawer.Screen name="ImportTab" component={ImportStack} options={{ title: fr.nav.importBatch }} />
        <Drawer.Screen name="SettingsTab" component={SettingsStack} options={{ title: fr.nav.settings }} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
