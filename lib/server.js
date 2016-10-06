import config from 'config';
import Parse from 'parse/node'
import express from 'express';
import path from 'path';
const PARSE_APP_ID = (process.env.PARSE_APP_ID) ? (process.env.PARSE_APP_ID) : config.get('PARSE_APP_ID');

const PARSE_SERVER_URL = (process.env.PARSE_SERVER_URL) ? (process.env.PARSE_SERVER_URL) : config.get('PARSE_SERVER_URL');

Parse.initialize(PARSE_APP_ID);
Parse.serverURL = PARSE_SERVER_URL;
global.Parse = Parse;

var app = express();
app.set('port', process.env.PORT || 8000);
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/creditcard', function(req, res) {
    res.sendFile(path.join(__dirname+'/views/index.html'));
});

module.exports = {app, Parse};
