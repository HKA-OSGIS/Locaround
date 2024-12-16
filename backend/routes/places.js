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
  const { type, location, role, group, date } = req.query;
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
        queryPoints += ' AND tourism = $' + (valuesPoints.length + 1);
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
      // Add more cases as needed
      default:
        return res.status(400).send('Invalid type');
    }
  }

  // Filter by location
  if (location) {
    const locations = location.split(',');
    if (locations.includes('outdoor')) {
      queryPoints += ' AND indoor = false';
      queryPolygons += ' AND indoor = false';
    }
    if (locations.includes('indoor')) {
      queryPoints += ' AND indoor = true';
      queryPolygons += ' AND indoor = true';
    }
  }

  // Filter by role
  if (role) {
    const roles = role.split(',');
    if (roles.includes('spectator')) {
      queryPoints += ' AND spectator = true';
      queryPolygons += ' AND spectator = true';
    }
    if (roles.includes('actor')) {
      queryPoints += ' AND actor = true';
      queryPolygons += ' AND actor = true';
    }
  }

  // Filter by group
  if (group) {
    const groups = group.split(',');
    if (groups.includes('solo')) {
      queryPoints += ' AND solo = true';
      queryPolygons += ' AND solo = true';
    }
    if (groups.includes('group')) {
      queryPoints += ' AND "group" = true';
      queryPolygons += ' AND "group" = true';
    }
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
