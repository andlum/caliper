$(document).ready(function() {

  var Caliper = (function() {
    var markers = {},
        route, map;

    function init() {
      map = loadGMaps();
      bindUIActions();
      retrieveData();
    }

    function loadGMaps() {
      var mapOptions = {
        center: new google.maps.LatLng(37.7127, -95.0059),
        zoom: 4,
        minZoom: 3,
        mapTypeControl: false,
        streetViewControl: false
      };
      return new google.maps.Map(document.getElementById("map"), mapOptions);
    }

    function bindUIActions() {
      $(".autocomplete").blur(function(){
        if (!this.value) {
          clearMap(this);
          $(".distance").fadeOut("slow");
        }
      });
    }

    function retrieveData() {
      var airports = [];
      $.getJSON("data/airports.json", function(data) {
        $.each(data, function(k, v){
          if (v.type === "Airports" && v.country === "United States") {
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
      }).done(function(){
        attachAutocomplete(airports);
      });
    }

    function attachAutocomplete(data) {
      $(".autocomplete").autocomplete({
        source: function(request, response) {
          if (request.term.length > 1) {
            response(autocompleteMatch(request, data));
          }
        },
        select: function(event, ui) {
          clearMap(this);
          markers[this.id] = new dropMark(ui);
          if (markers["from"] && markers["to"]) {
            updateDistance(getDistance());
            route = drawRoute();
          }
          this.blur();
        },
        autoFocus: true,
        change: function(event, ui) {
          if (!ui.item) {
            this.value = '';
          }
        }
      }).each(function(){
        $(this).data('ui-autocomplete')._renderItem = autocompleteRender;
      });
    }

    function autocompleteMatch(request, data) {
      var term = $.ui.autocomplete.escapeRegex(request.term),
          startsWithMatcher = new RegExp("^" + term, "i"),
          containsMatcher = new RegExp(term, "i"),
          startsWith = $.grep(data, function(value) {
            return startsWithMatcher.test(value.value) ||
                   startsWithMatcher.test(value.label) ||
                   startsWithMatcher.test(value.city);
          }),
          contains = $.grep(data, function(value) {
            return containsMatcher.test(value.value) ||
                   containsMatcher.test(value.label) ||
                   containsMatcher.test(value.city) ||
                   containsMatcher.test(value.icao);
          });
      return $.unique(startsWith.concat(contains));
    }

    function autocompleteRender(ul, item) {
        return $("<li></li>")
          .data("item.autcomplete", item)
          .append(
            "<a><strong>" + item.value + "</strong> &#8226; " + item.city + ", " + item.state + "<br>" + item.label + "</a>")
          .appendTo(ul);
      }

    function getDistance() {
      return (google.maps.geometry.spherical.computeDistanceBetween(markers["from"].position, markers["to"].position))/1000;
    }

    function updateDistance(dist) {
      $(".distance").fadeOut("slow", function(){
        $(".kmDistance").html(dist.toFixed(2));
        $(".nmDistance").html((dist/1.852).toFixed(2));
      });
      $(".distance").fadeIn("slow");
    }

    function dropMark(ui) {
      return new google.maps.Marker({
        position: new google.maps.LatLng(ui.item.latitude, ui.item.longitude),
        map: map,
        animation: google.maps.Animation.DROP,
        title: ui.item.value
      });
    }

    function drawRoute() {
      var departure = markers["from"].position,
          destination = markers["to"].position,
          route = new google.maps.Polyline({
            path: [departure, destination],
            geodesic: true,
            strokeColor: '#FC6E51',
            strokeOpacity: 1,
            strokeWeight: 1,
            icons: [{
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 1,
                strokeColor: '#FF0000'
              },
              offset: '100%'
            }],
            map: map
          });
      animate(departure, destination, route);
      return route;
    }

    function clearMap(el) {
      if (markers[el.id]) {
        markers[el.id].setMap(null);
      }
      if (route) {
        route.setMap(null);
      }
    }

    function animate(departure, destination, line) {
      var step = 0,
          numSteps = 500,
          icons = line.get('icons'),
          interval = setInterval(function() {
            step = (step + 1) % numSteps;
            if (step > numSteps) {
              clearInterval(interval);
            } else {
              head = google.maps.geometry.spherical.interpolate(departure,destination,step/numSteps);
              line.setPath([departure, head]);
            }
          }, 20);
    }

    return {
      init: init,
      getDistance: getDistance
    };

  })();

  Caliper.init();

});
