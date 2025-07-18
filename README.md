# Rate Shopping Web Scraper

## Proje Açıklaması

Rate Shopping Web Scraper, otel sektöründe rekabet analizi için rakip otellerin web sitelerinden oda fiyatlarını otomatik olarak toplayan bir uygulamadır. Toplanan veriler PostgreSQL veritabanında saklanır ve analiz veya raporlama amaçlarıyla kullanılabilir.

## Amaç

- Rakip otel sitelerinden güncel fiyat verilerini toplamak
- Fiyatları veritabanına kaydederek zaman bazlı analiz yapılabilmesini sağlamak
- Manuel veri toplama sürecini otomatik hale getirmek

## Kullanılan Teknolojiler

- Node.js
- Cheerio
- Puppeteer
- PostgreSQL
- node-cron (otomatik görevler için)
- dotenv (çevresel değişken yönetimi için)
- Winston (loglama için)

## Fonksiyonel Gereksinimler

- Kullanıcı sistemde takip etmek istediği otel sitelerini tanımlayabilmelidir.
- Sistem tanımlanan sitelerden aşağıdaki bilgileri çekebilmelidir:
  - Otel adı
  - Oda tipi
  - Fiyat
  - Para birimi
  - Tarih bilgisi
- Çekilen veriler PostgreSQL veritabanına kaydedilmelidir.
- Veriler günlük olarak otomatik toplanmalıdır (örn. cronjob ile).
- Aynı gün içinde birden fazla veri çekimi olması durumunda veriler güncellenmeli veya versiyonlanmalıdır.
- Erişilemeyen ya da hata alınan sayfalar sistem loglarına kaydedilmelidir.
- Tüm geçmiş veriler tarih filtresiyle sorgulanabilir olmalıdır.

## Scrape Edilecek Siteler

Proje başlangıcında hedeflenen otel siteleri aşağıdaki gibidir. Gerekli durumlarda yeni siteler kolayca entegre edilebilir şekilde yapı tasarlanmıştır.

- https://www.etstur.com
- https://www.booking.com
- https://www.tatilsepeti.com
- https://www.otelz.com
- https://www.tatilbudur.com

> Not: Her site için ayrı `scraper` modülü yazılmıştır. Her biri `selectors`, `pagination`, `login` gibi detaylara göre ayrı ayrı yapılandırılmıştır.

