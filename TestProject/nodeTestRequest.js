'use strict';
const LOAD_FUNCTIONS_TO_WAIT = 4;
const RESTAURANTS_PER_PAGE_MICHELIN = 10;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let jsdom = require('jsdom').JSDOM;
var finishedCount = 0;
var starredNames = [];
var allDetails;

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
	var data = "{\"criteria\":{\"year\":2019,\"month\":2,\"adults\":1,\"children\":0,\"childrenAges\":\"\",\"rooms\":1,\"corporatePromotionCode\":\"\",\"travelIndustryCode\":\"\",\"numberOfMonths\":2,\"nights\":1,\"hotelId\":56232,\"hotelGroupId\":8565,\"hotelGuid\":\"8ccb1747-7330-437b-81ea-28f286ce894a\",\"hotelGroupGuid\":\"e2be85e3-0f9c-48af-bcaf-64f6222d17d0\",\"primaryChannelId\":1,\"secondaryChannelId\":5,\"customerUniqueId\":\"00000000-0000-0000-0000-000000000000\",\"BookerUniqueId\":\"00000000-0000-0000-0000-000000000000\",\"templateInstanceUniqueId\":\"be26fd50-2ea7-4c66-bbf6-f416abe74c6c\",\"roomTypeFilterCodes\":\"\",\"isRequireFilter\":false,\"includeUnassignedRatesInRateFilters\":false,\"hideAssignedRatesOnEmptyFilter\":false,\"requestedNewRates\":\"\",\"userLocationCode\":\"\",\"arrivalTicks\":636859584000000000,\"departureTicks\":636860448000000000,\"calculatePricing\":2,\"includeTaxesInPricingCalculation\":false,\"showPriceAmount\":-1,\"calendarRate\":\"\",\"currencyDisplayId\":5,\"restrictions\":\"MINLOS|MAXSTAY|NOARRIVE|NODEPART\",\"losUsedByCalendar\":2,\"membershipLevel\":\"\",\"certificates\":\"\",\"confirmNumber\":\"\",\"isSoaEnabled\":\"\",\"dayCellStyleSuffix\":\"\",\"highlightWeekendsAndHolidays\":false,\"weekendDefinition\":0,\"forceDisplayPricing\":false,\"localCalId\":6853}}";
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			var allAvailability = JSON.parse(this.responseText.substr(0));
			console.log(allAvailability);
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