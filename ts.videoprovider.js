var CryptoJS,
    HTTPRequest;

const TAG = "[ VideoProvider ]";
var _providers = { 'youtube': true };

function _decodeYoutubeResponse(r) {
    var v=[];try{return(function(d,s,m,f,p,t,u){r=d(r)[m](/url_encoded_fmt_stream_map=([\s\S]+)/)
    [1][s](',');r[f](function(k){t={};k[s]('&')[f](function(i){(u=i[m](/^(quality|type|url)=/))&&
    (t[u[1]]=d(i[s]('=')[1])[m](/([^;]+)/)[1]);t.quality&&t.type&&t.url&&v[p](t);});});return v;}
    (decodeURIComponent,'split','match','forEach','push'));}catch(e){return v};
}

function _getYoutubeUrl(id, done) {
    if (!id) { return done(" Invalid parameter id", null); }
    if (!HTTPRequest) { return done(" Missing configuration HTTPRequest", null); }

    (new HTTPRequest({
            url: "http://youtube.com/get_video_info",
            method: "GET",
            success: handleYoutubeResponse,
            error: handleYoutubeError,
            data: { video_id: id }
    })).send();

    function handleYoutubeResponse(response) {
        var videos = _decodeYoutubeResponse(response); 
        if (videos.length === 0) { return done(" Unable to parse youtube video info", null); }

        /* Try to retrieve a good enough video, i.e. medium quality and not 3gpp */
        videos = videos.filter(function (v) { return ["video/webm", "video/x-flv"].indexOf(v.type) === -1; });
        videos.sort(function sortVideos(v, w) {
            var scores = { 0: 0, 1: 0 }; /* v = 0, w = 1 */
            
            [v, w].forEach(function (video, index) {
                (video.quality !== "medium") && (scores[index]  += 25);
                (video.quality === "small") && (scores[index] += 50);
                (video.type === "video/3gpp") && (scores[index] += 50);
            });

            if (scores[0] === scores[1]) { return 0; }
            return scores[0] > scores[1] && 1 || - 1;
        });
        done(null, videos[0].url);
    }

    function handleYoutubeError(e) { done(e, null); }
}

function _getLimelightUrl(id, done) {
    if (!id) { return done(" Invalid parameter id", null); }
    if (!HTTPRequest) { return done(" Missing configuration HTTPRequest", null); }
    if (!CryptoJS) { return done(" Missing configuration CryptoJS", null); }
    if (!_providers.limelight) { return done(" Missing configuration for Limelight", null); }

    /* First of all, build the limelight url */
    const EXPIRES = Math.floor(Date.now() / 1000 + 1000),
          BASE_URL = "api.videoplatform.limelight.com",
          CONF = _providers.limelight,
          PATH = '/rest/organizations/' + CONF.organizationId + '/media/' + id + '/encodings.json';
    
    var params = ['access_key=' + CONF.accessKey, 'expires=' + EXPIRES];
    params.push('signature=' + encodeURIComponent(CryptoJS.enc.Base64.stringify(
        CryptoJS.HmacSHA256(['get', BASE_URL, PATH, params.join('&')].join('|'), CONF.secretKey))));

    /* Then, send the request to their server */
    (new HTTPRequest({
        url: ['http://', BASE_URL, PATH, '?', params.join('&')].join(''),
        method: "GET",
        success: handleLimelightResponse,
        error: handleLimelightError
    })).send();

    function handleLimelightResponse(response) {
        if (!response.encodings) { return done(" Invalid response from Limelight server", null); }

        var url = response.encodings.filter(function(e) { 
            return e.primary_use === "MobileH264"; 
        })[0];

        if (!url) { return done(" No Limelight video found", null); }

        done(null, url.url);
    }

    function handleLimelightError(e) { done(e, null); }
}

function _configure(options) {
    options = options || {};

    /* Get External Dependencies */
    CryptoJS = options.CryptoJS;
    HTTPRequest = options.HTTPRequest;

    /* Get credentials for any provider. Only Limelight so far */
    options.providers && options.providers.forEach(function (provider) {
        if (!provider.name) { throw (TAG + " Invalid provider configuration. Name is missing"); }
        switch(provider.name) {
            case "limelight":
                if (!provider.secretKey) { throw (TAG + " Invalid Limelight conf. SecretKey is missing"); }
                if (!provider.accessKey) { throw (TAG + " Invalid Limelight conf. AccessKey is missing"); }
                if (!provider.organizationId) { throw (TAG + " Invalid Limelight conf. OrganizationId is missing"); }

                _providers["limelight"] = {
                    secretKey: provider.secretKey,
                    accessKey: provider.accessKey,
                    organizationId: provider.organizationId
                };
            break;
            case "youtube": break;
            default: throw (TAG + " Unreckognized provider :" + provider.name);
        }
    });
}

function _getVideoUrl(provider, id) {
    function then(success, error) {
        if (!_providers[provider]) { return error(TAG + " Unconfigured provider : " + provider); }

        ({ youtube: _getYoutubeUrl, limelight: _getLimelightUrl }[provider])(id, function (err, url) {
            if (err || !url) { return error(TAG + (err || " Internal error. Unable to retrieve the url")); }
            success(url);
        });
    }

    return { then: then };
}


/* --------- INTERFACE ---------- */

/**
 * Get a streamable url for a given video
 *
 * @param {String} provider The provider; only youtube and limelight so far.
 * @param {String} id The related video's id
 *
 * @return {Object} A lightweight promise-like object.
 *    @param {Function} then Function that actually execute the async request
 *    @param {Function} then.success success callback, take one parameter which is the requested url.
 *    @param {Function} then.error error callback, on parameter which is the error message.
 */
exports.getVideoUrl = _getVideoUrl;

/**
 * Configure the module. i.e., inject dependencies and supply providers keys
 *
 * @params {Object} options 
 *    @params {Object} options.CryptoJS An implementation of CryptoJS with SHA256 algs
 *    @params {Object} options.HTTPRequest An implementation of the HTTPRequest module
 *    @params {Array} options.providers A list of providers configuration. 
 *       @params {Object} options.providers.provider Abstract representation of a provider
 *          @params {String} options.providers.provider.name The provider name
 *          
 *          [limelight]
 *          @params {String} options.providers.provider.secretKey
 *          @params {String} options.providers.provider.accessKey
 *          @params {String} options.providers.provider.organizationId
 */
exports.configure = _configure;
