let app;
let map;
let flag = 0;
let crimes_per_nbhood = new Array(17).fill(0);
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
/*-----------Declare variables here------------
    for inside vue access: this.variablename
    outside vue access: this._data.variablename
*/            
            is_loaded:false,
            incidents: [],
            incident_types: new Map(),
            neighborhoods: new Map(),
            codes: new Map(),
            lat: 44.955139,
            lon: -93.102222,
            address: "",

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
        },
        //ALL MOUNTED() api calls will only run on initialization, cannot be called again
        //Copy and paste these into methods as functions to make another call to the db 
        mounted() {
            fetch("http://localhost:8000/neighborhoods")
            .then(response => response.json())
            .then((data) => {
                //Builds a map for easy access to neighborhood name
                for (let i=0; i<data.length; i++){
                    this.neighborhoods.set(data[i].neighborhood_number, data[i].neighborhood_name);
                }
            });


            fetch("http://localhost:8000/codes")
            .then(response => response.json())
            .then((data) => {
                for (let i=0; i<data.length; i++){
                    this.codes.set(data[i].code, data[i].incident_type);
                }
            });

            fetch("http://localhost:8000/incidents")
            .then(response => response.json())
            .then((data) => {
                this.incidents = data;
                let nbh_num = 0;
                //Janky but functional way to add neighborhood name and incident type to incidents array
                for (let i=0; i<this.incidents.length; i++){
                    nbh_num  = this.incidents[i].neighborhood_number;
                    crimes_per_nbhood[nbh_num]++;
                    this.incidents[i].neighborhood_name = this.neighborhoods.get(this.incidents[i].neighborhood_number);
                    this.incidents[i].incident_type = this.codes.get(this.incidents[i].code);
                }
                //Need a delay otherwise will get errors
                this.is_loaded = true;
                flag = 1;
            });

           
        },
        //To call methods outside vue instance: app.updateMapLtLn(params)
        methods: {
            updateMapLtLn(lat, lon) {
                console.log('updateMapLtLn called');
                lat = clamp(lat, this.map.bounds.se.lat, this.map.bounds.nw.lat);
                lon = clamp(lon, this.map.bounds.se.lng, this.map.bounds.nw.lng);
                fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon)
                .then(response => response.json())
                .then((data) => {
                    this.address = data.display_name;
                    onMapUpdate(this.lat, this.lon);
                });
            },
            updateMapAddr(address) {
                //Tests for input: 44.955139, -93.102222
                //Pelham Boulevard, Saint Paul, Ramsey County, Minnesota, 55104, United States of America
                console.log('update Map Addr called: ' + address);
                fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + address)
                .then(response => response.json())
                .then((data) => {
                    /*while(1){
                        if (data[0])
                    }*/
                    this.address = data[0].display_name;
                    this.lat = data[0].lat;
                    this.lon = data[0].lon;
                    onMapUpdate(this.lat, this.lon);
                });
            }
        },
/*  - Buttons changeLat and changeLon are not implemented yet, they should just increment 
      lat and lon and then pass them to updateMapLtLn.
    - v-model.lazy="varname" binds to data vars in vue instance
    - v-on:click="methodcall()"
    - v-for="item in items" parses through an array, to keep a counter use (items, i) where item was
*/
        template: `
            <div v-if="this.is_loaded">
                <p>Lat: </p>
                <button v-on:click="changeLat(lat,0)">-</button>
                <button v-on:click="changeLat(lat,1)">+</button>
                <input v-model.lazy="lat"/>
                <p>Lon: </p>
                <button v-on:click="changeLon(lon,0)">-</button>
                <button v-on:click="changeLon(lon,1)">+</button>
                <input v-model.lazy="lon"/>
                <button v-on:click="updateMapLtLn(lat, lon)">Find Lat/Lng</button>
                <p>{{address}}</p>
                <button v-on:click="updateMapAddr(address)">Find Address</button>
                <table>
                    <tr>
                        <th>Number</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Incident</th>
                        <th>Incident Desc.</th>
                        <th>Neighborhood Name</th>
                    </tr>
                    <tr v-for="(incident, i) in incidents" :key="i">
                        <td>{{i + 1}}<td>
                        <td>{{incidents[i].date.replaceAll("-", ", ")}}</td>
                        <td>{{incidents[i].time}}</td>
                        <td>{{incidents[i].incident}}</td>
                        <td>{{incidents[i].incident_type}}</td>
                        <td>{{incidents[i].neighborhood_name}}</td> 
                    </tr>
                </table>
            </div> `
    });

/*----------------------------------Map Initialization---------------------------------------------*/
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


/*----------------- Setting neighborhood markers -------------------*/
    function checkFlag() {
        if(flag == false) {
           window.setTimeout(checkFlag, 400); /* this checks the flag every 100 milliseconds*/
        } else {
            var markers = [];
            for (let i=0; i<neighborhood_markers.length; i++){
                markers[i] = L.marker([neighborhood_markers[i]['location'][0], neighborhood_markers[i]['location'][1]]);
                markers[i].bindPopup("<b>"+ app._data.neighborhoods.get(i+1) +"</b><br>Crimes: " + crimes_per_nbhood[i]);
                markers[i].addTo(map);
            }
        }
    }
    checkFlag();


/*-------------------- Map Pan Change -------------------*/

    function onMapClick(e) {
        app._data.lat = clamp(e.latlng.lat, 44.883658, 45.008206);
        app._data.lon = clamp(e.latlng.lng, -93.217977, -92.993787);
        app.updateMapLtLn(app._data.lat, app._data.lon);
    }

//Testing input
//Pelham Boulevard, Saint Paul, Ramsey County, Minnesota, 55104, United States of America
    function onMapUpdate(lat, lon){
        lat = clamp(lat, 44.883658, 45.008206);
        lon = clamp(lon, -93.217977, -92.993787);
        
        app._data.lat = lat;
        app._data.lon = lon;
        //Pan map
        var latlng = L.latLng(lat, lon);
        map.panTo(latlng);
    }

    map.on('click', onMapClick);
    
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

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
