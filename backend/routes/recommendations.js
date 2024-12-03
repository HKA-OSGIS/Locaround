// routes/recommendations.js
const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const User = require('../models/user');

router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    const user = await User.findOne({ userId });
    if (!user) {
        return res.status(404).send('User not found');
    }

    const { categories, location, dateRange } = user.preferences;
    let filteredEvents = await Event.find();

    if (categories) {
        filteredEvents = filteredEvents.filter(event => categories.includes(event.category));
    }

    if (location) {
        filteredEvents = filteredEvents.filter(event => event.location === location);
    }

    if (dateRange) {
        filteredEvents = filteredEvents.filter(event =>
            event.date >= dateRange.startDate && event.date <= dateRange.endDate
        );
    }

    res.status(200).send(filteredEvents);
});

module.exports = router;