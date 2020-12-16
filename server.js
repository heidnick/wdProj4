// Built-in Node.js modules
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
const { resolve } = require('path');
//console.log("express: ",express);

let app = express();
let port = 8000;

let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

// open stpaul_crime.sqlite3 database
// data source: https://information.stpaul.gov/Public-Safety/Crime-Incident-Report-Dataset/gppb-g9cg
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));


// REST API: GET /codes
// Respond with list of codes and their corresponding incident type
app.get('/codes', (req, res) => {
    console.log('/codes')
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let params = [];
    let code = url.searchParams.get('code');
    let query = '';
    if (code == null){
        //Default to return all codes
        query = 'SELECT * FROM Codes;';
    }
    else {
        //Else, format query
        code = code.split(',');
        query = 'SELECT * FROM Codes WHERE code IN ('
        for (let i=0; i<code.length; i++) {
            query = query + '?,';
            params.push(code[i]);
        }
        query = query.substring(0, query.length - 1);
        query = query + ');';
    }

    Promise.all([databaseSelect(query, params)]).then((results) => {
        var obj = JSON.stringify(results[0]);
        obj = JSON.stringify(JSON.parse(obj), null, 2);
        res.status(200).type('json').send(obj);
    }).catch((error) => {
        console.log(error);
        res.status(500).send('Database access error');
    });
});

// REST API: GET /neighborhoods
// Respond with list of neighborhood ids and their corresponding neighborhood name
app.get('/neighborhoods', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let params = [];
    let query = 'SELECT * FROM Neighborhoods';
    let id = url.searchParams.get('id');
    if (id == null){
        //Default to return all neighborhoods
        query = 'SELECT * FROM Neighborhoods;';
    }
    else {
        //Else, format query
        id = id.split(',');
        query = 'SELECT * FROM Neighborhoods WHERE neighborhood_number IN ('
        for (let i=0; i<id.length; i++) {
            query = query + '?,';
            params.push(id[i]);
        }
        query = query.substring(0, query.length - 1);
        query = query + ');';
    }

    Promise.all([databaseSelect(query, params)]).then((results) => {
        var obj = JSON.stringify(results[0]);
        obj = JSON.stringify(JSON.parse(obj), null, 2);
        res.status(200).type('json').send(obj);
    }).catch((error) => {
        console.log(error);
        res.status(500).send('Database access error');
    });
});

// Responding with list of incident types
app.get('/incident_types', (req, res) => {
    query = `Select DISTINCT Incident From Incidents`;
    //console.log('query: ',query);
    Promise.all([databaseSelect(query, [])]).then((results) => {
        var obj = JSON.stringify(results[0]);
        obj = JSON.stringify(JSON.parse(obj), null, 2);
        res.status(200).type('json').send(obj);
    }).catch((error) => {
        console.log(error);
        res.status(500).send('Database access error');
    });
});

