'use strict';

var map,
	view,
	marker,
	infoWindow,
	testData,
	mapLoaded = false,
	placeObject = {},
	startPoint = {lat: 37.773972, lng: -122.431297};
	//jsonTest = require("./places.json");

/**
 * Add google maps to screen
*/
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: startPoint,
		zoom: 12,
		disableDefaultUI: true
	});
	view.addSearch();
	//map.controls[google.maps.ControlPosition.LEFT_TOP].push(searchOrRetrieve);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(menu);
	map.controls[google.maps.ControlPosition.LEFT_CENTER].push(menuList);
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(inputBox);
	map.controls[google.maps.ControlPosition.LEFT_TOP].push(getSavedGroup);
	map.controls[google.maps.ControlPosition.LEFT_TOP].push(getSavedType);
	//map.controls[google.maps.ControlPosition.TOP_LEFT].push(seeSavedPlaces);
	//map.controls[google.maps.ControlPosition.TOP_LEFT].push(removeSavedPlaces);

	mapLoaded = true;

	// Try HTML5 geolocation.
	if (navigator.geolocation) {

		navigator.geolocation.getCurrentPosition(function(position) {
			var pos = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};

			var locationMarker = new google.maps.Marker({
				map: map,
				title: "Your Location",
				icon: 'images/star_blue_16.png',
				position: pos,
				zoomOnClick: false
			});

			map.setCenter(pos);

		}, function() {
			alert("Geolocation is currently unavaliable");

			var locationMarker = new google.maps.Marker({
				map: map,
				title: "Starting Location",
				icon: 'images/star_blue_16.png',
				position: startPoint,
				zoomOnClick: false
			});
		});
	} else {
		// Browser doesn't support Geolocation
		alert("Geolocation is currently unavaliable");
	}

	view.readFileByRadius(startPoint.lat, startPoint.lng, 2, view.readFileCallBack);
}

/**
 * Error if map does not load
 */
function onLoadError(){
	alert("Google is currently unavaliable, please try again later");
}

var Place = function (name, position, lat, lng, type, note, address){
	var self = this;
	self.map = map;
	self.name = name;
	self.lat = lat;
	self.lng = lng;
	self.type = type;
	self.note = note;
	self.address = address;
	self.position = {"lat":self.lat, "lng":self.lng};
	self.marker = new google.maps.Marker({
		map: map,
		title: name,
		icon: 'images/star_gold_16.png',
		position: self.position,
		zoomOnClick: false,
	});
	google.maps.event.addListener(this.marker, 'click', function() {
		view.addInfoWindow(self.name, self.address, self.type, self.note, self.marker);
		//view.setPlace(self);
	});
};

