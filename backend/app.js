const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const placesRouter = require('./routes/places');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

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
  const { category, location, start_date, end_date, date } = req.query;
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
  if (date) {
    values.push(date);
    query += ' AND $' + values.length + ' BETWEEN start_date AND end_date';
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
app.use('/places', placesRouter);

// Recommendation API (placeholder)
app.get('/recommendations', async (req, res) => {
  // Implement recommendation logic here
  res.json([]);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
