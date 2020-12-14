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


/*--------------------Select Date/Time Component (probably move this to new file and need to split up date and time) --------------*/
Vue.component('select-date-component', {
    data: function() {
        return { date: 0},
        {
            years: [2014,2015,2016,2017,2018,2019,2020],
            big_months: [1, 3, 5, 7, 8, 10, 12],
            lp_feb_flg: 0,
            feb_flg: 0,
            bigm_flg: 0,
            year: 0,
            month: 0,
            hour: 0,
            min: 0,
            sec: 0,
            day: 0,     
        }
    },
    props: ['date'],
    methods: {
        showDays: function(year, month){
            console.log('this.months: ' + this.month);
            if((this.year == 2020 || this.year == 2016) && this.month == 2){
                this.lp_feb_flg = 1;
                console.log('lp_feb_flg');
            }else if(this.month == 2){
                this.lp_feb_flg = 0;
                this.bigm_flag = 0;
                this.feb_flg = 1;
            }else if(this.big_months.includes(parseInt(this.month))){
                this.feb_flg = 0;
                this.lp_feb_flg = 0;
                this.bigm_flg = 1;
                console.log('hits big case');
            }else{
                this.lp_feb_flg = 0;
                this.feb_flg = 0;
                this.bigm_flg = 0;
            }
            console.log('leap', this.lp_feb_flg);
            console.log('big', this.bigm_flg);
            console.log('feb', this.feb_flg);
        },
        packDate: function(year, month, day, hour, min, sec){
            this.date = year + "-";
            if (month < 10 ){
                this.date += "0" + month + "-";
            }else{this.date+=month+'-';}
            if (day < 10 ){
                this.date += "0" + day+"T";
            }else{this.date+=day+"T";}
            if (hour < 10) {
                this.date += "0" + hour;
            }else{this.date+=hour;}
            this.date+=":";
            if (min < 10){
                this.date += "0" + min;
            }else{this.date+=min;}
            this.date+=":";
            if (sec < 10){
                this.date += "0" + sec;
            }else{this.date+=sec;}
            this.date+=".000";
            //console.log('finished date ' + this.date);
            this.$emit('clicked-finished-date', this.date);
        }
    },
    template: `
        <div>
            <label>Select Year</label>
            <select v-model="year" @change="showDays()">
                <option v-for="num in years">{{num}}</option>
            </select>
            <label>Select Month</label>
            <select v-model="month" @change="showDays()">
                <option v-for="num in 12">{{num}}</option>
            </select>
            <label>Select Day</label>
            <div v-if="lp_feb_flg">
                <select>
                    <option v-for="i in 29" v-model="day">{{i}}</option>
                </select>
            </div>    
            <div v-else-if="feb_flg">
                <select v-model="day">
                    <option v-for="i in 28" v-model="day">{{i}}</option>
                </select>
            </div>
            <div v-else-if="bigm_flg">
                <select v-model="day">
                    <option v-for="i in 31">{{i}}</option>
                </select>
            </div>
            <div v-else>
                <select v-model="day">
                    <option v-for="i in 30">{{i}}</option>
                </select>
            </div>
            <label>Select Hour</label>
            <select v-model="hour">
                <option v-for="num in 24">{{num - 1}}</option>
            </select>
            <label>Select Minute</label>
            <select v-model="min">
                <option v-for="num in 60">{{num - 1}}</option>
            </select>
            <label>Select Seconds</label>
            <select  v-model="sec">
                <option v-for="num in 60">{{num - 1}}</option>
            </select>
            <button  v-on:click="packDate(year, month, day, hour, min, sec)">Finished Picking Date</button>
        </div>
    `
});




