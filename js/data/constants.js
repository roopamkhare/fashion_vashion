export const THEMES = [
  { name: 'Beach Party',     emoji: '🏖️',  tags: ['bright',     'casual',    'summery']   },
  { name: 'Winter Gala',     emoji: '❄️',   tags: ['elegant',    'sparkly',   'cozy']      },
  { name: 'Superhero Chic',  emoji: '⚡',   tags: ['bold',       'bright',    'powerful']  },
  { name: 'Pop Star Night',  emoji: '🌟',   tags: ['sparkly',    'glam',      'bold']      },
  { name: 'Fairy Garden',    emoji: '🧚',   tags: ['floral',     'pastel',    'whimsical'] },
  { name: 'Space Explorer',  emoji: '🚀',   tags: ['futuristic', 'bold',      'metallic']  },
  { name: 'Candy Land',      emoji: '🍬',   tags: ['sweet',      'bright',    'pastel']    },
  { name: 'Jungle Safari',   emoji: '🌿',   tags: ['natural',    'casual',    'earthy']    },
];

export const SHOP_ITEMS = [
  // DRESSES
  { id: 'd1', category: 'dress',     name: 'Sunny Sundress',    emoji: '👗', tags: ['bright','casual','summery'],     price: 15 },
  { id: 'd2', category: 'dress',     name: 'Glitter Gown',      emoji: '👗', tags: ['sparkly','elegant','glam'],      price: 20 },
  { id: 'd3', category: 'dress',     name: 'Floral Wrap Dress', emoji: '👗', tags: ['floral','pastel','whimsical'],   price: 16 },
  { id: 'd4', category: 'dress',     name: 'Power Suit Dress',  emoji: '👗', tags: ['bold','powerful','futuristic'],  price: 18 },
  // SHOES
  { id: 's1', category: 'shoes',     name: 'Sparkle Sneakers',  emoji: '👟', tags: ['bright','casual','summery'],     price: 11 },
  { id: 's2', category: 'shoes',     name: 'Crystal Heels',     emoji: '👠', tags: ['sparkly','elegant','glam'],      price: 14 },
  { id: 's3', category: 'shoes',     name: 'Rainbow Boots',     emoji: '👢', tags: ['bold','whimsical','bright'],     price: 12 },
  { id: 's4', category: 'shoes',     name: 'Silver Skates',     emoji: '⛸️', tags: ['futuristic','metallic','bold'],  price: 13 },
  // BAGS
  { id: 'b1', category: 'bag',       name: 'Beach Tote',        emoji: '👜', tags: ['casual','summery','natural'],    price: 8  },
  { id: 'b2', category: 'bag',       name: 'Glam Clutch',       emoji: '👛', tags: ['sparkly','glam','elegant'],      price: 11 },
  { id: 'b3', category: 'bag',       name: 'Star Backpack',     emoji: '🎒', tags: ['bright','bold','sweet'],         price: 9  },
  { id: 'b4', category: 'bag',       name: 'Candy Bag',         emoji: '👝', tags: ['sweet','pastel','whimsical'],    price: 9  },
  // ACCESSORIES
  { id: 'a1', category: 'accessory', name: 'Flower Crown',      emoji: '🌸', tags: ['floral','pastel','whimsical'],  price: 7  },
  { id: 'a2', category: 'accessory', name: 'Star Sunglasses',   emoji: '🕶️', tags: ['bright','summery','glam'],      price: 6  },
  { id: 'a3', category: 'accessory', name: 'Crystal Tiara',     emoji: '👑', tags: ['sparkly','elegant','bold'],     price: 8  },
  { id: 'a4', category: 'accessory', name: 'Lightning Bolts',   emoji: '⚡', tags: ['bold','powerful','futuristic'], price: 7  },
];

export const CATEGORIES = [
  { key: 'dress',     label: '👗 Dresses'     },
  { key: 'shoes',     label: '👠 Shoes'       },
  { key: 'bag',       label: '👜 Bags'        },
  { key: 'accessory', label: '💍 Accessories' },
];

export const PLAYER_EMOJIS     = ['🎀', '⭐'];
export const MAX_QUESTIONS     = 5;
export const COINS_PER_CORRECT = 10;
export const QUESTION_TIME     = 20;           // seconds
export const TIMER_CIRCUMF     = 2 * Math.PI * 26;   // SVG circle r=26
