// main.js
const { scrapeEtsturHotels } = require('./scrapers/etstur');

async function main() {
  // Define the search parameters
  const searchParams = {
    location: 'Antalya',
    checkIn: '25.07.2025',
    checkOut: '29.07.2025',
    adults: 2,
    childrenAges: [9],
    page: 0,
    limit: 40,
    offset: 100,
  };

  console.log('Starting Etstur scraper...');
  await scrapeEtsturHotels(searchParams);
  console.log('Etstur scraper finished.');
}

main().catch(error => console.error('An error occurred in the main function:', error));
