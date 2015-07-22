"use strict";
// Yelp OAuth class with API credentials
var YelpCommunication = function() {
    this.auth = {
        consumerKey: "nsJaztWB593lsptA2C61gw",
        consumerSecret: "MDea2Xt-0joFt22F8DYqCo2pgcY",
        accessToken: "dCFwVSf6hSapbCrAf7Uyd9qsSsGWLvuc",
        accessTokenSecret: "Z5KK2Wq_89AUoKMr6Uc6kxDzDbc",
        serviceProvider: {signatureMethod: "HMAC-SHA1"}
    };
    this.accesor = {
        consumerSecret: this.auth.consumerSecret,
        tokenSecret: this.auth.accessTokenSecret
    };
    this.parameters = [
        ['callback', 'cb'],
        ['oauth_consumer_key', this.auth.consumerKey],
        ['oauth_consumer_secret', this.auth.consumerSecret],
        ['oauth_token', this.auth.accessToken],
        ['oauth_signature_method', 'HMAC-SHA1']
    ];
    this.rssUrl = "http://www.yelp.com/syndicate/user/HgpXQsxlmOmBc5q6gA2fDg/rss.xml";
};

// Method to get my recent yelp reviews through yelp RSS call
YelpCommunication.prototype.getRRS = function(){
    // Method to handle yelp API request error
    var yelpRequestTimeout = setTimeout(function() {
        $(".places-header").text("failed to retrieve review list");
        $(".internet-warning").css("display", "block");
    }, 5000);
    // Ajax call to get yelp review list
    $.ajax({
        url: document.location.protocol + "//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=" + encodeURIComponent(this.rssUrl),
        dataType: 'json',
        success: function(data) {
            // Clear the time out method if yelp request finsihes successfully
            clearTimeout(yelpRequestTimeout);
            // Handle the situation that RSS call returns nothing
            if (data === null || data.responseData === null) {
                $(".places-header").text("failed to retrieve review list");
            } else {
                data.responseData.feed.entries.forEach(function(yelpRSSentry){
                    // create location item based on RSS information
                    var yelpRSSLocation = new Location(yelpRSSentry);
                    locationArray.push(yelpRSSLocation);
                    // update observable array
                    ko.mapping.fromJS(locationArray, viewModel.places);
                });
            }
        }
    });
};

// Location class which parses yelp rss feedback
var Location = function(yelpRSSentry) {
    //console.log(yelpRSSentry);
    this.title = yelpRSSentry.title.substring(0, yelpRSSentry.title.indexOf(' ('));
    //parse the url to get location's yelp id, which will be used for yelp API call
    this.yelpId = yelpRSSentry.link.substring(yelpRSSentry.link.lastIndexOf("biz/")+4, yelpRSSentry.link.indexOf('?'));
    this.visibility = true;
    this.reviewUrl = yelpRSSentry.link;
    this.reviewContent = yelpRSSentry.content;
};

// Method to create markers and infobubbles of the location on the map
Location.prototype.createMarker = function() {
    // Set up reference class for callback function to use
    var self = this;
    // Instaniate marker with yelp icon
    var marker = new google.maps.Marker({
        map: map,
        icon: "img/yelp.png"
    });
    self.marker = marker;
    // Instaniate info bubble with custom style
    var infoBubble = new InfoBubble({
        shadowStyle: 1,
        backgroundColor: 'rgb(196,196,196)',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#0DF',
        backgroundClassName: 'transparent',
        maxWidth: 300,
        maxHeight: 200
    });
    self.infoBubble = infoBubble;
    // Add click listener to associate marker with the info bubble
    google.maps.event.addListener(marker, 'click', function() {
        // Close all open info bubble first
        locationArray.forEach(function(location){
            location.infoBubble.close();
        });
        // Open the info bubble once the marker icon is clicked
        infoBubble.open(map, marker);
    });
    // Retrieve location information using yelp API
    self.getYelpBusinessInfo(function(yelpAPIResponse){
        var position = {
            lat: yelpAPIResponse.location.coordinate.latitude,
            lng: yelpAPIResponse.location.coordinate.longitude
        };
        // Add marker to the map
        self.marker.setPosition(position);
        // Build info bubble's content
        var yelpLocationImage = "<img style='float: right; margin: 10px;' src='" + yelpAPIResponse.image_url + "' alt='location image'><br>";
        var yelpName = "<h2>" + self.title + "</h2>";
        var yelpStar = "<img src='" + yelpAPIResponse.rating_img_url + "' alt='yelp star rating'>";
        var yelpUrl =  "<h3><a target='_blank' href=" + yelpAPIResponse.mobile_url + ">view business details</a></h3>";
        var yelpReview =  "<p><i><b>My Review</i></b>: "  + self.reviewContent + " -> <a target='_blank' href=" + self.reviewUrl + "> read full review</a></p>";
        var contentHTML = yelpLocationImage + yelpName + yelpStar + yelpUrl +  yelpReview;
        // Add html content to the bubble
        self.infoBubble.setContent(contentHTML);
        // Extend google map's bound
        var LatLngPoint = new google.maps.LatLng(position.lat, position.lng);
        mapBounds.extend(LatLngPoint);
        map.fitBounds(mapBounds);
    });
};

