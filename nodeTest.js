'use strict';
const fs = require('fs');
var http = require('http');
fs.readFile('./myDatas.txt', function (err, txt) {
    if (err) {
        throw err; 
    }       
    http.createServer(function(request, response) {  
        response.writeHeader(200, {"Content-Type": "text/html"});  
        response.write(txt);  
        response.end();  
    }).listen(1338);
});