import { deleteSecureItem, getSecureItem, setSecureItem } from './secureKV';

const KEY = 'mealmatch.anthropicApiKey';

export async function getApiKey(): Promise<string | null> {
  return getSecureItem(KEY);
}

export async function setApiKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (trimmed === '') {
    await deleteSecureItem(KEY);
  } else {
    await setSecureItem(KEY, trimmed);
  }
}
