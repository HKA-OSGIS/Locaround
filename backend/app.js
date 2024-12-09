const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const axios = require('axios');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

//Configuration of PostgreSQL database
const pool = new Pool({
    user: 'postgres',                 // Nom d'utilisateur de la base de données
    host: 'localhost',                // Adresse du serveur de base de données
    database: 'postgres',                // Nom de la base de données
    password: 'nouveau_mot_de_passe',
    port: 5432,
});

// Routes
app.get('/', (req, res) => {
    res.send('API is running');
});

// Exemple of route for events
app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// Exemple de route pour le routage
app.get('/api/routes', async (req, res) => {
    const { start, end } = req.query;
    const url = `http://localhost:5000/route/v1/driving/${start};${end}?overview=false&geometries=geojson`;

    try {
        const response = await axios.get(url);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).send('Error fetching route');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
