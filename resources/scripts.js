// TODO: Comments needed in this file.

var map
var teamMarkers = []
var regionalMarkers = []
var districtMarkers = []

var teamState = true
var regState = true
var distState = true

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

    for (i = 0; i < teamInfo.length; i++) {
        createTeamMarker(i)
    }

    for (i = 0; i < regionals.length; i++) {
        createCompetitionMarker('regional', regionals[i])
    }

    for (i = 0; i < districts.length; i++) {
        createCompetitionMarker('district', districts[i])
    }

    addKeyboardListener()
}

function createCompetitionMarker(type, competitionEntry) {
    if (competitionEntry) {
        var position = {
            lat: type == 'regional' ? competitionEntry[1].lat : competitionEntry[2].lat,
            lng: type == 'regional' ? competitionEntry[1].lng : competitionEntry[2].lng
        }

        if (position.lat && position.lng) {
            var image = {
                url: 'resources/' + type + '.png',
                scaledSize: new google.maps.Size(30, 30)
            }

            var marker = new google.maps.Marker({
                position: position,
                map: map,
                title: competitionEntry[0],
                icon: image
            })

            google.maps.event.addListener(marker, 'click', function() {
                openCompInfo(type, competitionEntry, marker)
            })

            if (type === 'regional') {
                regionalMarkers.push(marker)
            } else {
                districtMarkers.push(marker)
            }
        }
    }
}

function createTeamMarker(index) {
    if (teamInfo[index]) {
        var title = teamInfo[index].team_number
        var position = {}

        if (title in updatedLocations) {
            position = {
                lat: updatedLocations[title].lat,
                lng: updatedLocations[title].lng
            }
        } else {
            position = {
                lat: teamInfo[index].lat + Math.random() / 100 * (Math.random() >= 0.5 ? -1 : 1),
                lng: teamInfo[index].lng + Math.random() / 100 * (Math.random() >= 0.5 ? -1 : 1)
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
            index: index
        })

        google.maps.event.addListener(marker, 'click', function() {
            openTeamInfo(title, marker)
        })

        teamMarkers.push(marker)
    }
}

function openCompInfo(type, entry, marker) {
    var dates = (type === 'regional' ? entry[4] : entry[5]).split(' - ')
    var start = new Date(dates[0]).toLocaleDateString()
    var end = new Date(dates[1]).toLocaleDateString()

    var content = ''

    content += '<h1>' + (type == 'regional' ? entry[0] : entry[1]) + '</h1>'
    content += '<ul>'

    if (type === 'district') {
        content += '<li><strong>District:</strong> ' + entry[0] + '</li>'
    }

    content += '<li><strong>Week:</strong> ' + (type === 'regional' ? entry[2] : entry[3]) + '</li>'
    content += '<li><strong>Date:</strong> ' + start + ' thru ' + end + '</li>'
    content +=
        '<li><a href="http://www.thebluealliance.com/event/' +
        (type === 'regional' ? entry[3] : entry[4]) +
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

function openTeamInfo(num, marker) {
    var team = teamInfo[marker.index];
    var content = '<h1>'

    content += team.website ? '<a href="' + team.website + '">' : ''
    content += 'Team ' + team.team_number
    content += team.nickname ? ' - ' + team.nickname : ''
    content += team.website ? '</a></h1>' : '</h1>'
    content += team.motto ? '<p><em>"' + team.motto + '"</em></p>' : ''
    content += '<ul>'
    content += '<li><strong>Location:</strong> ' + team.location + '</li>'
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

function toggleMarkers(type) {
    switch (type) {
        case 'teams':
            for (i = 0; i < teamMarkers.length; i++) {
                if (teamState) {
                    teamMarkers[i].setMap(null)
                } else {
                    teamMarkers[i].setMap(map)
                }
            }

            teamState = !teamState

            break
        case 'regionals':
            for (i = 0; i < regionalMarkers.length; i++) {
                if (regState) {
                    regionalMarkers[i].setMap(null)
                } else {
                    regionalMarkers[i].setMap(map)
                }
            }

            regState = !regState

            break
        case 'districts':
            for (i = 0; i < districtMarkers.length; i++) {
                if (distState == true) {
                    districtMarkers[i].setMap(null)
                } else {
                    districtMarkers[i].setMap(map)
                }
            }

            distState = !distState

            break
    }
}

function addKeyboardListener() {
    document.addEventListener('keyup', function(event) {
        switch (event.keyCode) {
            // D
            case 68:
                toggleMarkers('districts')
                break
            // R
            case 82:
                toggleMarkers('regionals')
                break
            // T
            case 84:
                toggleMarkers('teams')
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
