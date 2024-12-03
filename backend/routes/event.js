// routes/events.js
const express = require('express');
const router = express.Router();
const Event = require('../models/event');

router.post('/', async (req, res) => {
    const event = new Event(req.body);
    await event.save();
    res.status(201).send(event);
});

router.get('/', async (req, res) => {
    const events = await Event.find();
    res.status(200).send(events);
});

module.exports = router;