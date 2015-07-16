//YelpOAuth class
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
                      //parameter for search
                      //parameters.push(['term', terms]);
                      //parameters.push(['location', near]);
                      ['callback', 'cb'],
                      ['oauth_consumer_key', this.auth.consumerKey],
                      ['oauth_consumer_secret', this.auth.consumerSecret],
                      ['oauth_token', this.auth.accessToken],
                      ['oauth_signature_method', 'HMAC-SHA1']
                    ];
};



YelpOAuth.prototype.getYelpBusinessInfo = function(location, callback) {
    var businessUrl = 'http://api.yelp.com/v2/business/' + location.yelpId;
    var message = {
                    'action': businessUrl,
                    'method': 'GET',
                    'parameters': this.parameters
                  }
    var _accesor = this.accesor;
  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, _accesor);
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

        location.marker.setPosition(position);

        var yelpName = '<h3>' + data.name + '<h3>';
        var yelpStar = '<img src="' + data.rating_img_url + '" alt="yelp star rating">';

        var contentHTML = yelpName + yelpStar;

        //location.marker.setPosition(data)
        location.infowindow.setContent(contentHTML);
        //console.log(textStats);
        //console.log(data);
        //$("body").append(data);


        var LatLngPoint = new google.maps.LatLng(position.lat, position.lng);
        callback(LatLngPoint);
    },
    'error': function(XMLHttpRequest, textStats, errorThrown){
      console.log(errorThrown);
    }
  });
};



// global map variable
var map;

//initialize map
google.maps.event.addDomListener(window, 'load', initialize);

// location input
var locationData = [
        {
            title: "Maple Ave Restaurant",
            matchingIndex: 0,
            yelpId: 'maple-ave-restaurant-vienna'
        },
        {
            title: "Cava Mezze Grill",
            matchingIndex: 0,
            yelpId: 'cava-mezze-grill-mclean'
        },
        {
            title: "Nielsens Frozen Custard",
            matchingIndex: 0,
            yelpId: 'nielsens-frozen-custard-vienna'
        },
        {
            title: "Asia Taste",
            matchingIndex: 0,
            yelpId: 'asia-taste-rockville-3'
        }
];


var yelpOAuth = new YelpOAuth();

var Location = function(data){
    this.title = data.title;
    this.matchingIndex = data.matchingIndex;
    this.visibility = true;
    //var yelpOAuth = new YelpOAuth();

    this.yelpId = data.yelpId;

    //yelpOAuth.getYelpBusinessInfo(data.yelpId);
}

var locationArray = [];
for (var i = 0; i < locationData.length; i ++){
    locationArray.push(new Location(locationData[i]));

}




var ViewModel = function(){
    // assign model itself to this variable
    var self = this;

    self.searchBarText = ko.observable("");

    //self.places = ko.observableArray(locationArray);
    self.places = ko.mapping.fromJS(locationArray);


    for (var i = 0; i < self.places().length; i++) {
        //self.places()[i].visibility = ko.observable(true);
        //self.places()[i].visibility = ko.observable(self.places()[i].matchingIndex);
        console.log(self.places()[i].visibility);
    }


    self.searchBarText.subscribe(function(newValue) {
        self.match();

    });

    self.match = function() {
        //console.log(element);

        var text = self.searchBarText().toLowerCase();
        ko.utils.arrayForEach(self.places(), function(place, index) {
            console.log(locationArray[index].marker.visible);
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
}

ko.applyBindings(new ViewModel());



function initialize() {

    var mapOptions = {
          center: { lat: 38.9047, lng: -77.0164},
          zoom: 20
    };

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    var numOfLocation = locationArray.length;

    var bounds = new google.maps.LatLngBounds();

        for(var i = 0; i < numOfLocation; i++){
            createMarker(locationArray[i], bounds);

            /*
            var LatLngPoint = new google.maps.LatLng(locationArray[i].position.lat,
                locationArray[i].position.lng);
            latlngbounds.extend(LatLngPoint);
            */
        }

}

function createMarker(location, bounds) {
    var contentString = location.name;

    var marker = new google.maps.Marker({
            map: map
        //zIndex: Math.round(latlng.lat()*-100000)<<5
        });


   var infowindow = new google.maps.InfoWindow();

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });

    location.marker = marker;
    location.infowindow = infowindow;

    yelpOAuth.getYelpBusinessInfo(location, function(data){
        bounds.extend(data);
        map.fitBounds(bounds);
    });

}



