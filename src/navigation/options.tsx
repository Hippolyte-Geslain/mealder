import { Pressable, Text } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

function DrawerHamburger() {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      hitSlop={10}
      style={{ paddingHorizontal: 12, paddingVertical: 4 }}
    >
      <Text style={{ fontSize: 24, color: colors.text }}>≡</Text>
    </Pressable>
  );
}

export const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: colors.background },
};

export const rootStackOptions: NativeStackNavigationOptions = {
  headerLeft: () => <DrawerHamburger />,
};
