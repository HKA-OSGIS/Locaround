// Routing Variables
const transportModes = ['foot', 'bike', 'car', 'public_transport'];
const colors = {
    foot: '#f00',
    bike: '#00f',
    car: '#0f0',
    public_transport: '#ffa500'
};

// Fetch and Display Routes for All Transport Modes
function calculateRoutesToPOI(poiCoordinates) {
    if (!departureMarker) {
        alert('Please set your departure point first.');
        return;
    }

    const departureCoords = departureMarker.getLngLat();

    // Clear previous routes and route info
    clearPreviousRoutes();

    // Fetch routes for all transport modes
    transportModes.forEach(mode => {
        fetchAndDisplayRoute(
            { lat: departureCoords.lat, lng: departureCoords.lng },
            { lat: poiCoordinates[1], lng: poiCoordinates[0] },
            mode
        );
    });
}

// Fetch and Display Route for a Specific Mode
async function fetchAndDisplayRoute(start, end, mode) {
    try {
        let url = new URL("http://localhost:8989/route");

        // Construct URL based on transport mode
        url.searchParams.append("point", `${start.lat},${start.lng}`);
        url.searchParams.append("point", `${end.lat},${end.lng}`);
        url.searchParams.append("profile", mode === 'public_transport' ? 'pt' : mode);
        url.searchParams.append("geometries", mode === 'public_transport' ? 'geojson' : 'polyline');
        url.searchParams.append("locale", "en-US");

        if (mode === 'public_transport') {
            url.searchParams.append("pt.earliest_departure_time", new Date().toISOString());
            url.searchParams.append("pt.access_profile", "foot");
            url.searchParams.append("pt.egress_profile", "foot");
        }

        console.log(`Fetching ${mode} route: ${url.toString()}`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch route for ${mode}`);

        const json = await response.json();

        if (!json.paths || json.paths.length === 0) {
            console.warn(`No route found for ${mode}`);
            return;
        }

        const route = json.paths[0];

        // Ensure the route source exists
        if (!map.getSource(`route_${mode}`)) {
            map.addSource(`route_${mode}`, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                }
            });

            map.addLayer({
                id: `route_${mode}_layer`,
                type: 'line',
                source: `route_${mode}`,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': colors[mode],
                    'line-width': 4,
                    'line-opacity': 0.8
                }
            });
        }

        // Decode or directly use GeoJSON
        let routePoints;
        if (mode === 'public_transport') {
            routePoints = route.points.coordinates;
        } else {
            const decodedPoints = polyline.decode(route.points);
            routePoints = decodedPoints.map(([lat, lon]) => [lon, lat]);
        }

        // Update the map with route data
        map.getSource(`route_${mode}`).setData({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: routePoints
            }
        });

        // ✅ Update the route info box
        const routeInfo = document.getElementById('route-info');

        // Ensure the box is visible
        routeInfo.style.display = 'block';

        const info = `<b>${mode.toUpperCase()}</b>: ${(route.distance / 1000).toFixed(2)} km, ${(route.time / 60000).toFixed(1)} min`;
        
        // Append new route info
        routeInfo.innerHTML += `<div style="border-left: 5px solid ${colors[mode]}; padding-left: 5px; margin-bottom: 5px;">${info}</div>`;

        console.log(`${mode} route displayed.`);
    } catch (error) {
        console.error(`Error fetching/displaying ${mode} route:`, error);
    }
}

// Set Departure Marker
function setDeparture(coordinates) {
    if (departureMarker) {
        departureMarker.setLngLat(coordinates);
    } else {
        departureMarker = new maplibregl.Marker({ color: 'green' })
            .setLngLat(coordinates)
            .setDraggable(true)
            .addTo(map);
    }

    // Update the input field with the departure coordinates
    document.getElementById('departure').value = `${coordinates.lat}, ${coordinates.lng}`;
}

// Set Destination Marker
function setDestinationMarker(coords) {
    if (destinationMarker) {
        destinationMarker.remove();
    }

    destinationMarker = new maplibregl.Marker({ color: 'red' })
        .setLngLat(coords)
        .addTo(map);
}

// Clear Previous Routes and Route Info
function clearPreviousRoutes() {
    transportModes.forEach(mode => {
        if (map.getSource(`route_${mode}`)) {
            map.getSource(`route_${mode}`).setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [] }
            });
        }

        if (map.getLayer(`route_${mode}_layer`)) {
            map.removeLayer(`route_${mode}_layer`);
        }

        if (map.getSource(`route_${mode}`)) {
            map.removeSource(`route_${mode}`);
        }
    });

    // ✅ Clear the route info box
    document.getElementById('route-info').innerHTML = '';
}

// Handle POI Click for Routing
function setupPOIClickHandler() {
    map.on('click', 'pois-points', (e) => {
        const poiCoordinates = e.features[0].geometry.coordinates;
        const poiName = e.features[0].properties.name || "Selected POI";

        setDestinationMarker(poiCoordinates);

        // Clear the route info box before updating
        document.getElementById('route-info').innerHTML = '';

        // Trigger routing
        calculateRoutesToPOI(poiCoordinates);

        // Show POI info
        new maplibregl.Popup()
            .setLngLat(poiCoordinates)
            .setHTML(`${poiName}`)
            .addTo(map);
    });
}
