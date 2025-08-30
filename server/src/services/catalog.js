// Simple in-memory catalog with a few sample items
export const CATALOG = [
  // Dairy
  { id: "sku-milk-1", name: "milk", brand: "Amul", size: "1L", category: "dairy", price: 60 },
  { id: "sku-milk-2", name: "milk", brand: "Mother Dairy", size: "1L", category: "dairy", price: 58 },
  { id: "sku-almond-milk-1", name: "almond milk", brand: "Sofit", size: "1L", category: "dairy", price: 180 },

  // Bakery
  { id: "sku-bread-1", name: "bread", brand: "Britannia", size: "400g", category: "bakery", price: 38 },
  { id: "sku-bread-2", name: "bread", brand: "Modern", size: "400g", category: "bakery", price: 36 },

  // Produce
  { id: "sku-apple-1", name: "apple", brand: "Kinnaur", size: "1kg", category: "produce", price: 180 },
  { id: "sku-banana-1", name: "banana", brand: "Yelakki", size: "1dozen", category: "produce", price: 60 },

  // Staples
  { id: "sku-rice-1", name: "basmati rice", brand: "Daawat", size: "5kg", category: "staples", price: 699 },
  { id: "sku-rice-2", name: "basmati rice", brand: "India Gate", size: "5kg", category: "staples", price: 749 },
  { id: "sku-atta-1", name: "atta", brand: "Aashirvaad", size: "5kg", category: "staples", price: 330 },

  // Personal care
  { id: "sku-toothpaste-1", name: "toothpaste", brand: "Colgate", size: "100g", category: "personal care", price: 85 },
  { id: "sku-toothpaste-2", name: "toothpaste", brand: "Pepsodent", size: "100g", category: "personal care", price: 75 },
  { id: "sku-toothpaste-3", name: "toothpaste", brand: "Dabur Red", size: "100g", category: "personal care", price: 70 },
];

export function searchCatalog({ query, brand, minPrice, maxPrice, category }) {
  const q = (query || "").toLowerCase();
  const b = (brand || "").toLowerCase();
  const cat = (category || "").toLowerCase();

  return CATALOG.filter((item) => {
    const matchesQuery = q ? item.name.toLowerCase().includes(q) : true;
    const matchesBrand = b ? item.brand.toLowerCase().includes(b) : true;
    const matchesCategory = cat ? item.category.toLowerCase().includes(cat) : true;
    const matchesMin = typeof minPrice === "number" ? item.price >= minPrice : true;
    const matchesMax = typeof maxPrice === "number" ? item.price <= maxPrice : true;
    return matchesQuery && matchesBrand && matchesCategory && matchesMin && matchesMax;
  });
}

// Enhanced categorization map
const CATEGORY_KEYWORDS = [
  { category: "dairy", words: ["milk", "almond milk", "yogurt", "paneer", "butter", "ghee", "curd", "dahi", "cheese"] },
  { category: "bakery", words: ["bread", "loaf", "bun", "cake", "biscuit"] },
  { category: "produce", words: ["apple", "banana", "mango", "orange", "tomato", "onion", "potato", "carrot"] },
  { category: "staples", words: ["basmati rice", "atta", "dal", "oil", "salt", "sugar", "tea", "coffee", "flour", "rice"] },
  { category: "personal care", words: ["toothpaste", "soap", "shampoo", "deodorant"] },
  { category: "snacks", words: ["chips", "biscuits", "chocolate", "nuts", "cookies"] },
  { category: "beverages", words: ["juice", "soda", "water", "soft drink"] }
];

// Product substitutes mapping
const SUBSTITUTES = {
  "milk": ["almond milk", "soy milk", "oat milk"],
  "almond milk": ["milk", "soy milk", "oat milk"],
  "bread": ["roti", "naan", "pita bread"],
  "apple": ["banana", "orange", "pear"],
  "toothpaste": ["dabur red", "colgate", "pepsodent"],
  "rice": ["quinoa", "couscous", "millet"],
  "oil": ["ghee", "butter", "olive oil"]
};

// Seasonal items (month-based)
const SEASONAL_ITEMS = {
  1: ["mango", "watermelon", "cucumber"], // Summer
  2: ["mango", "watermelon", "cucumber"],
  3: ["mango", "watermelon", "cucumber"],
  4: ["mango", "watermelon", "cucumber"],
  5: ["mango", "watermelon", "cucumber"],
  6: ["mango", "watermelon", "cucumber"],
  7: ["apple", "pear", "grapes"], // Monsoon
  8: ["apple", "pear", "grapes"],
  9: ["apple", "pear", "grapes"],
  10: ["pomegranate", "guava", "papaya"], // Autumn
  11: ["pomegranate", "guava", "papaya"],
  12: ["orange", "sweet lime", "strawberry"] // Winter
};

export function categorizeItem(name) {
  const n = (name || "").toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.words.some((w) => n.includes(w))) {
      return entry.category;
    }
  }
  return "general";
}

export function getSubstitutes(itemName) {
  const item = (itemName || "").toLowerCase();
  return SUBSTITUTES[item] || [];
}

export function getSeasonalItems() {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return SEASONAL_ITEMS[currentMonth] || [];
}

export function getLowStockSuggestions(items) {
  // Analyze shopping patterns and suggest items that might be running low
  const itemCounts = {};
  const lastAdded = {};
  
  items.forEach(item => {
    const name = item.name.toLowerCase();
    itemCounts[name] = (itemCounts[name] || 0) + 1;
    lastAdded[name] = new Date();
  });

  const suggestions = [];
  
  // Check for items that haven't been added recently or are frequently bought
  Object.entries(itemCounts).forEach(([item, count]) => {
    if (count >= 2) { // Frequently bought items
      const daysSinceLastAdded = (new Date() - lastAdded[item]) / (1000 * 60 * 60 * 24);
      if (daysSinceLastAdded > 7) { // Not added in last week
        suggestions.push({
          name: item,
          reason: `You frequently buy ${item} and haven't added it recently`,
          priority: "high"
        });
      }
    }
  });

  return suggestions.slice(0, 3); // Top 3 suggestions
}


