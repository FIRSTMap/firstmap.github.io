(function() {
    var TBA_API_KEY = 'VCZM2oYCpR1s3OHxFbjdVQrtkk0LY1wcvyhH8hiNrzm1mSQnUn1t9ZDGyTqN4Ieq';

    var tbaCache = null;

    // Call this with the API query (Ex. /team/frc1234)
    // Query must start with a /
    window.getTBAQuery = async function(query) {
        var cached = tbaCache[query];

        if (cached && cached.expireTime > Date.now()) {
            // Copy the object before returning it so the cached version is not ever modified
            var copy = JSON.parse(JSON.stringify(cached.data));
            return [copy, null];
        }

        var resp = await fetch('https://www.thebluealliance.com/api/v3' + query, {
            headers: {
                'X-TBA-Auth-Key': TBA_API_KEY,
                'If-Modified-Since': cached && cached.lastModified ? cached.lastModified : undefined
            }
        });

        var newData = {};

        var cacheHeader = resp.headers.get('Cache-Control');
        var maxAgeData = [];

        if (cacheHeader) {
            maxAgeData = cacheHeader.split(',').filter(x => x.indexOf('max-age=') !== -1);
        }

        if (maxAgeData.length === 1) {
            // Get max age (seconds), convert to milliseconds, add to current time to get expireTime
            // I don't think max-age can ever return a negative number, but just to be safe, use Math.max
            var maxAgeMilli = Math.max(0, parseInt(maxAgeData[0].split('=')[1])) * 1000;
            newData.expireTime = Date.now() + maxAgeMilli;
        }

        if (resp.status === 200) {
            newData.lastModified = resp.headers.get('Last-Modified');
            newData.data = await resp.json();
            tbaCache[query] = newData;
            saveCache();

            var toReturn = JSON.parse(JSON.stringify(newData.data));
            return [toReturn, null];
        } else if (resp.status === 304) {
            // 304 not modified
            cached.expireTime = newData.expireTime;
            saveCache();
            // Copy it
            var toReturn = JSON.parse(JSON.stringify(cached.data));

            return [toReturn, null];
        } else {
            var error = 'Error: ' + resp.status + ' received from TBA attempting to process query '
                + query + '. ';

            if (cached) {
                error += 'Using cached data.';
            } else {
                error += 'No cached data available to use.'
            }

            var data;

            if (cached) {
                data = JSON.parse(JSON.stringify(cached.data));
            }

            return [data, error];
        }
    }

    function loadCache() {
        var stuff = localStorage.getItem('tbaData');

        var changed = false;

        if (!stuff) {
            stuff = '{}';
            changed = true;
        }

        tbaCache = JSON.parse(stuff);
    
        for (var itemKey in tbaCache) {
            if (tbaCache.hasOwnProperty(itemKey)) {
                // If the item is expired for more than 3 months, it probably isn't needed anymore,
                // so remove it from the cache. If it doesn't have an expireTime, there must be
                // something wrong, so remove it too.
                if (!tbaCache[itemKey].expireTime || tbaCache[itemKey].expireTime + 7776000000 < Date.now()) {
                    changed = true;
                    delete tbaCache[itemKey];
                }
            }
        }
    
        if (changed) {
            saveCache();
        }
    }

    function saveCache() {
        localStorage.setItem('tbaData', JSON.stringify(tbaCache));
    }

    loadCache();
})();