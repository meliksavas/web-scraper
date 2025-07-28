document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const autocompleteResults = document.getElementById('autocomplete-results');
    const hotelDataContainer = document.getElementById('hotel-data');
    const checkinDate = document.getElementById('checkin-date');
    const checkoutDate = document.getElementById('checkout-date');
    const adults = document.getElementById('adults');
    const childrenCount = document.getElementById('children-count');
    const childAgesContainer = document.getElementById('child-ages-container');
    const getDataButton = document.getElementById('get-data-button');

    let selectedHotelName = '';
    // DÜZELTME 1: Otelin URL'sini saklamak için yeni bir değişken ekledik.
    let selectedHotelUrl = '';

    searchInput.addEventListener('input', async () => {
        const query = searchInput.value;
        if (query.length < 3) {
            autocompleteResults.innerHTML = '';
            return;
        }
        
        // ÖNEMLİ: /api/search endpoint'inizin aşağıdaki gibi bir formatta veri döndürdüğünden emin olun:
        // [{ "title": "Örnek Otel Adı", "url": "ornek-otel-adi-urli" }, ...]
        const response = await fetch(`/api/search?q=${query}`);
        const hotels = await response.json();

        autocompleteResults.innerHTML = '';
        hotels.forEach(hotel => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.textContent = hotel.title;
            item.addEventListener('click', () => {
                searchInput.value = hotel.title;
                selectedHotelName = hotel.title;
                // DÜZELTME 2: Otel seçildiğinde, URL'sini de değişkene atıyoruz.
                // 'hotel.url' kısmını kendi API yanıtınıza göre ayarlamanız gerekebilir.
                selectedHotelUrl = hotel.url; 
                autocompleteResults.innerHTML = '';
            });
            autocompleteResults.appendChild(item);
        });
    });

    childrenCount.addEventListener('input', () => {
        const count = parseInt(childrenCount.value, 10);
        childAgesContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.placeholder = `Child ${i + 1} Age`;
            input.className = 'child-age-input';
            childAgesContainer.appendChild(input);
        }
    });

    getDataButton.addEventListener('click', async () => {
        // Otel adı yerine URL'nin seçilip seçilmediğini kontrol etmek daha güvenilirdir.
        if (!selectedHotelUrl) {
            hotelDataContainer.textContent = 'Lütfen önce listeden bir otel seçin.';
            return;
        }

        const childAgeInputs = document.getElementsByClassName('child-age-input');
        const childrenAges = [];
        for (let i = 0; i < childAgeInputs.length; i++) {
            childrenAges.push(parseInt(childAgeInputs[i].value, 10));
        }

        const response = await fetch('/api/hotel-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hotelName: searchInput.value,
                checkIn: checkinDate.value,
                checkOut: checkoutDate.value,
                adults: adults.value,
                childrenAges: childrenAges
            })
        });

        const data = await response.json();
        if (data.success && data.result && data.result.rooms) {
            let output = `Hotel: ${searchInput.value}\n`;
            // DÜZELTME 3: Artık tanımlı olan 'selectedHotelUrl' değişkenini kullanıyoruz.
            output += `URL: https://www.etstur.com/${selectedHotelUrl}\n\n`;

            data.result.rooms.forEach(room => {
                output += `Room: ${room.roomName}\n`;
                if (room.subBoards && room.subBoards.length > 0) {
                    room.subBoards.forEach(board => {
                        output += `  Board: ${board.boardType.label}\n`;
                        const totalPrice = board.price.discountedPrice || board.price.amount;
                        output += `  Total Price: ${totalPrice.toFixed(2)} ${board.price.currency}\n`;

                        if (board.dailyPrices && board.dailyPrices.length > 0) {
                            output += `  Daily Prices:\n`;
                            board.dailyPrices.forEach(daily => {
                                // Tarih formatını daha okunabilir hale getirebilirsiniz.
                                const date = new Date(daily.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                output += `    - ${date}: ${daily.amount.toFixed(2)} ${daily.currency}\n`;
                            });
                        }
                        output += '\n';
                    });
                } else {
                    output += '  Bu oda için fiyat bilgisi bulunamadı.\n\n';
                }
            });
            // Oluşturulan metni <pre> etiketine basıyoruz.
            hotelDataContainer.textContent = output;
        } else {
            hotelDataContainer.textContent = 'Otel oda bilgileri alınamadı.\n\n' + JSON.stringify(data, null, 2);
        }
    });
});