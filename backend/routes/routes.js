// routes/routes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    const { start, end } = req.query;
    const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start};${end}?overview=false&geometries=polyline&steps=true`;

    try {
        const response = await axios.get(url);
        res.status(200).send(response.data);
    } catch (error) {
        res.status(500).send('Error fetching route');
    }
});

module.exports = router;