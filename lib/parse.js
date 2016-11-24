import config from 'config';
import Parse from 'parse/node'

const PARSE_APP_ID = (process.env.PARSE_APP_ID) ? (process.env.PARSE_APP_ID) : config.get('PARSE_APP_ID');
const PARSE_SERVER_URL = (process.env.PARSE_SERVER_URL) ? (process.env.PARSE_SERVER_URL) : config.get('PARSE_SERVER_URL');

Parse.initialize(PARSE_APP_ID);
Parse.serverURL = PARSE_SERVER_URL;
global.Parse = Parse;


module.exports = {Parse};
