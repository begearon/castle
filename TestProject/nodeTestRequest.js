'use strict';
const YEAR = 2019;
const LOAD_FUNCTIONS_TO_WAIT = 4;
const RESTAURANTS_PER_PAGE_MICHELIN = 10;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let jsdom = require('jsdom').JSDOM;
var finishedCount = 0;
var starredNames = [];
var allDetails;

class Weekend {
  constructor(startDay, startMonth, endDay, endMonth) {
    this._startDay = startDay;
    this._startMonth = startMonth;
    this._endDay = endDay;
    this._endMonth = endMonth;
  }
  set startMonth(m) {
    this._startMonth = m;
  }
  get startMonth() {
    return this._startMonth;
  }
  set endMonth(m) {
    this._endMonth = m;
  }
  get endMonth() {
    return this._endMonth;
  }
  set startDay(d) {
    this._startDay = d;
  }
  get startDay() {
    return this._startDay;
  }
  set endDay(d) {
    this._endDay = d;
  }
  get endDay() {
    return this._endDay;
  }
  setPrice(restaurant, price) {
	  this._prices[restaurant] = price;
  }
  getPrice(restaurant) {
	  return this._prices[restaurant];
  }
  get minPrice() {
	  return Object.keys(_prices).map(function(key) {return _prices[key];}).reduce(function(last, next) {return last < next ? last : next;}, Infinity); 
  }
  printDate() {
    console.log('' + this.startDay + '/' + this.startMonth + " - " + this.endDay + '/' + this.endMonth);
  }
}

var weekends = [];
setWeekends();

function setWeekends() {
	var today = new Date();
	var date = new Date();
	while (date.getDay() != 5) {
		date.setDate(date.getDate() + 1);
	}
	date.setDate(date.getDate() + 2);
	while (date.getFullYear() == today.getFullYear()) {
		var friday = new Date();
		friday.setDate(date.getDate() - 2);
		var startMonth = friday.getMonth() + 1;
		var startDay = friday.getDate();
		var endMonth = date.getMonth() + 1;
		var endDay = date.getDate();
		weekends.push(new Weekend(startDay, startMonth, endDay, endMonth));
		date.setDate(date.getDate() + 7);
	}
}

var gotAllDetailsCb = function() {
	console.log('Called back: '+ Object.keys(starredNames).length + " Michelin Restaurants and all of their details downloaded.");
	var keys = Object.keys(allDetails);
	for (var i = 0; i < keys.length; i++) {
		if(starredNames[allDetails[keys[i]].RC_CODE]) {
			if(allDetails[keys[i]].countryName == "France" && starredNames[allDetails[keys[i]].RC_HOTEL] != "0") {
				starredNames[allDetails[keys[i]].RC_CODE] = keys[i];
				console.log(allDetails[keys[i]].RC_CODE + "     " + keys[i]);
			} else {
				delete starredNames[allDetails[keys[i]].RC_CODE];
			}
		}
	}
	keys = Object.keys(starredNames);
	for (var i = 0; i < keys.length; i++) { //deleting all the restaurants, who are not in the members list
		if(starredNames[keys[i]] < 0) delete starredNames[keys[i]];
	}
	console.log('There are '+ Object.keys(starredNames).length + " Michelin Starred Hotel-Restaurants in France: " + Object.keys(starredNames));
};

// getStarredNames(1, 1, gotAllDetailsCb);
// getStarredNames(1, 2, gotAllDetailsCb);
// getStarredNames(1, 3, gotAllDetailsCb);
// getRestaurantDetails(gotAllDetailsCb);
getAvailability();


function getRestaurantDetails(gotAllDetailsCb) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			allDetails = JSON.parse(this.responseText.substr(1));
			//console.log(allDetails);
			finishedCount++;
			if(finishedCount == LOAD_FUNCTIONS_TO_WAIT) gotAllDetailsCb();
		}
	};
	var myUrl = "https://api.relaischateaux.com/dsGHsfg4/members";
	xhr.open("GET", myUrl);
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	xhr.send();
}

function getAvailability() {
	var month = weekends[0].startMonth;
	var data = "{\"criteria\":{\"month\":" + month + ",\"numberOfMonths\":" + (13-month) + ",\"year\":" + 2019 + ",\"adults\":1,\"rooms\":1,\"nights\":2,\"hotelId\":56232,\"primaryChannelId\":1,\"secondaryChannelId\":5,\"templateInstanceUniqueId\":\"be26fd50-2ea7-4c66-bbf6-f416abe74c6c\",\"calculatePricing\":2,\"currencyDisplayId\":5,\"restrictions\":\"MINLOS|MAXSTAY|NOARRIVE|NODEPART\",\"localCalId\":6853}}";	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			var allAvailability = JSON.parse(this.responseText.substr(0));
			console.log(allAvailability['d'][7]);
		}
	};
	var myUrl = "https://gc.synxis.com/services/XbeService.asmx/GetCalendarAvailability";
	xhr.open("POST", myUrl);
	xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	xhr.send(data);
}



function getStarredNames(page, stars, gotAllDetailsCb) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			try {
				var realData = JSON.parse(this.responseText);
			} catch(err) {
				console.log(err.message + " (page: " + ", stars: " + stars + ")");
				getStarredNames(page, stars, gotAllDetailsCb);
				return;
			}
			let html = '' + realData["content"],
			dom = new jsdom(html),
			window = dom.window;
			var i = 0;
			while (window.document.querySelectorAll('a[data-name]')[i]) {
				starredNames[window.document.querySelectorAll('a[data-name]')[i].dataset['name']] = -1;
				i++;
			}
			console.log("page:   " + page + "   star:    " + stars + "  arraylength:  " + Object.keys(starredNames).length + "  finished:  " + finishedCount);
			if(i == RESTAURANTS_PER_PAGE_MICHELIN) getStarredNames(++page, stars, gotAllDetailsCb);
			else finishedCount++;
			if(finishedCount == LOAD_FUNCTIONS_TO_WAIT) gotAllDetailsCb();
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