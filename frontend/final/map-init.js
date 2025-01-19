//---------------------------------------------
// Script for the map initialization
//---------------------------------------------

// Global Variables
let map;
let departureMarker = null;
let destinationMarker = null;
let poiLayerPoints = null;
let poiLayerPolygons = null;

// Initialize the Map
function initMap() {
    map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.versatiles.org/assets/styles/colorful.json',
        center: [8.4043, 49.0145],  // Center on a default location
        zoom: 14
    });

    map.addControl(new maplibregl.NavigationControl());

    map.on('load', () => {
        console.log("Map fully loaded.");

        // Load marker icon for POIs
        map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', (error, image) => {
            if (error) throw error;
            if (!map.hasImage('custom-marker')) {
                map.addImage('custom-marker', image);
            }
        });

        // Handle missing images
        map.on('styleimagemissing', (e) => {
            console.warn(`Missing image: ${e.id}`);
            if (e.id === 'marker-15') {
                map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', (error, image) => {
                    if (error) throw error;
                    if (!map.hasImage('marker-15')) {
                        map.addImage('marker-15', image);
                    }
                });
            }
        });

        // ✅ Set departure marker only when clicking on empty map space
        map.on('click', (e) => {
            if (map.getLayer('pois-points')) {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['pois-points']
                });
        
                if (features.length === 0) {
                    setDeparture(e.lngLat);  // Set departure if not clicking on a POI
                }
            } else {
                setDeparture(e.lngLat);  // If layer doesn't exist, allow setting departure
            }
        });
        

        // Set up POI click handler
        setupPOIClickHandler();
    });
}

// ✅ Set Departure Marker (Green)
function setDeparture(coordinates) {
    if (!departureMarker) {
        departureMarker = new maplibregl.Marker({ color: 'green' }) // Green for Departure
            .setLngLat(coordinates)
            .setDraggable(true)
            .addTo(map);
    } else {
        departureMarker.setLngLat(coordinates);
    }
    console.log(`Departure point set at: ${coordinates.lng}, ${coordinates.lat}`);
}

// ✅ Set Destination Marker (Red)
function setDestination(coordinates) {
    if (!destinationMarker) {
        destinationMarker = new maplibregl.Marker({ color: 'red' }) // Red for Destination
            .setLngLat(coordinates)
            .setDraggable(false)
            .addTo(map);
    } else {
        destinationMarker.setLngLat(coordinates);
    }
    console.log(`Destination point set at: ${coordinates.lng}, ${coordinates.lat}`);
}

// ✅ Handle Click on POIs to Set Destination and Calculate Route
function setupPOIClickHandler() {
    map.on('click', 'pois-points', (e) => {
        const poiCoordinates = e.features[0].geometry.coordinates;
        const poiName = e.features[0].properties.name || "Selected POI";

        // 🔴 Always update the destination marker
        setDestination({ lat: poiCoordinates[1], lng: poiCoordinates[0] });

        // 🛣️ Calculate routes from the departure marker to the clicked POI
        if (departureMarker) {
            calculateRoutesToPOI(poiCoordinates);
        } else {
            alert("Please set a departure point first.");
        }

        // 📌 Show a popup with the POI name
        new maplibregl.Popup()
            .setLngLat(poiCoordinates)
            .setHTML(`<b>${poiName}</b>`)
            .addTo(map);
    });

    map.on('mouseenter', 'pois-points', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'pois-points', () => {
        map.getCanvas().style.cursor = '';
    });
}

// Fetch and Display POIs from GeoServer after filtering
async function fetchAndDisplayPOIs() {
    const radius = parseFloat(document.querySelector('input[name="distance"]').value) || 1000;
    const selectedActivities = Array.from(document.querySelectorAll('input[name="activity"]:checked')).map(el => el.value);

    if (!departureMarker) {
        alert("Please set your departure point.");
        return;
    }

    const center = departureMarker.getLngLat();

    const pointURL = `http://localhost:8080/geoserver/LocAround/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=LocAround:planet_osm_point&outputFormat=application/json`;
    const polygonURL = `http://localhost:8080/geoserver/LocAround/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=LocAround:planet_osm_polygon&outputFormat=application/json`;

    try {
        const [pointResponse, polygonResponse] = await Promise.all([
            fetch(pointURL),
            fetch(polygonURL)
        ]);

        if (!pointResponse.ok || !polygonResponse.ok) {
            console.error("Error fetching POIs from GeoServer.");
            alert("Failed to fetch POIs. Please check GeoServer.");
            return;
        }

        const pointData = await pointResponse.json();
        const polygonData = await polygonResponse.json();

        const filteredPoints = filterFeatures(pointData.features, selectedActivities, center, radius);
        const filteredPolygons = filterFeatures(polygonData.features, selectedActivities, center, radius);

        displayPOIs(filteredPoints, filteredPolygons);
    } catch (error) {
        console.error("Error fetching POIs:", error);
    }
}

window.onload = function () {
    initMap();
};
