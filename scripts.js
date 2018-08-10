// Configuration
paramUpdateDelay = 1000; // POST Argument Update Interval (ms)


// URL Parsing / POST Argument Tools
var url = new URL(window.location.href);
var params = url.searchParams;


// Map State Information
var map; // GMaps Container
var markers = { // Map Markers
    all: [],
    keys: {},
}

state = parseState(); // Map State Parsed from POST Arguments (Marker Visibility + Fullscreen)

lastParamUpdate = 0; // Last Time POST Arguemts were updated


// Initialize Google Map
function initMap() {   
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: parseFloat(params.get('lat')) || 30,
            lng: parseFloat(params.get('lng')) || 0
        },
        zoom: parseInt(params.get('zoom')) || 2,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        backgroundColor: '#173340',
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
    for (event of events) createEventMarker(event);
    for (team  of  teams)   createTeamMarker(team);
    
    openURLKey(); // Open / Zoom to Marker Specified in URL

    // Add Map State Listeners (Center & Zoom)
    map.addListener('center_changed', function() {
        lat = map.center.lat();
        lng = map.center.lng();

        if (lat == 30) {
            params.delete('lat');
        } else {
            params.set('lat', lat);
        }

        if (lng == 0) {
            params.delete('lng');
        } else {
            params.set('lng', lng);
        }
        
        pushHistory();
    });

    map.addListener('zoom_changed', function() {
        zoom = map.zoom;

        if (zoom == 2) {
            params.delete('zoom');
        } else {
            params.set('zoom', zoom);
        }

        pushHistory();
    });

    addKeyboardListener(); // Marker Toggling via Keyboard
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
            url: 'img/' + event.type + '.png',
            scaledSize: new google.maps.Size(30, 30)
        },
        visible: state[event.type],
        key: event.key,
        type: event.type
    });

    google.maps.event.addListener(marker, 'click', function() {
        openInfo(marker);
        params.set('key', event.key);
        pushHistory();
    });

    markers.all.push(marker);
    markers.keys[event.key] = marker;
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
    
    var image = 'img/team.png';

    allow_logos = !(params.get('logos') == 'false');
    if (allow_logos) {
        var custom = icons.indexOf(team.team_number) !== -1;
        if (custom) {
            image = 'logos/' + team.team_number + '.png';
        } else if (avatars[team.team_number]) {
            custom = true;
            image = 'data:image/png;base64,' + avatars[team.team_number]['img'];
        }
    }

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: team.team_number.toString(),
        icon: {
            url: image,
            scaledSize: custom ? new google.maps.Size(30, 30) : undefined
        },
        visible: state['team'],
        key: 'frc' + team.team_number,
        type: 'team'
    });

    google.maps.event.addListener(marker, 'click', function() {
        openInfo(marker);
        params.set('key', 'frc' + team.team_number);
        pushHistory();
    });

    markers.all.push(marker);
    markers.keys['frc' + team.team_number] = marker;
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
                content += parsed.website ? '</a>' : '';
                content += '<div class="tooltipped tooltipped-w share_icon" aria-label="Copy Share URL"></div></h1>';

                content += parsed.motto ? '<p><em>"' + parsed.motto + '"</em></p>' : '';
                content += '<ul>';
                content += '<li><strong>Location:</strong> ' + parsed.city + ', ';
                content += parsed.state_prov + ' ' + parsed.postal_code + ', ';
                content += parsed.country + '</li>';
                content += parsed.rookie_year ? '<li><strong>Rookie year:</strong> ' + parsed.rookie_year + '</li>' : '';
                content += '<li><a href="http://thebluealliance.com/team/' + parsed.team_number + '">View on The Blue Alliance</a></li>';
                content += '</ul>';
            } else {
                if (parsed.short_name) {
                    content += '<h1>' + parsed.short_name + '<div class="tooltipped tooltipped-w share_icon" aria-label="Copy Share URL"></div></h1>';
                    if (parsed.name != parsed.short_name) content += '<h6>' + parsed.name + '</h6>';
                } else {
                    content += '<h1>' + parsed.name + '<div class="tooltipped tooltipped-w share_icon" aria-label="Copy Share URL"></div></h1>';
                }
                content += '<ul>';
                if (marker.type === 'district' && parsed.district) {
                    content += '<li><strong>District:</strong> ' + parsed.district.abbreviation.toUpperCase() + '</li>';
                }
                if (parsed.week) {
                    content += '<li><strong>Week:</strong> ' + parsed.week + '</li>';
                }
                var start = /*new Date(*/parsed.start_date/*).toLocaleDateString()*/;
                var end = /*new Date(*/parsed.end_date/*).toLocaleDateString()*/;
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

            var clipboard = new ClipboardJS('.share_icon', { // Create Clipboard Object for Share URL copying
                text: function(trigger) {
                    return window.location.href.split('?')[0] + '?key=' + marker.key;
                }
            });

            clipboard.on('success', function(e) {
                e.trigger.setAttribute('aria-label', 'Success!');
                e.trigger.addEventListener('mouseleave',function() {
                    e.trigger.setAttribute('aria-label', 'Copy Share URL');
                });
                e.clearSelection();
            });

            clipboard.on('error', function(e) {
                actionMsg='';

                if(/iPhone|iPad/i.test(navigator.userAgent)){actionMsg='Unsupported Copy :/';}
                else if(/Mac/i.test(navigator.userAgent)){actionMsg='Press ⌘-c to copy';}
                else{actionMsg='Press Ctrl-C to Copy';}

                e.trigger.setAttribute('aria-label', actionMsg);
                e.trigger.addEventListener('mouseleave',function() {
                    e.clearSelection();
                    e.trigger.setAttribute('aria-label', 'Copy Share URL');
                });
            });

            infoWindow.addListener('closeclick', function() {
                if (params.get('key')) {
                    params.delete('key');
                    pushHistory();
                }
                clipboard.destroy(); // Remove old Clipboard Instance when closing Info Window to prevent DOM overload
            });
        }
    }
}

