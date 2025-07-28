const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Otel isminden Etstur otel URL'si üretir.
 * Türkçe karakterleri temizler, boşlukları tire yapar ve her kelimenin baş harfini büyük yapar.
 */
function generateHotelUrl(hotelName) {
  const hotelNameOnly = hotelName.split(',')[0];
  const slug = hotelNameOnly
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Türkçe karakterleri sil
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9\s-]/g, "") // özel karakterleri sil
    .trim()
    .split(/\s+/) // kelimelere ayır
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // baş harfleri büyüt
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
    if (!apiResponse || !apiResponse.success || !apiResponse.result || !apiResponse.result.rooms) {
        console.error("Invalid or empty API response.");
        return [];
    }

    const rooms = apiResponse.result.rooms;
    const parsedData = rooms.map(room => {
        const roomName = room.roomName;
        const subBoard = room.subBoards[0]; 
        const totalPrice = subBoard.price.discountedPrice;
        const dailyPrices = subBoard.dailyPrices.map(dp => ({
            date: dp.date,
            amount: dp.amount,
            currency: dp.currency
        }));

        return {
            roomName,
            totalPrice,
            dailyPrices
        };
    });

    return parsedData;
}

module.exports = {
  searchHotels,
  fetchHotelData,
  parseRoomData,
};