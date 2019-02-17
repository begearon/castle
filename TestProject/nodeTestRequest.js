'use strict';
TRIP_STAUTS_INITIATED: 1000;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let jsdom = require('jsdom').JSDOM;
var finishedCount = 0;
var starredNames = [];
var allDetails;

var gotAllDetailsCb = function() {
	console.log('Called back: '+ starredNames.length + " Michelin Restaurants and all of their details downloaded");
	for (var key in allDetails) {
		if (allDetails.hasOwnProperty(key)) {
			//console.log(i + ". " + allDetails[key].RC_CODE);
		}
	}
};

getStarredNames(1, 1, gotAllDetailsCb);
getStarredNames(1, 2, gotAllDetailsCb);
getStarredNames(1, 3, gotAllDetailsCb);
getRestaurantDetails(gotAllDetailsCb);

function getRestaurantDetails(gotAllDetailsCb) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			var allDetails = JSON.parse(this.responseText.substr(1));
			finishedCount++;
			if(finishedCount == 4) gotAllDetailsCb();
		}
	};
	var myUrl = "https://api.relaischateaux.com/dsGHsfg4/members";
	xhr.open("GET", myUrl);
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	xhr.send();
}



function getStarredNames(page, stars, gotAllDetailsCb) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			console.log("page:   " + page + "   star:    " + stars + "  arraylength:  " + starredNames.length + "  finished:  " + finishedCount);
			var realData = JSON.parse(this.responseText);
			let html = '' + realData["content"],
			dom = new jsdom(html),
			window = dom.window;
			var i = 0;
			while (window.document.querySelectorAll('a[data-name]')[i]) {
				starredNames.push(window.document.querySelectorAll('a[data-name]')[i].dataset['name']);
				i++;
			}
			if(i==10) getStarredNames(++page, stars, gotAllDetailsCb);
			else finishedCount++;
			if(finishedCount == 4) gotAllDetailsCb();
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