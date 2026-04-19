const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const db = require('../db/database');

// Mock product database per website (simulates scraping/API results)
const mockProducts = {
  amazon: [
    { name: 'Redmi Note 13 Pro 5G', price: 24999, category: 'mobiles', keywords: ['redmi', 'note', '13', 'pro', 'mobile', 'phone', 'smartphone'] },
    { name: 'iPhone 15 (128GB)', price: 69999, category: 'mobiles', keywords: ['iphone', '15', 'apple', 'mobile', 'phone', 'smartphone'] },
    { name: 'OnePlus 12R 5G', price: 32999, category: 'mobiles', keywords: ['oneplus', '12r', 'one plus', 'mobile', 'phone', 'smartphone'] },
    { name: 'OPPO Reno 11 5G', price: 26999, category: 'mobiles', keywords: ['oppo', 'reno', '11', 'mobile', 'phone', 'smartphone'] },
    { name: 'Samsung Galaxy S24', price: 74999, category: 'mobiles', keywords: ['samsung', 'galaxy', 's24', 'mobile', 'phone', 'smartphone'] },
    { name: 'Sony WH-1000XM5 Headphones', price: 24990, category: 'electronics', keywords: ['sony', 'headphones', 'wireless', 'wh1000xm5', 'headphone'] },
    { name: 'boAt Rockerz 450 Bluetooth Headphone', price: 1299, category: 'electronics', keywords: ['boat', 'headphone', 'bluetooth', 'rockerz', 'wireless'] },
    { name: 'Dell Inspiron 15 Laptop', price: 48990, category: 'laptops', keywords: ['dell', 'inspiron', 'laptop', 'notebook'] },
    { name: 'HP Pavilion 15 Laptop', price: 44999, category: 'laptops', keywords: ['hp', 'pavilion', 'laptop', 'notebook'] },
    { name: 'Nike Air Max 270', price: 9995, category: 'shoes', keywords: ['nike', 'air max', 'shoes', 'sneakers', 'footwear'] },
    { name: 'Adidas Ultraboost 22', price: 12999, category: 'shoes', keywords: ['adidas', 'ultraboost', 'shoes', 'sneakers', 'footwear'] },
    { name: 'Philips Air Fryer', price: 5499, category: 'appliances', keywords: ['philips', 'air fryer', 'fryer', 'kitchen'] },
    { name: 'LG 1.5 Ton 5 Star AC', price: 35999, category: 'appliances', keywords: ['lg', 'ac', 'air conditioner', 'split ac', 'inverter'] },
    { name: 'Whirlpool 265L Refrigerator', price: 26990, category: 'appliances', keywords: ['whirlpool', 'refrigerator', 'fridge'] },
  ],
  flipkart: [
    { name: 'Redmi Note 13 Pro+ 5G', price: 25999, category: 'mobiles', keywords: ['redmi', 'note', '13', 'pro', 'mobile', 'phone', 'smartphone'] },
    { name: 'Apple iPhone 15 128GB', price: 68999, category: 'mobiles', keywords: ['iphone', '15', 'apple', 'mobile', 'phone', 'smartphone'] },
    { name: 'OnePlus 12R (128GB)', price: 31499, category: 'mobiles', keywords: ['oneplus', '12r', 'one plus', 'mobile', 'phone', 'smartphone'] },
    { name: 'OPPO Reno 11 (256GB)', price: 25499, category: 'mobiles', keywords: ['oppo', 'reno', '11', 'mobile', 'phone', 'smartphone'] },
    { name: 'Samsung Galaxy S24 5G', price: 73999, category: 'mobiles', keywords: ['samsung', 'galaxy', 's24', 'mobile', 'phone', 'smartphone'] },
    { name: 'Sony WH-1000XM5', price: 23990, category: 'electronics', keywords: ['sony', 'headphones', 'wireless', 'wh1000xm5', 'headphone'] },
    { name: 'boAt Rockerz 450 Wireless', price: 1199, category: 'electronics', keywords: ['boat', 'headphone', 'bluetooth', 'rockerz', 'wireless'] },
    { name: 'Dell Inspiron 3520 Laptop', price: 47490, category: 'laptops', keywords: ['dell', 'inspiron', 'laptop', 'notebook'] },
    { name: 'HP 15s Laptop', price: 43999, category: 'laptops', keywords: ['hp', 'pavilion', 'laptop', 'notebook'] },
    { name: 'Nike Air Max 270 Men', price: 9499, category: 'shoes', keywords: ['nike', 'air max', 'shoes', 'sneakers', 'footwear'] },
    { name: 'Adidas Ultraboost Light', price: 13499, category: 'shoes', keywords: ['adidas', 'ultraboost', 'shoes', 'sneakers', 'footwear'] },
    { name: 'Philips Digital Air Fryer HD9252', price: 5299, category: 'appliances', keywords: ['philips', 'air fryer', 'fryer', 'kitchen'] },
    { name: 'LG 1.5 Ton 5 Star Inverter AC', price: 34999, category: 'appliances', keywords: ['lg', 'ac', 'air conditioner', 'split ac', 'inverter'] },
    { name: 'Whirlpool 265L 3 Star Refrigerator', price: 25990, category: 'appliances', keywords: ['whirlpool', 'refrigerator', 'fridge'] },
  ],
  jiomart: [
    { name: 'Redmi Note 13 Pro 5G (8/256)', price: 24499, category: 'mobiles', keywords: ['redmi', 'note', '13', 'pro', 'mobile', 'phone', 'smartphone'] },
    { name: 'iPhone 15 - 128GB Black', price: 71990, category: 'mobiles', keywords: ['iphone', '15', 'apple', 'mobile', 'phone', 'smartphone'] },
    { name: 'OnePlus 12R 5G (8GB+128GB)', price: 33499, category: 'mobiles', keywords: ['oneplus', '12r', 'one plus', 'mobile', 'phone', 'smartphone'] },
    { name: 'OPPO Reno11 5G 256GB', price: 27499, category: 'mobiles', keywords: ['oppo', 'reno', '11', 'mobile', 'phone', 'smartphone'] },
    { name: 'Samsung Galaxy S24 5G 256GB', price: 75490, category: 'mobiles', keywords: ['samsung', 'galaxy', 's24', 'mobile', 'phone', 'smartphone'] },
    { name: 'Sony WH-1000XM5 ANC Headphone', price: 25490, category: 'electronics', keywords: ['sony', 'headphones', 'wireless', 'wh1000xm5', 'headphone'] },
    { name: 'boAt Rockerz 450 On-Ear BT', price: 1349, category: 'electronics', keywords: ['boat', 'headphone', 'bluetooth', 'rockerz', 'wireless'] },
    { name: 'Dell Inspiron 15 3000', price: 49990, category: 'laptops', keywords: ['dell', 'inspiron', 'laptop', 'notebook'] },
    { name: 'HP Pavilion 15-eg Laptop', price: 45499, category: 'laptops', keywords: ['hp', 'pavilion', 'laptop', 'notebook'] },
    { name: 'Nike Air Max 270 Running Shoes', price: 9999, category: 'shoes', keywords: ['nike', 'air max', 'shoes', 'sneakers', 'footwear'] },
    { name: 'Adidas Ultraboost 22 Shoes', price: 12499, category: 'shoes', keywords: ['adidas', 'ultraboost', 'shoes', 'sneakers', 'footwear'] },
    { name: 'Philips Air Fryer 4.1L', price: 5799, category: 'appliances', keywords: ['philips', 'air fryer', 'fryer', 'kitchen'] },
    { name: 'LG 1.5T 5Star Inverter Split AC', price: 36499, category: 'appliances', keywords: ['lg', 'ac', 'air conditioner', 'split ac', 'inverter'] },
    { name: 'Whirlpool 265 Ltr Refrigerator', price: 27490, category: 'appliances', keywords: ['whirlpool', 'refrigerator', 'fridge'] },
  ]
};