function toggleMarkers(type) {
    state[type] = !state[type];
    updateMarkerVisibility();
    for (marker of markers.all)
        if (marker.type === type) marker.setVisible(state[type]);
}

function addKeyboardListener() {
    document.addEventListener('keyup', function (event) {
        switch (event.keyCode) {
            // Shift
            case 16:
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
            // O
            case 79:
                toggleMarkers('offseason');
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
                toggleMapFullscreen();
                break;
        }
    })
}

// Parse Map State from URL POST Arguments
function parseState() {
    mapState = {}

    // Marker Visibility
    visibility = params.get('visibility')
    if (visibility) visibility = visibility.toLowerCase();

    if (visibility == null || visibility == 'all') {
        mapState['team'] = true;
        mapState['regional'] = true;
        mapState['district'] = true;
        mapState['championship'] = true;
        mapState['offseason'] = true;
    } else if (visibility == 'none') { // Check for "none" before parsing state information since "none" includes both the "o" and "e" visibility triggers
        mapState['team'] = false;
        mapState['regional'] = false;
        mapState['district'] = false;
        mapState['championship'] = false;
        mapState['offseason'] = false;
    } else {
        mapState['team'] = visibility.includes('t');
        mapState['regional'] = visibility.includes('e') || visibility.includes('r');
        mapState['district'] = visibility.includes('e') || visibility.includes('d');
        mapState['championship'] = visibility.includes('e') || visibility.includes('c');
        mapState['offseason'] = visibility.includes('e') || visibility.includes('o');
    }

    // Fullscreen
    mapState['fullscreen'] = false;
    // Would include POST Argument, but browser requires user interaction for full screen initiation.

    return mapState;
}

// Update URL with current Marker Visibility State
function updateMarkerVisibility() {
    all_visible = true ? state.team && state.regional && state.district && state.championship && state.offseason : false;

    if (all_visible) {
        params.delete('visibility');
        pushHistory();
        return
    }

    now_visible = [];

    if (state.regional && state.district && state.championship && state.offseason)
        now_visible.push('e');

    if (state.team)
        now_visible.push('t');

    if (!now_visible.includes('e')) {
        if (state.regional)
            now_visible.push('r');

        if (state.district)
            now_visible.push('d');

        if (state.championship)
            now_visible.push('c');
        
        if (state.offseason)
            now_visible.push('o');
    }

    if (now_visible.length == 0){
        params.set('visibility', 'none');
    } else {
        params.set('visibility', now_visible.join("-"));
    }
    
    pushHistory();
}

// Handle Zoom / Reposition / Info Panel of URL specified marker key
function openURLKey() {
    keyToOpen = params.get('key');
    if (!keyToOpen) return;
    markerToOpen = markers.keys[keyToOpen.toLowerCase()];
    if (!markerToOpen) return;

    if (!params.get('lat') && !params.get('lng')) {
        map.panTo(markerToOpen.getPosition());
        setTimeout(deleteLatLng, 1500);
    }

    if (!params.get('zoom')) {
        map.setZoom(12);
        setTimeout(deleteZoom, 1500);
    }

    openInfo(markerToOpen);
}

function deleteLatLng() {  // Remove Lat/Lng POST arguments from URL
    params.delete('lat');
    params.delete('lng');
    pushHistory();
}

function deleteZoom() { // Remove Zoom POST arguments from URL
    params.delete('zoom');
    pushHistory();
}

function pushHistory() { // Push History State to URL
    if (lastParamUpdate >= (Date.now() - paramUpdateDelay)) return;
    lastParamUpdate = Date.now();

    window.history.pushState({"html":'',"pageTitle":document.title},"", url.href);
}

function toggleMapFullscreen(forceOpen=false) {
    fullscreenElement = document.documentElement;

    state.fullscreen = !state.fullscreen;

    if (state.fullscreen || forceOpen) {
        if (fullscreenElement.requestFullscreen) {
            fullscreenElement.requestFullscreen();
        } else if (fullscreenElement.mozRequestFullScreen) {
            fullscreenElement.mozRequestFullScreen();
        } else if (fullscreenElement.webkitRequestFullscreen) {
            fullscreenElement.webkitRequestFullscreen();
        } else if (fullscreenElement.msRequestFullscreen) {
            fullscreenElement.msRequestFullscreen();
        }

        document.getElementsByTagName('body')[0].setAttribute('class', 'fullscreen');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        document.getElementsByTagName('body')[0].removeAttribute('class');
    }
}

var about = document.getElementById('about');
function toggleAbout() {
    about.style.display = (about.style.display === 'block') ? 'none' : 'block';
}
