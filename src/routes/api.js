const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

router.get('/search', hotelController.search);
router.post('/hotel-data', hotelController.getHotelData);

module.exports = router;
