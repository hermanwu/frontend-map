//Yelp OAuth class
var YelpOAuth = function() {
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
      //parameters for search
      //parameters.push(['term', terms]);
      //parameters.push(['location', near]);
        ['callback', 'cb'],
        ['oauth_consumer_key', this.auth.consumerKey],
        ['oauth_consumer_secret', this.auth.consumerSecret],
        ['oauth_token', this.auth.accessToken],
        ['oauth_signature_method', 'HMAC-SHA1']
    ];
};

//Location class which represents each locations on the map
var Location = function(yelpRSSentry) {
    //console.log(yelpRSSentry.content);
    this.title = yelpRSSentry.title.substring(0, yelpRSSentry.title.indexOf(' ('));
    this.yelpId = yelpRSSentry.link.substring(yelpRSSentry.link.lastIndexOf("biz/")+4, yelpRSSentry.link.indexOf('?'));
    this.visibility = true;
    this.reviewUrl = yelpRSSentry.link;
    this.reviewContent = yelpRSSentry.content;
};

//Method to create markers of the location on the map
Location.prototype.createMarker = function() {

    var marker = new google.maps.Marker({
            map: map,
            icon: "img/yelp.png"
        });
    var infowindow = new google.maps.InfoWindow();

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });

    this.marker = marker;
    this.infowindow = infowindow;

    this.getYelpBusinessInfo(function(data){
        mapBounds.extend(data);
        map.fitBounds(mapBounds);
    });
};

// Method to use AJAX request to retrieve location information
Location.prototype.getYelpBusinessInfo = function(callback) {
    var self = this;
    var businessUrl = 'http://api.yelp.com/v2/business/' + this.yelpId;
    var message = {
                    'action': businessUrl,
                    'method': 'GET',
                    'parameters': yelpOAuth.parameters
                  }
   //var _accesor = this.accesor;
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, yelpOAuth.accesor);
    var parameterMap = OAuth.getParameterMap(message.parameters);
    parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);
    $.ajax({
        'url': message.action,
        'data': parameterMap,
        'cache': true,
        'dataType': 'jsonp',
        //'jsonpCallback': 'cb',
        'success': function(data, textStats, XMLHttpRequest) {
            var position = {
                lat: data.location.coordinate.latitude,
                lng: data.location.coordinate.longitude
            }

            self.marker.setPosition(position);
            self.title = data.name;
            //console.log(self);

            //console.log(data);
            console.log(self.reviewUrl);
            var yelpReview =  "<p>"  + self.reviewContent + " -> <a target='_blank' href=" + self.reviewUrl + "> read full review</a></p>";
            var yelpName = '<h3>' + data.name + '</h3>';
            var yelpStar = '<img src="' + data.rating_img_url + '" alt="yelp star rating"><br>';

            var contentHTML = yelpName + yelpStar + yelpReview;

            self.infowindow.setContent(contentHTML);

            var LatLngPoint = new google.maps.LatLng(position.lat, position.lng);

            callback(LatLngPoint);
        },
        'error': function(XMLHttpRequest, textStats, errorThrown){
            console.log(errorThrown);
        }
    });
};

// view model of Knockout.js
var ViewModel = function(){
    // assign model itself to this variable
    var self = this;

    self.searchBarText = ko.observable("");

    //self.places = ko.observableArray(locationArray);
    //console.log(locationArray);
    self.places = ko.mapping.fromJS(locationArray);


    self.searchBarText.subscribe(function(newValue) {
        self.match();
    });

    self.match = function() {
        var text = self.searchBarText().toLowerCase();
        ko.utils.arrayForEach(self.places(), function(place, index) {
            console.log(place);
            //console.log(locationArray[index].marker.visible);
            if (place.title().toLowerCase().search(text) < 0) {
                place.visibility(false);
                locationArray[index].marker.setVisible(false);
                locationArray[index].infowindow.close();
            }
            else {
                place.visibility(true);
                locationArray[index].marker.setVisible(true);
            }
        });
    }


    self.itemClicked = function(clickedItemIndex) {

        var clickedLocation = locationArray[clickedItemIndex];
        ko.utils.arrayForEach(self.places(), function(place, index) {
            locationArray[index].infowindow.close();
        });

        clickedLocation.infowindow.open(map, clickedLocation.marker);
        map.setCenter(clickedLocation.marker.getPosition());
    }
}




var yelpOAuth = new YelpOAuth();
//global google map variable
var map;
var mapBounds;
var locationArray;

var locationData = [
];

locationArray = [];
for (var i = 0; i < locationData.length; i ++){
    locationArray.push(new Location(locationData[i].title, locationData[i].yelpId));
}


//initialize map
google.maps.event.addDomListener(window, 'load', initialize);
//var viewModel = new ViewModel();

viewModel = new ViewModel();
console.log(viewModel.places);
ko.applyBindings(viewModel);

parseRSS("http://www.yelp.com/syndicate/user/HgpXQsxlmOmBc5q6gA2fDg/rss.xml");


// google map's initilization method
function initialize() {

    var mapOptions = {
        center: { lat: 38.9047, lng: -77.0164},
        zoom: 20,
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
      { "hue": "#00ddff" },
      { "visibility": "simplified" }
    ]
          }
        ]
    };

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    mapBounds = new google.maps.LatLngBounds();
    locationArray.forEach(function(location){
        location.createMarker();
    });
}



//ko.mapping.fromJS(locationArray.push(new Location("haha", "test")), viewModel);
//ko.mapping.fromJS(locationArray, this.places);

// url: http://www.yelp.com/syndicate/user/HgpXQsxlmOmBc5q6gA2fDg/rss.xml
function parseRSS(url) {
  $.ajax({
    url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + encodeURIComponent(url),
    dataType: 'json',
    success: function(data) {
      //ko.mapping.fromJS(locationArray, this.places);
    var data = data.responseData.feed;

    data.entries.forEach(function(yelpRSSentry){
        var yelpRSSLocation = new Location(yelpRSSentry);
        locationArray.push(yelpRSSLocation);
        ko.mapping.fromJS(locationArray, viewModel.places);
    });
    }
  });
}

