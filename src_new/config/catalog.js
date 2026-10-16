// Local catalog for the main-screen preview; no commerce API calls.
// Temporary standalone photos fill the gaps in the supplied reference assets.
// Keep these bundled locally so the static preview never fetches catalog images.
const photo = (source, resizeMode = 'cover', aspectRatio = 640 / 427) => ({
  source,
  borderRadius: 10,
  resizeMode,
  aspectRatio,
});
const temporaryArtwork = {
  // These bundled JPEGs render reliably in the Android image pipeline.
  rice: photo(require('../assets/main/placeholders/rice.jpg')),
  spices: photo(require('../assets/main/placeholders/spices.jpg')),
  dairy: photo(
    require('../assets/main/placeholders/eggs.jpg'),
    'cover',
    640 / 528,
  ),
  oils: photo(
    require('../assets/main/placeholders/oil.jpg'),
    'cover',
    640 / 971,
  ),
  snacks: photo(
    require('../assets/main/placeholders/snacks.jpg'),
    'cover',
    640 / 964,
  ),
  chocolate: photo(require('../assets/main/placeholders/chocolate.jpg')),
  beverages: photo(
    require('../assets/main/placeholders/juice.jpg'),
    'contain',
    640 / 960,
  ),
  care: photo(
    require('../assets/main/placeholders/personal-care.jpg'),
    'contain',
    640 / 616,
  ),
  breakfast: photo(require('../assets/main/placeholders/cereal.jpg')),
  electronics: photo(require('../assets/main/placeholders/headphones.jpg')),
  dress: photo(require('../assets/main/placeholders/dress.jpg')),
  watch: photo(
    require('../assets/main/placeholders/watch.jpg'),
    'cover',
    640 / 512,
  ),
  shoes: photo(require('../assets/main/placeholders/shoes.jpg')),
  luggage: photo(require('../assets/main/placeholders/luggage.jpg')),
};
const categoryIcon = (source, resizeMode = 'contain') => ({
  source,
  background: require('../assets/main/references/category-background.png'),
  resizeMode,
});
const subcategoryCutouts = {
  // Shared transparent PNG cutouts keep subcategory imagery consistent and
  // let each tile's pastel color show through instead of adding a photo box.
  rice: require('../assets/main/products/rice.png'),
  spices: require('../assets/main/products/spices.png'),
  dairy: require('../assets/main/products/eggs.png'),
  oils: require('../assets/main/products/oil.png'),
  snacks: require('../assets/main/products/snack.png'),
  beverages: require('../assets/main/placeholders/juice.jpg'),
  care: require('../assets/main/references/beauty-personal-care.png'),
  breakfast: require('../assets/main/placeholders/cereal.jpg'),

};
const cutoutFor = source => ({source, resizeMode: 'contain'});
// Each subcategory uses its own cell from the bundled 6 x 6 artwork atlas.
const subcategoryIllustrations = Object.fromEntries(
  ['produce', 'electronics', 'fashion', 'care', 'kitchen', 'baby', 'sports', 'books', 'food']
    .flatMap((categoryId, categoryIndex) =>
      Array.from({length: 4}, (_, index) => {
        const cell = categoryIndex * 4 + index;
        return [categoryId + '-' + index, {
          source: require('../assets/main/subcategory-atlas.png'),
          sprite: {columns: 6, rows: 6, column: cell % 6, row: Math.floor(cell / 6)},
          resizeMode: 'contain',
        }];
      }),
    ),
);

export const artwork = {
  banner: {
    source: require('../assets/main/banners/big-savings.png'),
    aspectRatio: 546 / 162,
    resizeMode: 'contain',
  },
  groceryPromo: {
    source: require('../assets/main/banners/home-grocery-promo.jpg'),
    aspectRatio: 800 / 460,
  },
  electronicsPromo: {
    source: require('../assets/main/banners/home-electronics-promo.jpg'),
    aspectRatio: 800 / 460,
  },
  serum: {
    source: require('../assets/main/banners/beauty-premium.png'),
    aspectRatio: 3 / 2,
  },
  dressDeal: temporaryArtwork.dress,
  watchDeal: temporaryArtwork.watch,
  cerealDeal: temporaryArtwork.breakfast,
};

export const homeOffers = [
  {
    id: 'beauty',
    categoryId: 'care',
    eyebrow: 'YOUR DAILY GLOW',
    title: 'A little care.\nA lot of glow.',
    caption: 'Discover your everyday essentials',
    source: artwork.serum.source,
    background: '#F0E7FA',
    accent: '#7144AA',
  },
  {
    id: 'electronics',
    categoryId: 'electronics',
    eyebrow: 'UPGRADE YOUR EVERYDAY',
    title: 'Turn up\nthe good vibes.',
    caption: 'Find your next favourite gadget',
    source: artwork.electronicsPromo.source,
    background: '#FFF1CB',
    accent: '#87570C',
  },
  {
    id: 'groceries',
    categoryId: 'grocery',
    eyebrow: 'FRESH FINDS',
    title: 'A fresh start\nto your day.',
    caption: 'Stock up on the things you love',
    source: artwork.groceryPromo.source,
    background: '#E4F5EA',
    accent: '#237A49',
  },
];

