// Main body of scripts for FIRSTmap, an application which shows the
// locations of FIRST Robotics Competition teams and events on an
// interactive map.

// Google Map and markers
var map;
var markers = [];

// Start all markers in displayable state (not hidden)
var state = {T: true, R: true, D: true, C: true};

function initMap() {
// Set up the google map parameters and options
// last few lines of function create team and event markers

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
                stylers: [
                    {
                        color: '#193341'
                    }
                ]
            },
            {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [
                    {
                        color: '#2c5a71'
                    }
                ]
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
                stylers: [
                    {
                        color: '#406d80'
                    }
                ]
            },
            {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [
                    {
                        color: '#406d80'
                    }
                ]
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
                stylers: [
                    {
                        color: '#ffffff'
                    }
                ]
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
                stylers: [
                    {
                        visibility: 'off'
                    }
                ]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [
                    {
                        color: '#2c5a71'
                    }
                ]
            }
        ]
    });

// Create team and event markers

    for (i = 0; i < teamInfo.length; i++)
        createTeamMarker(teamInfo[i]);

    for (i = 0; i < events.length; i++)
        createEventMarker(events[i]);

// And start application

    addKeyboardListener();
}

function createEventMarker(eventEntry) {
    if (eventEntry) {
        var position = {
            lat: eventEntry.lat,
            lng: eventEntry.lng
        };
        var key = eventEntry.key;

        if (position.lat && position.lng) {
            var image = {
                url: 'resources/img/' + (eventEntry.type=='R' ? 'regional' :
                     (eventEntry.type == 'C' ? 'championship' : 'district')) + '.png',
                scaledSize: new google.maps.Size(30, 30)
            };

            var marker = new google.maps.Marker({
                position: position,
                map: map,
                title: eventEntry.name,
                icon: image,
                key: eventEntry.key,
                type: eventEntry.type
            });

            google.maps.event.addListener(marker, 'click', function() {
                openInfo(marker)
            });

            markers.push(marker);
        }
    }
}

function createTeamMarker(teamInfo) {
    if (teamInfo) {
        var title = teamInfo.team_number;
        var position = {};

        if (title in updatedLocations) {
            position = {
                lat: updatedLocations[title].lat,
                lng: updatedLocations[title].lng
            };
        } else {
            position = {
                lat: teamInfo.lat + (Math.random()-.5) / 50,
                lng: teamInfo.lng + (Math.random()-.5) / 50
            };
        }
        var custom = icons.indexOf(title) !== -1;
        var imageUrl = 'resources/img/marker.png';
        if (custom) {
          imageUrl = 'logos/' + title + '.png';
        } else {
          if (teamAvatars[title]) {
            custom = true;
            imageUrl = 'data:image/png;base64,' + teamAvatars[title]["img"];
          }
        }

        var image = {
            url: imageUrl,
            scaledSize: custom ? new google.maps.Size(30, 30) : undefined
        };

        var marker = new google.maps.Marker({
            position: position,
            map: map,
            title: title.toString(),
            icon: image,
            key: 'frc' + title.toString(),
            type: 'T'
        });

        google.maps.event.addListener(marker, 'click', function() {
            openInfo(marker)
        });

        markers.push(marker);
    }
}

function openInfo(marker) {
    var req = new XMLHttpRequest();

    req.open('GET', 'https://www.thebluealliance.com/api/v3/' +
            (marker.type == 'T' ? 'team/' : 'event/') +
            marker.key + '?X-TBA-Auth-Key=' +
            'VCZM2oYCpR1s3OHxFbjdVQrtkk0LY1wcvyhH8hiNrzm1mSQnUn1t9ZDGyTqN4Ieq'
    );
    req.send();
    req.onreadystatechange = function() {
      if (req.readyState === 4 && req.status === 200) {
        var parsed = JSON.parse(req.responseText);

        var content = '';

        if (marker.type == 'T') {
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
            content += parsed.rookie_year
                ? '<li><strong>Rookie year:</strong> ' + parsed.rookie_year + '</li>'
                : '';
            content +=
                '<li><a href="http://thebluealliance.com/team/' + parsed.team_number +
                '">View on The Blue Alliance</a></li>';
            content += '</ul>';
        } else {
            if (parsed.event_type == 4) {
                content +=  '<h1>FIRST Championship ' + parsed.city + '</h1>';
            } else {
                content += '<h1>' + parsed.short_name + '</h1>';
            }

            content += '<ul>';
            if (parsed.event_type_string.startsWith('District')) {
                content += '<li><strong>District:</strong> ' +
                            parsed.district.abbreviation + '</li>';
            }
            if (parsed.week) {
                content += '<li><strong>Week:</strong> ' + parsed.week + '</li>';
            }
            var start = new Date(parsed.start_date).toLocaleDateString();
            var end = new Date(parsed.end_date).toLocaleDateString();
            content += '<li><strong>Date:</strong> ' + start + ' thru ' + end + '</li>';
            content += '<li><a href="http://www.thebluealliance.com/event/' +
                        marker.key + '">View on The Blue Alliance</a></li>';
            content += '</ul>'
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
    var change = '';
    var newMap = null;
    switch (type) {
        case 'T':
        case 'teams':
            state.T = !state.T;
            newMap = state.T ? map : null;
            change = 'T';
            break;
        case 'R':
        case 'regionals':
            state.R = !state.R;
            newMap = state.R ? map : null;
            change = 'R';
            break;
        case 'D':
        case 'districts':
            state.D = !state.D;
            newMap = state.D ? map : null;
            change = 'D';
            break;
        case 'C':
        case 'championships':
            state.C = !state.C;
            newMap = state.C ? map : null;
            change = 'C';
            break;
     }
     for (i = 0; i < markers.length; i++) {
         if (markers[i].type == change) {
              markers[i].setMap(newMap);
         }
    }
}

function addKeyboardListener() {
    document.addEventListener('keyup', function(event) {
        switch (event.keyCode) {
            // Esc
            case 27:
                toggleAbout();
                break;
            // C
            case 67:
                toggleMarkers('championships');
                break;
            // D
            case 68:
                toggleMarkers('districts');
                break;
            // R
            case 82:
                toggleMarkers('regionals');
                break;
            // T
            case 84:
                toggleMarkers('teams');
                break;
            // F
            case 70:
                document.getElementsByClassName('gm-fullscreen-control')[0].click();
                break;
        }
    })
}

function openAbout() {
   document.getElementById('about').style.display='inline-block';
}

function closeAbout() {
   document.getElementById('about').style.display='none';
}

function toggleAbout() {
   if (document.getElementById('about').style.display == 'none') {
      openAbout();
   } else {
      closeAbout();
   }
}
