const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

router.get('/search', hotelController.search);
router.post('/hotel-data', hotelController.getHotelData);
router.post('/room-types', hotelController.getRoomTypesForHotel);
router.post('/compare-prices', hotelController.comparePrices);

module.exports = router;
