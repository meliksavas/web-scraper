// etstur.js
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Parses hotel HTML to extract hotel data.
 * @param {string} html - The HTML content to parse.
 * @param {object} searchParams - The search parameters used for the request.
 * @returns {Array} - A list of hotel objects.
 */
function parseHotels(html, searchParams) {
  const $ = cheerio.load(html);
  const hotels = [];
  const hotelElements = $('div.has-price');

  hotelElements.each((i, el) => {
    const hotelEl = $(el);
    const hotelData = hotelEl.find('.hotel-card-data');
    const hotel = {
      name: hotelData.data('hotelname'),
      link: 'https://www.etstur.com' + hotelEl.find('a.hotel-card-link-wrapper').attr('href'),
      price: hotelData.data('price'),
      dates: {
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
      },
      location: hotelEl.find('p.location-wrap').text().trim().replace(/\s\s+/g, ' '),
      rating: hotelEl.find('p.comment-wrap').text().trim().replace(/\s\s+/g, ' '),
      boardType: hotelEl.find('li.facility-board-type span').text().trim(),
      themes: hotelEl.find('.free-package-item').map((i, themeEl) => $(themeEl).text().trim().replace(/\s\s+/g, ' ')).get(),
      otherData: {
        lat: hotelData.data('lat'),
        lon: hotelData.data('lon'),
        hotelId: hotelData.data('hotel-id'),
        boardType: hotelData.data('boardtype'),
        region: hotelData.data('region'),
        totalNights: hotelData.data('totalnights'),
        discountRate: hotelData.data('discountrate'),
        totalComments: hotelData.data('totalcomments'),
        country: hotelData.data('country'),
        city: hotelData.data('city'),
        score: hotelData.data('score'),
      }
    };
    hotels.push(hotel);
  });

  return hotels;
}

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
    const hotels = parseHotels(html, params);
    console.log(JSON.stringify(hotels, null, 2));
    return hotels;
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