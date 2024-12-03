// event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: String,
    category: String,
    location: String,
    date: String,
    coordinates: {
        lat: Number,
        lon: Number
    }
});

module.exports = mongoose.model('Event', eventSchema);