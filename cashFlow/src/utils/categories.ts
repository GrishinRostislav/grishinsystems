export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  subcategories?: Category[];
  [key: string]: any;
};

export type FlatCategory = Category & { depth: number };

/**
 * Builds a recursive tree from a flat array of categories.
 */
export function buildCategoryTree(flatCategories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  // Initialize map with copies to avoid mutating original objects unexpectedly
  for (const cat of flatCategories) {
    map.set(cat.id, { ...cat, subcategories: [] });
  }

  // Build tree
  for (const cat of map.values()) {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.subcategories!.push(cat);
    } else {
      roots.push(cat);
    }
  }

  // Optional: sort subcategories by name alphabetically at each level
  const sortByName = (a: Category, b: Category) => a.name.localeCompare(b.name);
  
  const sortRecursively = (categories: Category[]) => {
    categories.sort(sortByName);
    for (const cat of categories) {
      if (cat.subcategories && cat.subcategories.length > 0) {
        sortRecursively(cat.subcategories);
      }
    }
  };

  sortRecursively(roots);
  return roots;
}

/**
 * Flattens a category tree into an array with depth indicators,
 * suitable for rendering indented dropdown lists.
 */
export function flattenCategoryTree(categories: Category[], depth = 0): FlatCategory[] {
  let flat: FlatCategory[] = [];
  
  for (const cat of categories) {
    flat.push({ ...cat, depth });
    if (cat.subcategories && cat.subcategories.length > 0) {
      flat = flat.concat(flattenCategoryTree(cat.subcategories, depth + 1));
    }
  }
  
  return flat;
}
