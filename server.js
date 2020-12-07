// Built-in Node.js modules
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
const { resolve } = require('path');


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
    Promise.all([databaseSelect('SELECT * FROM Codes;', [])]).then((results) => {
        var obj = JSON.parse(JSON.stringify(results));
        res.status(200).type('json').send(obj);
    }).catch((error) => {
        console.log(error);
    });
});

// REST API: GET /neighborhoods
// Respond with list of neighborhood ids and their corresponding neighborhood name
app.get('/neighborhoods', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    Promise.all([databaseSelect('SELECT * FROM Neighborhoods;', [])]).then((results) => {
        var obj = JSON.parse(JSON.stringify(results));
        res.status(200).type('json').send(obj);
    }).catch((error) => {
        console.log(error);
    });
});

// REST API: GET/incidents
// Respond with list of crime incidents
app.get('/incidents', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    Promise.all([databaseSelect('SELECT * FROM Incidents;', [])]).then((results) => {
        var obj = JSON.parse(JSON.stringify(results));
        res.status(200).type('json').send(obj);
    }).catch((error) => {
        console.log(error);
    });
});

// REST API: PUT /new-incident
// Respond with 'success' or 'error'
app.put('/new-incident', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    /*var test = {
        case_number: 14171569,
        date_time: 
    }*/
    let query =  `INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) 
                  VALUES ($case_number, $date_time, $code, $incident, $police_grid, $neighborhood_number, $block)`;
    Promise.all([databaseInsert(query, url.searchParams)]).then((results) => {
        res.status(200).type('txt').send('success');
    }).catch((error) => {
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
