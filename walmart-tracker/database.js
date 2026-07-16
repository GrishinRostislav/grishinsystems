const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize SQLite Schema
db.serialize(() => {
  // Store all historic price data for analytics
  db.run(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      price REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Quick lookup table for last scanned price per product
  db.run(`
    CREATE TABLE IF NOT EXISTS last_prices (
      product_id TEXT PRIMARY KEY,
      price REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Retrieves the last recorded price for a product
function getLastPrice(productId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT price FROM last_prices WHERE product_id = ?", [productId], (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.price : null);
    });
  });
}

// Records the current price in both history and last_prices tables
function savePrice(productId, price) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("INSERT INTO price_history (product_id, price) VALUES (?, ?)", [productId, price]);
      db.run(
        "INSERT OR REPLACE INTO last_prices (product_id, price, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        [productId, price],
        function(err) {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  });
}

module.exports = {
  getLastPrice,
  savePrice,
  db
};
