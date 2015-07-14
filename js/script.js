var map;

var locationData = [
        {
            title: "Home",
            position: {lat: 38.9276490, lng: -77.2380320},
            matchingIndex: 0
        },
        {
            title: "Maple Ave Restaurant",
            position: {lat: 38.900498, lng: -77.266858},
            matchingIndex: 0
        },
        {
            title: "Cava Mezze Grill",
            position: {lat: 38.933868, lng: -77.17726},
            matchingIndex: 0
        },
        {
            title: "Nielsens Frozen Custard",
            position: {lat: 38.900899, lng: -77.267318},
            matchingIndex: 0
        },
        {
            title: "Asia Taste",
            position: {lat: 39.105290, lng: -77.157558},
            matchingIndex: 0
        }
];

var Location = function(data){
    this.title = data.title;
    this.position = data.position;
    this.matchingIndex = data.matchingIndex;
    this.visibility = true;
}

var locationArray = [];
for (var i = 0; i < locationData.length; i ++){
    locationArray.push(new Location(locationData[i]));
}


var markers = [];



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

    self.test = function(place) {
        //console.log(place.title);
        place.marker.open(map, place.marker);
    }

    self.searchBarText.subscribe(function(newValue) {
        self.match();
    });

    self.match = function() {
        //console.log(element);
        
        var text = self.searchBarText().toLowerCase();
        //console.log(self.searchBarText);
        //console.log(self.places);
        ko.utils.arrayForEach(self.places(), function(place) {
            if (place.title().toLowerCase().search(text) < 0) {
                place.visibility(false);
            }
            else {
                place.visibility(true);
            }
        });
    }


}

ko.applyBindings(new ViewModel());



function initialize() {

    var mapOptions = {
          center: locationArray[0].position,
          zoom: 13
        };

    map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);


    var latlngbounds = new google.maps.LatLngBounds();
    var numOfLocation = locationArray.length;


    for(var i = 0; i < numOfLocation; i++){
        /*
        var marker = new google.maps.Marker({
            map: map,
            position: locationArray[i].position,
            clickable: true
        });
        marker.info = new google.maps.InfoWindow({
            content: locationArray[i].title
        });
        locationArray[i].marker = marker;

        google.maps.event.addListener(marker, 'click', function() {
            this.info.open(map);
        });
        */
        var LatLngPoint = new google.maps.LatLng(locationArray[i].position.lat,
            locationArray[i].position.lng);
        latlngbounds.extend(LatLngPoint);
    }
    map.fitBounds(latlngbounds);
}

/*
function filter(element){
    var value = $(element).val().toLowerCase();
    $("#places > li").each(function(){
        var locationIndex = $("li").index($(this));
        var marker = locationArray[locationIndex].marker;
        if ($(this).text().toLowerCase().search(value) > -1) {
            $(this).show();
            marker.setVisible(true);

        }
        else{
            $(this).hide();
            marker.setVisible(false);
        }
    });
}
*/

google.maps.event.addDomListener(window, 'load', initialize);