import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { RecipeDraft } from '../ocr/claude';

export type LibraryStackParamList = {
  LibraryList: { search?: string } | undefined;
  RecipeForm: { recipeId?: string } | undefined;
};

export type ComposeStackParamList = {
  ComposeStart: undefined;
  MenuSummary: undefined;
  MenuDetail: { menuId: string };
};

export type MenusStackParamList = {
  SavedMenusList: undefined;
  MenuDetail: { menuId: string };
};

export type HomeStackParamList = {
  HomeMain: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
};

export type ImportStackParamList = {
  ImportPicker: undefined;
  ImportReview: { drafts: RecipeDraft[] };
};

export type DrawerParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  ComposeTab: NavigatorScreenParams<ComposeStackParamList>;
  MenusTab: NavigatorScreenParams<MenusStackParamList>;
  ImportTab: NavigatorScreenParams<ImportStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type LibraryListProps = NativeStackScreenProps<LibraryStackParamList, 'LibraryList'>;
export type RecipeFormProps = NativeStackScreenProps<LibraryStackParamList, 'RecipeForm'>;
export type ComposeStartProps = NativeStackScreenProps<ComposeStackParamList, 'ComposeStart'>;
export type MenuSummaryProps = NativeStackScreenProps<ComposeStackParamList, 'MenuSummary'>;
export type ComposeMenuDetailProps = NativeStackScreenProps<ComposeStackParamList, 'MenuDetail'>;
export type SavedMenusListProps = NativeStackScreenProps<MenusStackParamList, 'SavedMenusList'>;
export type MenuDetailProps = NativeStackScreenProps<MenusStackParamList, 'MenuDetail'>;
export type HomeMainProps = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;
export type ImportPickerProps = NativeStackScreenProps<ImportStackParamList, 'ImportPicker'>;
export type ImportReviewProps = NativeStackScreenProps<ImportStackParamList, 'ImportReview'>;
