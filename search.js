'use strict';

// ===== Filter / search user-interface stuff =====

var searchBar;
var searchBarTeams = document.getElementById('teamSearchInput');
var searchBarEvents = document.getElementById('eventSearchInput');

var filterBar;
var filterBarTeams = document.getElementById('filterInputTeams');
var filterBarEventDistrict = document.getElementById('filterInputOther');

var searchBarList = document.getElementById('eventSearchList');
var filterBarList = document.getElementById('filterInputList');

var searchType = document.getElementById('searchType');
var filterType = document.getElementById('filterType');

var searchInfoText = document.getElementById('searchInfoText');
var filterInfoText = document.getElementById('filterInfoText');

var searchBarObj;
var filterBarObj;

// Called when the filter type is changed. Makes the correct filter
// bar visible, and updates the information (fills in districts
// or events in the dropdown, depending on the search type).
function updateFilterType() {
    var type = filterType.value;

    if (type === 'team') {
        document.getElementById('teamFilter').hidden = false;
        document.getElementById('eventDistrictFilter').hidden = true;
        filterBar = filterBarTeams;
    } else {
        document.getElementById('teamFilter').hidden = true;
        document.getElementById('eventDistrictFilter').hidden = false;
        filterBar = filterBarEventDistrict;

        while (filterBarList.firstChild) {
            filterBarList.removeChild(filterBarList.firstChild);
        }

        if (type === 'event') {
            // Add all events to dropdown
            addEventsToList(filterBarList);
        } else {
            // Add all districts to dropdown
            addDistrictsToList(filterBarList);
        }
    }
}

// Called when the search type is changed. Makes the correct
// search bar visible.
function updateSearchType() {
    var type = searchType.value;

    if (type === 'team') {
        document.getElementById('teamSearch').hidden = false;
        document.getElementById('eventSearch').hidden = true;
        searchBar = searchBarTeams;
    } else {
        document.getElementById('teamSearch').hidden = true;
        document.getElementById('eventSearch').hidden = false;
        searchBar = searchBarEvents;
    }
}

// Called when the clear filter button is clicked.
function clearFilterClick() {
    filterBar.value = '';
    clearFilter();
}

// Makes it so pressing enter in the team search
// or filter inputs triggers a search or filter.
function inputKeyUp(input) {
    if (event.key === 'Enter') {
        if (input === filterBarTeams) {
            filter();
        } else if (input === searchBarTeams) {
            search();
        }
    }
}

function addOptionsToList(options, list) {
    let option = document.createElement('li');
    option.dataset.value = '';
    option.innerText = 'None';
    list.appendChild(option);

    // Sort all the options alphabetically
    options.sort((a, b) => a.innerText.localeCompare(b.innerText));

    for (let option of options) {
        list.appendChild(option);
    }
}

function addDistrictsToList(list) {
    // Add all districts to dropdown
    let option;
    let options = [];

    for (let district of districtList) {
        option = document.createElement('li');
        option.dataset.value = district.key;
        option.innerText = district.display_name + ' [' + district.key + ']';

        options.push(option);
    }

    addOptionsToList(options, list);
}

function addEventsToList(list) {
    // Add all events to dropdown
    let option;
    let options = [];

    for (let eventKey in eventData) {
        if (eventData.hasOwnProperty(eventKey)) {
            let event = eventData[eventKey];

            option = document.createElement('li');
            option.dataset.value = event.key;
            option.innerText = event.name + ' [' + event.key + ']';

            options.push(option);
        }
    }

    addOptionsToList(options, list);
}

// ===== Filtering and searching code =====

// Initialize all the filtering and searching stuff. This
// is called after all the team and event markers exist.
function initSearchFilter() {
    // Better to leave these hidden until this function is called, so the user
    // cannot type in them or anything if they open the dialog really quickly.
    document.getElementById('searchSection').hidden = false;
    document.getElementById('filterSection').hidden = false;

    updateSearchType();
    updateFilterType();

    // Add all events to search dropdown
    addEventsToList(searchBarList);

    searchBarObj = new SearchableSelect(document.getElementById('eventSearch'), function(value) {
        search(value, searchType.value);
    });

    filterBarObj = new SearchableSelect(document.getElementById('eventDistrictFilter'), function(value) {
        // Disable the filter bar while filtering is processing
        filterBar.disabled = true;
        filterType.disabled = true;

        if (value === '') {
            clearFilter();
            filterBar.value = '';
        } else {
            filter(value, filterType.value);
        }
    });

    // Filter to what is set in the filter URL parameter
    filterToParam();
}

