$(document).ready(function() {

  /* Initialize Google Maps*/
  var mapOptions = {
    center: new google.maps.LatLng(37.7127, -95.0059),
    zoom: 4,
    minZoom: 3,
    mapTypeControl: false,
    streetViewControl: false
  }

  var map = new google.maps.Map(document.getElementById("map"), mapOptions);

  var airports = [];
  var route;
  var markers = {};

  /* Grab data from local JSON file and attach autocomplete */
  $.getJSON("data/airports.json", function(data) {
    $.each(data, function(k, v){
      if (v.type == "Airports" && v.country == "United States") {
        airports.push({
          "value": v.code,
          "label": v.name,
          "city": v.city,
          "state": v.state,
          "country": v.country,
          "latitude": v.lat,
          "longitude": v.lon,
          "icao": v.icao
        });
      }
    });
  }).done(function(){ // attach autocomplete after getJSON is done since getJSON is an async call
    $(".autocomplete").autocomplete({
      source: function(request, response) {
        if (request.term.length > 1) {
          // Match to airport code, name, city, state, and icao
          var term = $.ui.autocomplete.escapeRegex(request.term);
          var startsWithMatcher = new RegExp("^" + term, "i");
          var containsMatcher = new RegExp(term, "i");
          var startsWith = $.grep(airports, function(value) {
            return results = startsWithMatcher.test(value.value)
                          || startsWithMatcher.test(value.label)
                          || startsWithMatcher.test(value.city)
                          || startsWithMatcher.test(value.icao);
          });
          var contains = $.grep(airports, function(value) {
            return results = containsMatcher.test(value.value)
                          || containsMatcher.test(value.label)
                          || containsMatcher.test(value.city)
                          || containsMatcher.test(value.icao);
          });
          response($.unique(startsWith.concat(contains)));
        }
      },
      select: function(event, ui) {
        markers[this.id] = new google.maps.Marker({
          position: new google.maps.LatLng(ui.item.latitude, ui.item.longitude),
          map: map,
          title: ui.name
        });
        if (markers["pointa"] != null && markers["pointb"] != null) {
          route = drawRoute();
          getDistance();
          $(".distance").removeClass("hidden");
        }
      }
    }).each(function(){ // data('ui-autocomplete') only finds first instance
      $(this).data('ui-autocomplete')._renderItem = customRender;
    });
  });

  // Customized _renderItem for autocomplete
  function customRender(ul, item) {
    return $("<li></li>")
      .data("item.autcomplete", item)
      .append(
        "<a><strong>" + item.value + "</strong> &#8226; " + item.city + ", " + item.state + "<br>" + item.label + "</a>")
      .appendTo(ul);
  }

  function drawRoute() {
    return new google.maps.Polyline({
      path: [markers["pointa"].position, markers["pointb"].position],
      geodesic: true,
      map: map,
      strokeColor: '#FC6E51',
      strokeOpacity: 0,
      strokeWeight: 1,
      icons: [{
        icon: {
          path: 'M 0,-0.5 0,0.5',
          strokeWeight: 3,
          strokeOpacity: 1,
          scale: 3
        },
        offset: '100%',
        repeat: '10px'
      }]
    });
  }

  function getDistance() {
    var distance = (google.maps.geometry.spherical.computeDistanceBetween(markers["pointa"].position, markers["pointb"].position))/1000;
    $(".kmDistance").html(distance.toFixed(2));
    $(".nmDistance").html((distance/1.852).toFixed(2));
  }

  $(".autocomplete").blur(function(){
    if (!$(this).val()) {
      $(".distance").addClass("hidden");
      if (route != null){
        route.setMap(null);
      }
      if (this.id in markers) {
        markers[this.id].setMap(null);
        markers[this.id] = null;
      }
    }
  });

});
