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
				brightness: 20
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
            featureType: 'poi.school',
            // TODO: Add special styling for schools
        }, {
            featureType: 'water',
            stylers: [{
                hue: '#333333'
            }, {
                saturation: -100
            }, {
                lightness: -50
            }]
        }]
	});
	for (i = 0; i < teams.length; i++) {
		var marker = new google.maps.Marker({
			position: coordinates[i],
			title: '' + teams[i]
		});
		marker.setMap(map);
	}
}