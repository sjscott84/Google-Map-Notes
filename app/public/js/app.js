'use strict';

var map,
	view,
	marker,
	infoWindow,
	contents,
	testData,
	placeObject = {},
	pos,
	getSavedOverlay = document.getElementById('getSaved'),
	startPoint = {lat: 34.5133, lng: -94.1629},
	radius = 2;

/**
 * Add google maps to screen
*/
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: startPoint,
		zoom: 2,
		disableDefaultUI: true,
		zoomControl: true,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});

	view.addSearch();

	map.controls[google.maps.ControlPosition.TOP_LEFT].push(menu);
	map.controls[google.maps.ControlPosition.LEFT_CENTER].push(menuList);
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(inputBox);

	// Try HTML5 geolocation.
	geolocateLocation(function(){
		view.readFileByRadius(pos.lat, pos.lng, radius, view.readFileCallBack);
	});

	view.pageSetUp(function(data){
		for(var i=0; i<data.groups.length; i++){
			view.availableGroups.push(data.groups[i]);
		}
		for(var i=0; i<data.types.length; i++){
			view.availableTypes.push(data.types[i]);
		}
		view.availableGroups.sort();
		view.availableTypes.sort();
	});

}

/**
 * Find current location
 */
function geolocateLocation(callback){
if (navigator.geolocation) {

		navigator.geolocation.getCurrentPosition(function(position) {
			pos = {
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

			callback();

		}, function() {
			alert("Geolocation is currently unavaliable");
		});
	} else {
		// Browser doesn't support Geolocation
		alert("Geolocation is currently unavaliable");
	}
}

/**
 * Error if map does not load
 */
function onLoadError(){
	alert("Google is currently unavaliable, please try again later");
}

/**
 * Place Object
*/
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
		view.currentPlace(self);
		map.setCenter(self.marker.getPosition());
	});
};