function findBestMatch(products, query) {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  let best = null;
  let bestScore = 0;

  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    let score = 0;

    // Exact match in name
    if (nameLower.includes(q)) score += 10;

    // Word matches in name
    for (const word of words) {
      if (nameLower.includes(word)) score += 3;
    }

    // Keyword matches
    for (const kw of product.keywords) {
      if (q.includes(kw) || words.some(w => kw.includes(w) || w.includes(kw))) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  return bestScore > 0 ? best : null;
}

// GET /search page
router.get('/search', requireLogin, (req, res) => {
  res.sendFile('search.html', { root: './public' });
});

// GET /api/search
router.get('/api/search', requireLogin, (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ success: false, message: 'Please enter a valid search query' });
  }

  const query = q.trim();

  // Save to search history
  db.prepare('INSERT INTO search_history (user_id, search_query) VALUES (?, ?)').run(req.session.userId, query);

  const results = [];
  const websites = [
    { key: 'amazon', name: 'Amazon', url: 'https://www.amazon.in/s?k=' + encodeURIComponent(query), logo: 'amazon' },
    { key: 'flipkart', name: 'Flipkart', url: 'https://www.flipkart.com/search?q=' + encodeURIComponent(query), logo: 'flipkart' },
    { key: 'jiomart', name: 'JioMart', url: 'https://www.jiomart.com/search#q=' + encodeURIComponent(query), logo: 'jiomart' },
  ];

  for (const site of websites) {
    const match = findBestMatch(mockProducts[site.key], query);
    if (match) {
      results.push({
        website: site.name,
        logo: site.logo,
        product_name: match.name,
        price: match.price,
        product_link: site.url,
        category: match.category
      });
    }
  }

  if (results.length === 0) {
    return res.json({ success: false, message: 'No products found for "' + query + '"' });
  }

  // Find minimum price
  const minPrice = Math.min(...results.map(r => r.price));

  res.json({ success: true, query, results, minPrice });
});

// GET /api/suggestions - search suggestions
router.get('/api/suggestions', requireLogin, (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  const query = q.toLowerCase();
  const allKeywords = new Set();

  for (const site of Object.values(mockProducts)) {
    for (const product of site) {
      if (product.name.toLowerCase().includes(query)) {
        allKeywords.add(product.name);
      }
    }
  }

  res.json([...allKeywords].slice(0, 5));
});

module.exports = router;