var ViewModel = function(){
	var self = this,
		searchBox,
		input = document.getElementById('pac-input'),
		menu = document.getElementById('menu');

	self.placeNote = ko.observable("");
	self.showOverlay = ko.observable(false);
	self.showSavedGroupOverlay = ko.observable(false);
	self.showSavedTypeOverlay = ko.observable(false);
	//self.showOptions = ko.observable(true);
	self.saveButton = ko.observable(true);
	self.removeButton = ko.observable(false);
	self.placeName = ko.observable("");
	self.placeGroup = ko.observable("");
	self.placeType = ko.observable("");
	self.getGroup = ko.observable("");
	self.getType = ko.observable("");
	self.listView = ko.observableArray([]);
	self.showMenuList = ko.observable(false);

	self.addSearch = function (){
		// Create the search box and link it to the UI element.
		//var input = document.getElementById('pac-input');
		searchBox = new google.maps.places.SearchBox(input);
		var bounds = new google.maps.LatLngBounds();
		map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

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
					self.addInfoWindow(place.name, place.formatted_address, 'type', 'note', marker);
				});

				if (place.geometry.viewport) {
				// Only geocodes have viewport.
					bounds.union(place.geometry.viewport);
				} else {
					bounds.extend(place.geometry.location);
				}

				map.setCenter(place.geometry.location);
				map.fitBounds(bounds);
				placeObject = {"group": undefined, "name": place.name, "address":place.formatted_address, "location":place.geometry.location, "latitude":place.geometry.location.lat(), "longitude":place.geometry.location.lng(), "type": undefined, "notes": undefined};
			});

		});
	};

	self.addInfoWindow = function(name, address, type, note, marker){

		var nameExists = false;
		var contents;

		view.listView().forEach(function(place){
			if(place.name === name){
				contents = '<b>'+name+'</b><br>'+address+'<br><b>What: </b>'+type+'<br><b>Notes: </b>'+note;
				nameExists = true;
			}
		});

		if(!nameExists){
			contents = '<b>'+name+'</b><br>'+address+'<br><span><button type="button" onclick="view.saveThisPlace()">Save Place</button><button type="button" onclick="view.removeThisPlace()">Remove Place</button></span>';
		
		}

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
	};

	self.savePlace = function(){
		placeObject.group = self.placeGroup();
		placeObject.type = self.placeType();
		placeObject.notes = self.placeNote();
		//console.log(placeObject);
		self.writeFile(function(){
			if(self.listView().length !== 0){
				self.fetchPlaceDetails();
			}
		});

		self.showOverlay(false);
		marker.setMap(null);
	};

	self.dontSavePlace = function(){
		placeObject = {};
		self.showOverlay(false);
		self.removeThisPlace();
	};

	self.writeFile = function(callback){
		$.ajax({
			type: 'POST',
			url: 'http://localhost:3000/writeFile',
			//dataType: "json",
			data: JSON.stringify(placeObject),
			contentType: "application/json; charset=utf-8"
		})
		.done(function(data){
			//var testData = data;
			callback();

			console.log("Successfully saved");
		})
		.fail(function(errMsg) {
			console.log(errMsg);
		});
	};

	self.readFileByGroup = function(group, callback){
		var data = {"group" : group};
		$.ajax({
			type:'GET',
			url: 'http://localhost:3000/readFile',
			data: data,
		})
		.done(function(data){
			//console.log(data);
			//testData = data;
			//console.log("this is you data: "+testData);
			callback(JSON.parse(data));
		})
		.fail(function(){
			alert("Error, no results for "+group+" found, please try again");
		});
	};

	self.readFileByRadius = function(lat, lng, distance, callback){
		var data = {"lat" : lat, "lng": lng, "distance": distance};
		$.ajax({
			type:'GET',
			url: 'http://localhost:3000/readFile',
			data: data,
		})
		.done(function(data){
			//console.log(data);
			//testData = data;
			//console.log("this is you data: "+testData);
			callback(JSON.parse(data));
		})
		.fail(function(){
			alert("Error, no results for "+group+" found, please try again");
		});
	};

	self.removeExisitingPlaces = function(){
		for (var i = 0; i < self.listView().length; i++) {
			self.listView()[i].marker.setMap(null);
		}
		self.listView.removeAll();
		self.closeMenu();
	}

	self.loadSavedPlacesByGroup = function(){
		self.removeExisitingPlaces();
		self.showSavedGroupOverlay(true);
	};

	self.loadSavedPlacesByType = function(){
		self.removeExisitingPlaces();
		self.showSavedTypeOverlay(true);

	}

	//TODO: Refactor this so it is not a repeat of loadSavedPlacesByGroup function
	self.loadSavedPlacesByRadius = function(){
		self.removeExisitingPlaces();
		self.readFileByRadius(startPoint.lat, startPoint.lng, 2, view.readFileCallBack)
	}

	self.fetchPlaceDetails = function(){

		self.removeExisitingPlaces();
		self.showSavedOverlay(false);
		self.saveButton(false);
		self.removeButton(true);

		if(!self.getGroup() && !self.getType()){
			self.readFileByRadius(startPoint.lat, startPoint.lng, 2, self.readFileCallBack);
		}else if(self.getGroup()){
			self.readFileByGroup(self.getGroup(), self.readFileCallBack);
		}else if(self.getType()){
			self.readFileByType(self.getType(), self.readFileCallBack);
		}
	};

	self.readFileCallBack = function(data){
		if(data.length !== 0){
			data.forEach(function(value){
				self.listView.push(new Place(value.name, value.position, value.latitude, value.longitude, value.type, value.notes, value.address));
			});
		}else{
			alert("Error, no results found, please try again");
		}
	}

	self.openMenu = function(){
		console.log("Open Menu");
		if(!self.showMenuList()){
			map.controls[google.maps.ControlPosition.TOP_LEFT].clear(menu);
			map.controls[google.maps.ControlPosition.TOP_CENTER].clear(input);
			self.showMenuList(true);
		}
	}

	self.closeMenu = function(){
		if(view.showMenuList()){
			view.showMenuList(false);
			map.controls[google.maps.ControlPosition.TOP_LEFT].push(menu);
			map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
		}
	}
};

view = new ViewModel();
ko.applyBindings(view);