var ViewModel = function(){
	var self = this,
		searchBox,
		input = document.getElementById('pac-input'),
		menu = document.getElementById('menu'),
		directionsService,
		directionsDisplay;

	self.placeNote = ko.observable("");
	self.showOverlay = ko.observable(false);
	self.saveButton = ko.observable(true);
	self.removeButton = ko.observable(false);
	self.placeName = ko.observable("");
	self.placeGroup = ko.observable("");
	self.placeType = ko.observable("");
	self.getGroup = ko.observable("");
	self.getType = ko.observable("");
	self.listView = ko.observableArray([]);	
	self.showMenuList = ko.observable(false);
	self.currentPlace = ko.observable();
	self.availableGroups = ko.observableArray(["All"]);
	self.availableTypes = ko.observableArray(["All"]);
	self.showSavedGroups = ko.observableArray([]);
	self.showSavedTypes = ko.observableArray([]);
	self.selectedGroupItem = ko.observable();
	self.selectedTypeItem = ko.observable();
	self.selectedGroupItemVisible = ko.observable(false);
	self.selectedTypeItemVisible = ko.observable(false);

	/**
	 * Display a list of groups already in database that matched the current input when adding a new place
	 */
	self.getSavedGroups = function(){
		self.selectedGroupItemVisible(true);
		self.showSavedGroups([]);
		var entry = self.placeGroup().length;
		for(var j = 0; j<self.availableGroups().length; j++){
			var what = self.availableGroups()[j].slice(0, entry);
			if(self.placeGroup().match(new RegExp([what], 'i'))){
				self.showSavedGroups.push(self.availableGroups()[j]);
			}
		}
	};

	/**
	 * Display a list of types already in database that matched the current input when adding a new place
	 */
	self.getSavedTypes = function(){
		self.selectedTypeItemVisible(true);
		self.showSavedTypes([]);
		var entry = self.placeType().length;
		for(var j = 0; j<self.availableTypes().length; j++){
			var what = self.availableTypes()[j].slice(0, entry);
			if(self.placeType().match(new RegExp([what], 'i'))){
				self.showSavedTypes.push(self.availableTypes()[j]);
			}
		}
	};

	/**
	 * Use the selected item from the group or type list when adding a new place
	 */
	self.useSelectedItem = function(){
		if(self.selectedGroupItem()){
			self.placeGroup(self.selectedGroupItem().toString());
			self.selectedGroupItemVisible(false);
		}
		if(self.selectedTypeItem()){
			self.placeType(self.selectedTypeItem().toString());
			self.selectedTypeItemVisible(false);
		}
	};

	/**
	 * Close the type list when entering a note when adding a new place
	 */
	self.closeGetSavedGroupsOrTypes = function(){
		if(self.selectedGroupItemVisible(true)){
			self.selectedGroupItemVisible(false);
		}
		if(self.selectedTypeItemVisible(true)){
			self.selectedTypeItemVisible(false);
		}
	};

	/**
 	* Add search functionality
	*/
	self.addSearch = function (){
		// Create the search box and link it to the UI element.
		searchBox = new google.maps.places.SearchBox(input);
		map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

		//Bias the SearchBox results towards current map's viewport.
		map.addListener('bounds_changed', function() {
			searchBox.setBounds(map.getBounds());
		});

		directionsDisplay = new google.maps.DirectionsRenderer();
		directionsService = new google.maps.DirectionsService();

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

		infoWindow = new google.maps.InfoWindow({
			disableAutoPan: true
		});
	};

	/**
 	* Add infowindow to marker
	*/
	self.addInfoWindow = function(name, address, type, note, marker){
		var nameExists = false;

		if(infoWindow){
			infoWindow.close();
		}

		view.listView().forEach(function(place){
			if(place.name === name){
				contents = '<div class="infowindow"><b>'+name+'</b><br>'+address+'<br><b>What: </b>'+type+'<br><b>Notes: </b>'+note+'<br><a onclick="view.openGoogleMap()">View on google maps</a></div>';
				nameExists = true;
			}
		});

		if(!nameExists){
			contents = '<div class="infowindow"><b>'+name+'</b><br>'+address+'<br><span><button class="myButton" id="leftButton" type="button" onclick="view.saveThisPlace()">Save Place</button><button class="myButton" id="rightButton" type="button" onclick="view.removeThisPlace()">Remove Place</button></span></div>';
		}

		infoWindow.setContent(contents);
		infoWindow.open(map, marker);
	};

	/**
	 * Save a searched place
	*/
	self.saveThisPlace = function(){
		infoWindow.close();
		self.showOverlay(true);
		self.placeName(marker.title);
	};

	/**
	* Remove searched place from screen without saving
	*/
	self.removeThisPlace = function(){
		infoWindow.close();
		marker.setMap(null);
	};

	/**
	* Assing group, type and notes to place and call writeFile function to save
	*/
	self.savePlace = function(){
		placeObject.group = self.placeGroup();
		placeObject.type = self.placeType();
		placeObject.notes = self.placeNote();
		self.writeFile(function(){
			self.listView.push(new Place(placeObject.name, placeObject.position, placeObject.latitude, placeObject.longitude, placeObject.type, placeObject.notes, placeObject.address));
			if(self.availableGroups.indexOf(placeObject.group) === -1){
				self.availableGroups.push(placeObject.group);
			}
			if(self.availableTypes.indexOf(placeObject.type) === -1){
				self.availableTypes.push(placeObject.type);
			}
		});

		self.showOverlay(false);
		marker.setMap(null);
	};

	/**
	 * Empty placeObject and close save place overlay
	*/
	self.dontSavePlace = function(){
		placeObject = {};
		self.showOverlay(false);
		self.removeThisPlace();
	};

	/**
	 * Save place to database
	 */
	self.writeFile = function(callback){
		$.ajax({
			type: 'POST',
			url: 'http://thescotts.mynetgear.com:3000/writeFile',
			data: JSON.stringify(placeObject),
			contentType: "application/json; charset=utf-8"
		})
		.done(function(data){
			callback();
			console.log("Successfully saved");
		})
		.fail(function(errMsg) {
			console.log(errMsg);
		});
	};

	/**
	 * Get places by group and/or type from database
	 */
	self.readFileByGroupAndType = function(group, type, callback){
		var data = {"group" : group, "type" : type};
		$.ajax({
			type:'GET',
			url: 'http://thescotts.mynetgear.com:3000/readFileForGroup',
			data: data,
		})
		.done(function(data){
			callback(JSON.parse(data));
		})
		.fail(function(){
			alert("Error, no results found, please try again");
		});
	};

	/**
	 * Get places by radius from starting point from database
	 */
	self.readFileByRadius = function(lat, lng, distance, callback){
		var data = {"lat" : lat, "lng": lng, "distance": distance};
		$.ajax({
			type:'GET',
			url: 'http://thescotts.mynetgear.com:3000/readFileForRadius',
			data: data,
		})
		.done(function(data){
			callback(JSON.parse(data));
		})
		.fail(function(){
			alert("Error, no results found, please try again");
		});
	};

	/**
	 * Get exisiting groups and types from database to use in searches and predictive input
	 */
	self.pageSetUp = function(callback){
		$.ajax({
			type:'GET',
			url: 'http://thescotts.mynetgear.com:3000/pageSetUp',
		})
		.done(function(data){
			callback(JSON.parse(data));
		})
		.fail(function(){
			alert("Error, no results found, please try again");
		});
	};

	/**
	 * Remove places from screen
	 */
	self.removeExisitingPlaces = function(){
		for (var i = 0; i < self.listView().length; i++) {
			self.listView()[i].marker.setMap(null);
		}
		self.listView.removeAll();
		self.closeMenu();
	};

	/**
	 * Open overlay to get saved places by group
	 */
	self.loadSavedPlacesByGroup = function(){
		self.removeExisitingPlaces();
		map.controls[google.maps.ControlPosition.LEFT_TOP].push(getSavedOverlay);
	};

	/**
	 * Open overlay to get saved places by radius
	 */
	self.loadSavedPlacesByRadius = function(){
		if(!pos){
			alert("Unable to find current location, please search by group and type");
		}else{
			self.removeExisitingPlaces();
			self.readFileByRadius(pos.lat, pos.lng, radius, view.readFileCallBack);
		}
	};

	/**
	 * Choose appropriate search method for places (by group, type or radius)
	 */
	self.fetchPlaceDetails = function(){
		map.controls[google.maps.ControlPosition.LEFT_TOP].clear(getSavedOverlay);
		self.removeExisitingPlaces();
		self.saveButton(false);
		self.removeButton(true);
		self.listView([]);

		if(!self.getGroup() && !self.getType()){
			self.readFileByRadius(pos.lat, pos.lng, radius, self.readFileCallBack);
		}else{
			self.readFileByGroupAndType(self.getGroup(), self.getType(), self.readFileCallBack);
		}
	};

	/**
	 * Callback function for readFile functions to push return data to self.listView for display
	 */
	self.readFileCallBack = function(data){
		if(data.length !== 0){
			data.forEach(function(value){
				self.listView.push(new Place(value.name, value.position, value.latitude, value.longitude, value.type, value.notes, value.address));
				self.fitBoundsToVisibleMarkers();
				var zoom = map.getZoom();
					map.setZoom(zoom > 15 ? 15 : zoom);
			});
		}else{
			alert("Error, no results found, please try again");
		}
	};

	/**
	 * Open menu
	 */
	self.openMenu = function(){
		if(infoWindow){
			contents = undefined;
			infoWindow.setContent();
		}
		if(!self.showMenuList()){
			map.controls[google.maps.ControlPosition.TOP_LEFT].clear(menu);
			map.controls[google.maps.ControlPosition.TOP_CENTER].clear(input);
			self.showMenuList(true);
		}
	};

	/**
	 * Close menu
	 */
	self.closeMenu = function(){
		if(view.showMenuList()){
			view.showMenuList(false);
			map.controls[google.maps.ControlPosition.TOP_LEFT].push(menu);
			map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
		}
	};

	/**
	 * Open link to google maps based on current place latitude and longitude
	 */
	self.openGoogleMap = function(){
		var lat = self.currentPlace().position.lat;
		var lng = self.currentPlace().position.lng;

		window.open("https://maps.google.com/maps?ll="+lat+","+lng+"&z=13&t=m&hl=en-US&q="+lat+"+"+lng);
	};

	/**
	 * Change zoom based on visible markers
	 */
	self.fitBoundsToVisibleMarkers = function() {
		if(map){

			var bounds = new google.maps.LatLngBounds();

			for (var i=0; i<self.listView().length; i++) {
				if(self.listView()[i].marker.getVisible()) {
					bounds.extend(self.listView()[i].marker.getPosition() );
				}
			}
			map.fitBounds(bounds);
		}
	};
};

view = new ViewModel();
ko.applyBindings(view);