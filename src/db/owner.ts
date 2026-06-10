import { getSecureItem, setSecureItem } from '../utils/secureKV';
import { uuid } from '../utils/uuid';

const KEY = 'mealmatch.deviceOwnerId';
let _cache: string | null = null;

export async function ensureDeviceOwnerId(): Promise<string> {
  if (_cache) return _cache;
  let id = await getSecureItem(KEY);
  if (!id) {
    id = uuid();
    await setSecureItem(KEY, id);
  }
  _cache = id;
  return id;
}