function init() {
    let crime_url = 'http://localhost:8000';

/*------------------------Main Component--------------------------*/
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
            selected_nbh_name: [],
            codes: new Map(),
            lat: 44.955139,
            lon: -93.102222,
            address: "",
            limit: 1000,
            startdate: 0,
            enddate: 0,
            markers: {},

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
            let nbh_num_all = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
            this.fetchNewCrime(this.limit, nbh_num_all);
           
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
                }).catch(function(error) {
                    console.log(error);
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
                }).catch(function(error) {
                    console.log(error);
                });
            },
            changeLat(lat, increment) {
                var latlng = L.latLng(lat + 0.01 * increment, this.lon);
                map.panTo(latlng);
            },
            changeLon(lon, increment) {
                var latlng = L.latLng(this.lat, lon + 0.01 * increment);
                map.panTo(latlng);
            },
            addTableMarker(incident) {
                //First, format address and replace Xs in Street Number with 0s
                let address = '';
                let block = incident.block.split(' ');
                block[0] = block[0].replace("X","0");
                for (let i=0; i<block.length; i++) {
                    if (block[i] === 'PA') {
                        block[i] = 'Parkway';
                    }
                    else if (block[i] === 'PL') {
                        block[i] = 'Place';
                    }
                    else if (block[i] === 'AV') {
                        block[i] = 'Avenue';
                    }
                    else if (block[i] === 'BD') {
                        block[i] = 'Boulevard';
                    }
                    else if (block[i] === 'RD') {
                        block[i] = 'Road';
                    }
                    address = address + ' ' + block[i];
                }
                address = address + ', St. Paul, Minnesota'
                //Convert address to latitude and longitude
                fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + address)
                .then(response => response.json())
                .then((data) => {
                    //Custom marker
                    var myIcon = new L.Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    });
                    //Create marker
                    var marker = new L.Marker([data[0].lat, data[0].lon], {icon: myIcon});

                    //Create delete button and text, put in popup, and add to map
                    let button = $('<button>Delete</button>').click(function() {
                        map.removeLayer(marker);
                    });
                    let inc = '<div><b>Incident: </b>' + incident.incident + '<br><b>Date: </b>' + incident.date + '</br><b>Time: </b>' + incident.time + '</div>';
                    let div = $('<div />').append(inc).append(button)[0];
                    marker.bindPopup(div);
                    marker.addTo(map);

                }).catch(function(error) {
                    console.log("Error, cannot find address; " + error);
                });
            },
            fetchNewCrime(limit, nbh_num_arr){
                this.is_loaded = false;
                flag = 0;

                //let qry = "http://localhost:8000/neighborhoods?id=";

                //console.log("qry: " + qry);
                fetch("http://localhost:8000/neighborhoods")
                .then(response => response.json())
                .then((data) => {
                    //Builds a map for easy access to neighborhood name
                    for (let i=0; i<data.length; i++){
                        this.neighborhoods.set(data[i].neighborhood_number, data[i].neighborhood_name);
                    }
                }).catch(function(error) {
                    console.log(error);
                });
    
    
                fetch("http://localhost:8000/codes")
                .then(response => response.json())
                .then((data) => {
                    for (let i=0; i<data.length; i++){
                        this.codes.set(data[i].code, data[i].incident_type);
                    }
                }).catch(function(error) {
                    console.log(error);
                });

                /* Append all selected form values to query to incidents for table build */
                let flg = 0;         
                let qry = "http://localhost:8000/incidents?";
                if (nbh_num_arr.length > 0){
                    qry += "neighborhood=";
                    for(let i=0; i<nbh_num_arr.length; i++){
                        qry += nbh_num_arr[i] + ",";
                    }
                    flg = 1;
                }
                if (this.startdate != 0){
                    if (flg){qry += "&";}
                    qry+= "start_date=" + this.startdate;
                    flg = 1;
                }
                if (this.enddate != 0){
                    qry+= "&end_date="+ this.enddate;
                }
                 
                if (flg){qry += "&";}
                qry += "limit=" + limit;
                console.log(qry);
                fetch(qry)
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
                    //reset all selected
                    this.selected_nbh_name = new Array();
                    //Need a delay otherwise will get errors
                    this.is_loaded = true;
                    flag = 1;
                }).catch(function(error) {
                    console.log(error);
                });
            },
            selectNbhNum(idx){
                console.log(this.selected_nbh_name);
                let index = this.selected_nbh_name.indexOf(idx);
                if (index >= 0) {
                    this.selected_nbh_name.splice( index, 1 );
                }else{
                    this.selected_nbh_name.push(idx);
                }
            },
            clickedFinishedSD: function(value){
                console.log('start date: ', value);
                this.startdate = value;
            },
            clickedFinishedED: function(value){
                console.log('end date: ', value);
                this.enddate = value;
            }
        },
