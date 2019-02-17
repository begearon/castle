'use strict';
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let jsdom = require('jsdom').JSDOM;
var finishedCount = 0;
var starredNames = [];
var allDetails;
// getStarredNames(1,1);
// getStarredNames(1,2);
// getStarredNames(1,3);
getRestaurantDetails();

function getRestaurantDetails() {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			var allDetails = JSON.parse(this.responseText.substr(1));
			var i = 1;
			for (var key in allDetails) {
				if (allDetails.hasOwnProperty(key)) {
					console.log(i + ". " + allDetails[key].RC_CODE);
					i++;
				}
			}
		}
	};
	var myUrl = "https://api.relaischateaux.com/dsGHsfg4/members";
	xhr.open("GET", myUrl);
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	xhr.send();
}


function getStarredNames(page, stars) {
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