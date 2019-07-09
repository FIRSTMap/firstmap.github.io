'use strict';

// Filter / search user-interface stuff
var searchBar = document.getElementById('searchInput');
var filterBarTeams = document.getElementById('filterInputTeams');
var filterBarOther = document.getElementById('filterInputOther');
var filterBar;
var searchType = document.getElementById('searchType');
var filterType = document.getElementById('filterType');
var searchInfoText = document.getElementById('searchInfoText');
var filterInfoText = document.getElementById('filterInfoText');

function updateFilterType() {
    var type = filterType.value;

    if (type === 'team') {
        document.getElementById('teamFilter').hidden = false;
        document.getElementById('otherFilter').hidden = true;
        filterBar = filterBarTeams;
    } else {
        document.getElementById('teamFilter').hidden = true;
        document.getElementById('otherFilter').hidden = false;
        filterBar = filterBarOther;


        while (filterBarOther.firstChild) {
            filterBarOther.removeChild(filterBarOther.firstChild);
        }

        let option = document.createElement('option');
        option.value = '';
        option.text = 'None';
        filterBarOther.appendChild(option);

        var options = [];

        if (type === 'event') {
            // Add all events to dropdown

            for (let eventKey in eventData) {
                if (eventData.hasOwnProperty(eventKey)) {
                    let event = eventData[eventKey];

                    option = document.createElement('option');
                    option.value = event.key;
                    option.text = event.name + ' [' + event.key + ']';

                    options.push(option);
                }
            }
        } else {
            // Add all districts to dropdown
            for (let district of districtList) {
                option = document.createElement('option');
                option.value = district.key;
                option.text = district.display_name + ' [' + district.key + ']';

                options.push(option);
            }
        }

        // Sort all the options alphabetically
        options.sort((a, b) => a.text.localeCompare(b.text));

        for (let option of options) {
            filterBarOther.appendChild(option);
        }
    }
}

function clearFilterClick() {
    filterBar.value = '';
    clearFilter();
}

function inputKeyUp(input) {
    if (event.key === "Enter") {
        if (input === filterBarTeams) {
            filter();
        } else if (input === searchBar) {
            search();
        }
    }
}

// Filtering and searching code

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
        filterBar.value = key;
        
        filter(key, type, function(success) {
            if (!success) {
                clearFilter();
            }
        });
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
        return false;
    }
    
    var marker = markers.keys[key];

    if (marker) {
        if (markers.filtered && !markers.filtered[key]) {
            searchInfoText.innerText = 'Error: ' + type + ' \'' + query + '\' not found within filtered area.';
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

            setFilterParam('team', query);
            filterInfoText.innerText = '';

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

                setFilterParam('event', query);
                filterInfoText.innerText = '';

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

                var keys = teams.concat(events);

                markers.filtered = {};
    
                keys.forEach(key => {
                    // Event divisions do not have markers, so
                    // don't include them in the filter list
                    if (markers.keys[key]) {
                        markers.filtered[key] = markers.keys[key];
                    }
                });

                setFilterParam('district', query);
                filterInfoText.innerText = '';
    
                updateVisibleMarkers();
                zoomFitVisible();
            });
        });
    }
}

function clearFilter() {
    markers.filtered = null;
    setFilterParam('none', '');

    updateVisibleMarkers();
}

// Zooms the map to show only the current visible markers
function zoomFitVisible() {
    var bounds = new google.maps.LatLngBounds();

    for (var marker of markers.all) {
        if (marker.getVisible()) {
            bounds.extend(marker.getPosition());
        }
    }

    // Add minimum 30 pixel border so markers are not cut off
    map.fitBounds(bounds, 30);
}
