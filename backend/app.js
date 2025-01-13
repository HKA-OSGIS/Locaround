const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const placesRouter = require('./routes/places');
const eventsRouter = require('./routes/events');
const fetchFootballEvents = require('./scripts/fetchFootballEvents');
const fetchRugbyEvents = require('./scripts/fetchRugbyEvents');

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
app.use('/events', eventsRouter);

// Places API
app.use('/places', placesRouter);

// Recommendation API (placeholder)
app.get('/recommendations', async (req, res) => {
  // Implement recommendation logic here
  res.json([]);
});

// Fetch events periodically
setInterval(async () => {
  await fetchFootballEvents();
  await fetchRugbyEvents();
}, 3600000); // Every hour

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
