/**
 * jQuery plugin for changing your background to your most played or current playing artist in Last.Fm
 *
 * @author Jasper de Kroon
 * @licence Licensed under the MIT license
 */

(function ($) {
    //Global variables
    var $selector;
    //Default settings
    var settings = {
        userName: 'japperman',
        lastFmApiKey: '538b14cef51de928b93a93d4d1f3c0b4',
        echoNestApiKey: 'GJJSCIL0PREWNK21P',
        listeningPeriod: 'overall',
        excludeArtists: [],
        getCurrentTrack: false,
        setGrayscale: 0,
        backgroundBehavior: 'scroll',
        backgroundDivision: 1
    };
    //Methods
    var methods = {

        /**
         * Initializes the elements & variables
         * @param selector
         */
        init: function (selector) {
            $selector = selector;
            //Will look for either most played artists, or current playing track based on setting given
            if (settings.getCurrentTrack == true) {
                methods.lastFmRecentTracksHandler();
            } else {
                methods.lastFmMostPlayedHandler();
            }
        },

        /**
         * Handler for retrieving Last.fm data by recent tracks
         */
        lastFmRecentTracksHandler: function () {
            //JSON call (Last.fm) by recent tracks
            $.getJSON("http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=" + settings.userName +
                "&api_key=" + settings.lastFmApiKey + "&format=json&callback",
                function (recentTracksData) {
                    console.log("lastfm done");
                    //Turns JSON in array to retrieve values from '#text' and '@attr'
                    var recentTracksCheck = jQuery.makeArray(recentTracksData.recenttracks.track);
                    var artist = jQuery.makeArray(recentTracksData.recenttracks.track[0].artist);
                    artist = (artist[0]['#text']);
                    //Checks if track is currently playing and artist is not excluded, else searches for most played
                    if (recentTracksCheck[0]['@attr'] && jQuery.inArray(artist, settings.excludeArtists) == -1) {
                        //Encodes artist string to URI Component so special characters won't break link
                        artist = encodeURIComponent(artist);
                        methods.getArtistImageHandler(artist);
                    } else {
                        methods.lastFmMostPlayedHandler();
                    }
                });
        },

        /**
         * Handler for retrieving Last.fm data by most played
         */
        lastFmMostPlayedHandler: function () {
            //JSON call (Last.fm) by most played
            $.getJSON("http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=" + settings.userName +
                "&api_key=" + settings.lastFmApiKey + "&period=" + settings.listeningPeriod + "&format=json&callback",
                function (mostPlayedData) {
                    var artist;
                    //Loops through artists, makes var artists the first entry that isn't on the excluded then breaks from for loop
                    for (i = 0; i < mostPlayedData.topartists.artist.length; i++) {
                        if (jQuery.inArray(mostPlayedData.topartists.artist[i].name, settings.excludeArtists) == -1) {
                            artist = mostPlayedData.topartists.artist[i].name;
                            break;
                        }
                    }
                    artist = encodeURIComponent(artist);
                    methods.getArtistImageHandler(artist);
                });
        },

        /**
         * Handler for requests to Echo Nest. First gets artist ID, then uses artist ID to get images
         * @param artistName
         */
        getArtistImageHandler: function (artistName) {
            //JSON call (Echo Next) by artist name for getting artist id
            $.getJSON("http://developer.echonest.com/api/v4/artist/search?api_key=" + settings.echoNestApiKey + "&name="
                + artistName + "&callback", function (artistIdData) {
                //Checks if the artist has an ID. If not, prepend error message in body
                if ($(artistIdData.response.artists[0]).length !== 0) {
                    //JSON call (Echo Nest) by artist id for getting artist images
                    $.getJSON("http://developer.echonest.com/api/v4/artist/images?api_key=" + settings.echoNestApiKey + "&id="
                        + artistIdData.response.artists[0].id + "&format=json&callback&results=100", methods.setBackground)
                } else {
                    var error = "No images found for current artist";
                    $($selector).prepend(error);
                }
            });
        },

        /**
         * Sets the background image
         * @param artistImageData
         */
        setBackground: function (artistImageData) {
            //Checks if there is an image response. If not, prepend error message in body
            if ($(artistImageData.response.images).length == 0) {
                var error = "No images found for current artist";
                $($selector).prepend(error);
            }
            var backGroundImage;
            //Checks if an image with a reasonable size exists within artistImageData than makes that the image
            //Note: Not all images come with a height and width within the data, so this loop doesn't always yield results
            for (i = 0; i < $(artistImageData.response.images).length; i++) {
                if (artistImageData.response.images[i].width >= $(window).width() / 1.5) {
                    backGroundImage = artistImageData.response.images[i].url;
                    break;
                }
            }
            //If no suitable image is found in the loop, sets the image to the first image in the array
            if (backGroundImage == null) {
                backGroundImage = artistImageData.response.images[0].url;
            }
            //Creates a div and sets the lastfm-background class
            $($selector).wrapInner($("<div>", {
                class: "lastfm-background"
            }));
            var background = $(".lastfm-background");
            //background css settings for background
            background.css({
                height: $selector.height(),
                width: $selector.width(),
                background: "url(" + backGroundImage + ")",
                backgroundSize: background.width() / settings.backgroundDivision,
                backgroundAttachment: settings.backgroundBehavior,
                filter: "grayscale(" + settings.setGrayscale + "%)",
                "-webkit-filter": "grayscale(" + settings.setGrayscale + "%)",
                "-moz-filter": "grayscale(" + settings.setGrayscale + "%)",
                "-ms-filter": "grayscale(" + settings.setGrayscale + "%)",
                "-o-filter": "grayscale(" + settings.setGrayscale + "%)"
            });
        }
    };

    /**
     *
     * @param options
     *          :userName           Default: 'japperman'                            The Last.fm username to get data
     *          :lastFmApiKey       Default: '538b14cef51de928b93a93d4d1f3c0b4'     The Last.fm API key to use
     *          :echoNestApiKey     Default: 'GJJSCIL0PREWNK21P'                    The Echo Nest API key to use
     *          :listeningPeriod    Default: 'overall'                              The period to search data by. Options are: 'overall' | '7day' | '1month' | '3month' | '6month' | '12month'
     *          :excludeArtists     Default: []                                     Passed artists will be excluded, no background from said artists will appear
     *          :getCurrentTrack    Default: false                                  If set to true, it will change background to current playing artist. If no track is playing or playing artist is excluded, will search for most played.
     *          :setGrayscale       Default: 0                                      Set the grayscale percentage that you want your background to have
     *          :backgroundBehavior Default: 'scroll'                               Sets background attachment. All css settings for background-attachment are available, 'fixed' comes recommended
     *          :backgroundDivision Default: 1                                      The number of times the background appears among the width of the screen. Useful for resizing when image is low-res
     *
     * @returns {*}
     */
    $.fn.myLastFmBackground = function (options) {
        //If additional options are given, it will override existing options
        if (options) {
            settings = $.extend(settings, options);
        }
        //Initializes the plugin with the set scope
        methods.init(this);

        //Return this for jQuery chaining
        return this;
    };
})(jQuery);