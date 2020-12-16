let app;
let map;
let flag = 0;
var markers = [];
let init_flag = 1;
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
            date_flag: 0,
            submitted: 0,     
        }
    },
    props: ['date'],
    methods: {
        showDays: function(year, month){
            //console.log('this.months: ' + this.month);
            if((this.year == 2020 || this.year == 2016) && this.month == 2){
                this.lp_feb_flg = 1;
                //console.log('lp_feb_flg');
            }else if(this.month == 2){
                this.lp_feb_flg = 0;
                this.bigm_flag = 0;
                this.feb_flg = 1;
            }else if(this.big_months.includes(parseInt(this.month))){
                this.feb_flg = 0;
                this.lp_feb_flg = 0;
                this.bigm_flg = 1;
                //console.log('hits big case');
            }else{
                this.lp_feb_flg = 0;
                this.feb_flg = 0;
                this.bigm_flg = 0;
            }
            //console.log('leap', this.lp_feb_flg);
            //console.log('big', this.bigm_flg);
            //console.log('feb', this.feb_flg);
        },
        packDate: function(year, month, day){
            if (year == 0 || month == 0 || day == 0){
                this.date_flag = 1;
            }else{ 
                this.date_flag = 0;
                 this.date = year + "-";
                if (month < 10 ){
                    this.date += "0" + month + "-";
                }else{this.date+=month+'-';}
                if (day < 10 ){
                    this.date += "0" + day;
                }else{this.date+=day}
                //console.log('finished date ' + this.date);
                this.$emit('clicked-finished-date', this.date);
                this.submitted = 1;
            }
        }
    },
    template: `
        <div>
            <label>Year:</label>
            <select v-model="year" @change="showDays()">
                <option v-for="num in years">{{num}}</option>
            </select>
            <label>Month:</label>
            <select v-model="month" @change="showDays()">
                <option v-for="num in 12">{{num}}</option>
            </select>
            <label>Day:</label>
            <div style="display: inline-block;">
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
            </div>
            <div v-if="date_flag">
                <b style="color: red;">You must select all fields</b>
            </div>
            </br>
            </br>
            <button style="display:block" type="button" class="btn btn-secondary" v-on:click="packDate(year, month, day, hour, min, sec)">Submit Date</button>
            <div v-if="submitted">
                <b style="color: Green;">Date submitted</d>
            </div>
            </br>
            </br>
        </div>
    `
});

