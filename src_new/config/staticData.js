export const sampleCategories = [
  {
    id: 'food',
    name: 'Food',
    icon: 'restaurant',
    subcategories: ['Biryani', 'South Indian', 'Chinese'],
  },
  {
    id: 'grocery',
    name: 'Grocery',
    icon: 'shopping-basket',
    subcategories: ['Rice & Flour', 'Spices', 'Essentials'],
  },
  {
    id: 'produce',
    name: 'Vegetable & Fruits',
    icon: 'eco',
    subcategories: ['Vegetables', 'Fruits', 'Greens'],
  },
  {
    id: 'meat',
    name: 'Meat',
    icon: 'set-meal',
    subcategories: ['Chicken', 'Fish', 'Mutton'],
  },
  {
    id: 'pickles',
    name: 'Pickles',
    icon: 'kitchen',
    subcategories: ['Mango', 'Lemon', 'Mixed'],
  },
  {
    id: 'care',
    name: 'Personal Care',
    icon: 'spa',
    subcategories: ['Skin Care', 'Hair Care', 'Bath'],
  },
  {
    id: 'snacks',
    name: 'Snacks',
    icon: 'bakery-dining',
    subcategories: ['Bakery', 'Sweets', 'Savouries'],
  },
  {
    id: 'dairy',
    name: 'Dairy Items',
    icon: 'local-drink',
    subcategories: ['Milk', 'Curd', 'Paneer'],
  },
];

// Local fixtures only; these are not live businesses or availability.
export const sampleShops = sampleCategories.flatMap(category =>
  category.subcategories.map((subcategory, index) => ({
    id: `${category.id}-${index}`,
    categoryId: category.id,
    subcategory,
    name:
      category.id === 'food'
        ? ['Godavari Kitchen', 'South Indian House', 'Wok & Bowl'][index]
        : `${subcategory} ${category.id === 'grocery' ? 'Mart' : 'Store'}`,
    rating: ['4.5', '4.3', '4.6'][index],
    time: ['20–30 min', '25–35 min', '15–25 min'][index],
    icon: category.icon,
  })),
);
