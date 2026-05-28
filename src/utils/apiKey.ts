import * as SecureStore from 'expo-secure-store';

const KEY = 'mealmatch.anthropicApiKey';

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setApiKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (trimmed === '') {
    await SecureStore.deleteItemAsync(KEY);
  } else {
    await SecureStore.setItemAsync(KEY, trimmed);
  }
}