Vue.component('select-time-component', {
    data: function() {
        return { time: 0},
        {
            time: 0,
            hour: 0,
            min: 0,
            sec: 0,
            submitted: 0,    
        }
    },
    props: ['time'],
    methods: {
        packTime: function(hour, min, sec){
            if (hour < 10) {
                this.time = "0" + hour;
            }else{this.time=hour;}
            this.time+=":";
            if (min < 10){
                this.time += "0" + min;
            }else{this.time+=min;}
            this.time+=":";
            if (sec < 10){
                this.time += "0" + sec;
            }else{this.time+=sec;}
            this.time+=".000";
        
            this.$emit('clicked-finished-time', this.time);
            this.submitted = 1;
        }
    },
    template: `
        <div>
            <label>Hour:</label>
            <select v-model="hour">
                <option v-for="num in 24">{{num - 1}}</option>
            </select>
            <label>Minute:</label>
            <select v-model="min">
                <option v-for="num in 60">{{num - 1}}</option>
            </select>
            <label>Seconds:</label>
            <select  v-model="sec">
                <option v-for="num in 60">{{num - 1}}</option>
            </select>
            </br>
            </br>
            <button style="display:block" type="button" class="btn btn-secondary" v-on:click="packTime(hour, min, sec)">Submit Time</button>
            <div v-if="submitted">
                <b style="color: Green;">Time submitted</d>
            </div>
            </br>
            </br>
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
            incident_types: [],
            selected_incident_types: [],
            neighborhoods: new Map(),
            selected_nbh_name: [],
            codes: new Map(),
            lat: 44.955139,
            lon: -93.102222,
            searched_address: "",
            address: "",
            limit: 1000,
            starttime: 0,
            endtime: 0,
            startdate: 0,
            enddate: 0,
            canPanMap: 1,
            address_flag: 0,
            new_fetch: 0,
            last_sd: 0,
            last_ed: 0,
            last_st: 0,
            last_et: 0,
            last_lim: 0,
            last_nbhs: [],
            last_incs: [],
            last_incs_list: "",
            last_nbhs_list: "",

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
                this.canPanMap = 0;
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
                this.canPanMap = 0;
                //Tests for input: 44.955139, -93.102222
                //Pelham Boulevard, Saint Paul, Ramsey County, Minnesota, 55104, United States of America
                console.log('update Map Addr called: ' + address);
                fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + address)
                .then(response => response.json())
                .then((data) => {
                    console.log(data);
                    for(let i = 0; i<data.length; i++){
                        if (data[i].display_name.includes(address)){
                            this.address = data[i].display_name;
                            this.lat = data[i].lat;
                            this.lon = data[i].lon;
                        }else if(data[i].display_name.includes('St Paul')){
                            this.address = data[i].display_name;
                            this.lat = data[i].lat;
                            this.lon = data[i].lon;
                        }else{
                            this.address_flag = 1;
                        }
                    }

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

                /* Append all selected form values to query to incidents for table build
                */
                //grab all last vars for showing results
                if (init_flag){
                    this.new_fetch = 0;
                    init_flag = 0;
                }else{
                    this.new_fetch = 1;
                }
                this.last_sd = this.startdate;
                this.last_ed = this.enddate;
                this.last_st = this.starttime;
                this.last_et = this.endtime;
                this.last_lim = this.limit;
                this.last_nbhs = nbh_num_arr;
                this.last_incs = this.selected_incident_types;
                this.last_incs_list = "";
                this.last_nbhs_list = "";
                for(let i=0; i<this.last_nbhs.length-1; i++){
                    this.last_nbhs_list += this.neighborhoods.get(this.last_nbhs[i]) + ', ';
                }
                if (this.last_nbhs.length !=0){
                    this.last_nbhs_list += this.neighborhoods.get(this.last_nbhs[this.last_nbhs.length-1]);
                }
                console.log("b", this.last_incs_list)
                for(let i=0; i<this.last_incs.length-1; i++){
                    this.last_incs_list += this.last_incs[i] + ', ';
                    console.log(this.last_incs[i]);
                }
                if (this.last_incs.length !=0){
                    this.last_incs_list += this.last_incs[this.last_incs.length-1];
                }
                
                console.log("a", this.last_incs_list);

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
                if (this.starttime != 0){
                    if (flg){qry += "&";}
                    qry+= "start_time=" + this.starttime;
                    flg = 1;
                }
                if (this.endtime != 0){
                    qry+= "&end_time="+ this.endtime;
                }
                if (this.selected_incident_types.length > 0){
                    if (flg){qry+='&'}
                    qry+='incident=';
                    for(let i=0; i<this.selected_incident_types.length; i++){
                        qry += this.selected_incident_types[i] + ",";
                    }
                    qry = qry.substring(0, qry.length - 1);
                    flg=1;
                }
                 
                if (flg){qry += "&";}
                qry += "limit=" + limit;
                console.log("outgoing query:",qry);
                fetch(qry)
                .then(response => response.json())
                .then((data) => {
                    this.incidents = data;
                    let nbh_num = 0;
                    //Janky but functional way to add neighborhood name and incident type to incidents array
                    crimes_per_nbhood = new Array(17).fill(0);
                    for (let i=0; i<this.incidents.length; i++){
                        nbh_num  = this.incidents[i].neighborhood_number;
                        crimes_per_nbhood[nbh_num-1]++;
                        this.incidents[i].neighborhood_name = this.neighborhoods.get(this.incidents[i].neighborhood_number);
                        this.incidents[i].incident_type = this.codes.get(this.incidents[i].code);
                        let idx = this.incident_types.indexOf(this.incidents[i].incident);
                        if (idx == -1){
                            this.incident_types.push(data[i].incident);
                        }
                    }
                    //updating markers
                    for (let i=0; i<markers.length; i++){
                        markers[i]._popup.setContent(this.neighborhoods.get(i+1) +"</b><br>Crimes: " + crimes_per_nbhood[i]);
                    }
                    
                    //reset all selected
                    this.selected_incident_types = new Array();
                    this.selected_nbh_name = new Array();
                    this.starttime = 0;
                    this.endtime = 0;
                    this.startdate = 0;
                    this.enddate = 0;
                    this.limit= 1000;
                    //Need a delay otherwise will get errors
                    this.is_loaded = true;
                    flag = 1;
                }).catch(function(error) {
                    console.log(error);
                });
            },
            selectNbhNum(idx){
                //console.log(this.selected_nbh_name);
                let index = this.selected_nbh_name.indexOf(idx);
                if (index >= 0) {
                    this.selected_nbh_name.splice( index, 1 );
                }else{
                    this.selected_nbh_name.push(idx);
                }
            },
            clickedFinishedSD: function(value){
                //console.log('start date: ', value);
                this.startdate = value;
            },
            clickedFinishedED: function(value){
                //console.log('end date: ', value);
                this.enddate = value;
            },
            clickedFinishedST: function(value){
                //console.log('start date: ', value);
                this.starttime = value;
            },
            clickedFinishedET: function(value){
                //console.log('end date: ', value);
                this.endtime = value;
            },
            selectIncidentType(i){
                console.log('selectIncidentType: ' + this.incident_types[i]);
                let index = this.selected_incident_types.indexOf(this.incident_types[i]);
                if (index >= 0) {
                    this.selected_incident_types.splice( index, 1 );
                }else{
                    this.selected_incident_types.push(this.incident_types[i]);
                }
            },
            toggleMapPan(){
                this.canPanMap = !this.canPanMap;
                console.log("toggle: " + this.canPanMap);
            }
        },
/*  - v-model.lazy="varname" binds to data vars in vue instance
    - v-on:click="methodcall()"
    - v-for="item in items" parses through an array, to keep a counter use (items, i) where item was

    // style="float:left; margin-left: 5%; padding: 20px; border: 1px solid black;
*/
        template: `
            <div v-if="this.is_loaded">
                <div style="float:left; margin-left: 5%; padding: 20px; border: 1px solid black;">
                    <div style="margin: auto; width: 30%;">
                        <button v-if="canPanMap" type="button" class="btn btn-success" v-on:click="toggleMapPan()">Map Pan Enabled</button>
                        <button v-else type="button" class="btn btn-danger" v-on:click="toggleMapPan()">Map Pan Disabled</button>
                    </div>
                    <h5>Latitude: </h5>
                    <button type="button" class="btn btn-outline-primary" v-on:click="changeLat(lat,-1)">-</button>
                    <button type="button" class="btn btn-outline-primary" v-on:click="changeLat(lat,1)">+</button>
                    <input v-model.lazy="lat"/>
                    <h5>Longitude: </h5>
                    <button type="button" class="btn btn-outline-primary" v-on:click="changeLon(lon,-1)">-</button>
                    <button type="button" class="btn btn-outline-primary" v-on:click="changeLon(lon,1)">+</button>
                    <input v-model.lazy="lon"/>
                    <button type="button" class="btn btn-primary" v-on:click="updateMapLtLn(lat, lon)">Find Lat/Lng</button>
                    <h5 style="margin-top: 3px"> Address: </h5>
                    <input size="50" v-model.lazy="address"/>
                    <button type="button" class="btn btn-primary" v-on:click="updateMapAddr(address)">Find Address</button>
                </div>
                <div style=" padding: 20px; margin: 1%; border: 1px solid black; clear:left" class="container">
                    <div class="row">
                        <div class="col-sm-0">
                            <h3 style="text-decoration: underline;">Crime Filters:</h3>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-sm-6">
                            <div>
                                <b>Neighborhoods:</b>
                                <div v-for="(neighborhood, index) in neighborhoods" :key="neighborhood">
                                    <input type="checkbox" v-on:click="selectNbhNum(index+1)">
                                    <label>{{neighborhoods.get(index + 1)}}</label>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div>
                                <b>Incidents:</b>
                                <div v-for="(incident,i) in incident_types">
                                    <input type="checkbox" v-on:click="selectIncidentType(i)">
                                    <label>{{incident_types[i]}}</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    </br>
                    <div class="row">
                        <div class="col-sm-6">
                            <b>Start Date:</b>
                            <select-date-component :date="startdate" @clicked-finished-date="clickedFinishedSD"></select-date-component>
                            <b>End Date:</b>
                            <select-date-component :date="enddate" @clicked-finished-date="clickedFinishedED"></select-date-component>
                        </div>
                        <div class="col-sm-6">
                            <b>Start Time:</b>
                            <select-time-component :time="starttime" @clicked-finished-time="clickedFinishedST"></select-time-component>
                            <b>End Time:</b>
                            <select-time-component :time="endtime" @clicked-finished-time="clickedFinishedET"></select-time-component>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-sm-9">
                            <div>
                                <b>Number of Incidents: </b>
                                </br>
                                <input size="10" v-model.lazy="limit"/> (max: 1000) 
                            </div>
                        </div>
                        <div class="col-sm-3">
                            <button type="button" class="btn btn-primary btn-lg" v-on:click="fetchNewCrime(limit, selected_nbh_name)">Submit Crime Query</button>
                        </div>        
                    </div>
                </div>
                <div v-if="new_fetch" style=" padding: 20px; margin: 1%; border: 1px solid black; clear:left text-align: left;" class="container">
                    <div class="row" >
                        <div class="col-md-0">
                            <h5>Showing Results For: </h5>
                        </div>
                    </div>
                    <div class="row">
                        <div v-if="!(last_sd == 0)" class="col-md-3">
                            <p><span style="font-weight:bold;">Start Date: </span>{{last_sd}}</p>
                        </div>
                        <div v-if="!(last_ed == 0)" class="col-md-3">
                            <p><span style="font-weight:bold;">End Date: </span>{{last_ed}}</p>
                        </div>
                        <div v-if="!(last_st == 0)" class="col-md-3">
                            <p><span style="font-weight:bold;">Start Time: </span>{{last_st.substring(0,8)}}</p>
                        </div>
                        <div v-if="!(last_et == 0)" class="col-md-3">
                            <p><span style="font-weight:bold;">End Time: </span>{{last_et.substring(0,8)}}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div v-if="last_nbhs.length > 0 && last_nbhs.length < 17" class="col-md-5">
                            <div>
                                <p><span style="font-weight:bold;">Neighborhoods: </span>{{last_nbhs_list}}</p>
                            </div>
                        </div>
                        <div v-if="last_incs.length > 0 && last_incs.length < 17" class="col-md-5">
                            <div>
                                <p><span style="font-weight:bold;">Incident Types: </span>{{last_incs_list}}</p>
                            </div>
                        </div>
                        <div v-if="last_lim > 0 && last_lim < 1000" class="col-md-2">
                            <div>
                                <p><span style="font-weight:bold;">Limit: </span>{{last_lim}}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="float: right; margin-right: 5%; margin-left: 20px; padding: 35px; padding-top:25px; border: 1px solid black;">
                    <b>Legend:</b>
                    <br>
                    <br>
                    Violent Crimes: <div style="background-color: red; padding: 6px;"></div>
                    <br>
                    <br>
                    Property Crimes: <div style="background-color: blue; padding: 6px;"></div>
                    <br>
                    <br>
                    Other Crimes: <div style="background-color: skyblue; padding: 6px;"></div>
                </div>
                <table style="clear:left; margin-left: 20px">
                    <tr style="text-align: center">
                        <th>Add to Map</th>
                        <th>Number</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Incident</th>
                        <th>Incident Desc.</th>
                        <th>Neighborhood Name</th>
                    </tr>
                    <tr v-for="(incident, i) in incidents" :key="i" v-bind:class="{ 
                    violentCrime: ['Rape','Homicide', 'Agg. Assault Dom.', 'Agg. Assault','Arson', 'Simple Asasult Dom.'].indexOf(incidents[i].incident) >= 0, 
                    propertyCrime: ['Theft', 'Burglary', 'Vandalism', 'Robbery', 'Auto Theft'].indexOf(incidents[i].incident) >= 0, 
                    otherCrime: ['Rape','Homicide', 'Agg. Assault Dom.', 'Agg. Assault','Arson', 'Simple Asasult Dom.','Theft', 'Burglary', 'Vandalism', 'Robbery', 'Auto Theft'].indexOf(incidents[i].incident) < 0}">
                        <td>
                            <button type="button" class="btn btn-outline-light" v-on:click="addTableMarker(incidents[i])">Add</button>
                        </td>
                        <td>{{i + 1}}</td>
                        <td>{{incidents[i].date.substring(5,7)}}-{{incidents[i].date.substring(8)}}-{{incidents[i].date.substring(0,4)}}</td>
                        <td>{{incidents[i].time.substring(0,8)}}</td>
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
        maxZoom: 18,
        
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
        //console.log('mappan called');
        //console.log(map);
        if (app._data.canPanMap == 1){      
            app._data.lat = clamp(map.getCenter().lat, 44.883658, 45.008206);
            app._data.lon = clamp(map.getCenter().lng, -93.217977, -92.993787);
            
            getJSON('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + clamp(map.getCenter().lat, 44.883658, 45.008206) + '&lon=' + clamp(map.getCenter().lng, -93.217977, -92.993787)).then((result) => {
                //Get address from result
                app._data.address = result.display_name;

            }).catch((error) => {
                console.log('Error:', error);
            });
        }
    }

//Testing input
//Pelham Boulevard, Saint Paul, Ramsey County, Minnesota, 55104, United States of America
//1300 University Ave W
    function onMapUpdate(lat, lon){
        //console.log('onmapupdate called');
        lat = clamp(lat, 44.883658, 45.008206);
        lon = clamp(lon, -93.217977, -92.993787);
        console.log('onmapupdate called');
        app._data.lat = lat;
        app._data.lon = lon;
        //Pan map
        var latlng = L.latLng(lat, lon);
        map.zoomIn(1);
        map.panTo(latlng);
    }

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
