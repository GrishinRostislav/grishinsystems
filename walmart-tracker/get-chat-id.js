require('dotenv').config();
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not set in your .env file!");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${token}/getUpdates`;

console.log("Listening for messages... Please send any message to your Telegram bot now (e.g. t.me/walmartGlitch_bot).");
console.log("Waiting for updates...");

let lastUpdateId = 0;

async function checkUpdates() {
  try {
    const res = await fetch(`${url}?offset=${lastUpdateId + 1}`);
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        const msg = update.message;
        if (msg && msg.chat) {
          console.log(`\n🎉 Found Chat ID!`);
          console.log(`User: ${msg.from.first_name} ${msg.from.last_name || ''} (@${msg.from.username || 'N/A'})`);
          console.log(`Text: "${msg.text}"`);
          console.log(`TELEGRAM_CHAT_ID=${msg.chat.id}`);
          console.log(`\nCopy the TELEGRAM_CHAT_ID value above and paste it in your .env file!`);
          process.exit(0);
        }
      }
    }
  } catch (err) {
    console.error("Error fetching updates from Telegram:", err.message);
  }
}

// Poll updates every 2 seconds
setInterval(checkUpdates, 2000);
