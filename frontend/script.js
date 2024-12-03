document.getElementById('preferencesForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const userId = 'user123'; // Example userId
    const categories = Array.from(document.getElementById('categories').selectedOptions).map(option => option.value);
    const location = document.getElementById('location').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, preferences: { categories, location, dateRange: { startDate, endDate } } })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Preferences saved:', data);
        fetchRecommendations(userId);
    })
    .catch(error => {
        console.error('Error saving preferences:', error);
    });
});

function fetchRecommendations(userId) {
    fetch(`/api/recommendations/${userId}`)
    .then(response => response.json())
    .then(data => {
        console.log('Recommendations:', data);
        displayEventsOnMap(data);
    })
    .catch(error => {
        console.error('Error fetching recommendations:', error);
    });
}

function displayEventsOnMap(events) {
    const map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    events.forEach(event => {
        L.marker([event.coordinates.lat, event.coordinates.lon]).addTo(map)
            .bindPopup(`<b>${event.name}</b><br>${event.category}`)
            .openPopup();
    });
}

//Integrate OpenStreetMap for Route Planning
function fetchRoute(start, end) {
    fetch(`/api/routes?start=${start}&end=${end}`)
    .then(response => response.json())
    .then(data => {
        console.log('Route:', data);
        displayRouteOnMap(data);
    })
    .catch(error => {
        console.error('Error fetching route:', error);
    });
}

function displayRouteOnMap(routeData) {
    const map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const polyline = L.Polyline.fromEncoded(routeData.routes[0].geometry).addTo(map);
    map.fitBounds(polyline.getBounds());
}