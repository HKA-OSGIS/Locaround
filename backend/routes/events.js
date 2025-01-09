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

// Route to get football events
router.get('/football', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM football_events');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to get rugby events
router.get('/rugby', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rugby_events');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
