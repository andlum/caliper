$(document).ready(function() {

  /* Initialize Google Maps*/
  var mapOptions = {
    center: new google.maps.LatLng(37.7127, -95.0059),
    zoom: 4,
    minZoom: 3,
    mapTypeControl: false,
    streetViewControl: false
  };

  var map = new google.maps.Map(document.getElementById("map"), mapOptions);

  var airports = [],
      markers = {},
      route;

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
          var term = $.ui.autocomplete.escapeRegex(request.term),
              startsWithMatcher = new RegExp("^" + term, "i"),
              containsMatcher = new RegExp(term, "i"),
              startsWith = $.grep(airports, function(value) {
                return startsWithMatcher.test(value.value) ||
                       startsWithMatcher.test(value.label);
              }),
              contains = $.grep(airports, function(value) {
                return containsMatcher.test(value.value) ||
                       containsMatcher.test(value.label) ||
                       containsMatcher.test(value.city) ||
                       containsMatcher.test(value.icao);
              });
          response($.unique(startsWith.concat(contains)));
        }
      },
      select: function(event, ui) {
        // Move to separate function for blur
        $el = $(this)[0];
        reset($el);
        markers[$el.id] = new dropMark($el, ui);
        route = drawRoute();
        this.blur();
      },
      autoFocus: true,
      change: function(event, ui) {
        if (!ui.item) {
          this.value = '';
        }
      }
    }).each(function(){
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
    if (markers["from"] && markers["to"]) {
      getDistance();
      return new google.maps.Polyline({
        path: [markers["from"].position, markers["to"].position],
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
  }

  function getDistance() {
    var distance = (google.maps.geometry.spherical.computeDistanceBetween(markers["from"].position, markers["to"].position))/1000;
    $(".kmDistance").html(distance.toFixed(2));
    $(".nmDistance").html((distance/1.852).toFixed(2));
    $(".distance").removeClass("hidden");
  }

  function dropMark(el, ui) {
    return new google.maps.Marker({
      position: new google.maps.LatLng(ui.item.latitude, ui.item.longitude),
      map: map,
      title: ui.item.value
    });
  }

  function reset(el) {
    if (markers[$el.id]) {
      markers[$el.id].setMap(null);
    }
    if (route) {
      route.setMap(null);
    }
    $(".distance").addClass("hidden");
  }

  $(".autocomplete").blur(function(){
    if (!this.value) {
      reset();
    }
  });

});
