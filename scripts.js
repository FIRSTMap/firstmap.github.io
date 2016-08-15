var teams = [1418];
var locs = ['Falls Church, VA'];

var map;

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: 30,
			lng: 0
		},
		zoom: 2,
		styles: [{
			featureType: 'all',
			stylers: [{

            }]
		}, {
			featureType: 'road.arterial',
			elementType: 'geometry',
			stylers: [{
				hue: '#00ffee'
			}, {
				saturation: 50
			}]
		}, {
			featureType: 'poi',
			elementType: 'labels',
			stylers: [{
				visibility: 'off'
			}]
		}],
		zoomControl: true,
		mapTypeControl: true,
		scaleControl: false,
		streetViewControl: false,
		rotateControl: false,
		fullscreenControl: true
	});
}