// REST API: GET/incidents
// Respond with list of crime incidents
app.get('/incidents', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let params = [];
    let flag = 0;
    let start_time = url.searchParams.get('start_time');
    let end_time = url.searchParams.get('end_time');
    let start_date = url.searchParams.get('start_date');
    let end_date = url.searchParams.get('end_date');
    let code = url.searchParams.get('code');
    let grid = url.searchParams.get('grid');
    let neighborhood = url.searchParams.get('neighborhood');
    let limit = url.searchParams.get('limit');
    let incident = url.searchParams.get('incident');
    //let query = 'SELECT * FROM Incidents';
    let query = `select case_number,
                    case when LENGTH(date_time)>0 
                        then SUBSTR(date_time, 0, 11) 
                        else date_time end date, 
                    CASE WHEN length(date_time)>0 
                        THEN SUBSTR(date_time,12,length(date_time))  
                        ELSE NULL END as time,
                        code, incident, police_grid, neighborhood_number, block
                from Incidents`;
    console.log(url.searchParams);
    //CODE            
    if (code != null){
        flag = 1;
        code = code.split(',');
        query = query + ' WHERE code IN ('
        for (let i=0; i<code.length; i++) {
            query = query + '?,';
            params.push(code[i]);
        }
        query = query.substring(0, query.length - 1);
        query = query + ')';
    }
    //Incident
    if (incident != null){
        console.log("incident: ",incident)
        flag = 1;
        incident = incident.split(',');
        query = query + ' WHERE incident IN ('
        for (let i=0; i<incident.length; i++) {
            query = query + '?,';
            params.push(incident[i]);
        }
        query = query.substring(0, query.length - 1);
        query = query + ')';
    }
    //START_DATE
    if (start_date != null){
        if (flag){ query += ' AND ';}else{query += ' WHERE '; flag=1;}
        console.log("start-date");
        query = query + 'date > ? ';
        params.push(start_date);
    }
    //END_DATE
    if (end_date != null){
        if (flag){ query += ' AND '}else{query +=' WHERE '; flag=1;}
        console.log("end-date");
        query = query + 'date < ? ';
        params.push(end_date);
    }
    //START_TIME
    if (start_time != null){
        if (flag){ query += ' AND ';}else{query += ' WHERE '; flag=1;}
        console.log("start-time");
        query = query + 'time > ? ';
        params.push(start_time);
    }
    //END_TIME
    if (end_time != null){
        if (flag){ query += ' AND '}else{query +=' WHERE '; flag=1;}
        console.log("end-time");
        query = query + 'time < ? ';
        params.push(end_time);
    }
    //GRID
    console.log(grid);
    if (grid != null){
        grid = grid.split(',');
        if (flag){ query += ' AND '}else{query += '  WHERE '; flag=1;}
        query += ' police_grid IN (';
        for (let i=0; i<grid.length; i++) {
            query = query + '?,';
            params.push(grid[i]);
        }
        query = query.substring(0, query.length - 1);
        query = query + ')';
    }
    //NEIGHBORHOOD
    if (neighborhood != null){
        neighborhood = neighborhood.split(',');
        if (flag){ query += ' AND '}else{query += '  WHERE '; flag=1;}
        query += ' neighborhood_number IN (';
        for (let i=0; i<neighborhood.length; i++) {
            query = query + '?,';
            params.push(neighborhood[i]);
        }
        query = query.substring(0, query.length - 1);
        query += ')';
    }
    query += ' ORDER BY DATE DESC, TIME DESC';
    //LIMIT
    if (limit != null){
        if (limit>1000){
            limit=1000;
        }else if(limit<1){
            limit=1;
        }
        query += ' LIMIT ?';
        params.push(limit);
    }else {
        query += ' LIMIT 1000';
    }
    //console.log('query: ',query);
    Promise.all([databaseSelect(query, params)]).then((results) => {
        var obj = JSON.stringify(results[0]);
        obj = JSON.stringify(JSON.parse(obj), null, 2);
        res.status(200).type('json').send(obj);
    }).catch((error) => {
        console.log(error);
        res.status(500).send('Database access error');
    });
});

// REST API: PUT /new-incident
// Respond with 'success' or 'error'
app.put('/new-incident', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    let caseNumber = url.searchParams.get("case_number");
    let date_time = url.searchParams.get("date_time");
    let code = url.searchParams.get("code");
    let incident = url.searchParams.get("incident");
    let police_grid = url.searchParams.get("police_grid");
    let neighborhood_number = url.searchParams.get("neighborhood_number");
    let block = url.searchParams.get("block");

    //console.log(url.searchParams.get("case_number"));
    //console.log(url.searchParams.get("police_grid"));

    //let case_number =
    let queryNumbers = 'SELECT case_number FROM Incidents WHERE case_number = ?';
    var check = false;
    let query =  'INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)';

    databaseSelect(queryNumbers,[caseNumber,date_time,code,incident, police_grid,neighborhood_number,block]).then((rows)=>{
        if(rows.length>0){
            return new Promise((resolve,reject)=>{
                reject('Incident number already exists');
            });
        } else {
            return databaseInsert(query,[caseNumber, ]);
        }
    }).then(()=>{
        res.status(200).type('txt').send('success');
    }).catch((err)=>{
        res.status(500).type('txt').send(err);
        console.log(error);
    });

});


// Create Promise for SQLite3 database SELECT query 
function databaseSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows); 
            }
        })
    })
}

// Create Promise for SQLite3 database INSERT query
function databaseInsert(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}


// Start server
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
