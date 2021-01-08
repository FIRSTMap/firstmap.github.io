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
    filtered: null,
    open: null
}

var eventData;
var districtList;

state = parseState(); // Map State Parsed from POST Arguments (Marker Visibility + Fullscreen)

lastParamUpdate = 0; // Last Time POST Arguemts were updated

// Loop around to the next competition year at the beginning of
// December since there shouldn't be any offseason events past
// November, and the next year's events should be available
// from The Blue Alliance.
function getCompetitionYear() {
    var date = new Date();
    
    // 0 is January, so 11 is December
    return date.getFullYear() + ((date.getMonth() == 11) ? 1 : 0);
}

var CURRENT_YEAR = getCompetitionYear();

var teams, avatars, locations, icons, event_fallback_locs;

async function getJsonData(file) {
    var resp = await fetch (file);
    if (resp.ok) {
        return resp.json();
    } else {
        throw new Error(`Could not download ${file}! Server responded with ${resp.status}.`);
    }
}

async function initMap() { // Initialize Google Map

    // Since (most) team avatars are designed to look good when they are pixelated but end up
    // looking bad when they are blurred on resize, setting `imageSmoothingEnabled` to false on
    // the canvas drawing context makes them look significantly better (because it stops the
    // avatars from being blurred on resize). This is especially an issue on higher resolution
    // devices where the canvas images have to be scaled up enough that there is a noticeable
    // decrease in sharpness. However, the canvas that the avatars are drawn on is handled by the
    // Google Maps API, so the drawing context cannot be accessed directly. We get around this by
    // modifying the CanvasRenderingContext2D prototype to set this property before each image is
    // drawn. We cannot simply override getContext and set the imageSmoothingEnabled property to
    // false with each retrieval of a drawing context because when a canvas's width or height
    // properties are set, the imageSmoothingEnabled property is automatically reset to its
    // default value of true. Since the Google Maps API changes these sizes after it calls
    // getContext, setting imageSmoothingEnabled in getContext has no effect. Hypothetically,
    // every resize of every canvas could be detected and imageSmoothingEnabled could be set
    // there, but this method seems simpler. This function is overridden before initializing the
    // map so that all canvas drawing contexts created inherit it.
    let canvasDrawImageOld = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function() {
        this.imageSmoothingEnabled = false;
        return canvasDrawImageOld.apply(this, arguments);
    };
    
    
    map = new google.maps.Map(document.getElementById('map'), { // Define Map Settings
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

    teams = await getJsonData('data/teams.json');
    avatars = await getJsonData('data/avatars.json');
    locations = await getJsonData('data/custom_locations.json');
    icons = await getJsonData('data/custom_icons.json');
    event_fallback_locs = await getJsonData('data/event_fallback_locs.json');

    // Create team and event markers
    for (team of teams) createTeamMarker(team);

    var [events, err] = await getTBAQuery('/events/' + CURRENT_YEAR);

    if (err && !events) {
        var msg = 'Failure to load events: ' + err;
        console.error(msg);
    } else {
        if (err) {
            console.warn('Warning: there was an error, but events were loaded from cache: ' + err);
        }

        var coordList = {};

        eventData = {};

        // Based on FIRSTMap-scraper
        for (var event of events) {
            // Save all the events by key so they can be easily looked up later
            eventData[event.key] = event;

            // Skip event divisions
            if (event.parent_event_key !== null) {
                continue;
            }
            
            if (event.event_type == 0) {
                event.type = 'regional';
            } else if (event.event_type == 3 || event.event_type == 4) {
                event.type = 'championship';
            } else if (event.event_type > 98) {
                event.type = 'offseason';
            } else {
                event.type = 'district';
            }

            // Use fallback locations if the event does not have lat/lng
            // coordinates available from TBA API
            if (event.lat == null || event.lng == null) {
                var fallbackLoc = event_fallback_locs[event.key];

                if (fallbackLoc) {
                    event.lat = fallbackLoc.lat;
                    event.lng = fallbackLoc.lng;
                } else {
                    console.error(`Error: event "${event.name}" (${event.key}) does not` +
                        " have coordinates available from The Blue Alliance API or from" +
                        " event_fallback_locs.json. The event marker will be placed at 0,0");
                    event.lat = 0;
                    event.lng = 0;
                }
            }

            // Correct duplicate locations
            if (coordList[event.lat]) {
                if (coordList[event.lat][event.lng] !== undefined) {
                    var count = coordList[event.lat][event.lng];
                    coordList[event.lat][event.lng]++;

                    switch (count % 4) {
                        case 0:
                            event.lat += 0.0001 * (1 + Math.floor(count / 4));
                            event.lng -= 0.0001 * (1 + Math.floor(count / 4));
                            break;
                        case 1:
                            event.lat -= 0.0001 * (1 + Math.floor(count / 4));
                            event.lng -= 0.0001 * (1 + Math.floor(count / 4));
                            break;
                        case 2:
                            event.lat += 0.0001 * (1 + Math.floor(count / 4));
                            event.lng += 0.0001 * (1 + Math.floor(count / 4));
                            break;
                        case 3:
                            event.lat -= 0.0001 * (1 + Math.floor(count / 4));
                            event.lng += 0.0001 * (1 + Math.floor(count / 4));
                            break;
                    }
                } else {
                    coordList[event.lat][event.lng] = 0;
                }
            } else {
                coordList[event.lat] = { };
                coordList[event.lat][event.lng] = 0;
            }

            createEventMarker(event);
        }
    
        openURLKey(); // Show POST Argument Specified Marker

        // Get the list of all districts in case they are needed for filtering
        var [districts, err] = await getTBAQuery('/districts/' + CURRENT_YEAR);

        if (err && !districts) {
            console.error('Unable to load districts: ' + err);
            console.error('Filtering to districts will not work!');
        } else {
            if (err) {
                console.warn('Warning: there was an error, but districts were loaded from cache: ' + err);
            }
            districtList = districts;

            // Initialize search and filter, and filter
            // to what is set in the filter URL parameter
            initSearchFilter();
        }
    }


    map.addListener('center_changed', function() { // Bind POST Arguement Update to map position change
        lat = map.center.lat();
        lng = map.center.lng();

        if (markers.open) {
            if (Math.abs(lat - markers.open.position.lat()) < 0.000001) {
                params.delete('lat');
            } else {
                params.set('lat', lat);
            }

            if (Math.abs(lng - markers.open.position.lng()) < 0.000001) {
                params.delete('lng');
            } else {
                params.set('lng', lng);
            }
        } else {
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
        }
        
        pushHistory();
    });

    map.addListener('zoom_changed', function() { // Bind POST Argument Update to map zoom
        zoom = map.zoom;

        if (markers.open && zoom == 12) {
            params.delete('zoom');
        } else if (zoom == 2) {
            params.delete('zoom');
        } else {
            params.set('zoom', zoom);
        }

        pushHistory();
    });

    addKeyboardListener(); // Marker Toggling via Keyboard
}

function createEventMarker(event) { // Create an Event Marker on map
    var marker = new google.maps.Marker({
        position: {
            lat: event.lat,
            lng: event.lng
        },
        map: map,
        title: event.short_name || event.name,
        icon: {
            url: 'img/' + event.type + '.png',
            scaledSize: new google.maps.Size(30, 30)
        },
        visible: state[event.type], // Set starting visibility based on defined state
        key: event.key,
        type: event.type
    });

    google.maps.event.addListener(marker, 'click', function() {
        openMarkerInfo(marker);
    });

    markers.all.push(marker);
    markers.keys[event.key] = marker;
}

function createTeamMarker(team) { // Create a Team Marker on map
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
    
    // Choose which logo to show:  Default, Defined, or FIRST Avatar
    var image = 'img/team.png'; // Default
    var scaledSize = new google.maps.Size(38, 23);
    var size = undefined;
    var origin = undefined;

    var allow_logos = !(params.get('logos') == 'false'); // POST Argument forces Default

    if (allow_logos) {
        // Prioritize FIRST avatars over manually submitted logos
        if (avatars.locations[team.team_number]) {
            // Scale factor of 0.75 resizes a 40x40 image to a 30x30 image
            const SCALE_FACTOR = 0.75;
            // The size of each FIRST avatar (before scaling) is 40x40
            const AVATAR_SIZE = 40;
            // Each sprite has a 2 pixel border between it and the next sprite
            // so that when the whole sprite sheet is resized with scaledSize,
            // the avatars do not bleed into each other around the edges
            const AVATAR_BORDER = 2;
            image = 'data/avatars.png'; // FIRST Avatar sprite sheet

            // scaledSize resizes the entire image (in this case the entire sprite sheet)
            // avatars.sheet_size is the width and height (in number of avatars)
            // of the sprite sheet. Multiplying that by AVATAR_SIZE gets the pixel
            // width/height, and multiplying by the SCALE_FACTOR gets the new
            // size of the sprite sheet.
            let newSheetSize = avatars.sheet_size * (AVATAR_SIZE + AVATAR_BORDER) * SCALE_FACTOR;
            scaledSize = new google.maps.Size(newSheetSize, newSheetSize);
            // Size refers to the size of the actual avatar, not the whole sprite sheet
            size = new google.maps.Size(30, 30);
            // Origin is the location of the top left corner of the avatar in the
            // sprite sheet, after scaling.
            var originX = avatars.locations[team.team_number].x * SCALE_FACTOR;
            var originY = avatars.locations[team.team_number].y * SCALE_FACTOR;
            origin = new google.maps.Point(originX, originY);
        } else if (icons.indexOf(team.team_number) !== -1) {
            image = 'logos/' + team.team_number + '.png'; // Defined
            scaledSize = new google.maps.Size(30, 30);
            size = undefined;
        }
    }

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: team.team_number.toString(),
        icon: {
            url: image,
            scaledSize: scaledSize,
            size: size,
            origin: origin
        },
        visible: state['team'], // Set starting visibility based on defined state
        key: 'frc' + team.team_number,
        type: 'team'
    });

    google.maps.event.addListener(marker, 'click', function() {
        openMarkerInfo(marker);
    });

    markers.all.push(marker);
    markers.keys['frc' + team.team_number] = marker;
}