// Loads the filter URL parameter and updates the
// filter to show it.
function filterToParam() {
    var filterKey = params.get('filter');

    if (filterKey && filterKey.length > 2) {
        var type = '';
        filterKey = filterKey.toLowerCase();

        if (filterKey.startsWith('t-')) {
            type = 'team';
        } else if (filterKey.startsWith('e-')) {
            type = 'event';
        } else if (filterKey.startsWith('d-')) {
            type = 'district';
        } else {
            clearFilter();
            return;
        }

        var key = filterKey.slice(2);

        filterType.value = type;
        updateFilterType();

        if (type == 'team') {
            filterBar.value = key;
            filter(key, type);
        } else {
            // Doing this triggers the onSelect callback, so
            // it automatically refilters. Therefore, we do not
            // have to call filter after setting the selection.
            filterBarObj.setSelection(key);
        }
    }
}

function setFilterParam(type, query) {
    var filter;

    if (type == 'team') {
        filter = 't-';
    } else if (type == 'event') {
        filter = 'e-';
    } else if (type == 'district') {
        filter = 'd-';
    }

    if (!filter || !query) {
        params.delete('filter');
    } else {
        filter += query;
        params.set('filter', filter);
    }

    pushHistory();
}

function search(query, type) {
    if (!query && !type) {
        query = searchBar.value;
        type = searchType.value;
    }

    if (!query) {
        searchInfoText.innerText = 'Please enter search text.';
        return;
    }

    query = query.toLowerCase();

    var key;

    if (type === 'team') {
        key = 'frc' + query;
    } else if (type === 'event') {
        key = query;
    } else {
        return;
    }
    
    var marker = markers.keys[key];

    if (marker) {
        // Don't open the marker InfoWindow if the marker is
        // not currently visible.
        if (!marker.getVisible()) {
            searchInfoText.innerText = 'Error: ' + type + ' \'' + query + '\' not found within filtered visibility.';
            return;
        }

        openMarkerInfo(marker);
        searchInfoText.innerText = '';
    } else {
        searchInfoText.innerText = 'Error: ' + type + ' \'' + query + '\' not found.';
    }
}

function failFilter(error) {
    filterInfoText.innerText = error;
    console.log(error);
    clearFilter();
}

