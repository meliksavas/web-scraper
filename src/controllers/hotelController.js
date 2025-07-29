const etsturService = require('../services/etsturService');

async function search(req, res) {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }
    try {
        const hotels = await etsturService.searchHotels(q);
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search for hotels.' });
    }
}

async function getHotelData(req, res) {
    const { hotelName, checkIn, checkOut, adults, childrenAges } = req.body;

    if (!hotelName) return res.status(400).json({ error: 'Missing required parameter: hotelName.' });
    if (!checkIn) return res.status(400).json({ error: 'Missing required parameter: checkIn.' });
    if (!checkOut) return res.status(400).json({ error: 'Missing required parameter: checkOut.' });
    if (!adults) return res.status(400).json({ error: 'Missing required parameter: adults.' });

    try {
        const hotelData = await etsturService.fetchHotelData({ hotelName, checkIn, checkOut, adults, childrenAges });
        if (hotelData) {
            res.json(hotelData);
        } else {
            res.status(404).json({ error: 'Hotel data not found.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch hotel data.' });
    }
}

async function getRoomTypesForHotel(req, res) {
    const { hotelName } = req.body;
    if (!hotelName) {
        return res.status(400).json({ error: 'hotelName is required' });
    }

    try {
        const hotelInfo = await etsturService.getHotelIdFromName(hotelName);
        if (!hotelInfo || !hotelInfo.hotelId) {
            return res.status(404).json({ error: 'Hotel not found or could not retrieve hotel ID.' });
        }

        const roomTypes = await etsturService.getRoomTypes(hotelInfo.hotelId);
        res.json({ roomTypes });
    } catch (error) {
        console.error('Error in getRoomTypesForHotel:', error);
        res.status(500).json({ error: 'Failed to get room types.' });
    }
}

async function comparePrices(req, res) {
    const { hotels, checkIn, checkOut, adults, childrenAges } = req.body;

    if (!hotels || !Array.isArray(hotels) || hotels.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty hotels array.' });
    }

    try {
        const comparisonData = await etsturService.fetchComparisonData({ hotels, checkIn, checkOut, adults, childrenAges });
        const analysis = etsturService.analyzeComparisonData(comparisonData);
        res.json(analysis);
    } catch (error) {
        console.error('Error in comparePrices:', error);
        res.status(500).json({ error: 'Failed to compare prices.' });
    }
}

module.exports = {
    search,
    getHotelData,
    getRoomTypesForHotel,
    comparePrices
};