const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const fetch = require('node-fetch'); // Node-fetch should be installed

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'nouveau_mot_de_passe',
  port: 5432,
});

// Route to the root
app.get('/', (req, res) => {
  res.send('Bienvenue sur le serveur backend de Locaround!');
});

// Event API
app.get('/events', async (req, res) => {
  const { category, location, date } = req.query;
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
  if (date) {
    values.push(date);
    query += ' AND date = $' + values.length;
  }

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
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

// Routing API (integrate with GraphHopper)
app.post('/route', async (req, res) => {
  const { start, end, mode } = req.body;
  try {
    let url = new URL('http://localhost:8989/route');
    url.searchParams.append('point', `${start.lat},${start.lng}`);
    url.searchParams.append('point', `${end.lat},${end.lng}`);
    url.searchParams.append('profile', mode);
    url.searchParams.append('geometries', 'polyline');

    const response = await fetch(url);
    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