/*  - v-model.lazy="varname" binds to data vars in vue instance
    - v-on:click="methodcall()"
    - v-for="item in items" parses through an array, to keep a counter use (items, i) where item was
*/
        template: `
            <div v-if="this.is_loaded">
                <div style="float:left; padding-left: 3rem; padding-top: 2rem;">
                    <p>Lat: </p>
                    <button v-on:click="changeLat(lat,-1)">-</button>
                    <button v-on:click="changeLat(lat,1)">+</button>
                    <input v-model.lazy="lat"/>
                    <p>Lon: </p>
                    <button v-on:click="changeLon(lon,-1)">-</button>
                    <button v-on:click="changeLon(lon,1)">+</button>
                    <input v-model.lazy="lon"/>
                    </br>
                    <button v-on:click="updateMapLtLn(lat, lon)">Find Lat/Lng</button>
                    </br>
                    <p> Address: </p>
                    <input size="45" v-model.lazy="address"/>
                    </br>
                    <button v-on:click="updateMapAddr(address)">Find Address</button>
                </div>
                <div>
                    <input size="45" v-model.lazy="limit"/>
                </div>
                <div>
                    <div v-for="(neighborhood, index) in neighborhoods" :key="neighborhood">
                        <input type="checkbox" v-on:click="selectNbhNum(index+1)">
                        <label>{{neighborhoods.get(index + 1)}}</label>
                    </div>
                </div>
                <h2>Select Start Date</h2>
                <select-date-component :date="startdate" @clicked-finished-date="clickedFinishedSD"></select-date-component>
                <h2>Select End Date</h2>
                <select-date-component :date="enddate" @clicked-finished-date="clickedFinishedED"></select-date-component>
                </br>
                <button v-on:click="fetchNewCrime(limit, selected_nbh_name)">Submit Crime Query</button>
                </br>
                <div style="float: right; margin-right: 5%; padding: 35px; border: 1px solid black;">
                    <b>Legend:</b>
                    <br>
                    <br>
                    Violent Crimes: <div style="background-color: red; padding: 6px;"></div>
                    <br>
                    <br>
                    Property Crimes: <div style="background-color: blue; padding: 6px;"></div>
                    <br>
                    <br>
                    Other Crimes: <div style="background-color: lightblue; padding: 6px;"></div>
                </div>
                <table style="clear:left">
                    <tr>
                        <th>Add to Map</th>
                        <th>Number</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Incident</th>
                        <th>Incident Desc.</th>
                        <th>Neighborhood Name</th>
                    </tr>
                    <tr v-for="(incident, i) in incidents" :key="i" v-bind:class="{ 
                    violentCrime: ['Rape', 'Agg. Assault Dom.', 'Agg. Assault','Arson', 'Simple Asasult Dom.'].indexOf(incidents[i].incident) >= 0, 
                    propertyCrime: ['Theft', 'Burglary', 'Vandalism', 'Robbery', 'Auto Theft',].indexOf(incidents[i].incident) >= 0, 
                    otherCrime: ['Narcotics', 'Proactive Police Visit', 'Discharge', 'Community Engagement Event', 'Graffiti'].indexOf(incidents[i].incident) >= 0}">
                        <td>
                            <button v-on:click="addTableMarker(incidents[i])">Add</button>
                        </td>
                        <td>{{i + 1}}</td>
                        <td>{{incidents[i].date}}</td>
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

    function onMapMoveend() {
        app._data.lat = map.getCenter().lat;
        app._data.lon = map.getCenter().lng;

        getJSON('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + map.getCenter().lat + '&lon=' + map.getCenter().lng).then((result) => {
            //Get address from result
            app._data.address = result.display_name;

        }).catch((error) => {
            console.log('Error:', error);
        });
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

    //map.on('click', onMapClick);
    map.on('moveend', onMapMoveend);
    
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
