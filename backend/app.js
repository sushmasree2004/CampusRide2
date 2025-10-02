const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());
require('./config/passport')(passport);

// routes
app.use('/auth', require('./routes/auth'));
app.use('/rides', require('./routes/rides'));
app.use('/users', require('./routes/users'));
app.use('/chat', require('./routes/chat'));

app.get('/', (req, res) => res.send('CampusRide API'));

module.exports = app;
