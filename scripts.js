// TODO: Comments needed in this file.

// Add your team to this list when you've put an icon in /logos!
var icons = [
	171,
	236,
	548,

	1058,
	1108,
	1418,
	1452,
	1982,

	2370,
	2403,
	2412,
	2626,
	2827,
	2855,
	2848,

	3015,
	3928,

	4150,
	4909,
	4924,

	5113,
	5115,
	5431,
	5482,
	5859,
];


// Is your team's location wrong?  Add your team and coordinates to this object to update their correct coordinates manually
var updatedLocations = {
	2403: {
		lat: 33.434551,
		lng: -111.672356
	}
}

var map;
var teamMarkers = []
var regionalMarkers = []
var districtMarkers = []

var teamState = true;
var regState = true;
var distState = true;

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
		createTeamMarker(coordinates[i], teams[i]);
	}

	for (i = 0; i < regionals.length; i++) {
		createCompetitionMarker('regional', regionals[i]);
	}

	for (i = 0; i < districts.length; i++) {
		createCompetitionMarker('district', districts[i]);
	}
}

function createCompetitionMarker(type, competitionEntry) {
	if (competitionEntry) {
		var position = {
			lat: (type == 'regional') ? competitionEntry[1].lat : competitionEntry[2].lat,
			lng: (type == 'regional') ? competitionEntry[1].lng : competitionEntry[2].lng
		};

		if (position.lat && position.lng) {
			var image = {
				url: type + '.png',
				scaledSize: new google.maps.Size(30, 30)
			};

			var marker = new google.maps.Marker({
				position: position,
				map: map,
				title: competitionEntry[0],
				icon: type + '.png'
			});

			google.maps.event.addListener(marker, 'click', function() {
				openCompInfo(type, competitionEntry, marker);
			});

			if (type === 'regional') {
				regionalMarkers.push(marker);
			} else {
				districtMarkers.push(marker);
			}
		}
	}
}

function createTeamMarker(pos, title) {
	if (pos) {
		var position = {};

		if (title in updatedLocations) {
			position = {
				lat: updatedLocations[title].lat,
				lng: updatedLocations[title].lng
			};
		} else {
			position = {
				lat: pos.lat + ((Math.random() / 100) * ((Math.random() >= 0.5) ? -1 : 1)),
				lng: pos.lng + ((Math.random() / 100) * ((Math.random() >= 0.5) ? -1 : 1))
			};
		}

		var custom = icons.indexOf(title) !== -1;
		var image = {
			url: custom ? 'logos/' + title + '.png' : 'marker.png',
			scaledSize: custom ? new google.maps.Size(30, 30) : undefined
		};

		var marker = new google.maps.Marker({
			position: position,
			map: map,
			title: title.toString(),
			icon: image
		});

		google.maps.event.addListener(marker, 'click', function() {
			openInfo(title, marker);
		});

		teamMarkers.push(marker);
	}
}

function openCompInfo(type, entry, marker) {
	var content = '<h1>';

	content += (type == 'regional') ? entry[0] : entry[1];
	content += '</h1>';

	if (type === 'district') {
		content += '<h2 style="text-align: center; font-weight: normal; padding-bottom: 10px;">'
		content += entry[0]
		content += '</h2>'
	}

	content += '<h3 style="text-align: center; font-weight: normal;"">Week ';
	content += (type === 'regional') ? entry[2] : entry[3];
	content += '<br/>';
	content += (type === 'regional') ? entry[4] : entry[5];

	content += '<br/>';
	content += '<a href="http://www.thebluealliance.com/event/'
	content += (type === 'regional') ? entry[3] : entry[4]
	content += '"> View on The Blue Alliance </a>'

	content += '</h3>';

	try {
		var oldInfoWindow = document.getElementsByClassName('gm-style-iw')[0];
		oldInfoWindow.parentNode.parentNode.removeChild(oldInfoWindow.parentNode);
	} catch (e) {}

	var infoWindow = new google.maps.InfoWindow({
		content: content
	});

	infoWindow.open(map, marker);
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

function toggleMarkers(type) {
	switch (type) {
		case 'teams':
			for (i = 0; i < teamMarkers.length; i++) {
				if (teamState) {
					teamMarkers[i].setMap(null);
				} else {
					teamMarkers[i].setMap(map);
				}
			}

			teamState = !teamState;

			break;
		case 'regionals':
			for (i = 0; i < regionalMarkers.length; i++) {
				if (regState) {
					regionalMarkers[i].setMap(null);
				} else {
					regionalMarkers[i].setMap(map);
				}
			}

			regState = !regState;

			break;
		case 'districts':
			for (i = 0; i < districtMarkers.length; i++) {
				if (distState == true) {
					districtMarkers[i].setMap(null);
				} else {
					districtMarkers[i].setMap(map);
				}
			}

			distState = !distState;

			break;
	}
}
