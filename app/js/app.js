'use strict';

var map,
	view,
	marker,
	mapLoaded = false,
	startPoint = {lat:37.773972, lng: -122.431297};

/**
 * Add google maps to screen
*/
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: startPoint,
		zoom: 12
	});
	view.addSearch();
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

			// Clear out the old marker
			if(marker){
				marker.setMap(null);
			}

			// For each place, get the icon, name and location.
			var bounds = new google.maps.LatLngBounds();
			places.forEach(function(place) {
				var icon = {
					url: place.icon,
					size: new google.maps.Size(71, 71),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(17, 34),
					scaledSize: new google.maps.Size(25, 25)
				};

			// Create a marker for each place.
				marker = new google.maps.Marker({
					map: map,
					icon: icon,
					title: place.name,
					position: place.geometry.location
				});

				google.maps.event.addListener(marker, 'click', function() {
					console.log('click');
				});

				if (place.geometry.viewport) {
				// Only geocodes have viewport.
					bounds.union(place.geometry.viewport);
				} else {
					bounds.extend(place.geometry.location);
				}

				map.setCenter(place.geometry.location);
				map.fitBounds(bounds);
			});

		});
	};
};

view = new ViewModel();