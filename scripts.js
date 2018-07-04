// Google Map
var map;
var markers = [];

// Show all markers
var state = {team: true, regional: true, district: true, championship: true};

function initMap() {
    // Initialize Google Map
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
        styles: [
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{
                    color: '#193341'
                }]
            },
            {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [{
                    color: '#2c5a71'
                }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [
                    {
                        color: '#29768a'
                    },
                    {
                        lightness: -37
                    }
                ]
            },
            {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [{
                    color: '#406d80'
                }]
            },
            {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{
                    color: '#406d80'
                }]
            },
            {
                elementType: 'labels.text.stroke',
                stylers: [
                    {
                        visibility: 'on'
                    },
                    {
                        color: '#3e606f'
                    },
                    {
                        weight: 2
                    },
                    {
                        gamma: 0.84
                    }
                ]
            },
            {
                elementType: 'labels.text.fill',
                stylers: [{
                    color: '#ffffff'
                }]
            },
            {
                featureType: 'administrative',
                elementType: 'geometry',
                stylers: [
                    {
                        weight: 0.6
                    },
                    {
                        color: '#1a3541'
                    }
                ]
            },
            {
                elementType: 'labels.icon',
                stylers: [{
                    visibility: 'off'
                }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{
                    color: '#2c5a71'
                }]
            }
        ]
    });

    // Create team and event markers
    for (team  of  teams)   createTeamMarker(team);
    for (event of events) createEventMarker(event);

    addKeyboardListener();
}

function createEventMarker(event) {
    var marker = new google.maps.Marker({
        position: {
            lat: event.lat,
            lng: event.lng
        },
        map: map,
        title: event.name,
        icon: {
            url: 'resources/img/' + event.type + '.png',
            scaledSize: new google.maps.Size(30, 30)
        },
        key: event.key,
        type: event.type
    });

    google.maps.event.addListener(marker, 'click', function() {
        openInfo(marker);
    });

    markers.push(marker);
}

function createTeamMarker(team) {
    var position;

    if (team.team_number in locations) {
        position = {
            lat: locations[team.team_number].lat,
            lng: locations[team.team_number].lng
        };
    } else {
        position = {
            lat: team.lat + (Math.random() - .5) / 50,
            lng: team.lng + (Math.random() - .5) / 50
        };
    }
    var custom = icons.indexOf(team.team_number) !== -1;
    var image = 'resources/img/team.png';
    if (custom) {
        image = 'logos/' + team.team_number + '.png';
    } else if (avatars[team.team_number]) {
        custom = true;
        image = 'data:image/png;base64,' + avatars[team.team_number]['img'];
    }

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: team.team_number.toString(),
        icon: {
            url: image,
            scaledSize: custom ? new google.maps.Size(30, 30) : undefined
        },
        key: 'frc' + team.team_number,
        type: 'team'
    });

    google.maps.event.addListener(marker, 'click', function() {
        openInfo(marker);
    });

    markers.push(marker);
}

function openInfo(marker) {
    var req = new XMLHttpRequest();
    req.open('GET', 'https://www.thebluealliance.com/api/v3/' + (marker.type == 'team' ? 'team' : 'event') + '/' + marker.key + '?X-TBA-Auth-Key=VCZM2oYCpR1s3OHxFbjdVQrtkk0LY1wcvyhH8hiNrzm1mSQnUn1t9ZDGyTqN4Ieq');
    req.send();
    req.onreadystatechange = function() {
        if (req.readyState === 4 && req.status === 200) {
            var parsed = JSON.parse(req.responseText);
            var content = '';

            if (marker.type == 'team') {
                content += '<h1>';
                content += parsed.website ? '<a href="' + parsed.website + '">' : '';
                content += 'Team ' + parsed.team_number;
                content += parsed.nickname ? ' - ' + parsed.nickname : '';
                content += parsed.website ? '</a></h1>' : '</h1>';

                content += parsed.motto ? '<p><em>"' + parsed.motto + '"</em></p>' : '';
                content += '<ul>';
                content += '<li><strong>Location:</strong> ' + parsed.city + ', ';
                content += parsed.state_prov + ' ' + parsed.postal_code + ', ';
                content += parsed.country + '</li>';
                content += parsed.rookie_year ? '<li><strong>Rookie year:</strong> ' + parsed.rookie_year + '</li>' : '';
                content += '<li><a href="http://thebluealliance.com/team/' + parsed.team_number + '">View on The Blue Alliance</a></li>';
                content += '</ul>';
            } else {
                if (parsed.event_type == 4) {
                    content += '<h1>FIRST Championship ' + parsed.city + '</h1>';
                } else {
                    content += '<h1>' + parsed.short_name + '</h1>';
                }

                content += '<ul>';
                if (parsed.event_type_string.startsWith('District')) {
                    content += '<li><strong>District:</strong> ' + parsed.district.abbreviation + '</li>';
                }
                if (parsed.week) {
                    content += '<li><strong>Week:</strong> ' + parsed.week + '</li>';
                }
                var start = new Date(parsed.start_date).toLocaleDateString();
                var end = new Date(parsed.end_date).toLocaleDateString();
                content += '<li><strong>Date:</strong> ' + start + ' - ' + end + '</li>';
                content += '<li><a href="http://www.thebluealliance.com/event/' + marker.key + '">View on The Blue Alliance</a></li>';
                content += '</ul>';
            }

            try {
                var oldInfoWindow = document.getElementsByClassName('gm-style-iw')[0];
                oldInfoWindow.parentNode.parentNode.removeChild(oldInfoWindow.parentNode);
            } catch (e) {}

            var infoWindow = new google.maps.InfoWindow({
                content: content
            });

            infoWindow.open(map, marker);
        }
    }
}

function toggleMarkers(type) {
    state[type] = !state[type];
    for (marker of markers)
        if (marker.type === type) marker.setMap(state[type] ? map : null);
}

function addKeyboardListener() {
    document.addEventListener('keyup', function (event) {
        switch (event.keyCode) {
            // Esc
            case 27:
                toggleAbout();
                break;
            // C
            case 67:
                toggleMarkers('championship');
                break;
            // D
            case 68:
                toggleMarkers('district');
                break;
            // R
            case 82:
                toggleMarkers('regional');
                break;
            // T
            case 84:
                toggleMarkers('team');
                break;
            // F
            case 70:
                document.getElementsByClassName('gm-fullscreen-control')[0].click();
                break;
        }
    })
}

var about = document.getElementById('about');
function toggleAbout() {
    about.style.display = (about.style.display === 'block') ? 'none' : 'block';
}
