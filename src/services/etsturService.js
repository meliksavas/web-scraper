const axios = require('axios');
const cheerio = require('cheerio');
const { debug } = require('puppeteer');

/**
 * Otel isminden Etstur otel URL'si üretir.
 * Türkçe karakterleri temizler, boşlukları tire yapar ve her kelimenin baş harfini büyük yapar.
 */
function generateHotelUrl(hotelName) {
  console.log(hotelName);
  const hotelNameOnly = hotelName.split(',')[0];
  const slug = hotelNameOnly
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Türkçe karakterleri sil
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9\s-]/gi, "") // özel karakterleri sil
    .trim()
    .split(/\s+/) // kelimelere ayır
    .join("-");

  return `https://www.etstur.com/${slug}`;
}

/** 
 * Otel ismiyle URL'yi oluşturur, sonra otelin HTML'inden hotelId'yi alır.
 */
async function getHotelIdFromName(hotelName) {
  const hotelUrl = generateHotelUrl(hotelName);
  console.log(`[DEBUG] Generated hotel URL: ${hotelUrl}`);

  try {
    const res = await axios.get(hotelUrl, {
      headers: {
        "accept": "text/html",
        "user-agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(res.data);
    const scriptContent = $('#__NEXT_DATA__').html();

    if (!scriptContent) {
      console.error("❌ __NEXT_DATA__ script bulunamadı.");
      return null;
    }

    const jsonData = JSON.parse(scriptContent);
    const hotelId = jsonData?.props?.pageProps?.data?.hotelId;

    if (hotelId) {
      console.log(`✅ Hotel ID bulundu: ${hotelId}`);
      return { hotelId, hotelUrl };
    } else {
      console.warn("⚠️ Hotel ID JSON içinde yok.");
      return null;
    }

  } catch (err) {
    console.error(`🚨 Hata: ${err.message}`);
    if (err.response) {
      console.error(`[DEBUG] Response status: ${err.response.status}`);
      console.error(`[DEBUG] Response data: ${JSON.stringify(err.response.data)}`);
    }
    return null;
  }
}

/**
 * Searches for hotels using the Etstur autocomplete API and filters for hotels.
 * @param {string} query - The search term for hotels, e.g., "cullinan".
 * @returns {Promise<Array>} A promise that resolves to a list of hotel objects.
 *                          Each object contains details like title, url, and state.
 *                          Returns an empty array if an error occurs.
 */
async function searchHotels(query) {
  const searchUrl = `https://www.etstur.com/v2/autocomplete?q=${encodeURIComponent(query)}`;
  console.log(`Searching for hotels with URL: ${searchUrl}`);

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "Referer": "https://www.etstur.com/",
      },
    });

    if (response.data && response.data.success && Array.isArray(response.data.result)) {
      const hotels = response.data.result.filter(item => item.type === 'HOTEL');
      console.log(`Found ${hotels.length} hotels for query "${query}".`);
      return hotels;
    } else {
      console.error("Unexpected response structure from autocomplete API:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error searching for hotels:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return [];
  }
}


/**
 * Fetches detailed data for a specific hotel from Etstur.
 * @param {object} params - The parameters for fetching hotel data.
 * @param {string} params.hotelUrl - The URL slug of the hotel (e.g., "Cullinan-Belek").
 * @param {string} params.checkIn - Check-in date (DD.MM.YYYY).
 * @param {string} params.checkOut - Check-out date (DD.MM.YYYY).
 * @param {number} params.adults - Number of adults.
 * @param {Array<number>} [params.childrenAges=[]] - An array of children's ages.
 * @returns {Promise<object|null>} A promise that resolves to the hotel's data from the
 *                                 alternatives API, or null if an error occurs.
 */
async function fetchHotelData(params) {
  const { hotelName, checkIn, checkOut, adults, childrenAges = [] } = params;
  console.log(`[DEBUG] fetchHotelData received hotelName: ${hotelName}`);

  const formattedCheckIn = checkIn;
  const formattedCheckOut = checkOut;

  const hotelInfo = await getHotelIdFromName(hotelName);

  if (!hotelInfo || !hotelInfo.hotelId) {
    console.error(`Could not find hotelId for ${hotelName}`);
    return null;
  }

  const { hotelId, hotelUrl } = hotelInfo;
  console.log(`[DEBUG] Using hotelId: ${hotelId}`);

  const refererUrl = new URL(hotelUrl);
  refererUrl.searchParams.set('check_in', checkIn.replace(/-/g, '.'));
  refererUrl.searchParams.set('check_out', checkOut.replace(/-/g, '.'));
  refererUrl.searchParams.set('adult_1', adults);
  refererUrl.searchParams.set('child_1', childrenAges.length);
  childrenAges.forEach((age, index) => {
    refererUrl.searchParams.set(`childage_1_${index + 1}`, age);
  });

  const roomApiUrl = "https://www.etstur.com/services/api/room";
  const postData = {
    hotelId: hotelId,
    checkIn: formattedCheckIn,
    checkOut: formattedCheckOut,
    room: {
      adultCount: parseInt(adults, 10),
      childCount: childrenAges.length,
      childAges: childrenAges,
      infantCount: 0
    }
  };

  console.log(`[DEBUG] Fetching room data from: ${roomApiUrl}`);
  console.log(`[DEBUG] POST data: ${JSON.stringify(postData, null, 2)}`);
  console.log(`[DEBUG] Referer: ${refererUrl.href}`);

  try {
    const apiResponse = await axios.post(roomApiUrl, postData, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "Referer": refererUrl.href
      },
    });
    console.log("Successfully fetched hotel data from room API.");
    return apiResponse.data;
  } catch (error) {
    console.error("Error fetching from room API:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return null;
  }
}


