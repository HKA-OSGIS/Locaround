const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'osm_data',
  password: 'nouveau_mot_de_passe',
  port: 5432,
});

router.get('/', async (req, res) => {
  const { type, location, role, date, indoor, outdoor, spectator, actor } = req.query;
  let queryPoints = `
    SELECT osm_id, name, ST_Y(way) AS latitude, ST_X(way) AS longitude
    FROM planet_osm_point
    WHERE 1=1
  `;

  let queryPolygons = `
    SELECT osm_id, name, ST_Y(ST_Centroid(way)) AS latitude, ST_X(ST_Centroid(way)) AS longitude
    FROM planet_osm_polygon
    WHERE 1=1
  `;

  const valuesPoints = [];
  const valuesPolygons = [];

  // Filter by type
  if (type) {
    switch (type) {
      case 'museum':
        queryPoints += ' AND amenity = $' + (valuesPoints.length + 1);
        valuesPoints.push('museum');
        break;
      case 'park':
        queryPoints += ' AND leisure = $' + (valuesPoints.length + 1);
        valuesPoints.push('park');
        break;
      case 'stadium':
        queryPoints += ' AND leisure = $' + (valuesPoints.length + 1);
        valuesPoints.push('stadium');
        break;
      case 'restaurant':
        queryPoints += ' AND amenity = $' + (valuesPoints.length + 1);
        valuesPoints.push('restaurant');
        queryPolygons += ' AND amenity = $' + (valuesPolygons.length + 1);
        valuesPolygons.push('restaurant');
        break;
      case 'cinema':
        queryPoints += ' AND amenity = $' + (valuesPoints.length + 1);
        valuesPoints.push('cinema');
        queryPolygons += ' AND amenity = $' + (valuesPolygons.length + 1);
        valuesPolygons.push('cinema');
        break;
      case 'theatre':
        queryPoints += ' AND amenity = $' + (valuesPoints.length + 1);
        valuesPoints.push('theatre');
        queryPolygons += ' AND amenity = $' + (valuesPolygons.length + 1);
        valuesPolygons.push('theatre');
        break;
      case 'bar':
        queryPoints += ' AND amenity = $' + (valuesPoints.length + 1);
        valuesPoints.push('bar');
        queryPolygons += ' AND amenity = $' + (valuesPolygons.length + 1);
        valuesPolygons.push('bar');
        break;
      case 'cafe':
        queryPoints += ' AND amenity = $' + (valuesPoints.length + 1);
        valuesPoints.push('cafe');
        queryPolygons += ' AND amenity = $' + (valuesPolygons.length + 1);
        valuesPolygons.push('cafe');
        break;
      case 'library':
        queryPoints += ' AND amenity = $' + (valuesPoints.length + 1);
        valuesPoints.push('library');
        queryPolygons += ' AND amenity = $' + (valuesPolygons.length + 1);
        valuesPolygons.push('library');
        break;
      case 'theme_park':
        queryPoints += ' AND tourism = $' + (valuesPoints.length + 1);
        valuesPoints.push('theme_park');
        queryPolygons += ' AND tourism = $' + (valuesPolygons.length + 1);
        valuesPolygons.push('theme_park');
        break;
      case 'sports_centre':
        queryPoints += ' AND leisure = $' + (valuesPoints.length + 1);
        valuesPoints.push('sports_centre');
        queryPolygons += ' AND leisure = $' + (valuesPolygons.length + 1);
        valuesPolygons.push('sports_centre');
        break;
      // Add more cases as needed
      default:
        return res.status(400).send('Invalid type');
    }
  }

  // Filter by location
  if (location) {
    queryPoints += ' AND "addr:housenumber" = $' + (valuesPoints.length + 1);
    valuesPoints.push(location);
    queryPolygons += ' AND "addr:housenumber" = $' + (valuesPolygons.length + 1);
    valuesPolygons.push(location);
  }

  // Filter by indoor/outdoor
  if (indoor !== undefined || outdoor !== undefined) {
    const conditionsPoints = [];
    const conditionsPolygons = [];
    if (indoor === 'true') {
      conditionsPoints.push('indoor = true');
      conditionsPolygons.push('indoor = true');
    }
    if (outdoor === 'true') {
      conditionsPoints.push('outdoor = true');
      conditionsPolygons.push('outdoor = true');
    }
    queryPoints += ` AND (${conditionsPoints.join(' OR ')})`;
    queryPolygons += ` AND (${conditionsPolygons.join(' OR ')})`;
  }

  // Filter by spectator/actor
  if (spectator !== undefined || actor !== undefined) {
    const conditionsPoints = [];
    const conditionsPolygons = [];
    if (spectator === 'true') {
      conditionsPoints.push('spectator = true');
      conditionsPolygons.push('spectator = true');
    }
    if (actor === 'true') {
      conditionsPoints.push('actor = true');
      conditionsPolygons.push('actor = true');
    }
    queryPoints += ` AND (${conditionsPoints.join(' OR ')})`;
    queryPolygons += ` AND (${conditionsPolygons.join(' OR ')})`;
  }

  // Filter by date
  if (date) {
    queryPoints += ' AND $' + (valuesPoints.length + 1) + ' BETWEEN start_date AND end_date';
    valuesPoints.push(date);
    queryPolygons += ' AND $' + (valuesPolygons.length + 1) + ' BETWEEN start_date AND end_date';
    valuesPolygons.push(date);
  }

  try {
    const resultPoints = await pool.query(queryPoints, valuesPoints);
    const resultPolygons = await pool.query(queryPolygons, valuesPolygons);
    const combinedResults = resultPoints.rows.concat(resultPolygons.rows);
    res.json(combinedResults);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
