import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { uuid } from './uuid';

const PHOTOS_DIR = `${FileSystem.documentDirectory}recipe-photos/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function pickAndStoreRecipePhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const src = result.assets[0].uri;
  await ensureDir();
  const ext = src.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const dest = `${PHOTOS_DIR}${uuid()}.${ext}`;
  await FileSystem.copyAsync({ from: src, to: dest });
  return dest;
}
