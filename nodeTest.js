var http = require("http");
var https = require('https');

http.createServer(function (request, response) {
   // Send the HTTP header 
   // HTTP Status: 200 : OK
   // Content Type: text/plain
   var myCallback = function(data) {
	  response.end(data.userDetail);
	};

	var usingItNow = function(callback) {
	  callback('get it?');
	};
   
   
   response.writeHead(200, {'Content-Type': 'text/plain'});
   getLoginDetails(myCallback);
   
}).listen(8081);

// Console will print the message
console.log('Server running at http://127.0.0.1:8081/');

function getLoginDetails(callback) {
return https.get({
        host: 'api.relaischateaux.com',
        path: '/dsGHsfg4/members?id=70987'
    }, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
		
        response.on('end', function() {
// Data received, let us parse it using JSON!
            var parsed = JSON.parse(body);
			//console.log(parsed.RC_ACCROCHE);
            callback({
                userDetail: parsed.RC_ACCROCHE,
                userId: parsed.PA_ID
            });
			//callback(body);
        });
    });
}