/**
 * Astro Stuff. Calculate the Body, Sign and Degrees for a given Date, Time and Place of birth
 */

var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
mongoModel = require('./model.js');
var app = express();


var ephemeris = require('ephemeris-moshier');
var GoogleMapsAPI = require('googlemaps');
var publicConfig = {
  key: process.env.GOOGLE_API_KEY,
  stagger_time:       1000, // for elevationPath
  encode_polylines:   false,
  secure:             true // use https

};
var gmAPI = new GoogleMapsAPI(publicConfig);

var chart = ephemeris.getAllPlanets("14.06.1992 13:04:00",  -117.161083, 32.7157380, 8, 0);


app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Additional middleware which will set headers that we need on each request.
app.use(function(req, res, next) {
    // Set permissive CORS header - this allows this server to be used only as
    // an API server in conjunction with something like webpack-dev-server.
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Disable caching so we'll always get the latest comments.
    res.setHeader('Cache-Control', 'no-cache');
    next();
});


app.get('/api/charts', function(req, res) {
  res.send(chart);
  console.log("chart sent!");
  console.log(chart.date.gregorianTerrestrial);
});

app.post('/api/charts', function(req, res) {
  // NOTE: In a real implementation, we would likely rely on a database or
  // some other approach (e.g. UUIDs) to ensure a globally unique id. We'll
  // treat Date.now() as unique-enough for our purposes.
  console.log("got a POST to /api/charts!");
  console.log(req.body.date);
  console.log(req.body.time);
  // console.log(req.body.lon);
  // console.log(req.body.lat);
  console.log(req.body.loc);
  console.log(req.body.day);
  console.log(req.body.month);
  console.log(req.body.year);
  
  
  console.log("setting variables!");
  var chartDate = req.body.day + "." + req.body.month + "." + req.body.year;
  console.log(chartDate);
  var chartTime = req.body.time + ":00";
  console.log(chartTime);
  var chartLon = req.body.lon;
  var chartLat = req.body.lat;
  var chartLoc = req.body.loc;
  var chartTimestamp = new Date(req.body.year + "-" + req.body.month + "-" + req.body.day + " " + chartTime).getTime();
  chartTimestamp = chartTimestamp/1000;
  console.log(chartTimestamp);
  var location = chartLat + "," + chartLon;
  console.log(location);
  var chartUTCDay = new Date(req.body.year + "-" + req.body.month + "-" + req.body.day + " " + chartTime).getUTCDate();
  var chartUTCMonth = new Date(req.body.year + "-" + req.body.month + "-" + req.body.day + " " + chartTime).getUTCMonth() + 1;
  var chartUTCYear = new Date(req.body.year + "-" + req.body.month + "-" + req.body.day + " " + chartTime).getUTCFullYear();
  var chartUTCHours = new Date(req.body.year + "-" + req.body.month + "-" + req.body.day + " " + chartTime).getUTCHours();
  var chartUTCMins = new Date(req.body.year + "-" + req.body.month + "-" + req.body.day + " " + chartTime).getUTCMinutes();
  
  // console.log("UTC Times!");
  // console.log(chartUTCDay);
  // console.log(chartUTCMonth);
  // console.log(chartUTCYear);
  // console.log(chartUTCHours);
  // console.log(chartUTCMins);

  
  var d = new Date("July 21, 1983 01:15:00");


  
  //"14.06.1992 13:04:00",  -117.161083, 32.7157380, 8, 0
  
  gmAPI.geocode({ address: chartLoc }, function(err, result){
    if (err) throw err;
    console.log("getting the location!");
    chartLat = result.results[0].geometry.location.lat.toFixed(4); 
    chartLon =  result.results[0].geometry.location.lng.toFixed(4);
    // console.log(result.results[0].geometry.location.lat.toFixed(4));
    // console.log(result.results[0].geometry.location.lng.toFixed(4));
    location = chartLat + "," + chartLon; 
    // console.log(location.toString());
    
    console.log("here's the lat and lon!");
    console.log(location.toString());
    console.log("here's the timestamp I'm sending!");
    console.log(chartTimestamp);
  
  
    gmAPI.timezone({ location: location.toString(), timestamp: chartTimestamp}, function(err, result){
      if (err) throw err;
      console.log("getting the timezone for " + chartTimestamp + "!");
      console.log(result.timeZoneName);
      // console.log(err.message);
      console.log("UTC Timestamp!");
      var chartUTCTime = (chartTimestamp) - (result.rawOffset) - (result.dstOffset);
      console.log(chartUTCTime);
      //console.log(chartTimestamp + (result.rawOffset * 1000 * -1) + (result.dstOffset * 1000 * -1));
      var date = new Date(chartUTCTime * 1000);
      console.log(date);
      // Hours part from the timestamp
      var hours = date.getHours();
      // Minutes part from the timestamp
      var minutes = "0" + date.getMinutes();
      // Seconds part from the timestamp
      var seconds = "0" + date.getSeconds();
      
      // Will display time in 10:30:23 format
      var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
      console.log(formattedTime);
      
      var chart = ephemeris.getAllPlanets(chartDate + " " + formattedTime,  Number(chartLon), Number(chartLat), 0);
      
      var chartObj = chart;
      
      console.log("cool, got the chart!")
      // console.log(chartObj);
      // console.log(chartObj.observed.sun.name);
      
      var royceObj = [
        chartObj.observed.sun,
        chartObj.observed.moon,
        chartObj.observed.mercury,
        chartObj.observed.venus,
        chartObj.observed.mars,
        chartObj.observed.jupiter,
        chartObj.observed.saturn,
        chartObj.observed.uranus,
        chartObj.observed.neptune,
        chartObj.observed.pluto
      ];
      
      var signs = [ 
        "aries", 
        "taurus", 
        "gemini", 
        "cancer", 
        "leo", 
        "virgo", 
        "libra", 
        "scorpio", 
        "sagittarius", 
        "capricorn", 
        "aquarius", 
        "pisces"
      ];
      
      var miniChart = [
        {id: 1, signName: royceObj[0].name, sign: signs[Math.floor(royceObj[0].apparentLongitudeDd / 30)], degrees: royceObj[0].apparentLongitudeDms30, degreesDM: royceObj[0].apparentLongitudeDd},
        {id: 2, signName: royceObj[1].name, sign: signs[Math.floor(royceObj[1].apparentLongitudeDd / 30)], degrees: royceObj[1].apparentLongitudeDms30, degreesDM: royceObj[1].apparentLongitudeDd},
        {id: 3, signName: royceObj[2].name, sign: signs[Math.floor(royceObj[2].apparentLongitudeDd / 30)], degrees: royceObj[2].apparentLongitudeDms30, degreesDM: royceObj[2].apparentLongitudeDd}, 
        {id: 4, signName: royceObj[3].name, sign: signs[Math.floor(royceObj[3].apparentLongitudeDd / 30)], degrees: royceObj[3].apparentLongitudeDms30, degreesDM: royceObj[3].apparentLongitudeDd},
        {id: 5, signName: royceObj[4].name, sign: signs[Math.floor(royceObj[4].apparentLongitudeDd / 30)], degrees: royceObj[4].apparentLongitudeDms30, degreesDM: royceObj[4].apparentLongitudeDd},
        {id: 6, signName: royceObj[5].name, sign: signs[Math.floor(royceObj[5].apparentLongitudeDd / 30)], degrees: royceObj[5].apparentLongitudeDms30, degreesDM: royceObj[5].apparentLongitudeDd},
        {id: 7, signName: royceObj[6].name, sign: signs[Math.floor(royceObj[6].apparentLongitudeDd / 30)], degrees: royceObj[6].apparentLongitudeDms30, degreesDM: royceObj[6].apparentLongitudeDd},
        {id: 8, signName: royceObj[7].name, sign: signs[Math.floor(royceObj[7].apparentLongitudeDd / 30)], degrees: royceObj[7].apparentLongitudeDms30, degreesDM: royceObj[7].apparentLongitudeDd},
        {id: 9, signName: royceObj[8].name, sign: signs[Math.floor(royceObj[8].apparentLongitudeDd / 30)], degrees: royceObj[8].apparentLongitudeDms30, degreesDM: royceObj[8].apparentLongitudeDd},
        {id: 10, signName: royceObj[9].name, sign: signs[Math.floor(royceObj[9].apparentLongitudeDd / 30)], degrees: royceObj[9].apparentLongitudeDms30, degreesDM: royceObj[9].apparentLongitudeDd}
      ];
      
      var ATLANTIC_OCEAN = {
        latitude: 29.532804,
        longitude: -55.491477
      };
      
      // console.log("here's the simpler chartObj!");
      // console.log(miniChart);
      
      var types = {
       "conjunct":       { major: true,  angle:   0,     orb: 6  , symbol: "<" },
       //"semisextile":    { major: false, angle:  30,     orb: 3  , symbol: "y" },
       //"decile":         { major: false, angle:  36,     orb: 1.5, symbol: ">" },
       //"novile":         { major: false, angle:  40,     orb: 1.9, symbol: "M" },
       //"semisquare":     { major: false, angle:  45,     orb: 3  , symbol: "=" },
       //"septile":        { major: false, angle:  51.417, orb: 2  , symbol: "V" },
       "sextile":        { major: true,  angle:  60,     orb: 6  , symbol: "x" },
       //"quintile":       { major: false, angle:  72,     orb: 2  , symbol: "Y" },
       //"bilin":          { major: false, angle:  75,     orb: 0.9, symbol: "-" },
       //"binovile":       { major: false, angle:  80,     orb: 2  , symbol: ";" },
       "square":         { major: true,  angle:  90,     orb: 6  , symbol: "c" },
       //"biseptile":      { major: false, angle: 102.851, orb: 2  , symbol: "N" },
       //"tredecile":      { major: false, angle: 108,     orb: 2  , symbol: "X" },
       "trine":          { major: true,  angle: 120,     orb: 6  , symbol: "Q" },
       //"sesquiquadrate": { major: false, angle: 135,     orb: 3  , symbol: "b" },
       //"biquintile":     { major: false, angle: 144,     orb: 2  , symbol: "C" },
       //"inconjunct":     { major: false, angle: 150,     orb: 3  , symbol: "n" },
       //"treseptile":     { major: false, angle: 154.284, orb: 1.1, symbol: "B" },
       //"tetranovile":    { major: false, angle: 160,     orb: 3  , symbol: ":" },
       //"tao":            { major: false, angle: 165,     orb: 1.5, symbol: "—" },
       "opposition":     { major: true,  angle: 180,     orb: 6  , symbol: "m" }
      };
      
      var isAspect = function (planet1, planet2) {
        var l1 = planet1.degreesDM,
            l2 = planet2.degreesDM,
            ng = Math.abs(l1 - l2);
            
        //console.log("here's the seperation")
        //console.log(ng);  
        
        if (ng > 180 + types.opposition.orb) {
            ng = l1 > l2 ? 360 - l1 + l2 : 360 - l2 + l1;
            ct = true;
        };
        
        for(type in types) {
          var t = types[type];
            if (ng >= t.angle - t.orb && ng <= t.angle + t.orb) {
                // console.log(planet1.signName + " and " + planet2.signName + " are " + type);
                return {planet1: planet1.signName, planet2: planet2.signName, aspect: type};
            }
        };

        
      };
      
      var aspects = [];
      
      var calculateAspects = function (chart) {
        for (i in chart){
          for (j in chart){
            if (i !== j && j > i) {
              var anAspect = isAspect(chart[i], chart[j]);
              if (anAspect) {
                aspects.push(anAspect);
              }
              
            }
          }
        }
        return aspects;
      };
      
      
      // isAspect(miniChart[0], miniChart[3]);
      var aspectsToFind = calculateAspects(miniChart);
      console.log(aspectsToFind);
      
      var findAspects = function(db, aspects, callback) {
        var collection = db.collection('combinations');
        for(i in aspects) {
          console.log(aspects[i])
          var p1 = aspects.planet1,
              p2 = aspects.planet2,
              apsect = aspects.aspect;
          
          collection.find({planet1: p1, planet2: p2, angle: aspect}).toArray(function(err, docs) {
          assert.equal(err, null);
          console.log("searching for " + p1 + " " + aspect + " " + p2);
          console.log("Found the following records");
          console.log(docs);
          // res.send(docs[0]);
          callback(docs);
          db.close();
        });
        }
        
        // collection.find({})
      }
      
      // console.log(findAspects(aspectstoFind));
      
      
      var findSign = function(db, planet, zodiac, callback) {
        // Get the documents collection
        var collection = db.collection('combinations');
        // Find some documents
        collection.find({planet: planet, zodiac: zodiac}).toArray(function(err, docs) {
          assert.equal(err, null);
          console.log("searching for " + planet + " in " + zodiac);
          console.log("Found the following records");
          console.log(docs);
          // res.send(docs[0]);
          callback(docs);
          db.close();
        });
      }
      
      var uri = 'mongodb://'+process.env.MONG_USER+':'+process.env.MONG_PASS+'@'+process.env.MONG_HOST+':'+process.env.MONG_PORT+'/'+process.env.MONG_DB;
      
      // var planet = req.query.planet;
      // var zodiac = req.query.sign;
      //for (i = 0; i < cars.length; i++) { 
      //      text += cars[i] + "<br>";
      //    }
      
      
      // console.log(uri);
      MongoClient.connect(uri, function(err, db) {
        assert.equal(null, err);
        console.log("Connected successfully to MongoDB server");
        console.log(miniChart);
        var i = 0;
        var runNext = function (i) {
          if (i < 10) {
            console.log(i);
            var planet = miniChart[i].signName;
            var zodiac = miniChart[i].sign;
            console.log(planet + " in " + zodiac);
            var collection = db.collection('combinations');
            // Find some documents
            collection.find({planet: planet, zodiac: zodiac}).toArray(function(err, docs) {
              assert.equal(err, null);
              console.log("searching for " + planet + " in " + zodiac + "!");
              console.log("Found the docs!");
              // console.log(docs);
              // res.send(docs[0]);
              chart.observed[planet].desc = docs[0].description;
              // console.log("here's the found text from callback!")
              //console.log(chart.observed[planet].desc);
              // callback(docs);
              db.close();
            });
            
            // findSign(db, planet, zodiac, function(docs) {
            //   
            //   
            //   db.close();
            // });
            runNext(i+1);
            db.close();
            
          }
          
          
        };
        runNext(0);
        
      });
      
      setTimeout(function() {
        // console.log(chart)
        console.log("chart sent!");
        console.log(chart.date.gregorianTerrestrial);
        
        res.send(chart);
      },
      1000
      );
      
      
    });

  });
  

  

  return chart;
  
});

