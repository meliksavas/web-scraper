// etstur.js
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Generates a URL from user input, fetches hotel data from Etstur,
 * and extracts the first hotel with a price.
 * @param {object} params - The search parameters.
 * @param {string} params.location - The search location (e.g., "Antalya").
 * @param {string} params.checkIn - Check-in date (DD.MM.YYYY).
 * @param {string} params.checkOut - Check-out date (DD.MM.YYYY).
 * @param {number} params.adults - Number of adults.
 * @param {Array<number>} params.childrenAges - An array of children's ages.
 * @param {number} [params.page=0] - The page number to fetch.
 * @param {number} [params.limit=20] - The number of results per page.
 * @param {number} [params.offset=100] - The offset for the results.
 * @returns {Promise<string|null>} - The HTML of the first hotel div with a price, or null if not found.
 */
async function scrapeEtsturHotels(params) {
  const {
    location,
    checkIn,
    checkOut,
    adults,
    childrenAges = [],
    page = 0,
    limit = 20,
    offset = 100,
  } = params;

  const searchParams = new URLSearchParams({
    url: `${location}-Otelleri`,
    check_in: checkIn,
    check_out: checkOut,
    adult_1: adults,
    child_1: childrenAges.length,
    page,
    minPrice: 0,
    maxPrice: 0,
    filters: '',
    sortType: 'popular',
    sortDirection: 'desc',
    limit,
    offset,
    totalHotelsWithPriceOnPage: 0,
    hasBannerAdded: true,
  });

  childrenAges.forEach((age, i) => {
    searchParams.append(`childage_1_${i + 1}`, age);
  });

  const url = `https://www.etstur.com/ajax/hotel-search-load-more?${searchParams.toString()}`;

  console.log("Constructed URL:", url);

  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const hotelWithPrice = $('div.has-price');

    if (hotelWithPrice.length > 0) {
      const hotelHtml = $.html(hotelWithPrice);
      console.log('Hotels with Price" ---');
      console.log(hotelHtml);
      console.log('------------------------------');
      return hotelHtml;
    } else {
      console.log('No hotels with a price found on the page.');
      return null;
    }
  } catch (error) {
    console.error("Error fetching or parsing data from Etstur:", error.message);
    if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Headers:", error.response.headers);
        console.error("Data:", error.response.data);
    }
    return null;
  }
}

module.exports = {
  scrapeEtsturHotels,
};
