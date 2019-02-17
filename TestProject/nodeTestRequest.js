'use strict';
var request = require('request');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let jsdom = require('jsdom').JSDOM;
var finishedCount = 0;
var starredNames = [];
getStarredNames(1,1);
getStarredNames(1,2);
getStarredNames(1,3);

//var $ = jQuery = require('jquery')(window);
/*
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
});*/
function getStarredNames(page, stars) {
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
	if (this.readyState === 4) {
			console.log("page:   " + page + "   star:    " + stars + "  arraylength:  " + starredNames.length + "  finished:  " + finishedCount);
			var realData = JSON.parse(this.responseText);
			let html = '' + realData["content"],
			 
			// get the dom by calling the jsdom constructor, and giving it the html
			dom = new jsdom(html),
			 
			// get the window object @ dom.window
			window = dom.window;
			 
			// now just do whatever, just like in the browser $("a[data-name]")
			//el = window.document.querySelectorAll('a[data-name]')[0].attributes;
			 
			//console.log(window.document.querySelectorAll('a[data-name]')[0].attributes); 
			
		var i = 0;
		while (window.document.querySelectorAll('a[data-name]')[i]) {
			starredNames.push(window.document.querySelectorAll('a[data-name]')[i].dataset['name']);
			i++;
		}
		if(i==10) getStarredNames(++page, stars);
		else finishedCount++;
		if(finishedCount == 3) console.log(starredNames);
	}
};
var myUrl;
if(stars == 1) {
	myUrl = "https://www.relaischateaux.com/fr/lp/filters/nos-chefs-1-etoile-michelin?page=";
} else {
	myUrl = "https://www.relaischateaux.com/fr/lp/filters/nos-chefs-" + stars + "-etoiles-michelin?page=";	
}
xhr.open("POST", myUrl + page);
xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
xhr.send();
}

/*request.post({url:'https://www.relaischateaux.com/fr/lp/filters/nos-chefs-3-etoiles-michelin', 
form: {page: 2}}, function(err,httpResponse,body){ 
	if (err) {
      console.log('Error:', err);
    } else if (httpResponse.statusCode !== 200) {
      console.log('Status:', httpResponse.statusCode);
    } else {
		//var realData = JSON.parse(data.substr(1));
      // data is already parsed as JSON:
       console.log(body);
    } 
})*/
/*
var url2 = 'https://www.relaischateaux.com/fr/lp/filters/nos-chefs-3-etoiles-michelin';
//'https://api.relaischateaux.com/dsGHsfg4/members?id=70987'
request.post({
    url: url2,
    json: false,
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
});*/