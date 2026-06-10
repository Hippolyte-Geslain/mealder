import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store n'a pas de support web : repli sur localStorage.
// (Moins protégé qu'un keychain, mais le BYOK web est assumé — la clé reste
// sur la machine de l'utilisateur, comme sur natif.)

export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // déjà absent ou stockage indisponible
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
