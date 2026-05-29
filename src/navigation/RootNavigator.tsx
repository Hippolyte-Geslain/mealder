import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { MainTabs } from './MainTabs';
import { MenusStack } from './MenusStack';
import { ImportStack } from './ImportStack';
import { SettingsStack } from './SettingsStack';
import { colors } from '../theme/colors';
import { fr } from '../i18n/fr';
import type { RootDrawerParamList } from './types';

const Drawer = createDrawerNavigator<RootDrawerParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.text,
          drawerStyle: { backgroundColor: colors.surface },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Drawer.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            title: fr.nav.home,
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="MenusTab"
          component={MenusStack}
          options={{
            title: fr.nav.savedMenus,
            drawerIcon: ({ color, size }) => (
              <Ionicons name="bookmark-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="ImportTab"
          component={ImportStack}
          options={{
            title: fr.nav.importBatch,
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cloud-upload-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="SettingsTab"
          component={SettingsStack}
          options={{
            title: fr.nav.settings,
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" color={color} size={size} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
