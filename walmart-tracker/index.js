require('dotenv').config();
const cron = require('node-cron');
const config = require('./config');
const { getLastPrice, savePrice } = require('./database');
const { scrapeWalmartProduct } = require('./scraper');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not configured in your .env file!");
  process.exit(1);
}

// Sends structured markdown alerts to the configured Telegram chat
async function sendTelegramMessage(text) {
  if (!chatId) {
    console.warn("Warning: TELEGRAM_CHAT_ID is not configured. Running in debug mode. Alerts will only be logged locally.");
    console.log("[Telegram Alert Mock]:", text);
    return;
  }
  
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram API error:", data.description);
    }
  } catch (err) {
    console.error("Error sending Telegram message:", err.message);
  }
}

// The core loop that scans all products and performs comparison
async function checkPrices() {
  console.log(`\n--- Starting Walmart Price Scrape [${new Date().toLocaleString()}] ---`);
  
  for (const product of config.products) {
    try {
      const current = await scrapeWalmartProduct(product.url);
      console.log(`Successfully scraped: ${current.title} = $${current.price}`);
      
      const lastPrice = await getLastPrice(product.id);
      
      if (lastPrice !== null) {
        console.log(`Previous recorded price for ${product.id}: $${lastPrice}`);
        
        if (current.price < lastPrice) {
          const discountAmt = lastPrice - current.price;
          const discountPct = Math.round((discountAmt / lastPrice) * 100);
          
          console.log(`Price drop detected! $${lastPrice} -> $${current.price} (-${discountPct}%)`);
          
          if (discountPct >= config.minDiscountPercent) {
            const alertMsg = 
`🚨 *Walmart Pricing Alert!* 🚨\n\n` +
`*Product:* ${current.title}\n` +
`*Old Price:* $${lastPrice.toFixed(2)}\n` +
`*New Price:* $${current.price.toFixed(2)} (-${discountPct}%)\n\n` +
`🔗 [Buy on Walmart](${product.url})`;
            
            await sendTelegramMessage(alertMsg);
          }
        } else if (current.price > lastPrice) {
          console.log(`Price increased from $${lastPrice} to $${current.price}`);
        } else {
          console.log("Price remains unchanged.");
        }
      } else {
        console.log(`First scan for product ${product.id}. Storing initial price of $${current.price}`);
      }
      
      // Save current price in SQLite history
      await savePrice(product.id, current.price);
      
      // Standard cooldown delay to avoid slamming Walmart with concurrent requests
      await new Promise(r => setTimeout(r, 5000));
      
    } catch (err) {
      console.error(`Failed to scrape ${product.name || product.id}:`, err.message);
    }
  }
  
  console.log("--- Scrape Finished ---\n");
}

// 1. Fire a dry-run check immediately on application boot
checkPrices();

// 2. Schedule recurrent executions based on cron config
cron.schedule(config.cronSchedule, () => {
  checkPrices();
});

console.log(`Walmart Price Hunter started successfully! Cron schedule: "${config.cronSchedule}"`);
