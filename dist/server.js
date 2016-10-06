'use strict';

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _node = require('parse/node');

var _node2 = _interopRequireDefault(_node);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PARSE_APP_ID = process.env.PARSE_APP_ID ? process.env.PARSE_APP_ID : _config2.default.get('PARSE_APP_ID');

var PARSE_SERVER_URL = process.env.PARSE_SERVER_URL ? process.env.PARSE_SERVER_URL : _config2.default.get('PARSE_SERVER_URL');

_node2.default.initialize(PARSE_APP_ID);
_node2.default.serverURL = PARSE_SERVER_URL;
global.Parse = _node2.default;

var app = (0, _express2.default)();
app.set('port', process.env.PORT || 8000);
app.set('view engine', 'ejs');
app.use(_express2.default.static('public'));

app.get('/creditcard', function (req, res) {
    res.sendFile(_path2.default.join(__dirname + '/views/index.html'));
});

module.exports = { app: app, Parse: _node2.default };