function openMarkerInfo(marker) {
    openInfo(marker);
    markers.open = marker;
    params.set('key', marker.key);
    pushHistory();
}

async function openInfo(marker) { // Create and show a Marker's InfoWindow
    var parsed, err;

    if (marker.type === 'team') { // TODO clean this up more
        [parsed, err] = await getTBAQuery('/team/' + marker.key);
    } else {
        // Get the event data from the cache because we don't really
        // need to call getTBAQuery for it again and then loop through
        // all the events for the correct one when we can just look it
        // up by key.
        parsed = eventData[marker.key];
        err = null;
    }

    if (parsed) {
        var content = document.createElement('div');
        var heading = document.createElement('h1');
        content.appendChild(heading);

        var shareLink = document.createElement('div');
        shareLink.classList.add('tooltipped', 'tooltipped-w', 'share_icon');
        shareLink.setAttribute('aria-label', 'Copy Share URL');

        if (marker.type == 'team') {
            // Heading with team name and number (linked to website, if available)
            var headingText = 'Team ' + parsed.team_number;
            headingText += parsed.nickname ? ' - ' + parsed.nickname : '';

            if (parsed.website) {
                var siteLink = document.createElement('a');
                siteLink.href = parsed.website;
                siteLink.innerText = headingText;

                heading.appendChild(siteLink);
            } else {
                heading.innerText = headingText;
            }

            // Append share link to heading
            heading.appendChild(shareLink);

            // Team motto
            if (parsed.motto) {
                var p = document.createElement('p');
                var em = document.createElement('em');
                em.innerText = parsed.motto;
                p.appendChild(em);
                content.appendChild(p);
            }

            // List
            var list = document.createElement('ul');

            // Location list item
            var locItem = document.createElement('li');
            locItem.innerHTML = '<strong>Location:</strong> ';
            var locText = parsed.city + ', ' + parsed.state_prov
                + (parsed.postal_code ? (' ' + parsed.postal_code) : '')
                + ', ' + parsed.country;
            locItem.appendChild(document.createTextNode(locText));
            list.appendChild(locItem);

            // Rookie year list item
            if (parsed.rookie_year) {
                var ryItem = document.createElement('li');
                ryItem.innerHTML = '<strong>Rookie year:</strong> ';
                ryItem.appendChild(document.createTextNode(parsed.rookie_year));
                list.appendChild(ryItem);
            }

            // TBA link list item
            var tbaItem = document.createElement('li');

            var tbaLink = document.createElement('a');
            tbaLink.href = 'http://thebluealliance.com/team/' + parsed.team_number;
            tbaLink.innerText = 'View on The Blue Alliance';
            tbaItem.appendChild(tbaLink);

            list.appendChild(tbaItem);

            content.appendChild(list);
        } else {
            // Event name and short name
            if (parsed.short_name) {
                heading.innerText = parsed.short_name;

                if (parsed.name != parsed.short_name) {
                    var fullName = document.createElement('h6');
                    fullName.innerText = parsed.name;
                    content.appendChild(fullName);
                }
            } else {
                heading.innerText = parsed.name;
            }
            // Append share link to heading
            heading.appendChild(shareLink);

            // List
            var list = document.createElement('ul');

            // District name (if part of a district) list item
            if (marker.type === 'district' && parsed.district) {
                var districtItem = document.createElement('li');
                districtItem.innerHTML += '<strong>District:</strong> ';
                districtItem.appendChild(document.createTextNode(parsed.district.abbreviation.toUpperCase()));
                list.appendChild(districtItem);
            }

            // Competition week (if available) list item
            if (parsed.week) {
                var weekItem = document.createElement('li');
                weekItem.innerHTML += '<strong>Week:</strong> ';
                weekItem.appendChild(document.createTextNode(parsed.week));
                list.appendChild(weekItem);
            }

            // Dates of competition list item
            var start = /*new Date(*/parsed.start_date/*).toLocaleDateString()*/;
            var end = /*new Date(*/parsed.end_date/*).toLocaleDateString()*/;

            var dateItem = document.createElement('li');
            dateItem.innerHTML = '<strong>Date:</strong> ';
            dateItem.appendChild(document.createTextNode(start + ' - ' + end));
            list.appendChild(dateItem);

            // TBA link list item
            var tbaLinkItem = document.createElement('li');
            var tbaLink = document.createElement('a');
            tbaLinkItem.appendChild(tbaLink);
            tbaLink.href = 'http://www.thebluealliance.com/event/' + marker.key;
            tbaLink.innerText = 'View on The Blue Alliance';
            list.appendChild(tbaLinkItem);

            content.appendChild(list);
        }

        try {
            var oldInfoWindow = document.getElementsByClassName('gm-style-iw')[0];
            oldInfoWindow.parentNode.parentNode.removeChild(oldInfoWindow.parentNode);
        } catch (e) { }

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
            e.trigger.addEventListener('mouseleave', function() {
                e.trigger.setAttribute('aria-label', 'Copy Share URL');
            });
            e.clearSelection();
        });

        clipboard.on('error', function(e) {
            actionMsg = '';

            if (/iPhone|iPad/i.test(navigator.userAgent)) { actionMsg = 'Unsupported Copy :/'; }
            else if (/Mac/i.test(navigator.userAgent)) { actionMsg = 'Press ⌘-c to copy'; }
            else { actionMsg = 'Press Ctrl-C to Copy'; }

            e.trigger.setAttribute('aria-label', actionMsg);
            e.trigger.addEventListener('mouseleave', function() {
                e.clearSelection();
                e.trigger.setAttribute('aria-label', 'Copy Share URL');
            });
        });

        infoWindow.addListener('closeclick', function() {
            if (params.get('key')) {
                markers.open = null;
                params.delete('key');
                pushHistory();
            }
            clipboard.destroy(); // Remove old Clipboard Instance when closing Info Window to prevent DOM overload
        });
    } else {
        console.error('There was an error loading the data: ' + err);
        return;
    }
}

