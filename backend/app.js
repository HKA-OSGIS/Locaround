const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'osm_data',
  password: 'nouveau_mot_de_passe',
  port: 5432,
});

// Route to the root
app.get('/', (req, res) => {
  res.send('Bienvenue sur le serveur backend de Locaround!');
});

// Event API
app.get('/events', async (req, res) => {
  const { category, location, start_date, end_date } = req.query;
  let query = 'SELECT * FROM events WHERE 1=1';
  const values = [];

  if (category) {
    values.push(category);
    query += ' AND category = $' + values.length;
  }
  if (location) {
    values.push(location);
    query += ' AND location = $' + values.length;
  }
  if (start_date) {
    values.push(start_date);
    query += ' AND start_date = $' + values.length;
  }
  if (end_date) {
    values.push(end_date);
    query += ' AND end_date = $' + values.length;
  }

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Places API
app.get('/places', async (req, res) => {
  const { type, location } = req.query;
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
    queryPoints += ' AND "addr:housenumber" = $' + (valuesPoints.length + 1);
    valuesPoints.push(location);
    queryPolygons += ' AND "addr:housenumber" = $' + (valuesPolygons.length + 1);
    valuesPolygons.push(location);
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

// Recommendation API (placeholder)
app.get('/recommendations', async (req, res) => {
  // Implement recommendation logic here
  res.json([]);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
