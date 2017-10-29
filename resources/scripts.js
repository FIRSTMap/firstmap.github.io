// TODO: Comments needed in this file.
// Main body of scripts for FIRSTmap, a GoogleMaps application to show the
// locations of First Robotics Competition teams and events on an
// interactive map.

// The GoogleMap and markers
var map
var markers = []

// Start all markers in displayable state (not hidden)
var state = {T: true, R: true, D: true}

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
    })

// Create team and event markers

    for (i = 0; i < teamInfo.length; i++) {
        createTeamMarker(teamInfo[i])
    }

    for (i = 0; i < events.length; i++) {
        createEventMarker(events[i])
    }

// And start application

    addKeyboardListener()
}

function createEventMarker(eventEntry) {
    if (eventEntry) {
        var position = {
            lat: eventEntry.lat,
            lng: eventEntry.lng 
        }
        var key = eventEntry.key

        if (position.lat && position.lng) {
            var image = {
                url: 'resources/' + (eventEntry.type=='R' ? 'regional' : 'district') + '.png',
                scaledSize: new google.maps.Size(30, 30)
            }

            var marker = new google.maps.Marker({
                position: position,
                map: map,
                title: eventEntry.name,
                icon: image,
                key: eventEntry.key,
                type: eventEntry.type
            })

            google.maps.event.addListener(marker, 'click', function() {
                openCompInfo(marker)
            })

            markers.push(marker)
        }
    }
}

function createTeamMarker(teamInfo) {
    if (teamInfo) {
        var title = teamInfo.team_number
        var position = {}

        if (title in updatedLocations) {
            position = {
                lat: updatedLocations[title].lat,
                lng: updatedLocations[title].lng
            }
        } else {
            position = {
                lat: teamInfo.lat + (Math.random()-.5) / 50,
                lng: teamInfo.lng + (Math.random()-.5) / 50 
            }
        }

        var custom = icons.indexOf(title) !== -1
        var image = {
            url: custom ? 'logos/' + title + '.png' : 'resources/marker.png',
            scaledSize: custom ? new google.maps.Size(30, 30) : undefined
        }

        var marker = new google.maps.Marker({
            position: position,
            map: map,
            title: title.toString(),
            icon: image,
            key: 'frc' + title.toString(),
            type: 'T'
        })

        google.maps.event.addListener(marker, 'click', function() {
            openTeamInfo(title, marker)
        })

        markers.push(marker)
    }
}

function openCompInfo(marker) {
    var req = new XMLHttpRequest()

    req.open(
        'GET',
        'https://www.thebluealliance.com/api/v3/event/' +
            marker.key + '?X-TBA-Auth-Key=' +
            'VCZM2oYCpR1s3OHxFbjdVQrtkk0LY1wcvyhH8hiNrzm1mSQnUn1t9ZDGyTqN4Ieq'
    )
    req.send()
    req.onreadystatechange = function() {
      if (req.readyState === 4 && req.status === 200) {
        var event = JSON.parse(req.responseText)

        var content = ''

        content += '<h1>' + event.short_name + '</h1>'
        content += '<ul>'

        if (event.event_type_string.startsWith('District')) {
            content += '<li><strong>District:</strong> ' + 
                        event.district.abbreviation + '</li>'
        }

        content += '<li><strong>Week:</strong> ' + event.week + '</li>'
        var start = new Date(event.start_date).toLocaleDateString()
        var end = new Date(event.end_date).toLocaleDateString()
        content += '<li><strong>Date:</strong> ' + start + ' thru ' + end + '</li>'
        content += '<li><a href="http://www.thebluealliance.com/event/' +
                    marker.key + '">View on The Blue Alliance</a></li>'
        content += '</ul>'

        try {
            var oldInfoWindow = document.getElementsByClassName('gm-style-iw')[0]
            oldInfoWindow.parentNode.parentNode.removeChild(oldInfoWindow.parentNode)
        } catch (e) {}

        var infoWindow = new google.maps.InfoWindow({
            content: content
        })

        infoWindow.open(map, marker)
      }
    }
}

function openTeamInfo(num, marker) {
    var req = new XMLHttpRequest()

    req.open(
        'GET',
        'https://www.thebluealliance.com/api/v3/team/frc' +
            num + '?X-TBA-Auth-Key=' +
            'VCZM2oYCpR1s3OHxFbjdVQrtkk0LY1wcvyhH8hiNrzm1mSQnUn1t9ZDGyTqN4Ieq'
    )
    req.send()
    req.onreadystatechange = function() {
        if (req.readyState === 4 && req.status === 200) {
            var team = JSON.parse(req.responseText)
            var content = '<h1>'

            content += team.website ? '<a href="' + team.website + '">' : ''
            content += 'Team ' + team.team_number
            content += team.nickname ? ' - ' + team.nickname : ''
            content += team.website ? '</a></h1>' : '</h1>'
            content += team.motto ? '<p><em>"' + team.motto + '"</em></p>' : ''
            content += '<ul>'
            content += '<li><strong>Location:</strong> ' + team.city + ', '
            content += team.state_prov + ' ' + team.postal_code + ', '
            content += team.country + '</li>'
            content += team.rookie_year
                ? '<li><strong>Rookie year:</strong> ' + team.rookie_year + '</li>'
                : ''
            content +=
                '<li><a href="http://thebluealliance.com/team/' +
                num +
                '">View on The Blue Alliance</a></li>'
            content += '</ul>'

            try {
                var oldInfoWindow = document.getElementsByClassName('gm-style-iw')[0]
                oldInfoWindow.parentNode.parentNode.removeChild(oldInfoWindow.parentNode)
            } catch (e) {}

            var infoWindow = new google.maps.InfoWindow({
                content: content
            })

            infoWindow.open(map, marker)
        }
    }
}

function toggleMarkers(type) {
    var change = ''
    var newMap = null
    switch (type) {
        case 'teams':
            state.T = !state.T
            newMap = state.T ? map : null
            change='T'
            break
        case 'regionals':
            state.R = !state.R
            newMap = state.R ? map : null
            change='R'
            break
        case 'districts':
            state.D = !state.D
            newMap = state.D ? map : null
            change='D'
            break
     }
     for (i = 0; i < markers.length; i++) {
         if (markers[i].type == change) {
              markers[i].setMap(newMap)
         }
    }
}

function addKeyboardListener() {
    document.addEventListener('keyup', function(event) {
        switch (event.keyCode) {
            // D
            case 68:
                toggleMarkers('D')
                break
            // R
            case 82:
                toggleMarkers('R')
                break
            // T
            case 84:
                toggleMarkers('T')
                break
            // F
            case 70:
                document.getElementsByClassName('gm-fullscreen-control')[0].click()
                break
        }
    })
}

function openAbout() {
   document.getElementById('about').style.display='inline-block'
}

function closeAbout() {
   document.getElementById('about').style.display='none'
}
