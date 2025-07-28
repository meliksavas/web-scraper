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

module.exports = {
    search,
    getHotelData,
};