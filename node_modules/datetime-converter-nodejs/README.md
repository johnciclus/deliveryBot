# datetime-converter-nodejs
npm package that converts between normal datetime to iso datetime format.

# INSTALL:

```bash
$ npm install datetime-converter-nodejs
```

# USAGE:

## simple functions

```js
var DateTime = require('datetime-converter-nodejs');
var time1 = 'Sat May 16 2015 16:30:13 GMT+0530 (IST)'
var time2 = 'Sat May 16 2015 15:30:13 GMT+0530 (IST)';
var isoTime1 = '2015-05-16T11:28:00.322Z';
var isoTime2 =  '2015-05-16T11:26:00.322Z';

console.log(DateTime.timeDiff(time1, time2));				// 3600
console.log(DateTime.isoTimeDiff(isoTime1, isoTime2));		// 120
console.log(DateTime.isoString(time1));						// 2015-05-16T11:00:13.000Z
console.log(DateTime.dateString(isoTime1))					// Sat May 16 2015 16:58:00 GMT+0530 (IST)
```
