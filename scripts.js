// TODO: Comments needed in this file.

// Add your team to this list when you've put an icon in /logos!
var icons = [
	1418,
	2403,
	5115,
    236
];

var map;

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: 30,
			lng: 0
		},
		zoom: 2,
		disableDefaultUI: true,
		zoomControl: true,
		mapTypeControl: false,
		streetViewControl: false,
		rotateControl: false,
		fullscreenControl: true,
		styles: [{
			featureType: 'water',
			elementType: 'geometry',
			stylers: [{
				color: '#193341'
			}]
		}, {
			featureType: 'landscape',
			elementType: 'geometry',
			stylers: [{
				color: '#2c5a71'
			}]
		}, {
			featureType: 'road',
			elementType: 'geometry',
			stylers: [{
				color: '#29768a'
			}, {
				lightness: -37
			}]
		}, {
			featureType: 'poi',
			elementType: 'geometry',
			stylers: [{
				color: '#406d80'
			}]
		}, {
			featureType: 'transit',
			elementType: 'geometry',
			stylers: [{
				color: '#406d80'
			}]
		}, {
			elementType: 'labels.text.stroke',
			stylers: [{
				visibility: 'on'
			}, {
				color: '#3e606f'
			}, {
				weight: 2
			}, {
				gamma: 0.84
			}]
		}, {
			elementType: 'labels.text.fill',
			stylers: [{
				color: '#ffffff'
			}]
		}, {
			featureType: 'administrative',
			elementType: 'geometry',
			stylers: [{
				weight: 0.6
			}, {
				color: '#1a3541'
			}]
		}, {
			elementType: 'labels.icon',
			stylers: [{
				visibility: 'off'
			}]
		}, {
			featureType: 'poi.park',
			elementType: 'geometry',
			stylers: [{
				color: '#2c5a71'
			}]
		}]
	});
	for (i = 0; i < teams.length; i++) {
		createMarker(coordinates[i], teams[i]);
	}
}

function createMarker(pos, t) {
	if (pos) {
		pos = {
			lat: pos.lat + ((Math.random() / 100) * ((Math.random() >= 0.5) ? -1 : 1)),
			lng: pos.lng + ((Math.random() / 100) * ((Math.random() >= 0.5) ? -1 : 1))
		};
		var marker = new google.maps.Marker({
			position: pos,
			map: map,
			title: t + '',
			icon: (icons.indexOf(t) != -1) ? 'logos/' + t + '.png' : 'marker.png'
		});
		google.maps.event.addListener(marker, 'click', function() {
			openInfo(t, marker);
		});
		return marker;
	}
}

function openInfo(num, marker) {
	var req = new XMLHttpRequest();
	req.open('GET', 'https://www.thebluealliance.com/api/v2/team/frc' + num + '?X-TBA-App-Id=erikboesen:frcmap:v1.0');
	req.send();
	req.onreadystatechange = function() {
		if (req.readyState === 4 && req.status === 200) {
			var team = JSON.parse(req.responseText);
			var content = '<h1>';
			content += team.website ? '<a href="' + team.website + '">' : '';
			content += 'Team ' + team.team_number;
			content += team.nickname ? ' - ' + team.nickname : '';
			content += team.website ? '</a></h1>' : '</h1>';
			content += team.motto ? '<p><em>"' + team.motto + '"</em></p>' : '';
			content += '<ul>';
			content += '<li><strong>Location:</strong> ' + team.location + '</li>';
			content += team.rookie_year ? '<li><strong>Rookie year:</strong> ' + team.rookie_year + '</li>' : '';
			content += '<li><a href="http://thebluealliance.com/team/' + num + '">View on The Blue Alliance</a></li>';
			content += '</ul>';
			try {
				var oldInfoWindow = document.getElementsByClassName('gm-style-iw')[0];
				oldInfoWindow.parentNode.parentNode.removeChild(oldInfoWindow.parentNode);
			} catch (e) {}
			var infoWindow = new google.maps.InfoWindow({
				content: content
			});
			infoWindow.open(map, marker);
		}
	};
}
