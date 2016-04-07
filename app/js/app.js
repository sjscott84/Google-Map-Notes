'use strict';

var map,
	view,
	marker,
	infoWindow,
	testData,
	mapLoaded = false,
	placeObject = {},
	startPoint = {lat:37.773972, lng: -122.431297};
	//jsonTest = require("./places.json");

/**
 * Add google maps to screen
*/
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: startPoint,
		zoom: 12
	});
	view.addSearch();
	map.controls[google.maps.ControlPosition.LEFT_TOP].push(inputBox);
	mapLoaded = true;
}

/**
 * Error if map does not load
 */
function onLoadError(){
	alert("Google is currently unavaliable, please try again later");
}

var Place = function (){
	var self = this;
}

var ViewModel = function(){
	var self = this,
		searchBox;

	self.placeNote = ko.observable("");
	self.showOverlay = ko.observable(false);
	self.placeName = ko.observable("");
	self.placeGroup = ko.observable("");
	self.placeType = ko.observable("");

	self.addSearch = function (){
		// Create the search box and link it to the UI element.
		var input = document.getElementById('pac-input');
		searchBox = new google.maps.places.SearchBox(input);
		var bounds = new google.maps.LatLngBounds();
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

		//Bias the SearchBox results towards current map's viewport.
		map.addListener('bounds_changed', function() {
			searchBox.setBounds(map.getBounds());
		});

		//directionsDisplay = new google.maps.DirectionsRenderer();
		//directionsService = new google.maps.DirectionsService();

		// Listen for the event fired when the user selects a prediction,
		// removes any existing search history and
		// retrieves more details for that place.
		searchBox.addListener('places_changed', function() {
			var places = searchBox.getPlaces();

			if (places.length === 0) {
				return;
			}

			// Close open infoWindows
			if(infoWindow){
				infoWindow.close();
			}

			// Clear out the old marker
			if(marker){
				marker.setMap(null);
			}

			// For each place, get the icon, name and location.
			var bounds = new google.maps.LatLngBounds();
			places.forEach(function(place) {

			// Create a marker for each place.
				marker = new google.maps.Marker({
					map: map,
					title: place.name,
					position: place.geometry.location
				});

				google.maps.event.addListener(marker, 'click', function() {
					console.log('click');
					self.addInfoWindow(place.name, place.formatted_address);
				});

				if (place.geometry.viewport) {
				// Only geocodes have viewport.
					bounds.union(place.geometry.viewport);
				} else {
					bounds.extend(place.geometry.location);
				}

				map.setCenter(place.geometry.location);
				map.fitBounds(bounds);
				placeObject = {"group": undefined, "name": place.name, "address":place.formatted_address, "location":place.geometry.location, "type": undefined, "notes": undefined};
			});

		});
	};

	self.addInfoWindow = function(name, address){

		var contents = '<b>'+name+'</b><br>'+address+'<br><span><button type="button" onclick="view.saveThisPlace()">Save Place</button><button type="button" onclick="view.removeThisPlace()">Remove Place</button></span>';

		if(infoWindow){
			infoWindow.close();
		}

		infoWindow = new google.maps.InfoWindow({
			content: contents
		});

		infoWindow.open(map, marker);

	};

	self.saveThisPlace = function(){
		infoWindow.close();
		self.showOverlay(true);
		self.placeName(marker.title);
	};

	self.removeThisPlace = function(){
		infoWindow.close();
		marker.setMap(null);
	}

	self.savePlace = function(){
		placeObject.group = self.placeGroup();
		placeObject.type = self.placeType();
		placeObject.notes = self.placeNote();
		console.log(placeObject);
		self.readFile();
	}

	self.dontSavePlace = function(){
		placeObject = {};
		self.showOverlay(false);
		self.removeThisPlace();
	}

	self.readFile = function(){
		$.ajax({
			type:'GET',
			url: 'http://localhost:3000/readFile',
		}).done(function(data){
			//console.log(data);
			testData = data;
			console.log("this is you data: "+testData);
		})
	}
};

view = new ViewModel();
ko.applyBindings(view);