function toggleMarkers(type) { // Toggle visibility of a given marker type
    state[type] = !state[type];
    updateMarkerVisibilityParam();
    updateVisibleMarkers();
}

function updateVisibleMarkers() {
    // Note: the check to marker.getVisible is done because without this,
    // all of the team markers being made visible disappear and reappear,
    // even if the marker was already visible.

    for (marker of markers.all) {
        // If there is a filter applied, check if the marker is within the filter,
        // otherwise only check if the marker's type is currently visible.
        var visibility = state[marker.type] && 
                            (!markers.filtered || markers.filtered[marker.key] !== undefined);
        
        if (marker.getVisible() !== visibility) {
            marker.setVisible(visibility);
        }
    }
}

function addKeyboardListener() { // Register toggle keybinds
    document.addEventListener('keyup', function (event) {
        // When the search menu is opened, the toggle keys should
        // not work because otherwise things are toggled when the
        // user starts to type in the search or filter boxes
        if (searchMenu.style.display !== 'none') {
            return;
        }

        switch (event.keyCode) {
            // Shift
            case 16:
                toggleAbout();
                break;
            // S
            case 83:
                toggleSearch();
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

function parseState() { // Parse Map State from URL POST Arguments
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
    } else if (visibility == 'none') { // "none" includes both "o" and "e" so must be checked before individual visibility
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

function updateMarkerVisibilityParam() { // Update URL with current Marker Visibility State
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
        params.set('visibility', now_visible.join('-'));
    }
    
    pushHistory();
}

function openURLKey() { // Handle Zoom / Reposition / Info Panel of URL specified marker key
    keyToOpen = params.get('key');
    if (!keyToOpen) return;
    markerToOpen = markers.keys[keyToOpen.toLowerCase()];
    if (!markerToOpen) return;

    markers.open = markerToOpen;

    if (!params.get('lat') && !params.get('lng')) {
        map.panTo(markerToOpen.getPosition());
    }

    if (!params.get('zoom')) {
        map.setZoom(12);
    }

    openInfo(markerToOpen);
}

function pushHistory() { // Push History State to URL
    function updateHist() {
    lastParamUpdate = Date.now();
        window.history.replaceState({'html':'','pageTitle':document.title},'', url.href);
    }

    clearTimeout(updateHist);

    var diff = Date.now() - lastParamUpdate;

    if (diff < paramUpdateDelay) {
        setTimeout(updateHist, paramUpdateDelay);
    } else {
        updateHist();
    }
}

function toggleMapFullscreen(forceOpen=false) { // Toggle fullscreen state of page.  If forceOpen, page will be forced to fullscreen
    fullscreenElement = document.documentElement; // Fullscreen entire page instead of just the map

    state.fullscreen = !state.fullscreen;

    if (state.fullscreen || forceOpen) { // Prefixes used for browser support
        if (fullscreenElement.requestFullscreen) {
            fullscreenElement.requestFullscreen();
        } else if (fullscreenElement.mozRequestFullScreen) {
            fullscreenElement.mozRequestFullScreen();
        } else if (fullscreenElement.webkitRequestFullscreen) {
            fullscreenElement.webkitRequestFullscreen();
        } else if (fullscreenElement.msRequestFullscreen) {
            fullscreenElement.msRequestFullscreen();
        }
    } else { // Prefixes used for browser support
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

if (document.addEventListener) { // Bind body class update to appropriate browser event
    document.addEventListener('webkitfullscreenchange', toggleFullscreenImage, false);
    document.addEventListener('mozfullscreenchange', toggleFullscreenImage, false);
    document.addEventListener('fullscreenchange', toggleFullscreenImage, false);
    document.addEventListener('MSFullscreenChange', toggleFullscreenImage, false);
}

function toggleFullscreenImage() { // Set body class to show appropriate image on fullscreen button
    if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
        document.getElementsByTagName('body')[0].setAttribute('class', 'fullscreen');
    } else {
        document.getElementsByTagName('body')[0].removeAttribute('class');
    }
}


// About & Search windows
var about = document.getElementById('about');
var searchMenu = document.getElementById('search');

// Handle About Window
function toggleAbout() { // Toggles About Window display state
    about.style.display = (about.style.display === 'block') ? 'none' : 'block';
    searchMenu.style.display = 'none';
}

// Handle Search Window
function toggleSearch() { // Toggles About Window display state
    about.style.display = 'none';
    searchMenu.style.display = (searchMenu.style.display === 'block') ? 'none' : 'block';
}

function toggleLogos() { // Toggles Custom Team Logos through page reload
    // Close About Window
    toggleAbout();
    
    // Toggle POST Argument state
    if (params.get('logos') == 'false') {
        params.delete('logos');
    } else {
        params.set('logos', 'false');
    }

    window.history.pushState({'html':'','pageTitle':document.title},'', url.href);
    updateDOMLogoToggleState();

    location.reload();
}

function updateDOMLogoToggleState() { // Updates Logo Toggle Button text
    if (params.get('logos') == 'false') {
        document.getElementById('toggle-logos').setAttribute('class', 'off');
    } else {
        document.getElementById('toggle-logos').setAttribute('class', 'on');
    }
}

updateDOMLogoToggleState(); // Update button text on page load
