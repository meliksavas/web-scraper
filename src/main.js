// main.js

const readline = require('readline'); // Node.js'te kullanıcı girdisi almak için
const { searchETSUrl } = require('./scrapers/etstur'); // etstur.js'den fonksiyonu import ediyoruz. Yolun doğru olduğundan emin ol!

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

(async () => {
    try {
        const searchKey = await question('Arama anahtarı (örn: Belek, Antalya): ');
        const checkIn = await question('Giriş tarihi (GG.AA.YYYY, örn: 16.07.2025): ');
        const checkOut = await question('Çıkış tarihi (GG.AA.YYYY, örn: 19.07.2025): ');
        const adultCountStr = await question('Yetişkin sayısı (örn: 2): ');
        const childCountStr = await question('Çocuk sayısı (örn: 0): ');

        const adultCount = parseInt(adultCountStr, 10) || 1; // Sayıya çevir, geçersizse 1 varsay
        const childCount = parseInt(childCountStr, 10) || 0; // Sayıya çevir, geçersizse 0 varsay

    
        const url = searchETSUrl(searchKey, checkIn, checkOut, adultCount, childCount);

        console.log('\nOluşan URL:\n', url);

     
        // Örnek:
        /*
        const puppeteer = require('puppeteer'); // Eğer burada kullanacaksan import et
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const pageTitle = await page.title();
        console.log('Sayfa Başlığı:', pageTitle);
        await browser.close();
        */

    } catch (error) {
        console.error("Bir hata oluştu:", error);
    } finally {
        rl.close(); 
    }
})();