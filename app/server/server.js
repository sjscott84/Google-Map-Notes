
var fs = require('fs');
var file = './places.json';
var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');

//var parseUrlencoded = bodyParser.urlencoded({extended: false});
app.use(bodyParser.json());

app.use(cors());
app.options('*', cors());

app.get('/readFile', function(request, response){
	var group = request.query.group;
	var returnedPlaces = [];

	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log(err);
		}else{
			var parsedData = JSON.parse(data);
			console.log(parsedData);
			for(var i = 0; i<parsedData.places.length; i++){
				if(parsedData.places[i]["group"] === group){
					returnedPlaces.push(parsedData.places[i]);
				}
			}
			response.send(JSON.stringify(returnedPlaces));
		}
	});
});

app.post('/writeFile', function(request, response){

	fs.stat(file, function(err, stats){
		if(err){
			console.log(err);
		}else{
			fs.readFile(file, function(err, data){
				if(err){
					console.log(err);
				}else{
					var parseJson = JSON.parse(data);
					parseJson.places.push(request.body);

					fs.writeFile(file, JSON.stringify(parseJson), function(err){
						if(err){
							console.log(err);
						}else{
							response.send("New place saved");
						}
					});
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