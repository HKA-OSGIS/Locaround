// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
});

router.get('/', async (req, res) => {
    const users = await User.find();
    res.status(200).send(users);
});

module.exports = router;