function parseRoomData(apiResponse) {
  if (!apiResponse?.success || !apiResponse.result?.rooms) {
    console.error("Invalid or empty API response.");
    return [];
  }

  const parsedData = apiResponse.result.rooms
    .map(room => {
      // Find the first sub-board that is explicitly marked as 'AVAILABLE'
      const availableSubBoard = room.subBoards?.find(
        sb => sb.availability?.type === 'AVAILABLE'
      );

      // If no available sub-board is found, skip this room
      if (!availableSubBoard) {
        return null;
      }

      // If available, parse its data
      return {
        roomName: room.roomName,
        totalPrice: availableSubBoard.price.discountedPrice,
        dailyPrices: availableSubBoard.dailyPrices.map(dp => ({
          date: dp.date,
          amount: dp.amount,
          currency: dp.currency
        }))
      };
    })
    .filter(Boolean); // This removes any null entries from the array

  return parsedData;
}


/**
 * Fetches available room types for a given hotel ID from Etstur.
 * @param {string} hotelId - The ID of the hotel.
 * @returns {Promise<Array>} A promise that resolves to a list of room type names.
 */
async function getRoomTypes(hotelId, checkIn, checkOut) {
  const roomApiUrl = "https://www.etstur.com/services/api/room";
  const postData = { hotelId: hotelId, checkIn, checkOut, room: { adultCount: 2, childCount: 0, childAges: [], infantCount: 0 } };

  try {
    const apiResponse = await axios.post(roomApiUrl, postData, {
      headers: { "accept": "application/json", "content-type": "application/json" },
    });

    if (apiResponse.data.success && apiResponse.data.result && apiResponse.data.result.rooms) {
      console.log(JSON.stringify(apiResponse.data, null, 2));
      const roomTypes = [...new Set(apiResponse.data.result.rooms.map(room => room.roomName))];
      console.log("Fetched room types:", roomTypes);
      return roomTypes;
    }
    return [];
  } catch (error) {
    console.error("Error fetching room types:", error.message);
    return [];
  }
}

/**
 * Fetches and processes pricing data for multiple hotels and their selected room types.
 * @param {object} params - The parameters for fetching comparison data.
 * @returns {Promise<Array>} A promise that resolves to an array of hotel data with filtered rooms.
 */
async function fetchComparisonData(params) {
  const { hotels, checkIn, checkOut, adults, childrenAges } = params;
  const allHotelsData = [];

  for (const hotel of hotels) {
    const hotelData = await fetchHotelData({
      hotelName: hotel.name,
      checkIn,
      checkOut,
      adults,
      childrenAges
    });

    if (hotelData && hotelData.success && hotelData.result && hotelData.result.rooms) {
      const filteredRooms = hotelData.result.rooms.filter(room =>
        hotel.roomTypes.includes(room.roomName)
      );
      allHotelsData.push({
        hotelName: hotel.name,
        rooms: filteredRooms
      });
    }
  }
  return allHotelsData;
}

/**
 * Analyzes and structures the comparison data into a table format.
 * @param {Array} comparisonData - The raw comparison data from fetchComparisonData.
 * @returns {object} An object containing the structured table data.
 */
function analyzeComparisonData(comparisonData) {
  const table = {
    headers: ["Otel / Tarih"],
    rows: [],
    summary: {
      cheapest: {},
      mostExpensive: {},
      average: {}
    }
  };
  const dailyPricesMap = new Map();

  comparisonData.forEach(hotel => {
    hotel.rooms.forEach(room => {
      const rowHeader = `${hotel.hotelName} (${room.roomName})`;
      const row = { header: rowHeader, prices: {} };

      if (room.subBoards && room.subBoards.length > 0 && room.subBoards[0].dailyPrices) {
        room.subBoards[0].dailyPrices.forEach(price => {
          const [day, month, year] = price.date.split('/');
          const date = new Date(year, month - 1, day).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          if (!table.headers.includes(date)) {
            table.headers.push(date);
          }
          row.prices[date] = price.amount;

          if (!dailyPricesMap.has(date)) {
            dailyPricesMap.set(date, []);
          }
          dailyPricesMap.get(date).push(price.amount);
        });
      }
      table.rows.push(row);
    });
  });

  table.headers.sort((a, b) => {
    if (a === "Otel / Tarih") return -1;
    if (b === "Otel / Tarih") return 1;
    const [dayA, monthA, yearA] = a.split('.');
    const [dayB, monthB, yearB] = b.split('.');
    return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
  });

  dailyPricesMap.forEach((prices, date) => {
    table.summary.cheapest[date] = Math.min(...prices);
    table.summary.mostExpensive[date] = Math.max(...prices);
    table.summary.average[date] = prices.reduce((a, b) => a + b, 0) / prices.length;
  });

  return table;
}

module.exports = {
  searchHotels,
  fetchHotelData,
  parseRoomData,
  getRoomTypes,
  getHotelIdFromName,
  fetchComparisonData,
  analyzeComparisonData
};
