const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const recommendationRoutes = require('./routes/recommendations');
const routeRoutes = require('./routes/routes');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/routes', routeRoutes);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eventmap', { useNewUrlParser: true, useUnifiedTopology: true });

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});