export const categories = [
  {
    id: 'grocery',
    name: 'Groceries',
    shortName: 'Grocery',
    art: categoryIcon(require('../assets/main/references/grocery.png')),
    icon: 'shopping-basket',
    subcategories: [
      {
        id: 'rice',
        name: 'Rice, Atta & Grains',
        art: temporaryArtwork.rice,
        color: '#F5DFCF',
      },
      {
        id: 'spices',
        name: 'Pulses, Spices & Masalas',
        art: temporaryArtwork.spices,
        color: '#FCE8EF',
      },
      {
        id: 'dairy',
        name: 'Dairy & Eggs',
        art: temporaryArtwork.dairy,
        color: '#FFE9D6',
      },
      {
        id: 'oils',
        name: 'Oils, Salt & Sugar',
        art: temporaryArtwork.oils,
        color: '#F1EBCD',
      },
      {
        id: 'snacks',
        name: 'Snacks & Packaged',
        art: temporaryArtwork.snacks,
        color: '#FFE0E3',
      },
      {
        id: 'beverages',
        name: 'Beverages',
        art: temporaryArtwork.beverages,
        color: '#E9F3D6',
      },
      {
        id: 'care',
        name: 'Home & Personal Care',
        art: temporaryArtwork.care,
        color: '#E6E2FF',
      },
      {
        id: 'breakfast',
        name: 'Breakfast & Cereals',
        art: temporaryArtwork.breakfast,
        color: '#F7E3FC',
      },
    ],
  },
  {
    id: 'produce',
    name: 'Fruits & Vegetables',
    art: categoryIcon(
      require('../assets/main/references/fruits-vegetables.png'),
    ),
    icon: 'eco',
    subcategories: [
      'Fresh Fruits',
      'Vegetables',
      'Leafy Greens',
      'Seasonal Picks',
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    art: categoryIcon(require('../assets/main/references/electronics.png')),
    icon: 'headphones',
    subcategories: [
      'Headphones',
      'Mobiles & Accessories',
      'Wearables',
      'Home Appliances',
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion',
    art: categoryIcon(require('../assets/main/references/fashion.png')),
    icon: 'checkroom',
    subcategories: ['Women', 'Men', 'Footwear', 'Bags & Luggage'],
  },
  {
    id: 'care',
    name: 'Beauty & Personal Care',
    art: categoryIcon(
      require('../assets/main/references/beauty-personal-care.png'),
    ),
    icon: 'spa',
    subcategories: ['Skin Care', 'Hair Care', 'Bath & Body', 'Makeup'],
  },
  {
    id: 'kitchen',
    name: 'Kitchen & Dining',
    art: categoryIcon(require('../assets/main/references/kitchen-dining.png')),
    icon: 'soup-kitchen',
    subcategories: ['Cookware', 'Dinnerware', 'Storage', 'Kitchen Tools'],
  },
  {
    id: 'baby',
    name: 'Baby Care',
    art: categoryIcon(require('../assets/main/references/baby-care.png')),
    icon: 'child-friendly',
    subcategories: ['Diapers', 'Baby Food', 'Toys', 'Bath & Care'],
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    art: categoryIcon(require('../assets/main/references/sports-fitness.png')),
    icon: 'fitness-center',
    subcategories: ['Fitness Equipment', 'Sports Gear', 'Yoga', 'Outdoor'],
  },
  {
    id: 'books',
    name: 'Books & Stationery',
    art: categoryIcon(
      require('../assets/main/references/books-stationery.png'),
    ),
    icon: 'menu-book',
    subcategories: ['Books', 'Notebooks', 'Art Supplies', 'Office Supplies'],
  },
  {
    id: 'food',
    name: 'Food & Restaurants',
    icon: 'restaurant',
    art: categoryIcon(require('../assets/main/placeholders/food.png')),
    subcategories: ['Biryani', 'South Indian', 'Chinese', 'Snacks'],
  },
].map(item => ({
  ...item,
  subcategories: item.subcategories.map((sub, index) => {
    const normalized =
      typeof sub === 'string'
        ? {
            id: `${item.id}-${index}`,
            name: sub,
            art: item.art,
            color: ['#F5DFCF', '#FCE8EF', '#FFE9D6', '#E9F3D6'][index % 4],
          }
        : sub;
    const cutout = subcategoryCutouts[normalized.id];
    return {
      ...normalized,
      art: subcategoryIllustrations[normalized.id] || cutoutFor(cutout || normalized.art.source),
    };
  }),
}));

export const moreArtwork = categoryIcon(
  require('../assets/main/references/more.png'),
);
export const sidebarCategories = [
  'grocery',
  'produce',
  'electronics',
  'fashion',
  'kitchen',
  'baby',
  'care',
  'sports',
  'books',
  'food',
].map(id => categories.find(item => item.id === id));
export const products = [
  {
    id: 'kurkure',
    name: 'Masala Munch Snack Mix',
    categoryId: 'grocery',
    subcategoryId: 'snacks',
    price: 99,
    originalPrice: 149,
    art: photo(require('../assets/main/products/snack.png'), 'contain', 1),
  },
  {
    id: 'kitkat',
    name: 'Four Finger Milk Chocolate',
    categoryId: 'grocery',
    subcategoryId: 'snacks',
    price: 99,
    originalPrice: 149,
    art: photo(require('../assets/main/products/chocolate.png'), 'contain', 1),
  },
  {
    id: 'sambar',
    name: 'South Indian Sambar Masala',
    categoryId: 'grocery',
    subcategoryId: 'spices',
    price: 99,
    originalPrice: 149,
    art: photo(require('../assets/main/products/spices.png'), 'contain', 1),
  },
  {
    id: 'dress',
    name: 'Teal Printed Kurta Set',
    categoryId: 'fashion',
    subcategoryId: 'fashion-0',
    price: 582,
    originalPrice: 3999,
    art: photo(require('../assets/main/products/dress.png'), 'contain', 1),
  },
  {
    id: 'shoes',
    name: 'Outdoor Hiking Shoes',
    categoryId: 'fashion',
    subcategoryId: 'fashion-2',
    price: 1479,
    originalPrice: 4495,
    art: photo(require('../assets/main/products/shoes.png'), 'contain', 1),
  },
  {
    id: 'luggage',
    name: 'Hard-Shell Travel Suitcase',
    categoryId: 'fashion',
    subcategoryId: 'fashion-3',
    price: 1049,
    originalPrice: 7596,
    art: photo(require('../assets/main/products/luggage.png'), 'contain', 1),
  },
  {
    id: 'rice',
    name: 'Aashirvaad Superior MP Chakki Atta 0% MAIDA 100% ATTA',
    categoryId: 'grocery',
    subcategoryId: 'rice',
    price: 351,
    originalPrice: 400,
    description:
      'Aashirvaad Superior MP Atta is made using the 4-step advantage process.',
    vegetarian: true,
    reviewCount: 5357,
    brand: 'Aashirvaad',
    detailResizeMode: 'cover',
    art: photo(
      require('../assets/main/product-details/aashirvaad-atta.png'),
      'contain',
      1,
    ),
  },
  {
    id: 'cereal',
    name: 'Breakfast Muesli',
    categoryId: 'grocery',
    subcategoryId: 'breakfast',
    price: 99,
    originalPrice: 149,
    art: artwork.cerealDeal,
  },
  {
    id: 'coriander',
    brand: 'Aashirvaad',
    name: 'Aashirvaad Coriander Powder',
    categoryId: 'grocery',
    subcategoryId: 'spices',
    price: 99,
    originalPrice: 149,
    description: 'Ground coriander powder',
    vegetarian: true,
    art: photo(
      require('../assets/main/product-details/coriander.png'),
      'contain',
      1,
    ),
  },
  {
    id: 'salt',
    name: 'Golden Cooking Oil',
    categoryId: 'grocery',
    subcategoryId: 'oils',
    price: 85,
    originalPrice: 120,
    art: categories[0].subcategories[3].art,
  },
  {
    id: 'eggs',
    name: 'Fresh Dairy & Eggs',
    categoryId: 'grocery',
    subcategoryId: 'dairy',
    price: 120,
    originalPrice: 160,
    art: categories[0].subcategories[2].art,
  },
  {
    id: 'beverages',
    name: 'Refreshing Beverages Pack',
    categoryId: 'grocery',
    subcategoryId: 'beverages',
    price: 149,
    originalPrice: 199,
    art: categories[0].subcategories[5].art,
  },
  {
    id: 'household',
    name: 'Home Care Essentials',
    categoryId: 'grocery',
    subcategoryId: 'care',
    price: 199,
    originalPrice: 299,
    art: categories[0].subcategories[6].art,
  },
  ...categories
    .filter(item => !['grocery', 'fashion'].includes(item.id))
    .flatMap(item =>
      item.subcategories.map((sub, index) => ({
        id: `${item.id}-product-${index}`,
        categoryId: item.id,
        subcategoryId: sub.id,
        name: sub.name,
        price: 99 + index * 100,
        originalPrice: 149 + index * 150,
        art: sub.art,
      })),
    ),
  ...[
    'Whole Wheat Atta',
    'Organic Wheat Flour',
    'Sharbati Atta',
    'Basmati Rice',
    'Multigrain Atta',
  ].map((name, index) => ({
    id: `grain-${index}`,
    name,
    categoryId: 'grocery',
    subcategoryId: 'rice',
    price: 149 + index * 35,
    originalPrice: 225 + index * 45,
    art:
      index === 1
        ? photo(
            require('../assets/main/product-details/organic-atta.png'),
            'contain',
            1,
          )
        : index === 0
        ? photo(
            require('../assets/main/product-details/aashirvaad-atta.png'),
            'contain',
            1,
          )
        : temporaryArtwork.rice,
    vegetarian: true,
  })),
].map((item, index) => ({
  ...item,
  rating: index % 3 === 0 ? '4.5' : '4.2',
  unit:
    item.subcategoryId === 'rice'
      ? '1 kg'
      : ['grocery', 'produce'].includes(item.categoryId)
      ? '500 g'
      : '1 item',
  description:
    item.description ||
    (item.categoryId === 'grocery'
      ? 'Everyday pantry essentials'
      : categories.find(category => category.id === item.categoryId)?.name),
  bestseller: index % 7 === 0,
}));

export const shops = categories.flatMap(item =>
  item.subcategories.slice(0, 3).map((sub, index) => ({
    id: `${item.id}-shop-${index}`,
    categoryId: item.id,
    subcategoryId: sub.id,
    name:
      item.id === 'food'
        ? ['Godavari Kitchen', 'South Indian House', 'Wok & Bowl'][index]
        : `${sub.name} Store`,
    art: sub.art,
    rating: '4.5',
    time: '20–30 min',
  })),
);

export const sampleOrders = [
  {
    id: '75935983433',
    placed: '10 Oct, 8:36 AM',
    count: 3,
    price: 440,
    originalPrice: 660,
    groups: [
      {
        name: 'Groceries',
        count: 3,
        price: 440,
        originalPrice: 660,
        productIds: ['rice', 'cereal', 'eggs'],
      },
    ],
  },
  {
    id: '75935983434',
    placed: '10 Oct, 8:36 AM',
    count: 7,
    price: 999,
    originalPrice: 1980,
    groups: [
      {
        name: 'Groceries',
        count: 2,
        price: 300,
        originalPrice: 660,
        productIds: ['rice', 'eggs'],
      },
      {
        name: 'Electronics',
        count: 2,
        price: 300,
        originalPrice: 660,
        productIds: ['electronics-product-0', 'electronics-product-2'],
      },
      {
        name: 'Fashion',
        count: 3,
        price: 399,
        originalPrice: 660,
        productIds: ['dress', 'shoes', 'luggage'],
      },
    ],
  },
  {
    id: '75935983435',
    placed: '9 Oct, 10:15 AM',
    count: 3,
    price: 313,
    originalPrice: 468,
    groups: [
      {
        name: 'Groceries',
        count: 3,
        price: 313,
        originalPrice: 468,
        productIds: ['rice', 'salt', 'cereal'],
      },
    ],
  },
].map(order => {
  const groups = order.groups.map(group => {
    const status =
      order.id === '75935983434'
        ? {
            Groceries: 'Out for delivery',
            Electronics: 'Packed',
            Fashion: 'Confirmed',
          }[group.name] || 'Confirmed'
        : order.id === '75935983435'
        ? 'Confirmed'
        : 'Delivered';
    const stages = [
      'Placed',
      'Confirmed',
      'Packed',
      'Out for delivery',
      'Delivered',
    ];
    const items = group.productIds
      .map(id => products.find(product => product.id === id))
      .filter(Boolean);
    return {
      ...group,
      id: order.id + '-' + (items[0]?.categoryId || group.name),
      categoryId: items[0]?.categoryId,
      status,
      tracking: stages
        .slice(0, stages.indexOf(status) + 1)
        .map(stage => ({
          status: stage,
          at: stage === 'Placed' ? order.placed : undefined,
        })),
      count: items.length,
      price: items.reduce((sum, item) => sum + item.price, 0),
      originalPrice: items.reduce((sum, item) => sum + item.originalPrice, 0),
    };
  });
  return {
    ...order,
    isDemo: true,
    groups,
    count: groups.reduce((sum, group) => sum + group.count, 0),
    price: groups.reduce((sum, group) => sum + group.price, 0),
    originalPrice: groups.reduce((sum, group) => sum + group.originalPrice, 0),
  };
});

export const money = amount => `₹${Number(amount).toLocaleString('en-IN')}`;
