'use strict';
var request = require('request');

var url = 'https://api.relaischateaux.com/dsGHsfg4/members?id=70987';
//'https://api.relaischateaux.com/dsGHsfg4/members?id=70987'
request.get({
    url: url,
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.log('Error:', err);
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode);
    } else {
		var realData = JSON.parse(data.substr(1));
      // data is already parsed as JSON:
       console.log(realData["70987"].RC_ACCROCHE);
    }
});