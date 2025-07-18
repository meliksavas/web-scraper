// etstur.js

// Puppeteer ve Cheerio burada tanımlı kalsın, ileride scrape fonksiyonu eklenebilir.
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

function searchETSUrl(searchKey, checkIn, checkOut, adultCount, childCount) {
    const url = `https://www.etstur.com/${encodeURIComponent(searchKey)}-Otelleri?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(checkOut)}&adult_1=${encodeURIComponent(adultCount)}&child_1=${encodeURIComponent(childCount)}`;
    return url;
}

// searchETSUrl fonksiyonunu dışarı aktarıyoruz
module.exports = {
    searchETSUrl
};