import Parse from './parse'
import express from 'express';
import bodyParser from 'body-parser';

let app = express();
app.set('port', process.env.PORT || 8000);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(cookieParser('foobarbazqux'));

app.use(express.static('public'));

module.exports = {app, express, Parse};
