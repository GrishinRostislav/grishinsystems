module.exports = {
  // Cron schedule: e.g. '*/15 * * * *' runs every 15 minutes.
  // Standard cron format: (minute hour day-of-month month day-of-week)
  cronSchedule: "*/15 * * * *",

  // Minimum discount percentage to trigger an alert (e.g. 30 = price dropped by 30% or more)
  minDiscountPercent: 30,

  // List of Walmart products to monitor
  products: [
    {
      id: "apple-tv-4k",
      name: "Apple TV 4K (3rd Generation) Wi-Fi 64GB",
      url: "https://www.walmart.com/ip/Apple-TV-4K-3rd-Generation-Wi-Fi-64GB/2012015093"
    },
    {
      id: "sony-ps5-slim",
      name: "Sony PlayStation 5 Console Slim Edition",
      url: "https://www.walmart.com/ip/Sony-PlayStation-5-Console-Slim/5112520625"
    }
  ]
};
