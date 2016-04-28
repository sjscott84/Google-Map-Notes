
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

app.get('/pageSetUp', function(request, response){
	var returnedGroups = [];
	var returnedTypes = [];
	var returnedData = {};

	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log(err);
		}else{
			var parsedData = JSON.parse(data);
			var place = parsedData.places;
			for(var i=0; i<place.length; i++){
				if(returnedGroups.indexOf(place[i]["group"]) === -1){
					returnedGroups.push(place[i]["group"]);
				}
				if(returnedTypes.indexOf(place[i]["type"]) === -1){
					returnedTypes.push(place[i]["type"]);
				}
			}
			returnedData.groups = returnedGroups;
			returnedData.types = returnedTypes;

			response.send(JSON.stringify(returnedData));
		}
	});
})

app.get('/readFile', function(request, response){

	var lat = request.query.lat;
	var lng = request.query.lng;
	var group = request.query.group;
	var type = request.query.type;
	var radius = request.query.distance;
	var returnedPlaces = [];

	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log(err);
		}else{
			var parsedData = JSON.parse(data);
			var minMax = findLocationsBasedOnRadius(lat, lng, radius);
			var place = parsedData.places;

			if(!group && !type){
				for(var i = 0; i<place.length; i++){
					if(place[i]["latitude"] > minMax.minLat && place[i]["latitude"] < minMax.maxLat && place[i]["longitude"] > minMax.minLng && place[i]["longitude"] < minMax.maxLng){
						//calculate distance from start point to saved location
						var resultDistance = calculateDistance(lat, place[i]["latitude"], lng, place[i]["longitude"]);
							if(resultDistance < radius){
								returnedPlaces.push(place[i]);
							}
						//returnedPlaces.push(parsedData.places[i]);
					}
				}
			}else if(group === "All" && type === "All"){
				for(var i = 0; i<place.length; i++){
					returnedPlaces.push(place[i]);
				}
			}else if(group && type === "All"){
				for(var i = 0; i<place.length; i++){
					if(place[i]["group"] === group){
						returnedPlaces.push(place[i]);
					}
				}
			}else if(group === "All" && type){
				for(var i = 0; i<place.length; i++){
					if(place[i]["type"] === type){
						returnedPlaces.push(place[i]);
					}
				}
			}else if(group && type){
				for(var i = 0; i<place.length; i++){
					if(place[i]["type"] === type && place[i]["group"] === group){
						returnedPlaces.push(place[i]);
					}
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

// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

//find nearby locations
function findLocationsBasedOnRadius(lat, lng, distance){
	var distance = distance;
	var lat = lat;
	var lng = lng;
	var radius = 6371;//radius at equater = 6378, at poles 6356
	var results = {};
	var latDegrees = Math.degrees(distance/radius);
	//console.log(lat, lng);
	//console.log(latDegrees);

	results.maxLat = (lat*1) + (latDegrees*1);//max
	results.minLat = lat - latDegrees;//min

	results.maxLng = (lng*1) + (Math.degrees(distance/radius/Math.cos(Math.radians(lat)))*1);//max
	results.minLng = lng - Math.degrees(distance/radius/Math.cos(Math.radians(lat)));//min

	return results;
}

//calculate distance from starting point to saved location
function calculateDistance (lat1, lat2, lng1, lng2){

	var lat1 = Math.radians(lat1);
	var lat2 = Math.radians(lat2);
	var lng1 = Math.radians(lng1);
	var lng2 = Math.radians(lng2);

	var distance = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng1 - lng2));

	//console.log(6371 * distance);
	return 6371 * distance;
}

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