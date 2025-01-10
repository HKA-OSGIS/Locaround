const axios = require('axios');
const { Pool } = require('pg');

const API_KEY = '1a7cd40555efc2cffff7ce3778bfe016';
const API_URL = 'https://v3.football.api-sports.io/fixtures';

// Configuration database connexions
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'osm_data',
  password: 'nouveau_mot_de_passe',
  port: 5432,
});

async function fetchFootballEvents() {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      },
      params: {
        league: 39, // Premier League
        season: 2023,
        next: 10 // Nombre de matchs à venir
      }
    });

    const events = response.data.response;

    for (const event of events) {
      const { fixture_id, homeTeam, awayTeam, date } = event;
      const query = 'INSERT INTO football_events (id, home_team, away_team, date) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING';
      const values = [fixture_id, homeTeam.name, awayTeam.name, date];

      await pool.query(query, values);
    }

    console.log('Football events imported successfully');
  } catch (error) {
    console.error('Error fetching football events:', error);
  }
}

fetchFootballEvents();
