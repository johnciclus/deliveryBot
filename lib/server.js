import express from 'express';

var app = express();
app.set('port', process.env.PORT || 8000);
app.set('view engine', 'ejs');
app.use(express.static('public'));

module.exports = app;
