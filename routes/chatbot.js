const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');

const responses = {
  greet: ['Hello! I\'m SaveBot, your shopping assistant. How can I help you today?', 'Hi there! Looking for the best deals? Ask me anything!', 'Hey! I\'m here to help you find great products. What are you shopping for?'],

  categories: {
    mobiles: ['Great choice! Here are some popular mobile options:\n📱 **Redmi Note 13 Pro** - Best budget flagship\n📱 **iPhone 15** - Premium Apple experience\n📱 **OnePlus 12R** - Smooth performance\n📱 **OPPO Reno 11** - Great camera\n📱 **Samsung Galaxy S24** - Top Android flagship\n\nTry searching any of these in the search bar!', 'Looking for a new phone? I\'d suggest checking out:\n• **Redmi** - Best value for money\n• **OnePlus** - Smooth performance\n• **Samsung** - Premium quality\n• **iPhone** - Premium ecosystem\nSearch for any brand above to compare prices!'],
    laptops: ['For laptops, popular options include:\n💻 **Dell Inspiron** - Reliable everyday laptop\n💻 **HP Pavilion** - Great performance\n\nSearch "Dell laptop" or "HP laptop" to compare prices!'],
    headphones: ['For headphones:\n🎧 **Sony WH-1000XM5** - Best noise cancellation\n🎧 **boAt Rockerz 450** - Budget Bluetooth\n\nSearch to compare prices across stores!'],
    shoes: ['Popular shoe brands:\n👟 **Nike Air Max** - Classic comfort\n👟 **Adidas Ultraboost** - Performance running\n\nSearch to find the best deals!'],
    appliances: ['Home appliance picks:\n🏠 **Philips Air Fryer** - Healthy cooking\n🏠 **LG AC** - Energy efficient\n🏠 **Whirlpool Fridge** - Reliable cooling\n\nSearch to compare prices!'],
  },

  brands: {
    redmi: 'Redmi phones are known for excellent value! 🔥\nThe **Redmi Note 13 Pro** is very popular right now.\nSearch "Redmi Note 13 Pro" to compare prices!',
    iphone: 'Apple iPhones are premium devices! 🍎\nThe **iPhone 15** is the latest model with great features.\nSearch "iPhone 15" to find the best price!',
    oneplus: 'OnePlus makes great performance phones! ⚡\nThe **OnePlus 12R** offers flagship performance.\nSearch "OnePlus 12R" to compare prices!',
    oppo: 'OPPO makes excellent camera phones! 📸\nThe **OPPO Reno 11** has a great camera setup.\nSearch "OPPO Reno 11" to find deals!',
    samsung: 'Samsung offers great Android phones! ⭐\nThe **Galaxy S24** is their flagship model.\nSearch "Samsung Galaxy S24" to compare!',
    sony: 'Sony makes excellent headphones! 🎧\nThe **WH-1000XM5** is the best noise-cancelling headphone.\nSearch to compare prices!',
    boat: 'boAt makes affordable audio products! 🎵\nPopular products include Rockerz headphones.\nSearch "boAt headphone" to find deals!',
    nike: 'Nike makes iconic sportswear! 👟\nThe **Air Max** series is very popular.\nSearch "Nike Air Max" for best prices!',
    adidas: 'Adidas makes great athletic shoes! 🏃\nThe **Ultraboost** series is highly rated.\nSearch "Adidas Ultraboost" for deals!',
  },

  cheapest: 'SaveZone automatically highlights the cheapest option! 🏷️\nJust search for any product and the platform with the **lowest price** will be highlighted in green!',

  howto: 'Here\'s how SaveZone works:\n1️⃣ **Search** for any product in the search bar\n2️⃣ We compare prices across **Amazon, Flipkart & JioMart**\n3️⃣ The **cheapest price** is highlighted automatically\n4️⃣ Click the link to go directly to the product page!',

  compare: 'SaveZone compares prices across:\n🛒 **Amazon** - Great deals & fast delivery\n🛒 **Flipkart** - Wide selection & offers\n🛒 **JioMart** - Competitive prices\n\nSearch any product to see real-time comparison!',

  help: 'I can help you with:\n• 🔍 **Product suggestions** - Ask about any category\n• 💰 **Price tips** - Find the best deals\n• 📱 **Brand recommendations** - Mobiles, headphones & more\n• ❓ **How SaveZone works** - Ask "how does it work"\n\nWhat would you like to know?',

  fallback: ['I\'m not sure about that, but I can help you search for products!\nTry asking me about:\n• Mobiles (Redmi, iPhone, OnePlus, Samsung)\n• Laptops, Headphones, Shoes, Appliances\n\nOr just use the search bar to compare prices!', 'Hmm, I didn\'t quite understand that. 😅\nTry asking me:\n• "Show me mobile phones"\n• "Which iPhone is best?"\n• "How does price comparison work?"\n• "Tell me about Redmi phones"'],
};

function getResponse(message) {
  const msg = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|howdy|greetings|good\s*(morning|evening|afternoon))/.test(msg)) {
    return responses.greet[Math.floor(Math.random() * responses.greet.length)];
  }

  // How it works
  if (/how.*(work|use|search)|what is savezone|what does|explain/.test(msg)) {
    return responses.howto;
  }

  // Compare
  if (/compar|websites?|platforms?|stores?|sites?/.test(msg)) {
    return responses.compare;
  }

  // Cheapest / lowest price
  if (/cheap|lowest|best.*(price|deal)|discount|offer|save/.test(msg)) {
    return responses.cheapest;
  }

  // Brand matches
  for (const [brand, reply] of Object.entries(responses.brands)) {
    if (msg.includes(brand)) return reply;
  }

  // Category: mobiles
  if (/mobile|phone|smartphone|handset/.test(msg)) {
    return responses.categories.mobiles[Math.floor(Math.random() * responses.categories.mobiles.length)];
  }

  // Category: laptops
  if (/laptop|notebook|computer|pc/.test(msg)) {
    return responses.categories.laptops[0];
  }

  // Category: headphones
  if (/headphone|earphone|earbuds?|audio|music|bluetooth/.test(msg)) {
    return responses.categories.headphones[0];
  }

  // Category: shoes
  if (/shoe|sneaker|footwear|boot/.test(msg)) {
    return responses.categories.shoes[0];
  }

  // Category: appliances
  if (/applian|ac|air condition|refrigerator|fridge|fryer|washing/.test(msg)) {
    return responses.categories.appliances[0];
  }

  // Help
  if (/help|assist|support|what can you/.test(msg)) {
    return responses.help;
  }

  // Thanks
  if (/thank|thanks|thx|great|awesome|perfect/.test(msg)) {
    return 'You\'re welcome! 😊 Happy shopping with SaveZone! Let me know if you need anything else.';
  }

  // Bye
  if (/bye|goodbye|see you|cya/.test(msg)) {
    return 'Goodbye! Happy shopping and saving! 👋';
  }

  return responses.fallback[Math.floor(Math.random() * responses.fallback.length)];
}

// POST /api/chatbot
router.post('/api/chatbot', requireLogin, (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.json({ success: false, message: 'Please send a message' });
  }
  const reply = getResponse(message);
  res.json({ success: true, reply });
});

module.exports = router;