app.post('/api/comments', function(req, res) {
  // NOTE: In a real implementation, we would likely rely on a database or
  // some other approach (e.g. UUIDs) to ensure a globally unique id. We'll
  // treat Date.now() as unique-enough for our purposes.
  
  
  var newComment = {
    id: Date.now(),
    author: req.body.author,
    text: req.body.text,
  };
  comments.push(newComment);
});

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

app.get("/api/combinations", function (req, res) {
  
  var uri = 'mongodb://'+process.env.MONG_USER+':'+process.env.MONG_PASS+'@'+process.env.MONG_HOST+':'+process.env.MONG_PORT+'/'+process.env.MONG_DB;
  
  var findSign = function(db, planet, zodiac, callback) {
    // Get the documents collection
    var collection = db.collection('combinations');
    // Find some documents
    collection.find({planet: planet, zodiac: zodiac}).toArray(function(err, docs) {
      assert.equal(err, null);
      console.log("searching for " + planet + " in " + zodiac);
      console.log("Found the following records");
      console.log(docs);
      res.send(docs[0]);
      // callback(docs);
      db.close();
    });
  }
  
  var planet = req.query.planet;
  var zodiac = req.query.sign;
  
  console.log(uri);
  MongoClient.connect(uri, function(err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    findSign(db, planet, zodiac, function() {
      db.close();
    });
    db.close();
  });
  
});  

app.post("/api/combinations", function (req, res) {
  
  var uri = 'mongodb://'+process.env.MONG_USER+':'+process.env.MONG_PASS+'@'+process.env.MONG_HOST+':'+process.env.MONG_PORT+'/'+process.env.MONG_DB;
  
  var findSign = function(db, planet, zodiac, callback) {
    // Get the documents collection
    var collection = db.collection('combinations');
    // Find some documents
    collection.find({planet: planet, zodiac: zodiac}).toArray(function(err, docs) {
      assert.equal(err, null);
      console.log("searching for " + planet + " in " + zodiac);
      console.log("Found the following records");
      console.log(docs);
      res.send(docs[0]);
      // callback(docs);
    });
  }
  
  var planet = req.body.planet;
  var zodiac = req.body.sign;
  
  console.log(uri);
  MongoClient.connect(uri, function(err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    findSign(db, planet, zodiac, function() {
      db.close();
    });
    db.close();
  });
  
}); 

app.listen(app.get('port'), function() {
  console.log('Server started on: ' + app.get('port'));
});