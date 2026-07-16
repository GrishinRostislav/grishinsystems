# Walmart Price Hunter 🚨

A Node.js daemon that monitors Walmart product pages for pricing glitches or clearances, storing history in a local SQLite database, and sending notifications via Telegram.

## Setup Instructions for macOS Server

### 1. Prerequisite: Node.js
Make sure Node.js (version 18 or newer) is installed on your macOS server. You can verify this in Terminal:
```bash
node -v
```

### 2. Install Dependencies
Navigate to this project folder in Terminal and install the required NPM packages:
```bash
cd walmart-tracker
npm install
```
*(This will automatically download and install Puppeteer and the Chromium browser sandbox).*

### 3. Get Your Telegram Chat ID
We need to tell the bot where to send pricing notifications.
1. Open the `.env` file and make sure your `TELEGRAM_BOT_TOKEN` is set.
2. Start the helper script in Terminal:
   ```bash
   npm run get-id
   ```
3. Open Telegram and send any message (e.g., "hello") to your bot: **t.me/walmartGlitch_bot**.
4. The Terminal script will intercept the message, print your `TELEGRAM_CHAT_ID`, and exit.
5. Open `.env` and paste your `TELEGRAM_CHAT_ID` there:
   ```env
   TELEGRAM_CHAT_ID=123456789
   ```

### 4. Running the Monitor

#### Option A: Quick Start (Manual)
To run the monitor in your current Terminal window:
```bash
npm start
```
*It will execute a test scan immediately, print results to the Terminal, and then sleep until the next scheduled interval.*

#### Option B: Keep Running 24/7 (Recommended)
To keep the script running in the background even if you close the Terminal window, use **PM2** (a Node process manager):

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
2. Start the script:
   ```bash
   pm2 start index.js --name "walmart-tracker"
   ```
3. To view logs in real-time:
   ```bash
   pm2 logs walmart-tracker
   ```
4. To configure PM2 to automatically start on macOS boot:
   ```bash
   pm2 startup
   # Copy and run the command PM2 prints in your terminal
   pm2 save
   ```

## Configuration (`config.js`)
You can edit `config.js` to:
- Change how often the check runs (`cronSchedule`).
- Change the discount threshold needed to trigger a alert (`minDiscountPercent`).
- Add or remove products in the `products` list.