// Method to use AJAX request to retrieve Yelp's location information
Location.prototype.getYelpBusinessInfo = function(callback) {
    var self = this;
    var businessUrl = "http://api.yelp.com/v2/business/" + self.yelpId;
    var message = {
        "action": businessUrl,
        "method": "GET",
        "parameters": yelpCommunication.parameters
    };
    // Set up API call's credentials
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, yelpCommunication.accesor);
    var parameterMap = OAuth.getParameterMap(message.parameters);
    parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);

    // Method to handle yelp API request error
    var yelpRequestTimeout = setTimeout(function() {
        $(".places-header").text("failed to get location information");
    }, 8000);

    // Retrieve yelp's location informaiton
    $.ajax({
        'url': message.action,
        'data': parameterMap,
        'cache': true,
        'dataType': 'jsonp',
        success: function(data) {
            // Clear the time out method if yelp request finsihes successfully
            clearTimeout(yelpRequestTimeout);
            callback(data);
        }
    });
};

// View model of Knockout.js
var ViewModel = function(){
    // Assign model itself to "self" avaiable to avoid confusion
    var self = this;
    // Instaniate obersable for search bar
    self.searchBarText = ko.observable("");
    // Map location array to oberservable array and obersvables accordingly
    self.places = ko.mapping.fromJS(locationArray);
    // Call "match" function whenever user starts to type in the location bar
    self.searchBarText.subscribe(function() {
        self.match();
    });
    // Method to check and filter reviews
    self.match = function() {
        // Change the search bar text to lower case
        var text = self.searchBarText().toLowerCase();
        // Check whether each review matches with the text in search bar
        ko.utils.arrayForEach(self.places(), function(place, index) {
            // If text does not match
            if (place.title().toLowerCase().search(text) < 0) {
                // Hide the review from the list
                place.visibility(false);
                // Hide the marker and close the info bubble on the map
                locationArray[index].marker.setVisible(false);
                locationArray[index].infoBubble.close();
            }
            // If text matches
            else {
                // Show the review on the list
                place.visibility(true);
                // Show the marker on the map
                locationArray[index].marker.setVisible(true);
            }
        });
    };

    // Method to trigger when a list item is clicked
    self.itemClicked = function(clickedItemIndex) {
        // Close all info bubble first
        locationArray.forEach(function(location){
            location.infoBubble.close();
        });
        // Get the corresponding location from the location array
        var clickedLocation = locationArray[clickedItemIndex];
        // Open the corresponding info bubble
        clickedLocation.infoBubble.open(map, clickedLocation.marker);
        // Center the info bubble on the map
        map.setCenter(clickedLocation.marker.getPosition());
    };
};

//Check internet connectivity
checkInternetConnection();

//global google map variable
var map;
var mapBounds;
var locationArray = [];
// Retrieve my latest yelp review through Yelp RSS call
var yelpCommunication = new YelpCommunication();
yelpCommunication.getRRS();

// Initialize map
google.maps.event.addDomListener(window, 'load', initialize);
// Instantiate view model
var viewModel = new ViewModel();
ko.applyBindings(viewModel);

// google map's initilization method
function initialize() {
    // set up map's options and style
    var mapOptions = {
        zoom: 0,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL,
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        scaleControl: true,
        styles: [
            {
                "stylers": [
                    { "invert_lightness": true },
                    // If I change it to #0DF, the map displays a different color (I believe Google is using a different algorithm to calculate the color).
                    { "hue": "#00DDFF" },
                    { "visibility": "simplified" }
                ]
            }
        ]
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    mapBounds = new google.maps.LatLngBounds();
    locationArray.forEach(function(location){
        // create location marker
        location.createMarker();
    });
}

//Check whether internet is connected
function checkInternetConnection() {
    setInterval(function() {
        $.ajax({
            // This url can be replaced with the actual server url
            url: "http://hermanwu.github.io/test-site/frontend-map/",
            cache: false,
            error: function(){
                console.log("Internet seems to be disconnected");
                $(".internet-warning").css("display", "block");
            },
            success: function() {
                $(".internet-warning").css("display", "none");
            },
        });
    }, 5000);
}