document.addEventListener('DOMContentLoaded', () => {
    const primarySearchInput = document.getElementById('primary-search-input');
    const primaryAutocompleteResults = document.getElementById('primary-autocomplete-results');
    const primaryHotelContainer = document.getElementById('primary-hotel-container');

    const rivalSearchInput = document.getElementById('rival-search-input');
    const rivalAutocompleteResults = document.getElementById('rival-autocomplete-results');
    const rivalHotelsList = document.getElementById('rival-hotels-list');

    const checkinDate = document.getElementById('checkin-date');
    const checkoutDate = document.getElementById('checkout-date');
    const adults = document.getElementById('adults');
    const childrenCount = document.getElementById('children-count');
    const childAgesContainer = document.getElementById('child-ages-container');
    const comparePricesButton = document.getElementById('compare-prices-button');
    const comparisonResults = document.getElementById('comparison-results');

    let primaryHotel = null;
    const rivalHotels = [];

    const searchHandler = async (query, resultsContainer, callback) => {
        if (query.length < 3) {
            resultsContainer.innerHTML = '';
            return;
        }
        const response = await fetch(`/api/search?q=${query}`);
        const hotels = await response.json();
        resultsContainer.innerHTML = '';
        hotels.forEach(hotel => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.textContent = hotel.title;
            item.addEventListener('click', () => {
                callback(hotel);
                resultsContainer.innerHTML = '';
            });
            resultsContainer.appendChild(item);
        });
    };

    primarySearchInput.addEventListener('input', () => searchHandler(primarySearchInput.value, primaryAutocompleteResults, addPrimaryHotel));
    rivalSearchInput.addEventListener('input', () => searchHandler(rivalSearchInput.value, rivalAutocompleteResults, addRivalHotel));

    function addPrimaryHotel(hotel) {
        primaryHotel = { name: hotel.title, roomTypes: [] };
        primarySearchInput.value = '';
        renderHotelCard(primaryHotel, primaryHotelContainer, true);
    }

    function addRivalHotel(hotel) {
        const rivalHotel = { name: hotel.title, roomTypes: [] };
        rivalHotels.push(rivalHotel);
        rivalSearchInput.value = '';
        renderHotelCard(rivalHotel, rivalHotelsList, false);
    }

    async function renderHotelCard(hotel, container, isPrimary) {
        const card = document.createElement('div');
        card.className = 'hotel-card';
        card.innerHTML = `<strong>${hotel.name}</strong>`;

        const roomTypesContainer = document.createElement('div');
        roomTypesContainer.className = 'room-types';
        card.appendChild(roomTypesContainer);

        if (!isPrimary) {
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => {
                rivalHotels.splice(rivalHotels.indexOf(hotel), 1);
                container.removeChild(card);
            };
            card.appendChild(removeBtn);
        }

        if (isPrimary) {
            container.innerHTML = ''; // Clear previous primary hotel
        }
        container.appendChild(card);

        // Fetch and display room types
        const response = await fetch('/api/room-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hotelName: hotel.name, checkIn: checkinDate.value, checkOut: checkoutDate.value })
        });
        const data = await response.json();
        if (data.roomTypes) {
            data.roomTypes.forEach(roomType => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `${hotel.name}-${roomType}`;
                checkbox.value = roomType;
                checkbox.onchange = (e) => {
                    if (e.target.checked) {
                        hotel.roomTypes.push(roomType);
                    } else {
                        hotel.roomTypes = hotel.roomTypes.filter(rt => rt !== roomType);
                    }
                };

                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = roomType;

                const wrapper = document.createElement('div');
                wrapper.appendChild(checkbox);
                wrapper.appendChild(label);
                roomTypesContainer.appendChild(wrapper);
            });
        }
    }

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

    comparePricesButton.addEventListener('click', async () => {
        const hotelsToCompare = [primaryHotel, ...rivalHotels].filter(h => h && h.roomTypes.length > 0);
        if (hotelsToCompare.length === 0) {
            alert('Please select at least one hotel and room type.');
            return;
        }

        const childAgeInputs = document.getElementsByClassName('child-age-input');
        const childrenAges = Array.from(childAgeInputs).map(input => parseInt(input.value, 10));

        const response = await fetch('/api/compare-prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hotels: hotelsToCompare,
                checkIn: checkinDate.value,
                checkOut: checkoutDate.value,
                adults: adults.value,
                childrenAges
            })
        });

        const data = await response.json();
        renderComparisonTable(data);
    });

    function renderComparisonTable(data) {
        let tableHtml = '<table id="comparison-table"><thead><tr>';
        data.headers.forEach(header => tableHtml += `<th>${header}</th>`);
        tableHtml += '</tr></thead><tbody>';

        // Summary Rows
        ['cheapest', 'mostExpensive', 'average'].forEach(type => {
            tableHtml += `<tr><td><strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong></td>`;
            data.headers.slice(1).forEach(date => {
                const value = data.summary[type][date];
                tableHtml += `<td>${value ? value.toFixed(2) + '₺' : 'N/A'}</td>`;
            });
            tableHtml += '</tr>';
        });

        // Hotel Rows
        data.rows.forEach(row => {
            tableHtml += `<tr><td>${row.header}</td>`;
            data.headers.slice(1).forEach(date => {
                const price = row.prices[date];
                tableHtml += `<td>${price ? price.toFixed(2) + '₺' : 'N/A'}</td>`;
            });
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table>';
        comparisonResults.innerHTML = tableHtml;
    }
});