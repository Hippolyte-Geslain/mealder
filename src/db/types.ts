export type Course = 'entree' | 'plat' | 'dessert';

export const COURSES: Course[] = ['entree', 'plat', 'dessert'];

export type Recipe = {
  id: string;
  ownerId: string;
  name: string;
  course: Course;
  photoUri: string | null;
  createdAt: number;
  updatedAt: number;
};

export type Ingredient = {
  id: string;
  recipeId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  costPerPortion: number;
  position: number;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: Ingredient[];
  totalCostPerPortion: number;
};

export type Menu = {
  id: string;
  ownerId: string;
  composedBy: string | null;
  title: string;
  couverts: number;
  createdAt: number;
  updatedAt: number;
};

export type MenuWithCourses = Menu & {
  courses: { course: Course; recipe: RecipeWithIngredients }[];
  totalCostPerPortion: number;
};
