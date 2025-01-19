
//---------------------------------------------
//Script for the filtering of the OSM locations
//---------------------------------------------


function calculateBoundingBox(lng, lat, radius) {
    const earthRadius = 6378137; // Earth's radius in meters

    // Convert radius to degrees
    const deltaLat = (radius / earthRadius) * (180 / Math.PI);
    const deltaLng = deltaLat / Math.cos(lat * (Math.PI / 180));

    return {
        minLng: lng - deltaLng,  // Longitude first
        minLat: lat - deltaLat,
        maxLng: lng + deltaLng,
        maxLat: lat + deltaLat
    };
}


// Apply filters with BBOX filtering
async function applyFilters() {
    console.log("Applying filters...");

    const radius = parseFloat(document.querySelector('input[name="distance"]').value) || 1000;

    if (!departureMarker) {
        alert("❗ Please set your departure point.");
        return;
    }

    const center = departureMarker.getLngLat();

    // Calculate the Bounding Box from the center and radius
    const bbox = calculateBoundingBox(center.lng, center.lat, radius);

    // Apply BBOX in the CQL_FILTER for server-side filtering with URL encoding
    const bboxParam = `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat},EPSG:4326`;

    const pointURL = `http://localhost:8080/geoserver/LocAround/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=LocAround:planet_osm_point&outputFormat=application/json&bbox=${bboxParam}`;
    const polygonURL = `http://localhost:8080/geoserver/LocAround/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=LocAround:planet_osm_polygon&outputFormat=application/json&bbox=${bboxParam}`;

    console.log("Point URL:", pointURL);
    console.log("Polygon URL:", polygonURL);

    try {
        const [pointResponse, polygonResponse] = await Promise.all([
            fetch(pointURL),
            fetch(polygonURL)
        ]);

        const pointData = await pointResponse.json();
        const polygonData = await polygonResponse.json();

        const activities = Array.from(document.querySelectorAll('input[name="activity"]:checked')).map(input => input.value);
        const indoor = document.querySelector('input[name="environment"][value="indoor"]').checked;
        const outdoor = document.querySelector('input[name="environment"][value="outdoor"]').checked;
        const spectator = document.querySelector('input[name="role"][value="spectator"]').checked;
        const actor = document.querySelector('input[name="role"][value="actor"]').checked;
        const startDate = document.querySelector('input[name="beginning"]').value;
        const endDate = document.querySelector('input[name="end"]').value;

        const filteredPoints = filterFeatures(pointData.features, activities, center, radius, indoor, outdoor, spectator, actor, startDate, endDate);
        const filteredPolygons = filterPolygonCentroids(polygonData.features, activities, center, radius, indoor, outdoor, spectator, actor, startDate, endDate);

        displayPOIs(filteredPoints, filteredPolygons);

    } catch (error) {
        console.error("Error fetching POIs:", error);
    }
}

// Filter polygon features by converting them to point centroids
function filterPolygonCentroids(features, activities, center, radius, indoor, outdoor, spectator, actor, startDate, endDate) {
    console.log("Filtering polygon features as point centroids...");

    return features
        .map(feature => {
            const props = feature.properties;

            let centroidCoords;
            if (props.centroid && props.centroid.startsWith("POINT")) {
                const coords = props.centroid.replace("POINT(", "").replace(")", "").split(" ");
                centroidCoords = [parseFloat(coords[0]), parseFloat(coords[1])];

                if (isNaN(centroidCoords[0]) || isNaN(centroidCoords[1])) {
                    console.warn("Invalid centroid coordinates, recalculating...");
                    centroidCoords = turf.centroid(feature).geometry.coordinates;
                }
            } else {
                centroidCoords = turf.centroid(feature).geometry.coordinates;
            }

            return {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: centroidCoords
                },
                properties: props
            };
        })
        .filter(feature => filterFeatures([feature], activities, center, radius, indoor, outdoor, spectator, actor, startDate, endDate)[0]);
}

// Filter point features with all criteria
function filterFeatures(features, activities, center, radius, indoor, outdoor, spectator, actor, startDate, endDate) {
    console.log("Filtering features with advanced criteria...");

    return features.filter(feature => {
        const props = feature.properties;

        const activityType = props.amenity || props.leisure || props.tourism || props.building;
        if (activities.length > 0 && !activities.includes(activityType)) {
            return false;
        }

        const featureCoords = feature.geometry.coordinates;
        const distance = turf.distance([center.lng, center.lat], featureCoords, { units: "meters" });

        if (distance > radius) {
            return false;
        }

        if (indoor && props.indoor !== 'yes') return false;
        if (outdoor && props.indoor === 'yes') return false;

        if (spectator && !props.spectator) return false;
        if (actor && !props.actor) return false;

        return true;
    });
}

// Display the filtered POIs on the map
function displayPOIs(points = [], polygons = []) {
    console.log(`Displaying ${points.length} point features and ${polygons.length} polygon features.`);

    // Clean up existing layers
    if (map.getLayer('pois-points')) {
        map.removeLayer('pois-points');
        map.removeSource('pois-points');
    }
    if (map.getLayer('pois-polygons')) {
        map.removeLayer('pois-polygons');
        map.removeSource('pois-polygons');
    }

    // Add Points Layer
    if (points.length > 0) {
        map.addSource('pois-points', {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: points
            }
        });

        map.addLayer({
            id: 'pois-points',
            type: 'circle',
            source: 'pois-points',
            paint: {
                'circle-radius': 6,
                'circle-color': '#FF5733',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#FFFFFF'
            }
        });

        
    }

    // Add Polygons Layer (converted to centroids)
    if (polygons.length > 0) {
        map.addSource('pois-polygons', {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: polygons
            }
        });

        map.addLayer({
            id: 'pois-polygons',
            type: 'circle',  // Display polygons as points (centroids)
            source: 'pois-polygons',
            paint: {
                'circle-radius': 6,
                'circle-color': '#3366FF',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#FFFFFF'
            }
        });

        // Add Click Event for Polygons
        map.on('click', 'pois-polygons', (e) => {
            const feature = e.features[0];
            const coords = feature.geometry.coordinates;
            const props = feature.properties;

            // Show POI Details
            new maplibregl.Popup()
                .setLngLat(coords)
                .setHTML(`<strong>${props.name || "Unknown Location"}</strong><br>Amenity: ${props.amenity || "N/A"}`)
                .addTo(map);

            // Set as Destination and Trigger Routing
            setDestinationAndRoute(coords);
        });
    }
}

// Trigger filtering when the "Search" button is clicked
function searchPlaces() {
    console.log("Search button clicked.");
    applyFilters();
}
