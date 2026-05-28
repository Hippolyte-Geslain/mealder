import * as SecureStore from 'expo-secure-store';
import { uuid } from '../utils/uuid';

const KEY = 'mealmatch.deviceOwnerId';
let _cache: string | null = null;

export async function ensureDeviceOwnerId(): Promise<string> {
  if (_cache) return _cache;
  let id = await SecureStore.getItemAsync(KEY);
  if (!id) {
    id = uuid();
    await SecureStore.setItemAsync(KEY, id);
  }
  _cache = id;
  return id;
}
