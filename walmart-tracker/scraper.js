const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Activate Puppeteer Stealth plugin to hide automation indicators
puppeteer.use(StealthPlugin());

async function scrapeWalmartProduct(url) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--disable-features=IsolateOrigins,site-per-process',
      '--blink-settings=imagesEnabled=false' // Disable loading images to save bandwidth and speed up page load
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Emulate a standard desktop user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log(`Scraping: ${url}`);
    
    // Fetch page (waiting until DOM is parsed is enough to extract JSON-LD metadata)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    
    // Small delay to let JS execution finish initial loads
    await new Promise(r => setTimeout(r, 3000));
    
    // Step 1: Parse JSON-LD metadata (immune to front-end redesigns)
    const jsonLdData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.innerText);
          if (json["@type"] === "Product" && json.offers) {
            return json;
          }
          if (json["@graph"]) {
            const product = json["@graph"].find(item => item["@type"] === "Product");
            if (product && product.offers) return product;
          }
        } catch (e) {
          // ignore parsing errors
        }
      }
      return null;
    });

    let price = null;
    let title = null;

    if (jsonLdData) {
      title = jsonLdData.name;
      const offers = jsonLdData.offers;
      if (Array.isArray(offers)) {
        price = parseFloat(offers[0].price);
      } else if (offers && offers.price) {
        price = parseFloat(offers.price);
      }
    }

    // Step 2: Fallback to DOM elements if metadata block was missing
    if (!price) {
      price = await page.evaluate(() => {
        // Try Walmart authoritative price selector
        const priceEl = document.querySelector('[data-automation-id="product-price-authoritative"] span.w_iO');
        if (priceEl) {
          const match = priceEl.innerText.match(/\$?([0-9.,]+)/);
          if (match) return parseFloat(match[1].replace(/,/g, ''));
        }
        
        // Search globally for typical price nodes
        const generalPriceEl = document.querySelector('.lh-copy.f1.bold.dark-gray') || document.querySelector('[data-testid="price-wrap"]');
        if (generalPriceEl) {
          const match = generalPriceEl.innerText.match(/\$?([0-9.,]+)/);
          if (match) return parseFloat(match[1].replace(/,/g, ''));
        }
        return null;
      });
    }

    if (!title) {
      title = await page.evaluate(() => {
        const titleEl = document.querySelector('h1#main-title') || document.querySelector('h1');
        return titleEl ? titleEl.innerText.trim() : null;
      });
    }

    await browser.close();
    
    if (price === null) {
      throw new Error("Could not find product price. Walmart might have blocked the request or the selector has changed.");
    }

    return {
      title: title || "Unknown Product",
      price: price
    };

  } catch (err) {
    await browser.close();
    throw err;
  }
}

module.exports = {
  scrapeWalmartProduct
};
