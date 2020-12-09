let app;
let map;
let neighborhood_markers = 
[
    {location: [44.942068, -93.020521], marker: null},
    {location: [44.977413, -93.025156], marker: null},
    {location: [44.931244, -93.079578], marker: null},
    {location: [44.956192, -93.060189], marker: null},
    {location: [44.978883, -93.068163], marker: null},
    {location: [44.975766, -93.113887], marker: null},
    {location: [44.959639, -93.121271], marker: null},
    {location: [44.947700, -93.128505], marker: null},
    {location: [44.930276, -93.119911], marker: null},
    {location: [44.982752, -93.147910], marker: null},
    {location: [44.963631, -93.167548], marker: null},
    {location: [44.973971, -93.197965], marker: null},
    {location: [44.949043, -93.178261], marker: null},
    {location: [44.934848, -93.176736], marker: null},
    {location: [44.913106, -93.170779], marker: null},
    {location: [44.937705, -93.136997], marker: null},
    {location: [44.949203, -93.093739], marker: null}
];

function init() {
    let crime_url = 'http://localhost:8000';

    app = new Vue({
        el: '#app',
        data: {
            map: {
                center: {
                    lat: 44.955139,
                    lng: -93.102222,
                    address: ""
                },
                zoom: 12,
                bounds: {
                    nw: {lat: 45.008206, lng: -93.217977},
                    se: {lat: 44.883658, lng: -92.993787}
                }
            }
        }
    });

    map = L.map('leafletmap').setView([app.map.center.lat, app.map.center.lng], app.map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 11,
        maxZoom: 18
    }).addTo(map);
    map.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);
    
    let district_boundary = new L.geoJson();
    district_boundary.addTo(map);

    getJSON('data/StPaulDistrictCouncil.geojson').then((result) => {
        // St. Paul GeoJSON
        $(result.features).each(function(key, value) {
            district_boundary.addData(value);
        });
    }).catch((error) => {
        console.log('Error:', error);
    });



    //Update input box text when map is moved
    map.on('moveend', function () {
        //Update lat/long
        document.getElementById("long").value = map.getCenter().lng;
        document.getElementById("lat").value = map.getCenter().lat;

        //Update Address: make a call to Nominatim
        getJSON('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + map.getCenter().lat + '&lon=' + map.getCenter().lng).then((result) => {

            //Get address from result
            var road = result.address.road + ", ";
            var city = result.address.city + ", ";
            if (city === "undefined, "){
                city = "";
            }
            if (road === "undefined, "){
                road = "";
            }
            document.getElementById("addr").value = road + city + "MN";

        }).catch((error) => {
            console.log('Error:', error);
        });
    });
}

function getJSON(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            dataType: "json",
            url: url,
            success: function(data) {
                resolve(data);
            },
            error: function(status, message) {
                reject({status: status.status, message: status.statusText});
            }
        });
    });
}

$(document).ready(function(){
    //Update map when longitude/latitude is submitted
    $("#lnglat").submit(function(){
        var long = document.getElementById("long").value;
        var lat = document.getElementById("lat").value;

        //Clamp values to keep within bounds
        lat = clamp(lat, 44.883658, 45.008206);
        long = clamp(long, -93.217977, -92.993787)

        //Reset input values in case the values were outside the bounds
        document.getElementById("long").value = long;
        document.getElementById("lat").value = lat;

        //Pan map
        var latlng = L.latLng(lat, long);
        map.panTo(latlng);

        return false;
    });
    //Update map when address is submitted
    $("#address").submit(function(){
        var address = document.getElementById("addr").value;
        //var address = $(this).serialize();
        
        //Make a call to Nominatim
        getJSON('https://nominatim.openstreetmap.org/search?q=' + address + '&format=json').then((result) => {

            //Get Lat/Long from result
            var lat=result[0].lat;
            var long=result[0].lon;

            //Clamp values to keep within bounds
            lat = clamp(lat, 44.883658, 45.008206);
            long = clamp(long, -93.217977, -92.993787)

            //Pan map
            var latlng = L.latLng(lat, long);
            map.panTo(latlng);

        }).catch((error) => {
            console.log('Error:', error);
        });

        return false;
    });
});

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