function filter(query, type) {
    if (!query && !type) {
        query = filterBar.value;
        type = filterType.value;
    }

    if (!query) {
        clearFilter();
        return;
    }

    filterInfoText.innerText = 'Filtering...';

    query = query.toLowerCase();

    if (type === 'team') {
        // Show all the events a team is attending / attended in the current season
        let teamKey = 'frc' + query;
        let marker = markers.keys[teamKey];

        getTBAQuery('/team/' + teamKey + '/events/' + CURRENT_YEAR + '/keys', function(events, err) {
            // (!marker && events.length == 0) means the team is not on the map,
            // and they are not registered for events this year.
            if (!events || (!marker && events.length == 0)) {
                failFilter('Error: team \'' + query + '\' not found.');
                return;
            }

            markers.filtered = {};

            // Team 9999 isn't on the map (since it's an offseason demo team)
            // but someone might still want to see what events it "attended,"
            // so I guess I'll just check if the marker exists here instead of
            // earlier.
            if (marker) {
                markers.filtered[teamKey] = marker;
            }

            events.forEach(key => {
                let parent = eventData[key].parent_event_key;

                if (parent) {
                    markers.filtered[parent] = markers.keys[parent];
                } else {
                    markers.filtered[key] = markers.keys[key];
                }
            });

            succeedFilter('team', query);

            updateVisibleMarkers();
            zoomFitVisible();
        });
    } else if (type === 'event') {
        // Show all the teams attending an event. This works for event divisions too.
        // If called with a parent event (e.g., Michigan State Championship), all teams
        // from all divisions are shown.
        let event = eventData[query];
        
        // If the event exists
        if (event) {
            function processTeams(teams) {
                // Take the list of all the teams and make them
                // (and the event marker) the only markers shown.
                markers.filtered = {};

                // If we are only showing teams from an event division,
                // we still have to show the parent event marker, since
                // divisions do not have their own markers.
                let parent = event.parent_event_key;

                if (parent) {
                    markers.filtered[parent] = markers.keys[parent];
                } else {
                    markers.filtered[query] = markers.keys[query];
                }


                teams.forEach(key => {
                    markers.filtered[key] = markers.keys[key];
                });

                succeedFilter('event', query);

                updateVisibleMarkers();
                zoomFitVisible();
            }

            let teamList;

            getTBAQuery('/event/' + query + '/teams/keys', function(teams, err) {
                if (err && !teams) {
                    failFilter('Error filtering to event with key \'' + query + '\'');
                    return;
                }

                teamList = teams;

                // If there are event divisions, get the teams from each division
                if (event.division_keys && event.division_keys.length > 0) {
                    let i = 0;

                    function getNextDiv() {
                        getTBAQuery('/event/' + event.division_keys[i] + '/teams/keys', function(teams, err) {
                            if (err && !teams) {
                                failFilter('Error: failure to get teams for event division \'' + + event.division_keys[i] + '\'');
                                return;
                            }

                            i++;
                            teamList = teamList.concat(teams);

                            if (i >= event.division_keys.length) {
                                processTeams(teamList);
                            } else {
                                getNextDiv();
                            }
                        });
                    }
                    getNextDiv();
                } else {
                    processTeams(teamList);
                }
            });
        } else {
            failFilter('Error: event with key \'' + query + '\' not found.');
            return;
        }
    } else if (type === 'district') {
        // Show all of the teams and events in the given district
        getTBAQuery('/district/' + query + '/teams/keys', function(teams, err) {
            if (err && !teams) {
                failFilter('Error: district with key \'' + query + '\' not found.');
                return;
            }

            getTBAQuery('/district/' + query + '/events/keys', function(events, err) {
                if (err && !events) {
                    failFilter('Error: failure to get events for district \'' + query + '\'');
                    return;
                }

                // Combine the list of teams and events to get a list of all
                // of the marker keys to show.
                var keys = teams.concat(events);

                markers.filtered = {};
    
                keys.forEach(key => {
                    // This prevents adding divisions to the filter list.
                    // Event divisions do not have markers, so
                    // markers.keys[key] will be undefined for divisions.
                    if (markers.keys[key]) {
                        markers.filtered[key] = markers.keys[key];
                    }
                });

                succeedFilter('district', query);
    
                updateVisibleMarkers();
                zoomFitVisible();
            });
        });
    }
}

// Called every time a filter succeeds. Clears the filter info / error
// message, sets the filter URL parameter, and re-enables the filter search
// bar and filter type dropdown menu so that the filter can be changed (it
// is disabled while filtering to ensure the user does not change the
// filter while it is still processing)
function succeedFilter(type, query) {
    setFilterParam(type, query);
    filterInfoText.innerText = '';
    filterBar.disabled = false;
    filterType.disabled = false;
}

// Called to clear the filter. Clears the filter URL parameter, re-enables
// the filter search bar and filter type dropdown menu, deletes the list of
// filtered markers, and updates marker visibility to reflect this.
function clearFilter() {
    filterBar.disabled = false;
    filterType.disabled = false;
    markers.filtered = null;
    setFilterParam('none', '');

    updateVisibleMarkers();
}

// Zooms the map to show only the current visible markers
function zoomFitVisible() {
    var bounds = new google.maps.LatLngBounds();
    var areMarkers = false;

    for (var marker of markers.all) {
        if (marker.getVisible()) {
            areMarkers = true;
            bounds.extend(marker.getPosition());
        }
    }

    // If there are no visible markers, don't change the zoom
    if (!areMarkers) {
        return;
    }

    // Set a minimum zoom. Otherwise, if there is only one marker,
    // it zooms in way too far. Must do in an event handler because
    // map.fitBounds is asynchronous.
    google.maps.event.addListenerOnce(map, 'bounds_changed', function(e) {
        if (this.getZoom() > 15) {
            this.setZoom(15);
        }
    });

    // Add minimum 30 pixel border so markers are not cut off
    map.fitBounds(bounds, 30);
}
