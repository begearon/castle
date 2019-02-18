'use strict';
const YEAR = 2019;
const LOAD_FUNCTIONS_TO_WAIT = 4;
const NOT_AVAILABLE_CONST = 99999;
const RESTAURANTS_PER_PAGE_MICHELIN = 10;
const fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let jsdom = require('jsdom').JSDOM;
var finishedCount = 0;
var starredNames = [];
var keysNames = [];
var keysImages = [];
var allDetails;

function overWriteFile(fileName, myText) {
	fs.writeFile(fileName, myText, (err) => { 
		if (err) throw err;
	});
}

function appendFile(fileName, myText) {
	fs.appendFile(fileName, myText, (err) => { 
		if (err) throw err;
	});
}     
	
var returnHtml = function() {
	var http = require('http');
	fs.readFile('./ui.html', function (err, html) {
		if (err) {
			throw err; 
		}  
		http.createServer(function(request, response) {  
			response.writeHeader(200, {"Content-Type": "text/html"});  
			response.write(html);  
			response.end();  
		}).listen(1337);
	});
	console.log('Server running at http://127.0.0.1:1337/');
	console.log('Open it in a browser and see the best offers for each weekend!');
}


function startFile() {
	fs.readFile('./ui3.html', function (err, html) {
		if (err) {
			throw err; 
		} 
		overWriteFile('ui.html', html);
	});
}

function endFile() {
	fs.readFile('./ui2.html', function (err, html) {
		if (err) {
			throw err; 
		} 
		fs.appendFile('ui.html', html, (err) => { 
			if (err) throw err;
			returnHtml();
		});
		
	});
}

class Weekend {
  constructor(startDay, startMonth, endDay, endMonth) {
    this._startDay = startDay;
    this._startMonth = startMonth;
    this._endDay = endDay;
    this._endMonth = endMonth;
	this._prices = [];
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
	  var myPrices = this._prices;
	  return Object.keys(myPrices).map(function(key) {return myPrices[key];}).reduce(function(last, next) {return last < next ? last : next;}, Infinity); 
  }
  get minPriceKey() {
	var min;
	var myPrices = this._prices;
	var myKeys = Object.keys(myPrices);
	  min = myKeys[0];
	for (var p = 0; p < myKeys.length; p++) {
		if(myPrices[myKeys[p]] < myPrices[min]) {
			min = myKeys[p];
		}    
	}
	return min;
  }
  printDate() {
	return '' + this._startDay + '/' + this._startMonth + " - " + this._endDay + '/' + this._endMonth;
  }
}


startFile();
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
				keysNames[allDetails[keys[i]].RC_CODE] = allDetails[keys[i]].RC_NOM_L;
				keysImages[allDetails[keys[i]].RC_CODE] = allDetails[keys[i]].img;
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
	console.log('There are '+ Object.keys(starredNames).length + " Michelin Starred Hotel-Restaurants in France.");
	getAvailability();
};

getStarredNames(1, 1, gotAllDetailsCb);
getStarredNames(1, 2, gotAllDetailsCb);
getStarredNames(1, 3, gotAllDetailsCb);
getRestaurantDetails(gotAllDetailsCb);


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

var gotAvailibilityDetails = function(keys, i, myObject) {
	if (myObject.readyState === 4) {
		var allAvailability = JSON.parse(myObject.responseText);
		var myArray = JSON.stringify(allAvailability['d'][7]).replace(/[^\d,]/g,'').split(",");;
		for(var k = 0; k < myArray.length; k++) {
			myArray[k] = parseInt(myArray[k]) || 0;
		}
		var j = 0;
		while (myArray[j] != weekends[0].startMonth || myArray[j+1] != weekends[0].startDay || myArray[j+6] != weekends[0].endMonth || myArray[j+7] != weekends[0].endDay) {
			j += 3;
		} //set the array to the first weekend's date
		for (var weekendIndex = 0; weekendIndex < weekends.length; weekendIndex++) {
			if(myArray[j+2] && myArray[j+5]) weekends[weekendIndex].setPrice(keys[i], myArray[j+2] + myArray[j+5]);
			else weekends[weekendIndex].setPrice(keys[i], NOT_AVAILABLE_CONST);
			j += 21;
		}
		finishedAvailabilityRequestCount++;
		console.log("Finished Availability Requests: " + finishedAvailabilityRequestCount);
		if(finishedAvailabilityRequestCount == availabilityRequestNumber) printResult();
	}
}

function printResult() {
	for (var weekendIndex = 0; weekendIndex < weekends.length; weekendIndex++) {
		appendFile('ui.html', '<div class="row"><div class="col-md-1">' + (weekendIndex+1) + '.</div><div class="col-md-2"><a href="' + keysImages[weekends[weekendIndex].minPriceKey] + '">image</a></div><div class="col-md-2">' + weekends[weekendIndex].printDate() + '</div><div class="col-md-2"></div><div class="col-md-3">' + keysNames[weekends[weekendIndex].minPriceKey] + '</div><div class="col-md-2">' + weekends[weekendIndex].minPrice + ' EUR</div></div>');
		console.log(weekends[weekendIndex].printDate() + ": " + weekends[weekendIndex].minPrice + "EUR is the minimum price. (at " + weekends[weekendIndex].minPriceKey) + ")";
	}
	endFile();
}

var finishedAvailabilityRequestCount = 0;
var availabilityRequestNumber = 0;

function getAvailability() {
	console.log("Get infos on prices and availability.");
	var keys = Object.keys(starredNames);
	var month = weekends[0].startMonth;
	var myUrl = "https://gc.synxis.com/services/XbeService.asmx/GetCalendarAvailability";
	var i = 0;
	availabilityRequestNumber = keys.length;
	for (i = 0; i < keys.length; i++) {
		var data = "{\"criteria\":{\"month\":" + month + ",\"numberOfMonths\":" + (13-month) + ",\"year\":" + 2019 + ",\"adults\":1,\"rooms\":1,\"nights\":2,\"hotelId\":" + starredNames[keys[i]] + ",\"primaryChannelId\":1,\"secondaryChannelId\":5,\"templateInstanceUniqueId\":\"be26fd50-2ea7-4c66-bbf6-f416abe74c6c\",\"calculatePricing\":2,\"currencyDisplayId\":5,\"restrictions\":\"MINLOS|MAXSTAY|NOARRIVE|NODEPART\",\"localCalId\":6853}}";
		var xhr = new XMLHttpRequest();
		const o = i;
		xhr.onreadystatechange = function() { gotAvailibilityDetails(keys, o, this);};
		
		xhr.open("POST", myUrl);
		xhr.setRequestHeader("Content-Type", "application/json; charset=utf8");
		xhr.setRequestHeader("cache-control", "no-cache");
		xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		xhr.send(data);	
	}
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