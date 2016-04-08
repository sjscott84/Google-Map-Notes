
var fs = require('fs');
var file = './places.json';
var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');
//var parseUrlencoded = bodyParser.urlencoded({extended: false});
var jsonParser = bodyParser.json();

app.use(cors());
app.options('*', cors());

app.get('/readFile', function(request, response){
	//response.send("Connected");

	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log(err);
		}else{
			response.send(data);
		}
	});
});

app.post('/writeFile', jsonParser, function(request, response){

	fs.stat(file, function(err, stats){
		if(err){
			console.log(err);
		}else{
			fs.appendFile(file, request.body, function(err){
				if(err){
					console.log(err);
				}else{
					//console.log("saved "+request.body);
					response.send(request.body);
				}
			});
		}
	});

});

app.listen(3000);

console.log("eveything is set up and waiting for you");

// find file testfile.txt does it exist

/*fs.stat(test, function(err, stats){
	var fileExists = false;//.....
	if(err){
		console.log(err);
	}else{
		fileExists = true;
		console.log("file exists = " + fileExists);
	}
});

fs.readFile(test, 'utf8', function(err, data){
	if(err){
		console.log(err);
	}else{
		console.log(data);
	}
});

fs.writeFile(test, "you're wonderful", function(err){
	if(err){
		console.log(err);
	}else{
		console.log("saved");
	}
});

fs.readFile(test, 'utf8', function(err, data){
	if(err){
		console.log(err);
	}else{
		console.log(data);
	}
});
*/