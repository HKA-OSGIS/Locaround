// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: String,
    preferences: {
        categories: [String],
        location: String,
        dateRange: {
            startDate: String,
            endDate: String
        }
    }
});

module.exports = mongoose.model('User', userSchema);