# Rate Shopping Web Scraper

## Proje Açıklaması

Rate Shopping Web Scraper, otel sektöründe rekabet analizi için rakip otellerin web sitelerinden oda fiyatlarını otomatik olarak toplayan bir uygulamadır. Toplanan veriler PostgreSQL veritabanında saklanır ve daha sonra analiz veya raporlama amacıyla kullanılabilir.

## Kullanılan Teknolojiler

- Node.js
- Cheerio
- Puppeteer
- PostgreSQL

## Amaç

- Rakip otel sitelerinden güncel fiyat verilerini toplamak
- Fiyatları veritabanına kaydederek zaman bazlı analiz yapabilmek
- Manuel veri toplama sürecini otomatikleştirmek

## Fonksiyonel Gereksinimler

- [ ] Kullanıcı sistemde takip etmek istediği otel sitelerini tanımlayabilmelidir.
- [ ] Sistem tanımlanan sitelerden otel adı, oda tipi, fiyat, para birimi ve tarih bilgilerini çekebilmelidir.
- [ ] Çekilen veriler PostgreSQL veritabanına kaydedilmelidir.
- [ ] Veriler belirli aralıklarla otomatik olarak toplanmalıdır (örn. günlük cronjob).
- [ ] Aynı gün içinde birden fazla veri çekimi durumunda veri güncellenmeli veya versiyonlanmalıdır.
- [ ] Erişilemeyen veya hatalı sayfalar loglanmalıdır.
- [ ] Tüm geçmiş veriler sorgulanabilir olmalıdır.

## Fonksiyonel Olmayan Gereksinimler

- [ ] Sistem düşük kaynak tüketimiyle verimli çalışmalıdır.
- [ ] Scraping işlemlerinde hedef sitelere zarar verilmemeli, istek sayısı sınırlandırılmalıdır (rate limiting).
- [ ] Kod yapısı modüler, okunabilir ve sürdürülebilir olmalıdır.
- [ ] Veritabanı yapısı normalize edilmelidir.
- [ ] Proje kolay kurulabilir olmalı ve yeterli dokümantasyona sahip olmalıdır.

## Kurulum

```bash
git clone https://github.com/meliksavas/web-scraper.git
cd rate-shopping-scraper
npm install
