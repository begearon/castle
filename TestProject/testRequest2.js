'use strict';
var request = require('request');

var url = 'https://datacollect6.abtasty.com/datacollectHeatmap.php?chID=b1c272a56a97afd57909497a04d785ed&cookie=19021713164411462*118878.166572*179024.247045*201390.276412&tests=118878,179024,201390&variations=166572,247045,276412&x=74&y=7632&w=277&element=div%23landing-page-results%3Ediv%3Anth-of-type(1)%3Eul%3Anth-of-type(1)%3Eli%3Anth-of-type(2)%3Ea%3Anth-of-type(1)&url=https%3A%2F%2Fwww.relaischateaux.com%2Ffr%2Flp%2Fnos-chefs-3-etoiles-michelin&timestamp=1550421356749';
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
		//var realData = JSON.parse(data.substr(1));
      // data is already parsed as JSON:
       console.log(data);
    }
});